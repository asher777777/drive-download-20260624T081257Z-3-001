import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenAI } from "@google/genai";

let geminiKey = process.env.GEMINI_API_KEY;
const aiConfig: any = {};
if (geminiKey?.startsWith("AQ.")) {
  aiConfig.httpOptions = { headers: { Authorization: `Bearer ${geminiKey}` } };
} else {
  aiConfig.apiKey = geminiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}
const ai = new GoogleGenAI(aiConfig);

const tools: any[] = [
  {
    functionDeclarations: [
      {
        name: "seed_database_collection",
        description: "Creates multiple documents in a specific Firestore collection path to seed the database with initial data. Can be used for deep paths like 'users/123/tasks'.",
        parameters: {
          type: "OBJECT",
          properties: {
            collectionPath: { type: "STRING", description: "The full path of the collection (e.g., 'products' or 'users/123/tasks')" },
            documents: {
              type: "ARRAY",
              description: "Array of JSON objects to insert. Each object represents a document data.",
              items: { type: "OBJECT" }
            }
          },
          required: ["collectionPath", "documents"]
        }
      }
    ]
  }
];

const systemInstruction = `
אתה "ארכיטקט מסדי נתונים" (Database Architect) של המערכת. התפקיד שלך הוא לעזור למשתמש בסיעור מוחות כדי לבנות מודלים, סכמות, וקולקציות למסד הנתונים (Firestore).

שלבים:
1. שאל את המשתמש איזה סוג נתונים הוא רוצה לאחסן ולנהל.
2. הצע סכמות JSON חכמות והגיוניות הכוללות שדות שימושיים (כמו סטטוסים, תאריכים, מזהים מקושרים).
3. לאחר שהמשתמש מאשר ומרוצה מהסכמה, הצע לייצר עבורו נתוני דמו (Mock Data).
4. אם המשתמש מסכים, השתמש בכלי 'seed_database_collection' כדי לייצר 3-5 דוגמאות ריאליסטיות ולהזריק אותן בפועל למסד הנתונים כדי שהמשתמש יראה אותן נוצרות מולו!

שים לב: 
- אין לך אישור למחוק נתונים! מותר לך רק ליצור מידע חדש.
- תמיד ענה בעברית בצורה שירותית, טכנית ומקצועית. עזור למשתמש לחשוב על שדות חשובים שאולי פספס.
- שים לב שאתה מסוגל לכתוב מספר מסמכים במכה אחת (Batch) בעזרת הכלי שלך.
`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Format history for Gemini
    const contents = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text || msg.content }]
        });
      }
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // High intelligence for architecture
      contents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7
      }
    });

    let functionCalls = response.functionCalls || [];
    let textResponse = response.text || '';
    
    let isSeeding = false;
    let seededCount = 0;
    
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === "seed_database_collection") {
          const { collectionPath, documents } = call.args as any;
          if (collectionPath && Array.isArray(documents) && documents.length > 0) {
            isSeeding = true;
            const batch = adminDb.batch();
            const colRef = adminDb.collection(collectionPath);
            documents.forEach((docData: any) => {
              const newDoc = colRef.doc();
              const cleanData = JSON.parse(JSON.stringify(docData));
              batch.set(newDoc, {
                 ...cleanData,
                 createdAt: Date.now()
              });
            });
            await batch.commit();
            seededCount = documents.length;
            textResponse += `\n\n[פעולת מערכת: הוזרקו בהצלחה ${seededCount} רשומות לתוך '${collectionPath}']`;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      text: textResponse,
      seededCount,
      isSeeding
    });

  } catch (error: any) {
    console.error("DB Architect API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "שגיאה פנימית" },
      { status: 500 }
    );
  }
}
