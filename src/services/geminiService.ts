import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getGeminiModel() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  const client = getGeminiModel();
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only provide the translation itself without any extra explanations: "${text}"`;
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No translation result.";
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function chatAssistant(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], targetLang: string = 'Portuguese') {
  const client = getGeminiModel();
  
  try {
    const response = await client.models.generateContent({
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
  const client = getGeminiModel();
  
  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: 'user',
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
      ],
    });
    return response.text || "No text detected.";
  } catch (error) {
    console.error("Image translation error:", error);
    throw error;
  }
}

