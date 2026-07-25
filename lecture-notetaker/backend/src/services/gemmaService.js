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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  };

  if (options.json) {
    requestBody.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`❌ Google API error:`, JSON.stringify(data, null, 2));
    throw new Error(
      data.error?.message || `Google API error: ${response.status}`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    console.error(
      `❌ Empty response from Google:`,
      JSON.stringify(data, null, 2),
    );
    throw new Error("Google Gemma returned an empty response.");
  }

  if (options.json) {
    try {
      JSON.parse(text);
      return text;
    } catch (e) {
      console.warn(
        `⚠️ Response claimed JSON but parsing failed: ${text.substring(0, 200)}...`,
      );
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      return text;
    }
  }

  return text;
}

async function callGemma(messages, options = {}) {
  try {
    return await callGoogleGemma(messages, options);
  } catch (googleError) {
    console.error(`❌ Google Gemma error: ${googleError.message}`);

    const { togetherApiKey, fallbackEnabled } = getConfig();
    if (fallbackEnabled && togetherApiKey) {
      try {
        console.log(`🔄 Falling back to Together AI...`);
        return await callTogetherGemma(messages, options);
      } catch (togetherError) {
        console.error(`❌ Together AI error: ${togetherError.message}`);
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
    `✅ Transcription successful (${rawTranscript.length} characters)`,
  );
  console.log(
    "🦙 Refining transcript with Gemma 4 via Google AI Studio for SDG 4 notes.",
  );

  const cleanedTranscript = await callGemma(
    [
      {
        role: "system",
        content: `You are a transcript cleaner. Clean the lecture transcript below.
        Return ONLY the cleaned transcript text. No explanations, no introductions, no meta-commentary.`,
      },
      {
        role: "user",
        content: `Clean this transcript for readability. Fix grammar, preserve all technical terms, names, and numbers. Return ONLY the cleaned text:

        ${rawTranscript}`,
      },
    ],
    { maxTokens: 2048 },
  );

  // Return just the cleaned text, not the system prompt
  return cleanedTranscript;
}

// Helper function to create notes directly from transcript
function createSimpleNotesFromTranscript(transcript) {
  console.log(
    `📝 Creating simple notes from transcript (${transcript.length} characters)`,
  );

  // Remove any system prompt artifacts
  let cleanTranscript = transcript;
  const artifacts = [
    "Expert Teaching Assistant",
    "Clean and enhance",
    "Preserve names",
    "Fix grammar",
    "Maintain original",
    "You are Gemma",
    "Your task is to clean",
    "Guidelines:",
  ];

  artifacts.forEach((artifact) => {
    cleanTranscript = cleanTranscript.replace(new RegExp(artifact, "gi"), "");
  });

  // Split into sentences
  const sentences = cleanTranscript
    .split(/[.!?]\s+/)
    .filter((s) => s.trim().length > 15)
    .map((s) => s.trim());

  if (sentences.length === 0) {
    return {
      summary: "Lecture notes from the transcript.",
      learningObjectives: [
        "Review the lecture material",
        "Practice applying the concepts",
        "Prepare questions for clarification",
      ],
      headings: [
        {
          title: "Lecture Content",
          keyPoints: ["Content from the lecture"],
          examples: [],
        },
      ],
      actionItems: ["Review and practice the material"],
    };
  }

  // Create summary from first 2-3 sentences
  const summary = sentences.slice(0, 3).join(". ") + ".";

  // Group sentences into sections
  const sectionSize = Math.max(3, Math.ceil(sentences.length / 3));
  const headings = [];

  for (let i = 0; i < sentences.length; i += sectionSize) {
    const sectionSentences = sentences.slice(
      i,
      Math.min(i + sectionSize, sentences.length),
    );
    if (sectionSentences.length > 0) {
      headings.push({
        title: `Section ${Math.floor(i / sectionSize) + 1}`,
        keyPoints: sectionSentences.slice(0, 5),
        examples: [],
      });
    }
  }

  // If no headings were created, use all sentences as key points
  if (headings.length === 0) {
    headings.push({
      title: "Key Points",
      keyPoints: sentences.slice(0, 8),
      examples: [],
    });
  }

  return {
    summary: summary || "Key concepts from the lecture.",
    learningObjectives: [
      "Understand the core concepts presented",
      "Apply the knowledge to practical scenarios",
      "Review and reinforce key takeaways",
    ],
    headings: headings,
    actionItems: [
      "Review the material for deeper understanding",
      "Practice applying the concepts",
      "Prepare questions for further clarification",
    ],
  };
}

export async function cleanAndStructureNotes(
  fullTranscript,
  lectureContext = "",
) {
  console.log(
    `📝 Generating structured notes from transcript (${fullTranscript.length} characters)`,
  );

  // Check if the transcript contains system prompt text
  if (
    fullTranscript.includes("Expert Teaching Assistant") ||
    fullTranscript.includes("Clean and enhance") ||
    fullTranscript.includes("Your task is to clean")
  ) {
    console.warn(
      `⚠️ Transcript appears to contain system prompt, not actual transcript.`,
    );
    console.log(`📝 Attempting to extract actual content...`);

    // Try to extract the actual transcript from the response
    const lines = fullTranscript.split("\n");
    const actualContent = lines
      .filter(
        (line) =>
          !line.includes("Expert Teaching Assistant") &&
          !line.includes("Clean and enhance") &&
          !line.includes("Preserve names") &&
          !line.includes("Fix grammar") &&
          !line.includes("Maintain original") &&
          !line.includes("You are Gemma") &&
          !line.includes("Your task is to clean") &&
          !line.includes("Guidelines:") &&
          !line.includes("Return ONLY") &&
          line.trim().length > 10,
      )
      .join("\n");

    if (actualContent.length > 50) {
      console.log(
        `✅ Extracted actual content (${actualContent.length} characters)`,
      );
      fullTranscript = actualContent;
    }
  }

  try {
    const text = await callGemma(
      [
        {
          role: "system",
          content: `You are Gemma 4, an expert educational assistant for SDG 4: Quality Education.
          
          CRITICAL: Convert the transcript into a complete, self-contained set of study notes.
          
          Return ONLY valid JSON with this exact structure. Do not add any text outside the JSON.
          
          {
            "summary": "A comprehensive 2-4 sentence overview of the entire lecture",
            "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
            "headings": [
              { 
                "title": "Section title", 
                "keyPoints": ["Key point 1", "Key point 2"], 
                "examples": ["Example 1", "Example 2"]
              }
            ],
            "actionItems": ["Study task 1", "Study task 2"]
          }`,
        },
        {
          role: "user",
          content: `Convert this lecture transcript into comprehensive study notes:
          
          ${fullTranscript}
          
          Return ONLY valid JSON. No markdown, no extra text, no explanations. Just the JSON object.`,
        },
      ],
      { json: true, maxTokens: 4096 },
    );

    console.log(`📝 Raw response from Gemma (${text.length} characters)`);

    try {
      const parsed = parseJsonResponse(text);
      console.log(`✅ Notes parsed successfully`);

      if (!parsed.summary || !parsed.headings || parsed.headings.length === 0) {
        console.warn(`⚠️ Parsed notes missing required fields, using fallback`);
        return createSimpleNotesFromTranscript(fullTranscript);
      }

      return parsed;
    } catch (parseError) {
      console.error(`❌ JSON parsing failed: ${parseError.message}`);
      return createSimpleNotesFromTranscript(fullTranscript);
    }
  } catch (error) {
    console.error(`❌ cleanAndStructureNotes error: ${error.message}`);
    return createSimpleNotesFromTranscript(fullTranscript);
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
      content: `You are a world-class teacher assistant for SDG 4: Quality Education.

      CRITICAL: DO NOT describe what you're about to do. DO NOT explain your thinking process. DIRECTLY ANSWER the student's question.

      Your response must be formatted with these headings:
      ## 📚 Summary
      ## 🎯 Key Concepts  
      ## 💡 Examples
      ## ✅ Practice Questions (if applicable)

      Use simple, clear language. Bold important terms with **. Use bullet points with -.

      Never say "I will" or "I'm going to" - just answer directly.`,
    },
    {
      role: "user",
      content: `Based on these lecture notes, directly answer the student's question:

      Lecture Notes:
      ${JSON.stringify(structuredNotes || {}, null, 2)}

      Recent chat:
      ${recentHistory || "No previous chat."}

      Student's Question: ${question}

      DIRECTLY ANSWER. No planning, no meta-commentary. Just the answer with proper formatting.`,
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
