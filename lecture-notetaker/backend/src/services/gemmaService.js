import "../config/env.js";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import Groq from "groq-sdk";

export const GEMMA_MODELS = [
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
  "google/gemma-4-31B-it",
  "google/gemma-4-26b-a4b-it",
];
const DEFAULT_MODEL = "gemma-4-31b-it";
const DEFAULT_FALLBACK_MODEL = "google/gemma-4-31B-it";
const DEFAULT_TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
const TOGETHER_CHAT_COMPLETIONS_URL =
  "https://api.together.xyz/v1/chat/completions";

const mimeTypes = new Map([
  [".aac", "audio/aac"],
  [".flac", "audio/flac"],
  [".m4a", "audio/mp4"],
  [".mp3", "audio/mpeg"],
  [".oga", "audio/ogg"],
  [".ogg", "audio/ogg"],
  [".wav", "audio/wav"],
  [".webm", "audio/webm"],
]);

function isConfiguredSecret(value) {
  return Boolean(
    value &&
    !value.toLowerCase().startsWith("your_") &&
    !value.toLowerCase().includes("_here"),
  );
}

function getConfig() {
  const requestedModel = process.env.GEMMA_MODEL || DEFAULT_MODEL;
  const model = GEMMA_MODELS.includes(requestedModel)
    ? requestedModel
    : DEFAULT_MODEL;

  if (requestedModel !== model) {
    console.warn(
      `⚠️ Unsupported Gemma model "${requestedModel}" requested. Using ${DEFAULT_MODEL}.`,
    );
  }

  const googleApiKey = process.env.GOOGLE_API_KEY || "";
  const groqApiKey = process.env.GROQ_API_KEY || "";
  const togetherApiKey = process.env.TOGETHER_API_KEY || "";

  return {
    googleApiKey: isConfiguredSecret(googleApiKey) ? googleApiKey : "",
    groqApiKey: isConfiguredSecret(groqApiKey) ? groqApiKey : "",
    model,
    togetherApiKey: isConfiguredSecret(togetherApiKey) ? togetherApiKey : "",
    fallbackEnabled:
      process.env.TOGETHER_FALLBACK_ENABLED === "true" &&
      isConfiguredSecret(togetherApiKey),
    togetherModel: process.env.TOGETHER_GEMMA_MODEL || DEFAULT_FALLBACK_MODEL,
    transcriptionModel:
      process.env.GROQ_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
  };
}

function createGroqClient() {
  const { groqApiKey } = getConfig();
  if (!groqApiKey) {
    throw new Error(
      "GROQ_API_KEY is required to use real Gemma models via Groq Cloud.",
    );
  }
  return new Groq({ apiKey: groqApiKey });
}

