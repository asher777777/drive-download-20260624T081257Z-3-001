import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";

// Helper for Service Account OAuth2 token
async function getGoogleOAuth2Token() {
  try {
    const privateKeyB64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64;
    let privateKey = "";
    if (privateKeyB64) {
      privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
    } else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
    }
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    if (clientEmail && privateKey) {
      const jwtClient = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          "https://www.googleapis.com/auth/generative-language",
          "https://www.googleapis.com/auth/cloud-platform"
        ],
      });
      const tokenRes = await jwtClient.getAccessToken();
      return tokenRes.token;
    }
  } catch (err: any) {
    console.warn("Failed to get OAuth2 token:", err?.message);
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const {
      permissions,
      ai_capabilities,
      primary_roles,
      collaboration,
      tone_style,
      general_prompt,
      conversation_history_id,
    } = body;

    const cacheHistoryId = conversation_history_id || `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const promptAssistInstruction = `You are a master Prompt Engineer specializing in AI Agent Instructions & System Prompts.
We are configuring a Smart Worker for office [${slug}].

Current Form Configuration:
- Schema Header: root\\${slug}\\smart-worker-config
- Primary Roles: ${Array.isArray(primary_roles) ? primary_roles.join(", ") : "Advisor"}
- AI Capabilities: ${Array.isArray(ai_capabilities) ? ai_capabilities.join(", ") : "text_response"}
- Tone & Style: ${tone_style || "Professional"}
- Database Permissions: ${JSON.stringify(permissions || {})}
- Collaborating Agents: ${Array.isArray(collaboration) ? collaboration.join(", ") : "None"}
- Base Draft Prompt: "${general_prompt || ""}"

Task: Craft an exceptionally precise, authoritative, highly effective System Prompt for this Smart Worker that incorporates all its roles, capabilities, tone, and security parameters.
Rules: Return ONLY the refined system prompt text directly, without conversational intros or markdown headers.`;

    let refinedPrompt = "";

    // 1. Try Gemini AI with OAuth2 Token
    const oauthToken = await getGoogleOAuth2Token();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (oauthToken) {
      for (const model of ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-2.5-flash"]) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${oauthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptAssistInstruction }] }],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text?.trim()) {
              refinedPrompt = text.trim();
              break;
            }
          }
        } catch (e) {
          console.warn(`OAuth prompt assist for ${model} failed:`, e);
        }
      }
    }

    if (!refinedPrompt && geminiKey && !geminiKey.startsWith("AQ.")) {
      try {
        const aiKey = new GoogleGenAI({ apiKey: geminiKey });
        const res = await aiKey.models.generateContent({
          model: "gemini-1.5-flash-latest",
          contents: promptAssistInstruction,
        });
        if (res.text?.trim()) refinedPrompt = res.text.trim();
      } catch (e) {
        console.warn("APIKey prompt assist failed:", e);
      }
    }

    // Dynamic High-Quality Fallback Prompt Synthesis
    if (!refinedPrompt) {
      const rolesText = Array.isArray(primary_roles) && primary_roles.length > 0 ? primary_roles.join(", ") : "Executive Assistant & Analyst";
      const capText = Array.isArray(ai_capabilities) && ai_capabilities.length > 0 ? ai_capabilities.join(", ") : "Text Response & Data Analysis";
      refinedPrompt = `You are a Smart Worker operating under schema root\\${slug}\\smart-worker. Your primary roles are [${rolesText}] with active AI capabilities [${capText}]. Communication tone must strictly follow a ${tone_style || "Professional"} style. You possess authorized workspace permissions to query database records, generate insights, and collaborate with team agents [${Array.isArray(collaboration) ? collaboration.join(", ") : "default"}]. Always execute tasks with high accuracy, zero fluff, and direct actionable clarity.`;
    }

    return NextResponse.json({
      success: true,
      refinedPrompt,
      conversation_history_id: cacheHistoryId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("POST /api/office/[slug]/prompt-assist error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate prompt assist" },
      { status: 500 }
    );
  }
}
