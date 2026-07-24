import Lecture from "../models/Lecture.js";
import GroupMembership from "../models/GroupMembership.js";
import ChatThread from "../models/ChatThread.js";
import {
  splitAudioIntoChunks,
  processLectureAudio,
} from "../services/audioService.js";
import { answerQuestion } from "../services/gemmaService.js";
import { httpError } from "../utils/httpError.js";

async function getMembership(userId, groupId) {
  return GroupMembership.findOne({ userId, groupId });
}

async function canView(userId, lecture) {
  if (String(lecture.uploadedBy) === String(userId)) return true;
  if (lecture.groupId && lecture.status === "approved")
    return Boolean(await getMembership(userId, lecture.groupId));
  return false;
}

export async function uploadLecture(req, res, next) {
  try {
    if (!req.file) throw httpError(400, "Audio file is required");

    const { title, courseTag, groupId, lectureContext } = req.body;
    let status = "personal";
    let approvedAt = null;
    let approvedBy = null;

    if (groupId) {
      const membership = await getMembership(req.user._id, groupId);
      if (!membership || membership.role !== "admin") {
        throw httpError(
          403,
          "Only group admins can directly upload approved group lectures",
        );
      }
      status = "approved";
      approvedAt = new Date();
      approvedBy = req.user._id;
    }

    // Create lecture record first
    const lecture = await Lecture.create({
      title,
      courseTag,
      uploadedBy: req.user._id,
      groupId: groupId || null,
      status,
      approvedAt,
      approvedBy,
      lectureContext,
      audioChunks: [],
      processingStatus: "pending",
    });

    // 1. Split audio into chunks
    console.log(`Splitting audio for lecture ${lecture._id}...`);
    lecture.audioChunks = await splitAudioIntoChunks(
      req.file.path,
      lecture._id,
    );
    lecture.processingStatus = "chunking_completed";
    await lecture.save();
    console.log(
      `Created ${lecture.audioChunks.length} chunks for lecture ${lecture._id}`,
    );

    // 2. Process audio (transcribe and generate notes)
    // This could take time, so we'll do it with progress tracking
    console.log(`Processing audio for lecture ${lecture._id}...`);
    await processLectureAudio(lecture, {
      batchSize: 3,
      onProgress: (progress) => {
        console.log(
          `Lecture ${lecture._id} processing: ${progress.current}/${progress.total}`,
        );
      },
    });

    console.log(`Lecture ${lecture._id} fully processed successfully`);
    res.status(201).json(lecture);
  } catch (e) {
    console.error("Upload lecture error:", e);
    next(e);
  }
}

// Alternative: Upload and process asynchronously (if you want the response faster)
export async function uploadLectureAsync(req, res, next) {
  try {
    if (!req.file) throw httpError(400, "Audio file is required");

    const { title, courseTag, groupId, lectureContext } = req.body;
    let status = "personal";
    let approvedAt = null;
    let approvedBy = null;

    if (groupId) {
      const membership = await getMembership(req.user._id, groupId);
      if (!membership || membership.role !== "admin") {
        throw httpError(
          403,
          "Only group admins can directly upload approved group lectures",
        );
      }
      status = "approved";
      approvedAt = new Date();
      approvedBy = req.user._id;
    }

    const lecture = await Lecture.create({
      title,
      courseTag,
      uploadedBy: req.user._id,
      groupId: groupId || null,
      status,
      approvedAt,
      approvedBy,
      lectureContext,
      audioChunks: [],
      processingStatus: "pending",
    });

    // Send response immediately
    res.status(201).json({
      lecture,
      message: "Lecture uploaded, processing in background",
    });

    // Process in background
    processLectureInBackground(lecture._id, req.file.path).catch(console.error);
  } catch (e) {
    console.error("Upload lecture error:", e);
    next(e);
  }
}

