import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export type TranslationMode = 'Standard' | 'Formal' | 'Casual' | 'Literal';

export async function translateText(
  text: string, 
  sourceLang: string, 
  targetLang: string, 
  mode: TranslationMode = 'Standard'
) {
  const systemPrompt = `You are Traduza.AI, a high-quality translation engine. 
  Your goal is to translate text from ${sourceLang === 'Auto' ? 'the detected language' : sourceLang} to ${targetLang}.
  
  MODE: ${mode}
  - Standard: Neutral, accurate, and natural.
  - Formal: Respectful, professional, suitable for business or formal settings.
  - Casual: Friendly, colloquial, suitable for friends and family.
  - Literal: Word-for-word as much as possible, focusing on structural accuracy over natural flow.

  INSTRUCTIONS:
  1. Preserving Formatting: Keep all line breaks, lists, and special characters exactly as they are in the source.
  2. Nuance: Capture the precise emotional and cultural context of the specified mode.
  3. No Meta-talk: Return ONLY the translated text. Do not explain anything.
  4. Language Detection: If source language is unknown, detect it automatically.
  
  SOURCE TEXT:
  """
  ${text}
  """`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: systemPrompt,
    });
    
    return {
      text: response.text || "No translation result.",
      detectedLanguage: sourceLang === 'Auto' ? 'Detected' : null
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function chatAssistant(message: string, history: any[], targetLang: string = 'Portuguese') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are Traduza.AI, a helpful and professional translation assistant. You must always communicate in ${targetLang}. You help users translate phrases, learn new languages, and explain cultural nuances of translations.`,
      }
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}

export async function translateImage(base64Image: string, targetLang: string = 'Portuguese') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: `Identify any text in this image and translate it to ${targetLang}. Return ONLY the translated text. If no text is found, say "No text detected".` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    });
    return response.text || "No text detected.";
  } catch (error) {
    console.error("Image translation error:", error);
    throw error;
  }
}
