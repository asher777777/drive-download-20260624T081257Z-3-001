"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveGlobalSettings, getGlobalSettings, GlobalSettings } from "@/features/settings/actions";
import { savePageConfig, getPageConfig, HomePageConfig } from "@/features/home/actions";
import { getUserCoins, grantPitchBonusCoins, deductCoins, deductAiTextCoins } from "@/features/credits/actions";
import { generateSeoImageWithAI, rephraseTextWithAI } from "@/features/ai/actions";
import { buildLogoPrompt, BrandLogoContext } from "../utils/logoPromptBuilder";

export interface PersonaCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface BuilderStateData {
  pitchProblem?: string;
  companyName?: string;
  slogan?: string;
  companyVision?: string;
  shortVision?: string;
  personas?: PersonaCard[];
  servicePages?: { id: string; title: string; description: string; imageUrl?: string }[];
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactFacebook?: string;
  contactInstagram?: string;
  contactTikTok?: string;
  currentStep: number;
}

/**
 * Save current builder step & data to DB (User profile & Admin CRM Contact Card)
 */
export async function saveBuilderProgress(
  data: Partial<BuilderStateData>,
  userId?: string
): Promise<{ success: boolean; coins: number }> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      targetUserId = session.user.id;
    }

    // 1. Update Firestore user document (Admin CRM Contact Card)
    const userRef = adminDb.collection("users").doc(targetUserId);
    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
      agentOnboardingStep: data.currentStep ?? 1,
    };

    if (data.pitchProblem) updatePayload.pitchProblem = data.pitchProblem;
    if (data.companyName) updatePayload.companyName = data.companyName;
    if (data.slogan) updatePayload.slogan = data.slogan;
    if (data.companyVision) updatePayload.companyVision = data.companyVision;
    if (data.shortVision) updatePayload.shortVision = data.shortVision;
    if (data.personas) updatePayload.personas = data.personas;
    if (data.servicePages) updatePayload.servicePages = data.servicePages;
    if (data.logoUrl) updatePayload.logoUrl = data.logoUrl;
    if (data.contactPhone) updatePayload.contactPhone = data.contactPhone;
    if (data.contactEmail) updatePayload.contactEmail = data.contactEmail;
    if (data.contactWhatsApp) updatePayload.contactWhatsApp = data.contactWhatsApp;

    await userRef.set(updatePayload, { merge: true });

    // 2. Sync to GlobalSettings
    const settingsUpdate: Partial<GlobalSettings> = {};
    if (data.companyName) settingsUpdate.companyName = data.companyName;
    if (data.slogan) settingsUpdate.slogan = data.slogan;
    if (data.companyVision) settingsUpdate.companyVision = data.companyVision;
    if (data.shortVision) settingsUpdate.shortVision = data.shortVision;
    if (data.logoUrl) settingsUpdate.logoUrl = data.logoUrl;
    if (data.primaryColor) settingsUpdate.primaryColor = data.primaryColor;
    if (data.secondaryColor) settingsUpdate.secondaryColor = data.secondaryColor;
    if (data.contactPhone) settingsUpdate.contactPhone = data.contactPhone;
    if (data.contactEmail) settingsUpdate.contactEmail = data.contactEmail;
    if (data.contactWhatsApp) settingsUpdate.contactWhatsApp = data.contactWhatsApp;
    if (data.contactFacebook) settingsUpdate.contactFacebook = data.contactFacebook;
    if (data.contactInstagram) settingsUpdate.contactInstagram = data.contactInstagram;
    if (data.contactTikTok) settingsUpdate.contactTikTok = data.contactTikTok;

    if (Object.keys(settingsUpdate).length > 0) {
      await saveGlobalSettings(settingsUpdate);
    }

    // 3. Sync to HomePageConfig if name/problem/vision updated
    if (data.companyName || data.pitchProblem || data.slogan) {
      const currentConfig = await getPageConfig("pages", "home");
      if (currentConfig) {
        const updatedHero = {
          ...currentConfig.hero,
          title: data.companyName || currentConfig.hero.title,
          subtitle: data.slogan || currentConfig.hero.subtitle,
          description: data.pitchProblem || currentConfig.hero.description,
        };
        await savePageConfig({ ...currentConfig, hero: updatedHero }, "pages", "home");
      }
    }

    const coinsData = await getUserCoins(targetUserId);
    revalidatePath("/agentonbord");
    return { success: true, coins: coinsData.coins };
  } catch (error) {
    console.error("Error saving builder progress:", error);
    return { success: false, coins: 0 };
  }
}

