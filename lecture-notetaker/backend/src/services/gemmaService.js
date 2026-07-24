import fs from 'fs/promises';
import path from 'path';

const DEFAULT_MODEL = 'gemma-3-27b-it';
const GEMMA_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const mimeTypes = new Map([
  ['.aac', 'audio/aac'],
  ['.flac', 'audio/flac'],
  ['.m4a', 'audio/mp4'],
  ['.mp3', 'audio/mpeg'],
  ['.oga', 'audio/ogg'],
  ['.ogg', 'audio/ogg'],
  ['.wav', 'audio/wav'],
  ['.webm', 'audio/webm']
]);

function getConfig() {
  return {
    apiKey: process.env.GEMMA_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: process.env.GEMMA_MODEL || DEFAULT_MODEL
  };
}

function getMimeType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

async function callGemma(parts, { responseMimeType } = {}) {
  const { apiKey, model } = getConfig();
  if (!apiKey) {
    throw new Error('Gemma API key missing. Set GEMMA_API_KEY or GOOGLE_API_KEY in the backend environment.');
  }

  const response = await fetch(`${GEMMA_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        ...(responseMimeType ? { responseMimeType } : {})
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Gemma request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function transcribeChunk(chunkPath, lectureContext = '') {
  const fileBuffer = await fs.readFile(chunkPath);
  const prompt = [
    'Transcribe this lecture audio accurately for a study-notes app.',
    'Keep important names, formulas, definitions, and examples.',
    lectureContext ? `Use this teacher/student context to resolve ambiguous words: ${lectureContext}` : ''
  ].filter(Boolean).join('\n\n');

  return callGemma([
    { text: prompt },
    { inlineData: { mimeType: getMimeType(chunkPath), data: fileBuffer.toString('base64') } }
  ]);
}

export async function cleanAndStructureNotes(fullTranscript, lectureContext = '') {
  const prompt = `You are the Gemma parser for Recall, a hackathon prototype for SDG 4 quality education.
Convert the transcript into concise structured notes for students.
${lectureContext ? `Class context: ${lectureContext}\n` : ''}
Return only valid JSON with this exact shape:
{
  "summary": "2-4 sentence overview",
  "headings": [
    { "title": "section title", "keyPoints": ["point"], "examples": ["example"] }
  ],
  "actionItems": ["study task or follow-up"],
  "transcriptPreview": "first useful excerpt"
}
Transcript:
${fullTranscript}`;

  const text = await callGemma([{ text: prompt }], { responseMimeType: 'application/json' });
  try {
    return parseJsonResponse(text);
  } catch {
    return {
      summary: 'Gemma returned notes, but they could not be parsed as JSON.',
      headings: [{ title: 'Gemma Notes', keyPoints: [text], examples: [] }],
      actionItems: [],
      transcriptPreview: fullTranscript.slice(0, 500)
    };
  }
}

export async function answerQuestion(structuredNotes, question, chatHistory = []) {
  const recentHistory = chatHistory.slice(-8).map((message) => `${message.role}: ${message.content}`).join('\n');
  return callGemma([{ text: `Answer as a helpful AI study assistant using the lecture notes first. If the notes do not contain the answer, say what is missing and give a careful general explanation.

Lecture notes JSON:
${JSON.stringify(structuredNotes || {}, null, 2)}

Recent chat:
${recentHistory}

Question: ${question}` }]);
}
