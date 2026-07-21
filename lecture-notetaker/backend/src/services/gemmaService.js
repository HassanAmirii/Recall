export async function transcribeChunk(chunkPath) {
  // TODO: replace with real Gemma 4 API call
  return `Placeholder transcript for ${chunkPath}.`;
}

export async function cleanAndStructureNotes(fullTranscript) {
  // TODO: replace with real Gemma 4 API call
  return {
    headings: [
      {
        title: 'Placeholder Lecture Summary',
        keyPoints: [
          'This is dummy structured note content generated from the transcript pipeline.',
          'Replace the placeholder Gemma service functions when API integration is ready.'
        ],
        examples: ['Example concept pulled from future transcript processing.']
      }
    ],
    transcriptPreview: fullTranscript.slice(0, 500)
  };
}

export async function answerQuestion(structuredNotes, question, chatHistory) {
  // TODO: replace with real Gemma 4 API call
  return `Placeholder answer to: "${question}". I would use ${chatHistory.length} prior messages and the lecture notes when Gemma 4 is connected.`;
}