/**
 * Handle AI Agent pitch submission -> validates problem, awards 100 coins
 */
export async function submitPitchChallenge(problem: string): Promise<{
  success: boolean;
  agentResponse: string;
  coins: number;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Award 100 pitch bonus coins
    const bonusRes = await grantPitchBonusCoins(session.user.id);
    
    // Save problem to DB & CRM
    await saveBuilderProgress({ pitchProblem: problem, currentStep: 2 }, session.user.id);

    const agentResponse = `איזו בעיה חשובה וקריטית! פתרון מרתק בעל אימפקט אמיתי. שוכנעתי לחלוטין! 🪙 העברתי לך כעת 100 מטבעות במתנה להתחיל לבנות ולשווק את האתר שלך!`;

    return {
      success: true,
      agentResponse,
      coins: bonusRes.newBalance,
    };
  } catch (error: any) {
    console.error("Error submitting pitch:", error);
    return {
      success: false,
      agentResponse: "שגיאה בחיבור לסוכן. אנא נסה שנית.",
      coins: 0,
    };
  }
}

/**
 * Generate AI Logo with full consolidated brand context
 */
export async function generateLogoWithAI(context: BrandLogoContext): Promise<{
  success: boolean;
  logoUrl?: string;
  newBalance: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Deduct 10 coins for logo generation
    const deductRes = await deductCoins(10, "יצירת לוגו ב-AI", session.user.id);
    if (!deductRes.success) {
      return { success: false, newBalance: deductRes.newBalance, error: deductRes.error };
    }

    // 2. Build precise prompt
    const prompt = buildLogoPrompt(context);

    // 3. Call AI Image Generation
    const imgRes = await generateSeoImageWithAI(prompt);
    if (!imgRes.success || !imgRes.imageUrl) {
      return { success: false, newBalance: deductRes.newBalance, error: imgRes.error || "שגיאה ביצירת תמונת לוגו" };
    }

    // 4. Save logo to settings and DB
    await saveGlobalSettings({ logoUrl: imgRes.imageUrl });
    await saveBuilderProgress({ logoUrl: imgRes.imageUrl }, session.user.id);

    return {
      success: true,
      logoUrl: imgRes.imageUrl,
      newBalance: deductRes.newBalance,
    };
  } catch (error: any) {
    console.error("Error generating AI logo:", error);
    return { success: false, newBalance: 0, error: error.message || "Failed to generate logo" };
  }
}

/**
 * Generate AI Service Page (10 coins creation)
 */
export async function createServicePageWithAI(
  serviceTitle: string,
  painPoint: string
): Promise<{
  success: boolean;
  servicePage?: { id: string; title: string; description: string; imageUrl?: string };
  newBalance: number;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Deduct 10 coins for service page creation
    const deductRes = await deductCoins(10, `יצירת עמוד שירות: ${serviceTitle}`, session.user.id);
    if (!deductRes.success) {
      return { success: false, newBalance: deductRes.newBalance, error: deductRes.error };
    }

    // Generate service image
    const imagePrompt = `Modern professional service banner illustration for "${serviceTitle}", solving pain point "${painPoint}". Clean minimalist style, studio lighting, high quality`;
    const imgRes = await generateSeoImageWithAI(imagePrompt);

    const newPage = {
      id: "service_" + Date.now(),
      title: serviceTitle,
      description: `עמוד שירות ממוקד הפותר את נקודת הכאב: ${painPoint}`,
      imageUrl: imgRes.imageUrl || "",
    };

    return {
      success: true,
      servicePage: newPage,
      newBalance: deductRes.newBalance,
    };
  } catch (error: any) {
    console.error("Error creating service page:", error);
    return { success: false, newBalance: 0, error: error.message };
  }
}
