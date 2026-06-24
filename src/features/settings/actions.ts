"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export interface NavLink {
  name: string;
  href: string;
}

export interface GlobalSettings {
  siteLogoUrl: string;
  headerLayout: "classic" | "center" | "left";
  theme: "navy" | "emerald" | "rose" | "violet" | "charcoal";
  navLinks: NavLink[];
  customAudiences?: string[];
  customGoals?: string[];
  whatToGenerate?: string[];
  
  // Global Colors
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  
  // Text Colors
  textColor?: string;
  textColorH1?: string;
  textColorH2?: string;
  textColorH3?: string;
  
  // Button Colors
  buttonBgColor?: string;
  buttonTextColor?: string;
  
  // Personal Details
  companyName?: string;
  organizationType?: "חברה" | "עמותה" | "שותפות" | "עוסק מורשה" | "עוסק פטור";
  organizationPurpose?: string;
  slogan?: string;
  shortVision?: string;
  companyVision?: string;
  personalName?: string;
  personalEmail?: string;
  personalPhone?: string;
  personalTitle?: string;

  // Contact Info
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;

  // Social Networks
  contactFacebook?: string;
  contactInstagram?: string;
  contactYouTube?: string;
  contactWhatsApp?: string;
  
  // Mini Site
  miniSiteSlug?: string;
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  siteLogoUrl: "/logo.png",
  headerLayout: "classic",
  theme: "charcoal",
  navLinks: [
    { name: "בית", href: "/" },
    { name: "עמודי נחיתה", href: "/landing-pages" },
    { name: "שירותים", href: "/services-pages" },
    { name: "תוכן ו-SEO", href: "/content-pages" },
    { name: "צור קשר", href: "/contact" },
  ],
  customAudiences: [],
  primaryColor: "#d8435d",
  secondaryColor: "#10354b",
  backgroundColor: "#f8f9fa",
  textColor: "#1f2937",
  contactPhone: "054-000-0000",
  contactEmail: "info@community-generator.co.il",
  contactFacebook: "https://www.facebook.com/",
  contactAddress: "רחוב החדשנות 1, אזור ההייטק",
  contactInstagram: "",
  contactYouTube: "",
  contactWhatsApp: "",
  companyName: "",
  companyVision: "",
  personalName: "",
  personalEmail: "",
  personalPhone: "",
  personalTitle: "",
};

export async function getGlobalSettings(userId?: string): Promise<GlobalSettings> {
  try {
    let finalUserId = userId;
    if (!finalUserId) {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      finalUserId = session.user.id;
    }

    const { getUserDb } = await import("@/lib/firebase-admin");
    const docRef = getUserDb(finalUserId).collection("settings").doc("global");
    const docSnap = await docRef.get();
    
    let data = docSnap.exists ? docSnap.data() : {};

    const adminLogoUrl = await import("@/features/company-assets/actions").then(m => m.getAdminLogoUrl());
      
      return {
        siteLogoUrl: data?.siteLogoUrl || adminLogoUrl || "",
        headerLayout: data?.headerLayout || "classic",
        theme: data?.theme || "navy",
        navLinks: data?.navLinks || DEFAULT_GLOBAL_SETTINGS.navLinks,
        customAudiences: data?.customAudiences || [],
        customGoals: data?.customGoals || [],
        
        // Global Colors
        primaryColor: data?.primaryColor || "",
        secondaryColor: data?.secondaryColor || "",
        backgroundColor: data?.backgroundColor || "",
        textColor: data?.textColor || "",
        textColorH1: data?.textColorH1 || "",
        textColorH2: data?.textColorH2 || "",
        textColorH3: data?.textColorH3 || "",
        buttonBgColor: data?.buttonBgColor || "",
        buttonTextColor: data?.buttonTextColor || "",
        shortVision: data?.shortVision || "",
        companyVision: data?.companyVision || "",
        personalName: data?.personalName || "",
        personalEmail: data?.personalEmail || "",
        personalPhone: data?.personalPhone || "",

        // Personal Details
        companyName: data?.companyName || "",
        organizationType: data?.organizationType || "",
        organizationPurpose: data?.organizationPurpose || "",
        slogan: data?.slogan || "",
        personalTitle: data?.personalTitle || "",

        // Contact Info
        contactPhone: data?.contactPhone || DEFAULT_GLOBAL_SETTINGS.contactPhone,
        contactEmail: data?.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail,
        contactAddress: data?.contactAddress || DEFAULT_GLOBAL_SETTINGS.contactAddress,

        // Social Networks
        contactFacebook: data?.contactFacebook || DEFAULT_GLOBAL_SETTINGS.contactFacebook,
        contactInstagram: data?.contactInstagram || "",
        contactYouTube: data?.contactYouTube || "",
        contactWhatsApp: data?.contactWhatsApp || "",
        
        // Mini Site
        miniSiteSlug: data?.miniSiteSlug || "",
      } as GlobalSettings;
  } catch (error) {
    console.warn(`Error fetching global settings:`, (error as Error).message);
    return DEFAULT_GLOBAL_SETTINGS;
  }
}

export async function saveGlobalSettings(settings: Partial<GlobalSettings>) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { getUserDb } = await import("@/lib/firebase-admin");

    const docRef = getUserDb(session.user.id).collection("settings").doc("global");
    await docRef.set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.warn(`Error saving global settings:`, (error as Error).message);
    throw new Error("Failed to save to Firebase");
  }
}
