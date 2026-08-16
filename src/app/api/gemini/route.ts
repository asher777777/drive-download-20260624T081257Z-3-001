import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// אתחול ה-SDK של ג'מיני. 
// יש לוודא שמשתנה הסביבה GEMINI_API_KEY מוגדר בפרויקט.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, fileBase64, mimeType } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required (generate-image, generate-code, web-search, read-document)' }, { status: 400 });
    }

    switch (action) {
      case 'generate-image':
        return await handleGenerateImage(prompt);
      case 'generate-code':
        return await handleGenerateCode(prompt);
      case 'web-search':
        return await handleWebSearch(prompt);
      case 'read-document':
        return await handleReadDocument(prompt, fileBase64, mimeType);
      default:
        return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 1. נתיב ליצירת תמונות (Image Generation)
// משתמש במודל imagen-3.0-generate-002
async function handleGenerateImage(prompt: string) {
  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1', // ניתן לשנות ל-16:9, 9:16 וכו'
    }
  });

  const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
  return NextResponse.json({ imageBase64: base64Image });
}

// 2. נתיב ליצירת קוד (Code Generation)
// משתמש במודל gemini-3.1-pro (או 2.5-pro)
async function handleGenerateCode(prompt: string) {
  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro', // ניתן לשנות ל- 'gemini-2.5-pro' במידת הצורך
    contents: prompt,
    config: {
      systemInstruction: 'You are an expert software developer. Generate clean, efficient, well-documented, and production-ready code. Output only the code with necessary brief explanations.',
      temperature: 0.2, // טמפרטורה נמוכה ליצירת קוד עקבי ומדויק
    }
  });

  return NextResponse.json({ result: response.text });
}

// 3. נתיב לסריקת אתרים וליקוט מידע (Web Search / Information Gathering)
// משתמש ב- gemini-2.5-pro עם יכולות חיפוש מובנות של Google
async function handleWebSearch(prompt: string) {
  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      // הפעלת חיפוש מובנה של גוגל בזמן אמת
      tools: [{ googleSearch: {} }],
      temperature: 0.3, // טמפרטורה נמוכה לקבלת מידע עובדתי
    }
  });

  // שליפת מקורות המידע אם קיימים
  const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  return NextResponse.json({ 
    result: response.text,
    sources: searchChunks 
  });
}

// 4. נתיב לקריאת מסמכים (Document Reading)
// משתמש ב- gemini-2.5-flash המהיר לקריאת קבצים ומסמכים
async function handleReadDocument(prompt: string, fileBase64: string, mimeType: string) {
  if (!fileBase64 || !mimeType) {
    return NextResponse.json({ error: 'fileBase64 and mimeType are required for reading documents' }, { status: 400 });
  }
  
  const textPrompt = prompt || 'Please analyze this document and summarize its key points.';
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: textPrompt },
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType // לדוגמה: 'application/pdf', 'image/png', 'text/plain'
            }
          }
        ]
      }
    ],
    config: {
      temperature: 0.1,
    }
  });

  return NextResponse.json({ result: response.text });
}
