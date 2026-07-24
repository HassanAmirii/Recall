import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { transcribeChunk, cleanAndStructureNotes } from "./gemmaService.js";

const CHUNK_SECONDS = 30;

// Set ffmpeg path to the bundled binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Log ffmpeg path for debugging
console.log(`FFmpeg path: ${ffmpegStatic}`);

/**
 * Split an audio file into smaller chunks for processing
 * @param {string} inputPath - Path to the input audio file
 * @param {number} lectureId - ID of the lecture
 * @returns {Promise<Array<{chunkIndex: number, filePath: string}>>} Array of chunk objects
 */
export async function splitAudioIntoChunks(inputPath, lectureId) {
  const uploadRoot = process.env.UPLOAD_DIR || "uploads";
  const chunkDir = path.join(uploadRoot, String(lectureId), "chunks");

  try {
    // Create chunks directory
    await fs.mkdir(chunkDir, { recursive: true });
    console.log(`Created chunk directory: ${chunkDir}`);

    const outputPattern = path.join(chunkDir, "chunk-%03d.wav");

    console.log(`Starting ffmpeg chunking for: ${inputPath}`);
    console.log(`Output pattern: ${outputPattern}`);
    console.log(`Chunk duration: ${CHUNK_SECONDS} seconds`);

    // Run ffmpeg to split audio into chunks
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec("pcm_s16le") // WAV format
        .audioFrequency(16000) // 16kHz for better transcription
        .audioChannels(1) // Mono for speech
        .outputOptions([
          "-f segment",
          `-segment_time ${CHUNK_SECONDS}`,
          "-reset_timestamps 1",
          "-map 0:a", // Only process audio stream
        ])
        .output(outputPattern)
        .on("start", (commandLine) => {
          console.log(`FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress) => {
          // Log progress every 10%
          if (progress.percent && Math.floor(progress.percent) % 10 === 0) {
            console.log(`FFmpeg processing: ${Math.floor(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log("FFmpeg chunking completed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          reject(err);
        })
        .run();
    });

    // Read and verify chunk files
    const files = (await fs.readdir(chunkDir))
      .filter((file) => file.endsWith(".wav"))
      .sort((a, b) => {
        // Sort numerically by chunk number
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    if (files.length === 0) {
      console.warn("No chunk files were created");
      throw new Error("No chunks created");
    }

    console.log(`Successfully created ${files.length} audio chunks`);

    return files.map((file, index) => ({
      chunkIndex: index,
      filePath: path.join(chunkDir, file),
      fileName: file,
    }));
  } catch (error) {
    console.error("ffmpeg chunking failed:", error.message);
    console.error("Error stack:", error.stack);
    console.warn("⚠️ Using original upload as a single placeholder chunk.");

    // Check if original file exists
    try {
      await fs.access(inputPath);
      console.log(`Original file exists: ${inputPath}`);
    } catch (fileError) {
      console.error("Original file not found:", fileError.message);
      throw new Error("Both chunking and original file access failed");
    }

    return [{ chunkIndex: 0, filePath: inputPath }];
  }
}

/**
 * Process a lecture's audio by transcribing each chunk and generating structured notes
 * @param {Object} lecture - Lecture model instance
 * @param {Object} options - Processing options
 * @param {number} options.batchSize - Number of chunks to process in parallel (optional)
 * @returns {Promise<Object>} Updated lecture object
 */
export async function processLectureAudio(lecture, options = {}) {
  const { batchSize = 3, onProgress = null } = options;

  // Validate lecture has audio chunks
  if (!lecture.audioChunks || lecture.audioChunks.length === 0) {
    throw new Error("No audio chunks found in lecture");
  }

  console.log(
    `Processing ${lecture.audioChunks.length} audio chunks for lecture ID: ${lecture._id}`,
  );
  console.log(`Batch size: ${batchSize}`);

  const transcripts = [];
  const chunks = [...lecture.audioChunks].sort(
    (a, b) => a.chunkIndex - b.chunkIndex,
  );

  // Process chunks in batches for better performance
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`,
    );

    const batchPromises = batch.map(async (chunk, index) => {
      try {
        console.log(
          `Transcribing chunk ${i + index + 1}/${chunks.length}: ${chunk.filePath}`,
        );

        // Check if file exists before processing
        try {
          await fs.access(chunk.filePath);
        } catch (fileError) {
          console.error(`Chunk file not found: ${chunk.filePath}`);
          return `[Error: Missing chunk ${i + index + 1}]`;
        }

        const transcript = await transcribeChunk(
          chunk.filePath,
          lecture.lectureContext,
        );
        console.log(
          `Chunk ${i + index + 1} transcribed successfully (${transcript.length} characters)`,
        );

        // Call progress callback if provided
        if (onProgress) {
          onProgress({
            current: i + index + 1,
            total: chunks.length,
            chunkIndex: chunk.chunkIndex,
            transcript: transcript,
          });
        }

        return transcript;
      } catch (error) {
        console.error(
          `Error processing chunk ${i + index + 1}:`,
          error.message,
        );
        return `[Error: Failed to transcribe chunk ${i + index + 1}]`;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    transcripts.push(...batchResults);
  }

  // Filter out error messages if needed
  const successfulTranscripts = transcripts.filter(
    (t) => !t.startsWith("[Error:"),
  );
  console.log(
    `Successfully transcribed ${successfulTranscripts.length}/${chunks.length} chunks`,
  );

  // Combine transcripts with clear separation
  const rawTranscript = transcripts
    .map((text, index) => `[Chunk ${index + 1}]\n${text}`)
    .join("\n\n---\n\n");

  console.log(`Raw transcript length: ${rawTranscript.length} characters`);

  try {
    console.log("Generating structured notes...");
    const structuredNotes = await cleanAndStructureNotes(
      rawTranscript,
      lecture.lectureContext,
    );
    console.log("Structured notes generated successfully");

    // Update lecture with results
    lecture.rawTranscript = rawTranscript;
    lecture.structuredNotes = structuredNotes;
    lecture.processedAt = new Date();
    lecture.processingStatus = "completed";

    await lecture.save();
    console.log(`Lecture ${lecture._id} processed and saved successfully`);

    return lecture;
  } catch (error) {
    console.error("Error generating structured notes:", error.message);
    // Save partial results
    lecture.rawTranscript = rawTranscript;
    lecture.processingStatus = "partial";
    await lecture.save();
    throw new Error(`Failed to generate structured notes: ${error.message}`);
  }
}

/**
 * Verify ffmpeg installation and path
 * @returns {Promise<boolean>} True if ffmpeg is accessible
 */
export async function verifyFFmpeg() {
  try {
    console.log("Verifying ffmpeg installation...");
    console.log(`FFmpeg path: ${ffmpegStatic}`);

    // Check if ffmpeg exists at the path
    try {
      await fs.access(ffmpegStatic);
      console.log("✅ FFmpeg binary found at:", ffmpegStatic);
      return true;
    } catch (error) {
      console.error("❌ FFmpeg binary not found at:", ffmpegStatic);
      return false;
    }
  } catch (error) {
    console.error("❌ FFmpeg verification failed:", error.message);
    return false;
  }
}

// Auto-verify ffmpeg when module loads
if (process.env.NODE_ENV !== "test") {
  verifyFFmpeg();
}

export default {
  splitAudioIntoChunks,
  processLectureAudio,
  verifyFFmpeg,
  CHUNK_SECONDS,
};
