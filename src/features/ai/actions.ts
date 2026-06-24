"use server";

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getAiSettings() {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { getUserDb } = await import("@/lib/firebase-admin");
    const docRef = getUserDb(userId).collection("settings").doc("ai");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    }
    return { googleAiKey: "" };
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return { googleAiKey: "" };
  }
}

export async function saveAiSettings(settings: { googleAiKey: string }) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { getUserDb } = await import("@/lib/firebase-admin");

    const docRef = getUserDb(userId).collection("settings").doc("ai");
    await docRef.set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error saving AI settings:", error);
    return { success: false, error: error.message };
  }
}

export async function rephraseTextWithAI(
  text: string,
  tone: "warm" | "elegant" | "punchy" | "storytelling" = "warm",
  customInstruction: string = ""
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {
    // If not authenticated or error, we might just fail
  }

  if (!text || !text.trim()) {
    return { success: false, error: "׳׳ ׳ ׳©׳׳— ׳˜׳§׳¡׳˜ ׳׳ ׳™׳¡׳•׳—" };
  }

  // Try to get API key from env, then from Firebase settings
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Using smart Hebrew copywriting fallback.");
    
    // Provide a beautiful copywriting fallback
    let fallbackText = text;
    if (text.includes("׳§׳₪׳”")) {
      fallbackText = "׳©׳•׳×׳₪׳•׳× ׳—׳׳” ׳•׳׳׳™׳¨׳”: ׳§׳—׳• ׳—׳׳§ ׳‘׳׳—׳–׳§׳× ׳₪׳™׳ ׳× ׳”׳§׳₪׳” ׳©׳ ׳‘׳™׳× ׳”׳›׳ ׳¡׳× ׳׳–׳›׳•׳× ׳׳× ׳”׳׳×׳₪׳׳׳™׳ ׳•׳”׳׳•׳׳“׳™׳. ׳×׳¨׳•׳׳” ׳§׳˜׳ ׳” ׳©׳ ׳—׳¡׳“ - ׳–׳›׳•׳× ׳’׳“׳•׳׳” ׳׳¢׳™׳׳•׳™ ׳ ׳©׳׳”, ׳׳”׳¦׳׳—׳” ׳׳• ׳׳‘׳¨׳›׳” ׳‘׳‘׳™׳×.";
    } else if (text.includes("׳§׳”׳™׳׳”")) {
      fallbackText = "׳‘׳™׳× ׳—׳ ׳׳›׳ ׳׳—׳“: ׳׳ ׳• ׳׳–׳׳™׳ ׳™׳ ׳׳×׳›׳ ׳׳”׳™׳•׳× ׳—׳׳§ ׳׳”׳§׳”׳™׳׳” ׳©׳׳ ׳•. ׳׳¨׳›׳– ׳©׳ ׳—׳™׳‘׳•׳¨, ׳¢׳¨׳‘׳•׳× ׳”׳“׳“׳™׳× ׳•׳₪׳¢׳™׳׳•׳× ׳§׳”׳™׳׳×׳™׳× ׳¢׳ ׳₪׳” ׳׳›׳ ׳”׳’׳™׳׳׳™׳.";
    } else if (text.includes("׳©׳™׳¨׳•׳×׳™׳") || text.includes("׳×׳₪׳™׳׳™׳")) {
      fallbackText = "׳©׳™׳¨׳•׳×׳™׳ ׳׳§׳¦׳•׳¢׳™׳™׳: ׳™׳™׳¢׳•׳¥, ׳׳™׳•׳•׳™, ׳”׳¨׳¦׳׳•׳× ׳׳¨׳×׳§׳•׳×, ׳¡׳™׳•׳¢ ׳•׳”׳›׳•׳•׳ ׳”. ׳׳ ׳—׳ ׳• ׳›׳׳ ׳‘׳©׳‘׳™׳׳›׳ ׳׳›׳ ׳“׳‘׳¨ ׳•׳¢׳ ׳™׳™׳.";
    } else {
      const toneLabels: Record<string, string> = {
        warm: "׳—׳ ׳•׳׳§׳¨׳‘",
        elegant: "׳¨׳©׳׳™ ׳•׳׳›׳•׳‘׳“",
        punchy: "׳§׳¦׳¨ ׳•׳§׳•׳׳¢",
        storytelling: "׳¨׳•׳—׳ ׳™ ׳•׳׳¨׳’׳©"
      };
      fallbackText = `[׳¡׳’׳ ׳•׳: ${toneLabels[tone] || "׳—׳"}] ${text} ${customInstruction ? `(׳׳•׳×׳׳ ׳׳™׳©׳™׳×: ${customInstruction})` : ""}`;
    }
    
    return { success: true, text: fallbackText };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-pro-preview model as specified by the user
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    
    const toneGuidelines: Record<string, string> = {
      warm: "׳¡׳’׳ ׳•׳ ׳§׳”׳™׳׳×׳™, ׳—׳, ׳׳¡׳‘׳™׳¨ ׳₪׳ ׳™׳, ׳׳—׳‘׳§ ׳•׳׳§׳¨׳‘ ׳׳‘׳‘׳•׳×. ׳”׳©׳×׳׳© ׳‘׳׳™׳׳™׳ ׳©׳™׳•׳¦׳¨׳•׳× ׳×׳—׳•׳©׳× ׳©׳™׳™׳›׳•׳×, ׳—׳׳™׳׳•׳× ׳•׳׳©׳₪׳—׳×׳™׳•׳× (׳׳׳©׳: '׳׳¨׳’׳™׳©׳™׳ ׳‘׳‘׳™׳×', '׳›׳•׳׳ ׳׳•׳–׳׳ ׳™׳', '׳‘׳׳”׳‘׳” ׳•׳‘׳©׳׳—׳”').",
      elegant: "׳¡׳’׳ ׳•׳ ׳™׳•׳§׳¨׳×׳™, ׳¨׳©׳׳™, ׳׳›׳•׳‘׳“ ׳•׳‘׳¢׳ ׳¢׳‘׳¨׳™׳× ׳’׳‘׳•׳”׳” ׳•׳×׳§׳™׳ ׳” ׳‘׳׳™׳•׳—׳“. ׳׳×׳׳™׳ ׳׳׳›׳×׳‘׳™׳ ׳¨׳©׳׳™׳™׳, ׳×׳¨׳•׳׳•׳× ׳’׳“׳•׳׳•׳×, ׳׳• ׳”׳¡׳‘׳¨׳™׳ ׳”׳׳›׳×׳™׳™׳ ׳׳›׳•׳‘׳“׳™׳.",
      punchy: "׳¡׳’׳ ׳•׳ ׳§׳¦׳¨, ׳§׳•׳׳¢, ׳—׳“, ׳§׳¦׳‘׳™ ׳•׳׳ ׳™׳¢ ׳׳₪׳¢׳•׳׳” (׳§׳•׳₪׳™ ׳©׳™׳•׳•׳§׳™ ׳׳׳•׳§׳“). ׳׳¦׳•׳™׳ ׳׳›׳•׳×׳¨׳•׳× ׳׳• ׳׳›׳₪׳×׳•׳¨׳™׳. ׳”׳—׳¡׳¨ ׳׳™׳׳™׳ ׳׳™׳•׳×׳¨׳•׳× ׳•׳”׳×׳׳§׳“ ׳‘׳׳¡׳¨ ׳”׳׳¨׳›׳–׳™.",
      storytelling: "׳¡׳’׳ ׳•׳ ׳¡׳™׳₪׳•׳¨׳™, ׳׳¨׳’׳©, ׳¨׳•׳—׳ ׳™ ׳•׳׳¢׳•׳¨׳¨ ׳”׳©׳¨׳׳” ׳”׳ ׳•׳’׳¢ ׳‘׳ ׳™׳׳™ ׳”׳ ׳©׳׳”. ׳”׳©׳×׳׳© ׳‘׳“׳™׳׳•׳™׳™׳ ׳©׳ ׳׳•׳¨, ׳׳¡׳•׳¨׳×, ׳—׳™׳‘׳•׳¨ ׳₪׳ ׳™׳׳™ ׳•׳©׳׳©׳׳× ׳”׳“׳•׳¨׳•׳× ׳”׳™׳”׳•׳“׳™׳×."
    };

    const systemPrompt = `׳׳×׳” ׳§׳•׳₪׳™׳¨׳™׳™׳˜׳¨ ׳©׳™׳•׳•׳§׳™ ׳׳•׳׳—׳”.
׳׳˜׳¨׳”: ׳¢׳¨׳™׳›׳” ׳•׳©׳“׳¨׳•׳’ ׳§׳•׳₪׳™׳¨׳™׳™׳˜׳™׳ ׳’ ׳©׳ ׳˜׳§׳¡׳˜ ׳”׳׳™׳•׳¢׳“ ׳׳׳×׳¨ ׳”׳׳™׳ ׳˜׳¨׳ ׳˜ ׳©׳ ׳”׳׳¨׳’׳•׳.
׳˜׳§׳¡׳˜ ׳׳§׳•׳¨׳™ ׳׳ ׳™׳¡׳•׳— ׳׳—׳“׳©:
"${text}"

׳¡׳’׳ ׳•׳ ׳›׳×׳™׳‘׳” ׳׳‘׳•׳§׳© (׳˜׳•׳):
${toneGuidelines[tone] || toneGuidelines.warm}

${customInstruction ? `׳“׳’׳©׳™׳ ׳׳™׳•׳—׳“׳™׳ ׳©׳ ׳”׳׳©׳×׳׳© (׳—׳•׳‘׳” ׳׳™׳™׳©׳ ׳׳•׳×׳ ׳‘׳׳׳•׳׳):\n- ${customInstruction}` : ""}

׳”׳ ׳—׳™׳•׳× ׳§׳¨׳™׳˜׳™׳•׳× ׳׳¢׳‘׳•׳“׳”:
1. ׳₪׳׳˜: ׳”׳—׳–׳¨ ׳׳ ׳•׳¨׳§ ׳§׳•׳“ HTML ׳ ׳§׳™! ׳”׳˜׳§׳¡׳˜ ׳—׳™׳™׳‘ ׳׳”׳™׳•׳× ׳׳¢׳•׳¦׳‘ ׳‘׳׳׳¦׳¢׳•׳× ׳×׳’׳™׳•׳× HTML ׳¢׳©׳™׳¨׳•׳× (׳›׳’׳•׳ <h2>, <h3>, <p>, <strong>, <ul>, <li>, <em>).
2. ׳¢׳™׳¦׳•׳‘: ׳׳ ׳×׳©׳׳© ׳‘-Markdown (׳›׳’׳•׳ ׳›׳•׳›׳‘׳™׳•׳× ׳׳• ׳¡׳•׳׳׳•׳×). ׳”׳©׳×׳׳© ׳¨׳§ ׳‘-HTML.
3. ׳׳ ׳×׳•׳¡׳™׳£ ׳”׳§׳“׳׳•׳× ׳›׳׳• "׳׳”׳׳ ׳”׳§׳•׳“", ׳׳ ׳×׳¢׳˜׳•׳£ ׳‘׳¡׳™׳׳•׳ ׳™ markdown (׳›׳׳• \`\`\`html), ׳₪׳©׳•׳˜ ׳”׳—׳–׳¨ ׳׳× ׳”-HTML ׳ ׳˜׳• ׳©׳ ׳™׳×׳ ׳׳”׳–׳¨׳™׳§ ׳™׳©׳™׳¨׳•׳× ׳׳¢׳•׳¨׳ ׳˜׳§׳¡׳˜.
4. ׳¢׳‘׳¨׳™׳×: ׳›׳×׳•׳‘ ׳‘׳¢׳‘׳¨׳™׳× ׳§׳•׳׳—׳×, ׳˜׳‘׳¢׳™׳× ׳׳—׳׳•׳˜׳™׳ ׳•׳™׳₪׳”. ׳”׳™׳׳ ׳¢ ׳׳‘׳™׳˜׳•׳™׳™׳ ׳׳™׳•׳©׳ ׳™׳.
5. ׳¨׳•׳— ׳”׳׳§׳•׳: ׳”׳×׳׳ ׳׳¨׳•׳— ׳”׳§׳”׳™׳׳” - ׳׳¡׳‘׳™׳¨ ׳₪׳ ׳™׳, ׳©׳׳—, ׳₪׳×׳•׳— ׳׳›׳•׳׳ ׳‘׳׳”׳‘׳” ׳•׳׳׳™׳¨ ׳₪׳ ׳™׳.
`;

    console.log("=== AI REPHRASE REQUEST ===");
    console.log("Original Text:", text);
    console.log("Tone:", tone);
    console.log("Custom Instruction:", customInstruction);
    
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim().replace(/^"|"$/g, '');
    
    console.log("=== AI REPHRASE RESPONSE ===");
    console.log("Rephrased Text:", responseText);
    
    return { success: true, text: responseText };
  } catch (error) {
    console.error("AI Rephrase Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function generateSeoTagsWithAI(
  pageContent: string
): Promise<{ success: boolean; title?: string; description?: string; keywords?: string; error?: string }> {
  if (!pageContent || !pageContent.trim()) {
    return { success: false, error: "׳׳ ׳ ׳©׳׳— ׳×׳•׳›׳ ׳׳ ׳™׳×׳•׳—" };
  }

  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "׳׳ ׳׳•׳’׳“׳¨ ׳׳₪׳×׳— API ׳©׳ Gemini. ׳׳ ׳ ׳”׳’׳“׳™׳¨׳• ׳‘׳”׳’׳“׳¨׳•׳× ׳”׳׳¢׳¨׳›׳×." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const systemPrompt = `׳׳×׳” ׳׳•׳׳—׳” SEO ׳׳§׳¦׳•׳¢׳™.
׳׳˜׳¨׳”: ׳™׳™׳¦׳•׳¨ ׳×׳’׳™׳•׳× SEO (׳›׳•׳×׳¨׳×, ׳×׳™׳׳•׳¨ ׳׳˜׳ ׳•׳׳™׳׳•׳× ׳׳₪׳×׳—) ׳׳׳•׳§׳“׳•׳× ׳•׳׳™׳›׳•׳×׳™׳•׳× ׳׳¢׳׳•׳“ ׳‘׳׳×׳¨ ׳©׳ ׳”׳׳¨׳’׳•׳, ׳¢׳ ׳‘׳¡׳™׳¡ ׳”׳×׳•׳›׳ ׳”׳‘׳ ׳©׳ ׳”׳¢׳׳•׳“.

׳×׳•׳›׳ ׳”׳¢׳׳•׳“:
"${pageContent}"

׳—׳•׳§׳™׳ ׳•׳”׳ ׳—׳™׳•׳×:
1. Title (׳›׳•׳×׳¨׳×): ׳¢׳“ 60 ׳×׳•׳•׳™׳, ׳׳•׳©׳›׳×, ׳›׳•׳׳׳× ׳׳× ׳׳™׳׳× ׳”׳׳₪׳×׳— ׳”׳¢׳™׳§׳¨׳™׳× ׳•׳©׳ ׳”׳׳•׳×׳’ (׳׳“׳•׳’׳׳” "... | ׳׳—׳•׳׳ ׳”׳§׳”׳™׳׳•׳×").
2. Description (׳×׳™׳׳•׳¨ ׳׳˜׳): ׳¢׳“ 155 ׳×׳•׳•׳™׳, ׳׳¡׳›׳ ׳׳× ׳×׳•׳›׳ ׳”׳¢׳׳•׳“, ׳׳ ׳™׳¢ ׳׳₪׳¢׳•׳׳”, ׳—׳ ׳•׳׳–׳׳™׳.
3. Keywords (׳׳™׳׳•׳× ׳׳₪׳×׳—): 5-10 ׳׳™׳׳•׳× ׳׳₪׳×׳— ׳׳•׳₪׳¨׳“׳•׳× ׳‘׳₪׳¡׳™׳§׳™׳, ׳¨׳׳•׳•׳ ׳˜׳™׳•׳× ׳׳—׳™׳₪׳•׳© ׳‘׳’׳•׳’׳.

׳₪׳׳˜ ׳ ׳“׳¨׳© (׳—׳•׳‘׳” ׳׳”׳—׳–׳™׳¨ ׳¨׳§ ׳׳•׳‘׳™׳™׳§׳˜ JSON ׳×׳§׳ ׳™, ׳׳׳ ׳₪׳•׳¨׳׳˜ Markdown ׳׳• ׳˜׳§׳¡׳˜ ׳ ׳•׳¡׳£):
{
  "title": "...",
  "description": "...",
  "keywords": "..."
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown code blocks if any
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) {
        responseText = lines.slice(1, -1).join("\n");
      }
    }

    const json = JSON.parse(responseText);
    
    return { 
      success: true, 
      title: json.title, 
      description: json.description, 
      keywords: json.keywords 
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function generateSeoImageWithAI(
  promptStr: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "׳׳ ׳׳•׳’׳“׳¨ ׳׳₪׳×׳— API ׳©׳ Gemini. ׳׳ ׳ ׳”׳’׳“׳™׳¨׳• ׳‘׳”׳’׳“׳¨׳•׳× ׳”׳׳¢׳¨׳›׳×." };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptStr }]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Gemini Image API Error Data:", errData);
      throw new Error(`Gemini Image response error: ${response.statusText}`);
    }

    const data = await response.json();
    const b64Image = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64Image) {
      throw new Error("No image data received from Gemini");
    }

    return { success: true, imageUrl: `data:image/jpeg;base64,${b64Image}` };
  } catch (error) {
    console.error("AI SEO Image Generation Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function suggestWizardFieldWithAI(
  fieldName: 'painPoint' | 'solution' | 'prompt',
  context: {
    type: string;
    audience: string;
    tone: string;
    painPoint?: string;
    solution?: string;
  }
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    if (fieldName === 'painPoint') {
      return { success: true, text: `׳§׳•׳©׳™ ׳׳”׳’׳™׳¢ ׳׳§׳”׳ ׳©׳ ${context.audience} ׳‘׳¦׳•׳¨׳” ׳׳₪׳§׳˜׳™׳‘׳™׳× ׳•׳׳—׳‘׳¨ ׳׳•׳×׳ ׳׳₪׳¢׳™׳׳•׳×.` };
    }
    if (fieldName === 'solution') {
      return { success: true, text: `׳™׳¦׳™׳¨׳× ׳“׳£ ׳׳׳•׳§׳“ ׳¢׳ ׳׳¡׳¨׳™׳ ׳׳•׳×׳׳׳™׳ ׳׳™׳©׳™׳× ׳-${context.audience} ׳©׳׳ ׳™׳¢׳™׳ ׳׳₪׳¢׳•׳׳” ׳׳”׳™׳¨׳”.` };
    }
    return { success: true, text: `׳“׳£ ׳×׳•׳›׳ ׳”׳׳™׳•׳¢׳“ ׳-${context.audience} ׳‘׳˜׳•׳ ${context.tone} ׳›׳“׳™ ׳׳¢׳•׳¨׳¨ ׳¢׳ ׳™׳™׳ ׳•׳׳¢׳•׳¨׳‘׳•׳×.` };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    let systemPrompt = "";
    if (fieldName === 'painPoint') {
      systemPrompt = `You are a copywriting expert. Suggest 1-2 sentences in Hebrew describing the main pain point, challenge, or core need of the target audience: "${context.audience}" for a page of type "${context.type}". The tone should be "${context.tone}".
Return ONLY the suggested Hebrew text. Do not wrap in quotes or add comments.`;
    } else if (fieldName === 'solution') {
      systemPrompt = `You are a copywriting expert. Suggest 1-2 sentences in Hebrew describing the big solution offered by our organization to solve the following pain point: "${context.painPoint}". The target audience is: "${context.audience}", and page type is "${context.type}". Tone: "${context.tone}".
Return ONLY the suggested Hebrew text. Do not wrap in quotes or add comments.`;
    } else {
      systemPrompt = `You are a copywriting expert. Write a focused prompt/instruction in Hebrew for an AI writer to generate a page about "${context.type}".
Target Audience: "${context.audience}".
Tone of Voice: "${context.tone}".
Target Audience Pain Point: "${context.painPoint}".
Offered Solution: "${context.solution}".
Generate a paragraph of instructions detailing what the page should focus on.
Return ONLY the suggested Hebrew text. Do not wrap in quotes or add comments.`;
    }

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();
    return { success: true, text };
  } catch (error) {
    console.error("AI Wizard Suggestion Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function suggestPainPointsWithAI(
  problemTitle: string,
  audiences: string[]
): Promise<{ success: boolean; painPoints?: { title: string, description: string }[]; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "׳׳ ׳׳•׳’׳“׳¨ ׳׳₪׳×׳— API ׳©׳ Gemini." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const systemPrompt = `You are an expert copywriter.
The user provides a problem title: "${problemTitle}" and a list of target audiences: ${audiences.join(', ')}.
Generate EXACTLY 6 pain points that this problem causes for these audiences.
Return the result ONLY as a JSON array of objects, where each object has "title" (string, max 5 words) and "description" (string, 1-2 short sentences in Hebrew).
Do not add any markdown formatting like \`\`\`json, just return the raw JSON array.
Example:
[
  {"title": "׳—׳•׳¡׳¨ ׳–׳׳", "description": "׳׳§׳•׳—׳•׳× ׳׳‘׳–׳‘׳–׳™׳ ׳©׳¢׳•׳× ׳¨׳‘׳•׳× ׳¢׳ ׳׳©׳™׳׳•׳× ׳™׳“׳ ׳™׳•׳× ׳©׳ ׳™׳×׳ ׳׳‘׳¦׳¢ ׳‘׳׳•׳˜׳•׳׳¦׳™׳” ׳§׳׳”."},
  ...
]`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown code blocks if any
    if (responseText.startsWith("\`\`\`")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) {
        responseText = lines.slice(1, -1).join("\n");
      }
    }

    const painPoints = JSON.parse(responseText);
    
    return { success: true, painPoints };
  } catch (error) {
    console.error("AI Pain Points Suggestion Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function suggestBenefitsWithAI(
  benefitTitle: string,
  audiences: string[],
  painPointsContext: string
): Promise<{ success: boolean; benefits?: { title: string, description: string }[]; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "׳׳ ׳׳•׳’׳“׳¨ ׳׳₪׳×׳— API ׳©׳ Gemini." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const systemPrompt = `You are an expert copywriter.
The user provides a benefit category title: "${benefitTitle}" and a list of target audiences: ${audiences.join(', ')}.
We already know the service solves the following pain points:
${painPointsContext}

Generate EXACTLY 6 benefits that this service provides for these audiences, directly addressing the pain points mentioned above.
Return the result ONLY as a JSON array of objects, where each object has "title" (string, max 5 words) and "description" (string, 1-2 short sentences in Hebrew explaining how it solves the pain points).
Do not add any markdown formatting like \`\`\`json, just return the raw JSON array.
Example:
[
  {"title": "׳—׳™׳¡׳›׳•׳ ׳׳©׳׳¢׳•׳×׳™ ׳‘׳–׳׳", "description": "׳¢׳ ׳™׳“׳™ ׳׳•׳˜׳•׳׳¦׳™׳” ׳©׳ ׳₪׳¢׳•׳׳•׳× ׳™׳“׳ ׳™׳•׳×, ׳”׳׳§׳•׳—׳•׳× ׳™׳—׳¡׳›׳• ׳©׳¢׳•׳× ׳¢׳‘׳•׳“׳” ׳™׳§׳¨׳•׳×."},
  ...
]`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown code blocks if any
    if (responseText.startsWith("\`\`\`")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) {
        responseText = lines.slice(1, -1).join("\n");
      }
    }

    const benefits = JSON.parse(responseText);
    
    return { success: true, benefits };
  } catch (error) {
    console.error("AI Benefits Suggestion Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function suggestSingleServiceFromVisionWithAI(
  visionText: string,
  existingServices: string[],
  availableAudiences: string[]
): Promise<{ success: boolean; service?: any; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "לא מוגדר מפתח API של Gemini." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const systemPrompt = `You are an expert business strategist and copywriter.
The user provides their "Company Vision":
"""
${visionText}
"""

Currently, the company already offers the following services: ${existingServices.length > 0 ? existingServices.join(', ') : 'None'}.
Available target audiences in the system: ${availableAudiences.join(', ')}.

Your task:
Analyze the vision and suggest EXACTLY ONE new service that the company should offer, which is NOT in the list of existing services.
For this service, generate:
1. "name": A catchy, professional name for the service (max 5 words).
2. "targetAudiences": An array of strings selecting the most relevant audiences from the available list, or suggest new ones if none fit well.
3. "problems": An array with EXACTLY ONE object representing the main problem category this service solves. This object must have:
   - "title": The category title (e.g. "חוסר יעילות בתהליכי עבודה")
   - "painPoints": An array of EXACTLY 6 objects, each with "title" (string, max 5 words) and "description" (string, 1-2 short sentences in Hebrew explaining the pain point).
4. "benefitGroups": An array with EXACTLY ONE object representing the main benefit category of this service. This object must have:
   - "title": The category title (e.g. "אוטומציה וייעול")
   - "items": An array of EXACTLY 6 objects, each with "title" (string, max 5 words) and "description" (string, 1-2 short sentences in Hebrew explaining the benefit).

Return the result ONLY as a valid JSON object matching the exact structure below, with no markdown formatting (\`\`\`json) or additional text.
Example structure:
{
  "name": "שם השירות",
  "targetAudiences": ["קהל 1", "קהל 2"],
  "problems": [
    {
      "title": "כותרת קבוצת הכאב",
      "painPoints": [
        {"title": "כאב 1", "description": "פירוט..."}
      ]
    }
  ],
  "benefitGroups": [
    {
      "title": "כותרת קבוצת המעלות",
      "items": [
        {"title": "מעלה 1", "description": "פירוט..."}
      ]
    }
  ]
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown code blocks if any
    if (responseText.startsWith("\`\`\`")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) {
        responseText = lines.slice(1, -1).join("\n");
      }
    }

    const service = JSON.parse(responseText);
    
    return { success: true, service };
  } catch (error) {
    console.error("AI Service Suggestion Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