function maskKeyStatus(key) {
  if (!key) {
    return "missing";
  }
  return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`;
}

function logGemmaBanner() {
  const {
    googleApiKey,
    groqApiKey,
    model,
    fallbackEnabled,
    togetherApiKey,
    togetherModel,
    transcriptionModel,
  } = getConfig();
  console.log("\n🦙 Gemma Integration via Google AI Studio");
  console.log("📋 SDG 4: Quality Education");
  console.log(`🔑 Google API key: ${maskKeyStatus(googleApiKey)}`);
  console.log(`🔑 Groq API key: ${maskKeyStatus(groqApiKey)}`);
  console.log(`🤖 Model being used: ${model}`);
  console.log(`🎧 Cloud speech-to-text: ${transcriptionModel}`);
  console.log(
    fallbackEnabled
      ? `🛟 Fallback: Together AI (${togetherModel})`
      : `🛟 Fallback: disabled${togetherApiKey ? "" : " (TOGETHER_API_KEY is not set)"}`,
  );
  console.log("☁️ Cloud processing enabled for 8GB RAM laptops.\n");
}

function getMimeType(filePath) {
  return (
    mimeTypes.get(path.extname(filePath).toLowerCase()) ||
    "application/octet-stream"
  );
}

function estimateAudioSeconds(byteLength, mimeType) {
  if (mimeType === "audio/wav") {
    return Math.max(1, Math.round(byteLength / 32000));
  }
  return null;
}

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callGroqGemma(messages, options = {}) {
  const { model } = getConfig();
  const groq = createGroqClient();

  console.log(`🔄 Using Groq fallback: ${model}`);
  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 4096,
    response_format: options.json ? { type: "json_object" } : undefined,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Groq Gemma returned an empty response.");
  }
  return text;
}

async function callTogetherGemma(messages, options = {}) {
  const { togetherApiKey, togetherModel, fallbackEnabled } = getConfig();
  if (!fallbackEnabled || !togetherApiKey) {
    throw new Error("Together AI is disabled or missing API key.");
  }

  console.log(`🛟 Using Together AI fallback: ${togetherModel}`);
  const response = await fetch(TOGETHER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${togetherApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: togetherModel,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.json ? { type: "json_object" } : undefined,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        `Together AI request failed with status ${response.status}`,
    );
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Together AI Gemma returned an empty response.");
  }
  return text;
}

async function callGoogleGemma(messages, options = {}) {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new Error(
      "GOOGLE_API_KEY is required for free Gemma 4 via Google AI Studio.",
    );
  }

  const model = process.env.GEMMA_MODEL || DEFAULT_MODEL;
  console.log(`🦙 Using FREE Gemma 4 via Google AI Studio: ${model}`);

  // Google's API uses a different format
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  // Convert messages to Google's format
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 4096,
        ...(options.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error?.message || `Google API error: ${response.status}`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Google Gemma returned an empty response.");
  }
  return text;
}

async function callGemma(messages, options = {}) {
  // Try Google AI Studio first (FREE Gemma 4)
  try {
    return await callGoogleGemma(messages, options);
  } catch (googleError) {
    console.error(`❌ Google Gemma error: ${googleError.message}`);

    // Fallback to Together AI if available
    const { togetherApiKey, fallbackEnabled } = getConfig();
    if (fallbackEnabled && togetherApiKey) {
      try {
        console.log(`🔄 Falling back to Together AI...`);
        return await callTogetherGemma(messages, options);
      } catch (togetherError) {
        console.error(`❌ Together AI error: ${togetherError.message}`);
        // Try Groq as last resort
        try {
          console.log(`🔄 Falling back to Groq...`);
          return await callGroqGemma(messages, options);
        } catch (groqError) {
          throw new Error(
            `Gemma failed. Google: ${googleError.message}. Together: ${togetherError.message}. Groq: ${groqError.message}`,
          );
        }
      }
    }

    // Try Groq as last resort if Together not available
    try {
      console.log(`🔄 Falling back to Groq...`);
      return await callGroqGemma(messages, options);
    } catch (groqError) {
      throw new Error(
        `Gemma request failed. Google: ${googleError.message}. Groq: ${groqError.message}`,
      );
    }
  }
}

export function listGemmaModels() {
  const { googleApiKey, groqApiKey, model, togetherModel, fallbackEnabled } =
    getConfig();
  return {
    provider: "Google AI Studio (FREE)",
    sdgTheme: "SDG 4: Quality Education",
    defaultModel: DEFAULT_MODEL,
    activeModel: model,
    gemmaModels: GEMMA_MODELS,
    googleApiKey: maskKeyStatus(googleApiKey),
    groqApiKey: maskKeyStatus(groqApiKey),
    fallback: fallbackEnabled
      ? { provider: "Together AI", model: togetherModel }
      : { provider: "Together AI", enabled: false },
  };
}

export async function testGemmaConnection() {
  const { model } = getConfig();
  console.log(
    `🔎 Testing Gemma 4 connection through Google AI Studio with ${model}...`,
  );
  const response = await callGemma(
    [
      {
        role: "system",
        content:
          "You are Gemma 4, supporting SDG 4: Quality Education in a lecture-notetaker app.",
      },
      {
        role: "user",
        content: "Reply with: Gemma 4 via Google AI Studio is ready for SDG 4.",
      },
    ],
    { maxTokens: 64 },
  );
  console.log(`✅ Gemma 4 connection ready: ${response}`);
  return { ok: true, model, response };
}

export async function transcribeChunk(chunkPath, lectureContext = "") {
  const fileBuffer = await fs.readFile(chunkPath);
  const mimeType = getMimeType(chunkPath);
  const audioSeconds = estimateAudioSeconds(fileBuffer.length, mimeType);
  const { transcriptionModel } = getConfig();
  const groq = createGroqClient();

  console.log(
    `🎧 Transcribing lecture audio in Groq Cloud: ${path.basename(chunkPath)}`,
  );
  const transcription = await groq.audio.transcriptions.create({
    file: createReadStream(chunkPath),
    model: transcriptionModel,
    response_format: "text",
    temperature: 0,
  });

  const rawTranscript =
    typeof transcription === "string"
      ? transcription.trim()
      : transcription.text?.trim();

  if (!rawTranscript) {
    throw new Error("Groq Cloud transcription returned an empty transcript.");
  }

  console.log(
    "🦙 Refining transcript with Gemma 4 via Google AI Studio for SDG 4 notes.",
  );
  return callGemma(
    [
      {
        role: "system",
        content:
          "You are Gemma 4 for Recall, an SDG 4 quality education lecture-notetaker. Clean transcription text without inventing content.",
      },
      {
        role: "user",
        content: `Clean this lecture transcript chunk for student notes. Preserve important names, formulas, definitions, examples, and uncertainty markers. Do not add facts that are not in the transcript.

Lecture context: ${lectureContext || "not provided"}
Audio file: ${path.basename(chunkPath)}
MIME type: ${mimeType}
Size: ${fileBuffer.length} bytes
Estimated duration: ${audioSeconds ? `${audioSeconds} seconds` : "unavailable"}

Raw transcript:
${rawTranscript}`,
      },
    ],
    { maxTokens: 2048 },
  );
}

export async function cleanAndStructureNotes(
  fullTranscript,
  lectureContext = "",
) {
  const text = await callGemma(
    [
      {
        role: "system",
        content:
          "You are Gemma 4 for Recall, a hackathon prototype for SDG 4: Quality Education. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Convert the transcript into concise structured notes for students.
${lectureContext ? `Class context: ${lectureContext}\n` : ""}
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
${fullTranscript}`,
      },
    ],
    { json: true, maxTokens: 4096 },
  );

  try {
    return parseJsonResponse(text);
  } catch {
    return {
      summary: "Gemma 4 returned notes, but they could not be parsed as JSON.",
      headings: [{ title: "Gemma Notes", keyPoints: [text], examples: [] }],
      actionItems: [],
      transcriptPreview: fullTranscript.slice(0, 500),
    };
  }
}

export async function answerQuestion(
  structuredNotes,
  question,
  chatHistory = [],
) {
  const recentHistory = chatHistory
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  return callGemma([
    {
      role: "system",
      content:
        "You are a helpful Gemma 4 study assistant for SDG 4: Quality Education. Use the lecture notes first.",
    },
    {
      role: "user",
      content: `Lecture notes JSON:
${JSON.stringify(structuredNotes || {}, null, 2)}

Recent chat:
${recentHistory || "No previous chat."}

Question: ${question}

If the notes do not contain the answer, say what is missing and give a careful general explanation.`,
    },
  ]);
}

if (process.env.NODE_ENV !== "test") {
  logGemmaBanner();
  testGemmaConnection().catch((error) => {
    console.error(`⚠️ Gemma startup self-test failed: ${error.message}`);
  });
}

export default {
  transcribeChunk,
  cleanAndStructureNotes,
  answerQuestion,
  testGemmaConnection,
  listGemmaModels,
};
