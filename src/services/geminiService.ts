export type TranslationMode = 'Standard' | 'Formal' | 'Casual' | 'Literal';

async function handleApiError(response: Response) {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Erro desconhecido na API' }));
    throw new Error(errData.error || `Erro HTTP: ${response.status}`);
  }
}

export async function translateText(
  text: string, 
  sourceLang: string, 
  targetLang: string, 
  mode: TranslationMode = 'Standard'
) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang, mode })
    });
    
    await handleApiError(response);
    return await response.json();
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function chatAssistant(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[], 
  targetLang: string = 'Portuguese'
) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, targetLang })
    });

    await handleApiError(response);
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}

export async function translateImage(base64Image: string, targetLang: string = 'Portuguese') {
  try {
    const response = await fetch('/api/translate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, targetLang })
    });

    await handleApiError(response);
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Image translation error:", error);
    throw error;
  }
}
