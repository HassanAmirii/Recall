import Lecture from '../models/Lecture.js';
import GroupMembership from '../models/GroupMembership.js';
import ChatThread from '../models/ChatThread.js';
import { splitAudioIntoChunks, processLectureAudio } from '../services/audioService.js';
import { answerQuestion } from '../services/gemmaService.js';
import { httpError } from '../utils/httpError.js';

async function getMembership(userId, groupId) { return GroupMembership.findOne({ userId, groupId }); }
async function canView(userId, lecture) {
  if (String(lecture.uploadedBy) === String(userId)) return true;
  if (lecture.groupId && lecture.status === 'approved') return Boolean(await getMembership(userId, lecture.groupId));
  return false;
}

export async function uploadLecture(req, res, next) { try {
  if (!req.file) throw httpError(400, 'Audio file is required');
  const { title, courseTag, groupId } = req.body;
  let status = 'personal'; let approvedAt = null; let approvedBy = null;
  if (groupId) {
    const membership = await getMembership(req.user._id, groupId);
    if (!membership || membership.role !== 'admin') throw httpError(403, 'Only group admins can directly upload approved group lectures');
    status = 'approved'; approvedAt = new Date(); approvedBy = req.user._id;
  }
  const lecture = await Lecture.create({ title, courseTag, uploadedBy: req.user._id, groupId: groupId || null, status, approvedAt, approvedBy, audioChunks: [] });
  lecture.audioChunks = await splitAudioIntoChunks(req.file.path, lecture._id);
  await lecture.save();
  await processLectureAudio(lecture);
  res.status(201).json(lecture);
} catch (e) { next(e); } }

export async function listPersonalLectures(req, res, next) { try {
  res.json(await Lecture.find({ uploadedBy: req.user._id, status: 'personal', groupId: null }).sort({ createdAt: -1 }));
} catch (e) { next(e); } }

export async function getLecture(req, res, next) { try {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw httpError(404, 'Lecture not found');
  if (!(await canView(req.user._id, lecture))) throw httpError(403, 'Lecture access denied');
  const chatThread = await ChatThread.findOneAndUpdate({ userId: req.user._id, lectureId: lecture._id }, { $setOnInsert: { messages: [] } }, { upsert: true, new: true });
  res.json({ lecture, chatThread });
} catch (e) { next(e); } }

export async function submitLecture(req, res, next) { try {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw httpError(404, 'Lecture not found');
  if (String(lecture.uploadedBy) !== String(req.user._id) || lecture.status !== 'personal') throw httpError(403, 'Only the owner can submit a personal lecture');
  const membership = await getMembership(req.user._id, req.body.groupId);
  if (!membership) throw httpError(403, 'Group membership required');
  lecture.groupId = req.body.groupId; lecture.status = 'pending';
  await lecture.save(); res.json(lecture);
} catch (e) { next(e); } }

export async function approveLecture(req, res, next) { try {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture || lecture.status !== 'pending') throw httpError(404, 'Pending lecture not found');
  const membership = await getMembership(req.user._id, lecture.groupId);
  if (!membership || membership.role !== 'admin') throw httpError(403, 'Admin access required');
  lecture.status = 'approved'; lecture.approvedAt = new Date(); lecture.approvedBy = req.user._id;
  await lecture.save(); res.json(lecture);
} catch (e) { next(e); } }

export async function chatWithLecture(req, res, next) { try {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) throw httpError(404, 'Lecture not found');
  if (!(await canView(req.user._id, lecture))) throw httpError(403, 'Lecture access denied');
  const thread = await ChatThread.findOneAndUpdate({ userId: req.user._id, lectureId: lecture._id }, { $setOnInsert: { messages: [] } }, { upsert: true, new: true });
  const question = req.body.question;
  thread.messages.push({ role: 'user', content: question });
  const reply = await answerQuestion(lecture.structuredNotes, question, thread.messages);
  thread.messages.push({ role: 'assistant', content: reply });
  await thread.save(); res.json(thread);
} catch (e) { next(e); } }
