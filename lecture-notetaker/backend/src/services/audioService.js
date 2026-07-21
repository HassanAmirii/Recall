import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { transcribeChunk, cleanAndStructureNotes } from './gemmaService.js';

const CHUNK_SECONDS = 30;

export async function splitAudioIntoChunks(inputPath, lectureId) {
  const uploadRoot = process.env.UPLOAD_DIR || 'uploads';
  const chunkDir = path.join(uploadRoot, String(lectureId), 'chunks');
  await fs.mkdir(chunkDir, { recursive: true });
  const outputPattern = path.join(chunkDir, 'chunk-%03d.wav');

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-f segment', `-segment_time ${CHUNK_SECONDS}`, '-reset_timestamps 1'])
        .output(outputPattern)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    const files = (await fs.readdir(chunkDir)).filter((file) => file.endsWith('.wav')).sort();
    if (files.length > 0) return files.map((file, index) => ({ chunkIndex: index, filePath: path.join(chunkDir, file) }));
  } catch (error) {
    console.warn('ffmpeg chunking failed; using original upload as a single placeholder chunk.', error.message);
  }

  return [{ chunkIndex: 0, filePath: inputPath }];
}

export async function processLectureAudio(lecture) {
  const transcripts = [];
  for (const chunk of lecture.audioChunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
    transcripts.push(await transcribeChunk(chunk.filePath));
  }
  const rawTranscript = transcripts.join('\n\n');
  const structuredNotes = await cleanAndStructureNotes(rawTranscript);
  lecture.rawTranscript = rawTranscript;
  lecture.structuredNotes = structuredNotes;
  await lecture.save();
  return lecture;
}
