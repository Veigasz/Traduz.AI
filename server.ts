import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Gemini Setup
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  // API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLang, targetLang, mode } = req.body;
      
      const systemPrompt = `You are Traduza.AI, a high-quality translation engine. 
      Your goal is to translate text from ${sourceLang === 'Auto' ? 'the detected language' : sourceLang} to ${targetLang}.
      
      MODE: ${mode || 'Standard'}
      - Standard: Neutral, accurate, and natural.
      - Formal: Respectful, professional, suitable for business or formal settings.
      - Casual: Friendly, colloquial, suitable for friends and family.
      - Literal: Word-for-word as much as possible, focusing on structural accuracy over natural flow.

      INSTRUCTIONS:
      1. Preserving Formatting: Keep all line breaks, lists, and special characters exactly as they are in the source.
      2. No Meta-talk: Return ONLY the translated text. Do not explain anything.
      
      SOURCE TEXT:
      """
      ${text}
      """`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
      });

      res.json({ 
        text: response.text || "Sem resultado de tradução.",
        detectedLanguage: sourceLang === 'Auto' ? 'Detectado' : sourceLang 
      });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/translate-image", async (req, res) => {
    try {
      const { image, targetLang } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: `Identify any text in this image and translate it to ${targetLang}. Return ONLY the translated text. If no text is found, say "No text detected".` },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image
              }
            }
          ]
        }
      });
      
      res.json({ text: response.text || "Nenhum texto detectado." });
    } catch (error: any) {
      console.error("Image translation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, targetLang } = req.body;

      // Filter and map history to correct format
      const formattedHistory = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.parts[0].text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...formattedHistory, { role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: `You are Traduza.AI, a helpful and professional translation assistant. You must always communicate in ${targetLang || 'Portuguese'}. You help users translate phrases, learn new languages, and explain cultural nuances of translations.`
        }
      });

      res.json({ text: response.text || "Desculpe, não consegui processar isso." });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