// Background processing function for async upload
async function processLectureInBackground(lectureId, filePath) {
  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) throw new Error("Lecture not found");

    console.log(`Background processing started for lecture ${lectureId}`);
    lecture.processingStatus = "processing";
    await lecture.save();

    // Split audio
    lecture.audioChunks = await splitAudioIntoChunks(filePath, lecture._id);
    lecture.processingStatus = "chunking_completed";
    await lecture.save();

    // Process audio
    await processLectureAudio(lecture, {
      batchSize: 3,
      onProgress: (progress) => {
        console.log(
          `Background progress for ${lectureId}: ${progress.current}/${progress.total}`,
        );
      },
    });

    console.log(`Background processing completed for lecture ${lectureId}`);
  } catch (error) {
    console.error(
      `Background processing failed for lecture ${lectureId}:`,
      error,
    );
    await Lecture.findByIdAndUpdate(lectureId, {
      processingStatus: "failed",
      errorMessage: error.message,
    });
  }
}

export async function listPersonalLectures(req, res, next) {
  try {
    res.json(
      await Lecture.find({
        uploadedBy: req.user._id,
        status: "personal",
        groupId: null,
      }).sort({ createdAt: -1 }),
    );
  } catch (e) {
    next(e);
  }
}

export async function getLecture(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) throw httpError(404, "Lecture not found");
    if (!(await canView(req.user._id, lecture)))
      throw httpError(403, "Lecture access denied");
    const chatThread = await ChatThread.findOneAndUpdate(
      { userId: req.user._id, lectureId: lecture._id },
      { $setOnInsert: { messages: [] } },
      { upsert: true, new: true },
    );
    res.json({ lecture, chatThread });
  } catch (e) {
    next(e);
  }
}

export async function submitLecture(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) throw httpError(404, "Lecture not found");
    if (
      String(lecture.uploadedBy) !== String(req.user._id) ||
      lecture.status !== "personal"
    ) {
      throw httpError(403, "Only the owner can submit a personal lecture");
    }
    const membership = await getMembership(req.user._id, req.body.groupId);
    if (!membership) throw httpError(403, "Group membership required");
    lecture.groupId = req.body.groupId;
    lecture.status = "pending";
    await lecture.save();
    res.json(lecture);
  } catch (e) {
    next(e);
  }
}

export async function approveLecture(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture || lecture.status !== "pending")
      throw httpError(404, "Pending lecture not found");
    const membership = await getMembership(req.user._id, lecture.groupId);
    if (!membership || membership.role !== "admin")
      throw httpError(403, "Admin access required");
    lecture.status = "approved";
    lecture.approvedAt = new Date();
    lecture.approvedBy = req.user._id;
    await lecture.save();
    res.json(lecture);
  } catch (e) {
    next(e);
  }
}

// Get processing status for a lecture
export async function getLectureStatus(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId).select(
      "processingStatus rawTranscript structuredNotes errorMessage",
    );

    if (!lecture) throw httpError(404, "Lecture not found");
    if (!(await canView(req.user._id, lecture)))
      throw httpError(403, "Lecture access denied");

    res.json({
      status: lecture.processingStatus,
      hasTranscript: !!lecture.rawTranscript,
      hasNotes: !!lecture.structuredNotes,
      error: lecture.errorMessage,
    });
  } catch (e) {
    next(e);
  }
}

// Get only the structured notes for a lecture
export async function getLectureNotes(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId).select(
      "title structuredNotes rawTranscript",
    );

    if (!lecture) throw httpError(404, "Lecture not found");
    if (!(await canView(req.user._id, lecture)))
      throw httpError(403, "Lecture access denied");

    res.json({
      title: lecture.title,
      structuredNotes: lecture.structuredNotes,
      rawTranscript: lecture.rawTranscript,
    });
  } catch (e) {
    next(e);
  }
}

export async function chatWithLecture(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) throw httpError(404, "Lecture not found");
    if (!(await canView(req.user._id, lecture)))
      throw httpError(403, "Lecture access denied");

    const thread = await ChatThread.findOneAndUpdate(
      { userId: req.user._id, lectureId: lecture._id },
      { $setOnInsert: { messages: [] } },
      { upsert: true, new: true },
    );

    const question = req.body.question;
    if (!question) throw httpError(400, "Question is required");

    thread.messages.push({ role: "user", content: question });
    const reply = await answerQuestion(
      lecture.structuredNotes,
      question,
      thread.messages,
    );
    thread.messages.push({ role: "assistant", content: reply });
    await thread.save();
    res.json(thread);
  } catch (e) {
    next(e);
  }
}
