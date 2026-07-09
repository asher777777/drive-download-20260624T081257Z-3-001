"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Coins, 
  Building2, 
  Heart, 
  Sparkles, 
  Loader2, 
  Globe, 
  ShieldCheck, 
  HelpCircle 
} from "lucide-react";
import { BrandingTab } from "@/components/dashboard/BrandingTab";
import { SocialNetworksTab } from "@/components/dashboard/SocialNetworksTab";
import { ContactDetailsTab } from "@/components/dashboard/ContactDetailsTab";
import { WhatToGenerateTab } from "@/components/dashboard/WhatToGenerateTab";
import { ServicesTab } from "@/components/dashboard/ServicesTab";
import { CreateCommunityTab } from "@/components/dashboard/CreateCommunityTab";
import { StatBadge } from "@/components/ui/StatBadge";
import { saveGlobalSettings, getGlobalSettings, GlobalSettings } from "@/features/settings/actions";
import { getCompanyServices } from "@/features/company-services/actions";

interface DashboardClientProps {
  initialSettings: GlobalSettings;
  initialServices: any[];
  contactCount: number;
  totalSpentResult: number;
  userName: string;
}

export function DashboardClient({
  initialSettings,
  initialServices,
  contactCount,
  totalSpentResult,
  userName,
}: DashboardClientProps) {
  const [settings, setSettings] = useState<GlobalSettings>(initialSettings);
  const [services, setServices] = useState<any[]>(initialServices);
  const [loading, setLoading] = useState(false);
  const [openTab, setOpenTab] = useState<"branding" | "social" | "contact" | "whatToGenerate" | "community" | "services" | null>("branding");

  // Sync state on prop change
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  // Re-fetch function after each save step
  const handleSaveSuccess = async () => {
    try {
      const data = await getGlobalSettings();
      setSettings(data);
      const svcs = await getCompanyServices();
      setServices(svcs);
    } catch (err) {
      console.error("Error refreshing settings:", err);
    }
  };

  // Determine current active step based on empty fields (progressive disclosure)
  // Step 1: organizationPurpose is empty (Welcome Screen)
  // Step 2: companyName is empty (Company Name text input)
  // Step 3: memberCount is empty (Number of employees/members/volunteers selector)
  // Step 4: slogan is empty (Slogan text input)
  // Step 5: companyVision is empty (Vision detailed editor)
  // Step 6: contactPhone or contactEmail is empty (Contact info)
  // Step 7: whatToGenerate list is empty (What to Generate Tab)
  // Step 8: services list is empty (Services Tab)
  // Step 9: Complete (at least one service exists)
  
  const getActiveStep = (): number => {
    if (!settings.organizationPurpose || settings.organizationPurpose.trim() === "") {
      return 1;
    }
    if (!settings.companyName || settings.companyName.trim() === "") {
      return 2;
    }
    if (!settings.memberCount || settings.memberCount.trim() === "") {
      return 3;
    }
    if (!settings.slogan || settings.slogan.trim() === "") {
      return 4;
    }
    if (!settings.companyVision || settings.companyVision.trim() === "") {
      return 5;
    }
    if (!settings.socialSetupCompleted) {
      return 6;
    }
    if (
      !settings.contactPhone || 
      settings.contactPhone.trim() === "" || 
      settings.contactPhone === "054-000-0000" || 
      !settings.contactEmail || 
      settings.contactEmail.trim() === "" || 
      settings.contactEmail === "info@community-generator.co.il"
    ) {
      return 7;
    }
    if (!settings.communities || settings.communities.length === 0) {
      return 8; // Step 8: communities list is empty (Create Community Tab)
    }
    const comm = settings.communities[0];
    if (
      !comm.name || 
      comm.name.trim() === "" ||
      !comm.targetAudiences || 
      comm.targetAudiences.length === 0
    ) {
      return 8;
    }
    if (services.length === 0) {
      return 9; // Step 9: services list is empty (Services Tab)
    }
    return 10; // Step 10: Complete (at least one service exists)
  };

  const activeStep = getActiveStep();

  // Auto-set open tab based on step changes during onboarding
  useEffect(() => {
    if (activeStep >= 2 && activeStep <= 5) {
      setOpenTab("branding");
    } else if (activeStep === 6) {
      setOpenTab("social");
    } else if (activeStep === 7) {
      setOpenTab("contact");
    } else if (activeStep === 8) {
      setOpenTab("community");
    } else if (activeStep === 9) {
      setOpenTab("services");
    }
  }, [activeStep]);

  // Auto-scroll the active open tab to the top of the viewport
  useEffect(() => {
    if (openTab) {
      setTimeout(() => {
        const element = document.getElementById(`tab-container-${openTab}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 250);
    }
  }, [openTab]);

  // Handler for Welcome Screen organization purpose selection
  const selectPurpose = async (purpose: string) => {
    setLoading(true);
    try {
      await saveGlobalSettings({ organizationPurpose: purpose });
      await handleSaveSuccess();
    } catch (err) {
      alert("שגיאה בשמירת הנתונים. אנא נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Render Welcome Screen (Step 1)
  if (activeStep === 1) {
    const options = [
      {
        id: "commercial",
        text: "כספית - מכירה - נתינת שירותים",
        icon: Coins,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50",
      },
      {
        id: "public",
        text: "ציבורית - מתן שירות תחת משרדי ממשלה או עיירה",
        icon: Building2,
        color: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50",
      },
      {
        id: "social",
        text: "אידאולוגית/חברתית- קידום אגנדות או שירותי דת",
        icon: Heart,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
      },
      {
        id: "other",
        text: "אחר - מטרה אישית, מקצועית או שונה",
        icon: Sparkles,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50",
      },
    ];

    return (
      <div className="w-full min-h-full bg-[#0f172a] text-right p-6 sm:p-8 flex flex-col justify-between" dir="rtl">
        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full space-y-6 py-4">
          
          {/* Avatar/Character representation of Michael */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 animate-pulse shrink-0">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-none">{userName} מה שלומך ?</h2>
              <p className="text-xs text-indigo-400 font-semibold mt-1">מיכאל המחלל - מדריך אישי</p>
            </div>
          </div>

          {/* Guide Introduction Speech bubble style */}
          <div className="bg-[#181818] border border-white/5 p-5 rounded-3xl relative text-slate-300 text-sm leading-relaxed space-y-3 shadow-xl">
            <p className="font-medium text-slate-200">
              אני מיכאל המחלל ואני המדריך האישי שלך במדריך לחולל קהילות.
            </p>
            <p>
              ראשית בוא נתחיל בהסבר קטן על מה היא קהילה:
            </p>
            <p className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-slate-300">
              קהילה היא התאגדות המבוססת על חזון משותף, אשר נועדה לפתור באופן עקבי צורך בסיסי, אישי או מקצועי של חבריה. 
              כדי לשרוד ולשמר את חבריה מעבר לסקרנות הראשונית, הקהילה חייבת לספק להם ערך פונקציונלי או רגשי ברור.
            </p>
            <p>
              היא אינה מרחב שמיועד ל"כולם", אלא נבנית סביב קהל יעד ספציפי מתוך הבנה עמוקה של המניעים, החסמים והכאבים שלו.
            </p>
            <p>
              בנוסף, קהילה מצליחה דואגת להעניק לחברים חדשים תחושת ביטחון עם הצטרפותם, ומייצרת אסטרטגיית מעורבות אקטיבית שהופכת את השיח להרגל.
            </p>
            <p>
              בסופו של דבר, חיוניותה של הקהילה אינה נמדדת רק במספר האנשים הרשומים אליה, אלא במדדי מעורבות אמיתיים של משתמשים פעילים ודיונים חיים.
            </p>
          </div>

          <hr className="border-white/5 my-4" />

          {/* Core Question */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white pr-1">
              מה מטרת התאגדות שלך {userName}
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-[#111] border border-white/5 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400 font-bold">שומר הגדרות...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectPurpose(opt.text)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-right transition-all duration-300 w-full hover:-translate-y-0.5 hover:shadow-lg ${opt.color}`}
                    >
                      <div className="p-2.5 rounded-xl bg-white/5 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-200">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 2. Progressive Setup Tabs Layout (Steps 2 to 9)
  const hour = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })).getHours();
  let greeting = "שלום";
  if (hour >= 5 && hour < 12) greeting = "בוקר טוב";
  else if (hour >= 12 && hour < 17) greeting = "צהריים טובים";
  else if (hour >= 17 && hour < 21) greeting = "ערב טוב";
  else greeting = "לילה טוב";

  // Logical rules for displaying Tabs:
  // - Branding Tab: visible in all steps from Step 2 onwards.
  // - Social Networks Tab: visible only from Step 6 onwards.
  // - Contact Details Tab: visible only from Step 7 onwards.
  // - What to Generate Tab: visible only from Step 8 onwards.
  // - Services Tab: visible only from Step 9 onwards.
  const showBranding = activeStep >= 2;
  const showSocial = activeStep >= 6;
  const showContact = activeStep >= 7;
  const showCommunity = activeStep >= 8;
  const showServices = activeStep >= 9;

  return (
    <div className="space-y-6 text-right pb-8" dir="rtl">
      
      {/* Stats Badges Row - Hidden for now */}
      {/* 
      <div className="-mt-4 md:-mt-8 flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 w-full pt-4 px-2 md:px-0">
        <StatBadge 
          icon={<Users className="w-4 h-4 text-indigo-400" />} 
          value={contactCount} 
          label="חברי קהילה ב-CRM" 
          description="מספר אנשי הקשר וחברי הקהילה הרשומים במערכת ה-CRM"
          badgeColorClass="bg-indigo-500/10 border-indigo-500/20"
        />
        <StatBadge 
          icon={<Globe className="w-4 h-4 text-purple-400" />} 
          value={services.length} 
          label="עמודי שירות ודפים" 
          description="עמודי שירות ודפי נחיתה פעילים באתר שנוצרו על ידי ה-AI"
          badgeColorClass="bg-purple-500/10 border-purple-500/20"
        />
        <StatBadge 
          icon={<Coins className="w-4 h-4 text-emerald-400" />} 
          value={`₪${totalSpentResult.toLocaleString("he-IL")}`} 
          label="סה״כ תרומות/עסקאות" 
          description="סך התרומות והתשלומים שהתקבלו החודש מחברי הקהילה ב-CRM"
          badgeColorClass="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatBadge 
          icon={<ShieldCheck className="w-4 h-4 text-blue-400" />} 
          value="תקין" 
          label="תקינות המערכת" 
          description="מצב חיבורי השרת, ה-Database וה-API של Gemini"
          badgeColorClass="bg-blue-500/10 border-blue-500/20"
        />
      </div>
      */}

      {/* Greeting & Guide Progress Banner */}
      <div className="px-4 md:px-2 mt-8 mb-2 space-y-3">
        <div className="text-base md:text-lg font-medium text-white drop-shadow-sm">
          {greeting}, {userName} ✨
        </div>
      </div>

      {/* 1. Branding Tab */}
      {showBranding && (
        <div id="tab-container-branding" className="scroll-mt-4">
          <BrandingTab 
            onSave={handleSaveSuccess} 
            activeStep={activeStep}
            settings={settings}
            isOpen={openTab === "branding"}
            onToggle={() => setOpenTab(openTab === "branding" ? null : "branding")}
            isCompleted={activeStep >= 6}
          />
        </div>
      )}

      {/* 2. Social Networks Tab */}
      {showSocial && (
        <div id="tab-container-social" className="scroll-mt-4">
          <SocialNetworksTab 
            onSave={handleSaveSuccess}
            activeStep={activeStep}
            settings={settings}
            isOpen={openTab === "social"}
            onToggle={() => setOpenTab(openTab === "social" ? null : "social")}
            isCompleted={activeStep >= 7}
          />
        </div>
      )}

      {/* 3. Contact Details Tab */}
      {showContact && (
        <div id="tab-container-contact" className="scroll-mt-4">
          <ContactDetailsTab 
            onSave={handleSaveSuccess}
            activeStep={activeStep}
            settings={settings}
            isOpen={openTab === "contact"}
            onToggle={() => setOpenTab(openTab === "contact" ? null : "contact")}
            isCompleted={activeStep >= 8}
          />
        </div>
      )}

      {/* 4. Create Community Tab */}
      {showCommunity && (
        <div id="tab-container-community" className="scroll-mt-4">
          <CreateCommunityTab 
            onSave={handleSaveSuccess}
            activeStep={activeStep}
            settings={settings}
            isOpen={openTab === "community"}
            onToggle={() => setOpenTab(openTab === "community" ? null : "community")}
            isCompleted={activeStep >= 9}
          />
        </div>
      )}

      {/* 5. Services Tab */}
      {showServices && (
        <div id="tab-container-services" className="scroll-mt-4">
          <ServicesTab 
            onSave={handleSaveSuccess}
            activeStep={activeStep}
            settings={settings}
            companyServices={services}
            isOpen={openTab === "services"}
            onToggle={() => setOpenTab(openTab === "services" ? null : "services")}
            isCompleted={activeStep >= 10}
          />
        </div>
      )}

    </div>
  );
}
