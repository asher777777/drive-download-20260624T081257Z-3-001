"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, Wand2, Loader2, Copy, Building2, Check, Phone, Globe, Palette, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getGlobalSettings, saveGlobalSettings, GlobalSettings } from "@/features/settings/actions";
import { rephraseTextWithAI } from "@/features/ai/actions";
import { getCompanyServices } from "@/features/company-services/actions";
import { generateMiniSiteWithAI } from "@/features/services/actions";
import { CompanyMediaSection } from "./CompanyMediaSection";
import { useRouter } from "next/navigation";

const scrollToTop = (e: React.MouseEvent<HTMLElement>) => {
  const target = e.currentTarget.parentElement;
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }
};

export function BrandingTab() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isMainOpen, setIsMainOpen] = useState(true);
  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const [isBaseColorsOpen, setIsBaseColorsOpen] = useState(true);
  const [isTextColorsOpen, setIsTextColorsOpen] = useState(false);
  const [isButtonColorsOpen, setIsButtonColorsOpen] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [organizationType, setOrganizationType] = useState<"חברה" | "עמותה" | "שותפות" | "עוסק מורשה" | "עוסק פטור">("חברה");
  const [organizationPurpose, setOrganizationPurpose] = useState("");
  const [slogan, setSlogan] = useState("");
  const [companyVision, setCompanyVision] = useState("");
  const [shortVision, setShortVision] = useState("");
  
  const [savingName, setSavingName] = useState(false);
  const [savingVision, setSavingVision] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [servicesCount, setServicesCount] = useState(0);
  const [companyServices, setCompanyServices] = useState<any[]>([]);
  const router = useRouter();

  // Mini-site Generation states
  const [isMiniSiteModalOpen, setIsMiniSiteModalOpen] = useState(false);
  const [slugName, setSlugName] = useState("");
  const [generatingMiniSite, setGeneratingMiniSite] = useState(false);

  const updateField = (field: keyof GlobalSettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSavingGeneral(true);
    await saveGlobalSettings(settings);
    setSavingGeneral(false);
  };

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getGlobalSettings();
      const svcs = await getCompanyServices();
      setCompanyServices(svcs);
      setServicesCount(svcs.length);
      setSettings(data);
      setCompanyName(data.companyName || "");
      if (data.organizationType) setOrganizationType(data.organizationType as any);
      setOrganizationPurpose(data.organizationPurpose || "");
      setSlogan(data.slogan || "");
      setCompanyVision(data.companyVision || "");
      setShortVision(data.shortVision || "");
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveName = async () => {
    setSavingName(true);
    await saveGlobalSettings({ 
      companyName, 
      organizationType: organizationType || undefined,
      organizationPurpose,
      slogan
    });
    if (companyName.trim()) setIsNameOpen(false);
    setSavingName(false);
  };

  const getEntityNameLabel = () => {
    switch (organizationType) {
      case "עמותה": return "שם העמותה";
      case "שותפות": return "שם השותפות";
      case "עוסק מורשה": return "שם העסק";
      case "עוסק פטור": return "שם העסק";
      case "חברה":
      default: return "שם החברה";
    }
  };

  const handleSaveVision = async () => {
    setSavingVision(true);
    await saveGlobalSettings({ companyVision, shortVision });
    setIsVisionOpen(false);
    setSavingVision(false);
  };

  const handleImproveWithAI = async () => {
    setAiLoading(true);
    try {
      const result = await rephraseTextWithAI(companyVision, undefined, customInstruction);
      if (result.success && result.text) {
        setCompanyVision(result.text);
      } else {
        alert("שגיאה בשיפור הטקסט");
      }
    } catch (err) {
      alert("שגיאה בשיפור הטקסט");
    } finally {
      setAiLoading(false);
    }
  };

  const handleShortenVisionAI = async () => {
    if (!companyVision.trim()) {
      alert("אנא הזן תחילה חזון מפורט");
      return;
    }
    setAiLoading(true);
    try {
      const result = await rephraseTextWithAI(companyVision, undefined, "תמצת את החזון הזה למשפט קצר וקולע של עד 15 מילים. החזר טקסט נקי בלבד ללא שום תגיות HTML או קוד.");
      if (result.success && result.text) {
        const cleanText = result.text.replace(/<[^>]*>?/gm, '').trim();
        setShortVision(cleanText);
      } else {
        alert("שגיאה בתמצות הטקסט");
      }
    } catch (err) {
      alert("שגיאה בתמצות הטקסט");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiResult = async () => {
    if (aiResult) {
      try {
        const blobHtml = new Blob([aiResult], { type: "text/html" });
        const textOnly = new DOMParser().parseFromString(aiResult, 'text/html').body.textContent || "";
        const blobText = new Blob([textOnly], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        await navigator.clipboard.writeText(aiResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleReplaceVision = () => {
    setCompanyVision(aiResult);
    setIsAiModalOpen(false);
    setAiResult("");
    setCustomInstruction("");
  };

  if (loading) return (
    <div className="w-full p-12 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
    </div>
  );

  const hasName = companyName.trim().length > 0;
  const hasVision = companyVision.trim().length > 0;
  const hasSlogan = slogan.trim().length > 0;
  const hasContact = !!(settings?.contactPhone && settings?.contactEmail);
  const hasServices = servicesCount > 0;
  const canGenerateSite = hasName && hasVision && hasSlogan && hasContact && hasServices;
  const hasMiniSiteSlug = !!settings?.miniSiteSlug;

  const handleGenerateMiniSite = async () => {
    if (!slugName.trim()) return;
    setGeneratingMiniSite(true);
    
    const finalSlug = slugName.toLowerCase().replace(/[^a-z0-9-]/g, "");
    
    const res = await generateMiniSiteWithAI(
      finalSlug,
      companyName,
      companyVision,
      companyServices,
      settings
    );

    if (res.success && res.slug) {
      await saveGlobalSettings({ miniSiteSlug: res.slug });
      router.push(`/${res.slug}`);
    } else {
      alert("שגיאה ביצירת האתר: " + (res.error || "לא ידוע"));
      setGeneratingMiniSite(false);
    }
  };

  return (
    <div className="w-full space-y-0">
      {/* 1. Global Settings / Company Details Wrapper */}
      <div className="w-full bg-[#181818] border-y border-white/5" dir="rtl">
      {/* Outer Tab Header */}
      <button
        onClick={(e) => {
          const next = !isMainOpen;
          setIsMainOpen(next);
          if (next) scrollToTop(e);
        }}
        className="w-full p-4 sm:p-5 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-sm sm:text-base">מיתוג</span>
        </div>
        {isMainOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />}
      </button>

      {/* Outer Tab Content */}
      {isMainOpen && (
        <div className="w-full bg-[#111] border-t border-white/5 animate-in fade-in duration-200">
          <div className="w-full flex flex-col">
            
            {/* Company Name Inner Accordion */}
            <div className={`w-full border-b border-white/5 bg-[#181818] transition-all scroll-mt-24 duration-500 ${isNameOpen ? 'ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10 relative' : ''}`}>
              <button
                onClick={(e) => {
                  const next = !isNameOpen;
                  setIsNameOpen(next);
                  if (next) scrollToTop(e);
                }}
                className="w-full p-4 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-3">
                  {getEntityNameLabel()}
                </span>
                <div className="flex items-center gap-3">
                  {!isNameOpen && companyName && (
                    <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      {companyName}
                    </span>
                  )}
                  {isNameOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </button>
              
              {isNameOpen && (
                <div className="p-4 bg-[#111] border-t border-white/5 animate-in fade-in duration-200 space-y-4">
                  {/* Organization Type Selection */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-bold block">סוג התאגדות</label>
                    <div className="flex flex-col gap-2">
                      {["חברה", "עמותה", "שותפות", "עוסק מורשה", "עוסק פטור"].map((type) => (
                        <label key={type} onClick={() => setOrganizationType(type as any)} className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${organizationType === type ? 'border-indigo-500' : 'border-white/20 group-hover:border-white/40'}`}>
                            {organizationType === type && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                          </div>
                          <span className={`text-sm ${organizationType === type ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'}`}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                      placeholder={`הזן את ${getEntityNameLabel()}...`}
                    />
                  </div>
                  
                  {/* Organization Purpose & Slogan */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">מטרת התאגדות</label>
                      <input
                        type="text"
                        value={organizationPurpose}
                        onChange={(e) => setOrganizationPurpose(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                        placeholder="לדוגמה: מתן שירותים דיגיטליים..."
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">סלוגן</label>
                      <input
                        type="text"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
                        placeholder="המשפט שמלווה את העסק..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSaveName} 
                      disabled={savingName} 
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
                    >
                      {savingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      <span className="mr-2">שמור הגדרות שם</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Company Vision Inner Accordion */}
            <div className={`w-full border-b border-white/5 bg-[#181818] transition-all scroll-mt-24 duration-500 ${isVisionOpen ? 'ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] z-10 relative' : ''}`}>
              <button
                onClick={(e) => {
                  const next = !isVisionOpen;
                  setIsVisionOpen(next);
                  if (next) scrollToTop(e);
                }}
                className="w-full p-4 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-3">
                  חזון החברה
                </span>
                {isVisionOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>
              
              {isVisionOpen && (
                <div className="p-4 bg-[#111] border-t border-white/5 animate-in fade-in duration-200 space-y-4">
                  <div className="border border-white/10 overflow-hidden shadow-sm bg-[#181818]">
                    <RichTextEditor
                      value={companyVision}
                      onChange={setCompanyVision}
                      placeholder="הזן כאן את חזון החברה בפירוט..."
                    />
                  </div>
                  
                  {/* Short Vision AI */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-white text-sm font-bold">תמצית החזון</label>
                      <button 
                        onClick={handleShortenVisionAI}
                        disabled={aiLoading}
                        className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                      >
                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        ייצר תמצית בעזרת AI
                      </button>
                    </div>
                    <textarea
                      value={shortVision}
                      onChange={(e) => setShortVision(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600 min-h-[80px]"
                      placeholder="כאן יופיע תקציר החזון, או שתוכל לכתוב אותו בעצמך..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4 border-t border-white/5">
                    <Button 
                      onClick={handleSaveVision} 
                      disabled={savingVision}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                    >
                      {savingVision ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      שמור שינויים
                    </Button>
                    <Button 
                      onClick={() => setIsAiModalOpen(true)}
                      variant="outline"
                      className="bg-white/5 hover:bg-white/10 border-white/10 text-purple-400"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      שפר עם AI
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Accordion */}
            <div className={`w-full border-b border-white/5 bg-[#181818] transition-all scroll-mt-24 duration-500 ${isContactOpen ? 'ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] z-10 relative' : ''}`}>
              <button
                onClick={(e) => {
                  const next = !isContactOpen;
                  setIsContactOpen(next);
                  if (next) scrollToTop(e);
                }}
                className="w-full p-4 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  נתוני התקשרות גלובליים
                </span>
                {isContactOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>
              
              {isContactOpen && settings && (
                <div className="p-4 bg-[#111] border-t border-white/5 animate-in fade-in duration-200 space-y-4">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">טלפון ליצירת קשר</label>
                      <input
                        type="tel"
                        value={settings.contactPhone || ""}
                        onChange={(e) => updateField("contactPhone", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                        placeholder="054-0000000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">אימייל ליצירת קשר</label>
                      <input
                        type="email"
                        value={settings.contactEmail || ""}
                        onChange={(e) => updateField("contactEmail", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                        placeholder="info@yourdomain.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">כתובת פיזית (Waze)</label>
                      <input
                        type="text"
                        value={settings.contactAddress || ""}
                        onChange={(e) => updateField("contactAddress", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="רחוב החדשנות 1, תל אביב"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveGeneral} disabled={savingGeneral} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 py-2 rounded-xl">
                      {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      שמור התקשרות
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Social Networks Accordion */}
            <div className={`w-full border-b border-white/5 bg-[#181818] transition-all scroll-mt-24 duration-500 ${isSocialOpen ? 'ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] z-10 relative' : ''}`}>
              <button
                onClick={(e) => {
                  const next = !isSocialOpen;
                  setIsSocialOpen(next);
                  if (next) scrollToTop(e);
                }}
                className="w-full p-4 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-400" />
                  רשתות חברתיות
                </span>
                {isSocialOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>
              {isSocialOpen && settings && (
                <div className="p-4 bg-[#111] border-t border-white/5 animate-in fade-in duration-200 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">קישור לפייסבוק</label>
                      <input
                        type="url"
                        value={settings.contactFacebook || ""}
                        onChange={(e) => updateField("contactFacebook", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">קישור לאינסטגרם</label>
                      <input
                        type="url"
                        value={settings.contactInstagram || ""}
                        onChange={(e) => updateField("contactInstagram", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">קישור ליוטיוב</label>
                      <input
                        type="url"
                        value={settings.contactYouTube || ""}
                        onChange={(e) => updateField("contactYouTube", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400">מספר WhatsApp</label>
                      <input
                        type="tel"
                        value={settings.contactWhatsApp || ""}
                        onChange={(e) => updateField("contactWhatsApp", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors text-left"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveGeneral} disabled={savingGeneral} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6 py-2 rounded-xl">
                      {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      שמור רשתות חברתיות
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Colors Accordion */}
            <div className={`w-full border-b border-white/5 bg-[#181818] transition-all scroll-mt-24 duration-500 ${isColorsOpen ? 'ring-1 ring-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)] z-10 relative' : ''}`}>
              <button
                onClick={(e) => {
                  const next = !isColorsOpen;
                  setIsColorsOpen(next);
                  if (next) scrollToTop(e);
                }}
                className="w-full p-4 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white text-xs sm:text-sm cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-pink-400" />
                  צבעים גלובליים
                </span>
                {isColorsOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>
              {isColorsOpen && settings && (
                <div className="p-4 bg-[#111] border-t border-white/5 animate-in fade-in duration-200 space-y-4">
                  
                  {/* Base Colors Sub-accordion */}
                  <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-[#181818] scroll-mt-24">
                    <button
                      onClick={(e) => {
                        const next = !isBaseColorsOpen;
                        setIsBaseColorsOpen(next);
                        if (next) scrollToTop(e);
                      }}
                      className="w-full p-3 bg-black/20 hover:bg-black/40 flex items-center justify-between font-bold text-white text-xs cursor-pointer transition-colors"
                    >
                      <span>צבעי בסיס</span>
                      {isBaseColorsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {isBaseColorsOpen && (
                      <div className="p-4 bg-black/10 border-t border-white/5 grid grid-cols-1 gap-4">
                        {/* NOTE: Always row by row / 1 column (grid-cols-1) */}
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">צבע ראשי</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.primaryColor || "#d8435d"} onChange={(e) => updateField("primaryColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.primaryColor || "#d8435d"} onChange={(e) => updateField("primaryColor", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">צבע משני</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.secondaryColor || "#10354b"} onChange={(e) => updateField("secondaryColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.secondaryColor || "#10354b"} onChange={(e) => updateField("secondaryColor", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">צבע רקע גלובלי</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.backgroundColor || "#f8f9fa"} onChange={(e) => updateField("backgroundColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.backgroundColor || "#f8f9fa"} onChange={(e) => updateField("backgroundColor", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Colors Sub-accordion */}
                  <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-[#181818] scroll-mt-24">
                    <button
                      onClick={(e) => {
                        const next = !isTextColorsOpen;
                        setIsTextColorsOpen(next);
                        if (next) scrollToTop(e);
                      }}
                      className="w-full p-3 bg-black/20 hover:bg-black/40 flex items-center justify-between font-bold text-white text-xs cursor-pointer transition-colors"
                    >
                      <span>צבעי טקסט</span>
                      {isTextColorsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {isTextColorsOpen && (
                      <div className="p-4 bg-black/10 border-t border-white/5 grid grid-cols-1 gap-4">
                        {/* NOTE: Always row by row / 1 column (grid-cols-1) */}
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">כותרת ראשית (H1)</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.textColorH1 || "#000000"} onChange={(e) => updateField("textColorH1", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.textColorH1 || "#000000"} onChange={(e) => updateField("textColorH1", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">כותרת משנית (H2)</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.textColorH2 || "#333333"} onChange={(e) => updateField("textColorH2", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.textColorH2 || "#333333"} onChange={(e) => updateField("textColorH2", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">כותרת (H3)</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.textColorH3 || "#444444"} onChange={(e) => updateField("textColorH3", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.textColorH3 || "#444444"} onChange={(e) => updateField("textColorH3", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">טקסט רגיל (p)</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.textColor || "#1a1a1a"} onChange={(e) => updateField("textColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.textColor || "#1a1a1a"} onChange={(e) => updateField("textColor", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Button Colors Sub-accordion */}
                  <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-[#181818] scroll-mt-24">
                    <button
                      onClick={(e) => {
                        const next = !isButtonColorsOpen;
                        setIsButtonColorsOpen(next);
                        if (next) scrollToTop(e);
                      }}
                      className="w-full p-3 bg-black/20 hover:bg-black/40 flex items-center justify-between font-bold text-white text-xs cursor-pointer transition-colors"
                    >
                      <span>צבעי כפתורים</span>
                      {isButtonColorsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                    {isButtonColorsOpen && (
                      <div className="p-4 bg-black/10 border-t border-white/5 grid grid-cols-1 gap-4">
                        {/* NOTE: Always row by row / 1 column (grid-cols-1) */}
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">רקע כפתור</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.buttonBgColor || "#2563eb"} onChange={(e) => updateField("buttonBgColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.buttonBgColor || "#2563eb"} onChange={(e) => updateField("buttonBgColor", e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col"><span className="text-sm font-semibold text-gray-200">טקסט כפתור</span></div>
                          <div className="flex items-center gap-3 bg-black/60 p-1 pr-3 rounded-full border border-white/10">
                            <input type="text" className="w-20 bg-transparent border-none text-xs font-mono text-gray-300 focus:outline-none focus:text-white uppercase text-left" dir="ltr" value={settings.buttonTextColor || "#ffffff"} onChange={(e) => updateField("buttonTextColor", e.target.value)} />
                            <input type="color" className="w-7 h-7 rounded-full cursor-pointer" value={settings.buttonTextColor || "#ffffff"} onChange={(e) => updateField("buttonTextColor", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveGeneral} disabled={savingGeneral} className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-6 py-2 rounded-xl">
                      {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      שמור צבעים
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Media Section */}
            <CompanyMediaSection 
              onApplyColors={async (colors) => {
                if (colors.length >= 2) {
                  const newSettings = { ...settings, primaryColor: colors[0], secondaryColor: colors[1] };
                  updateField("primaryColor", colors[0]);
                  updateField("secondaryColor", colors[1]);
                  if (colors[2]) updateField("backgroundColor", colors[2]);
                  
                  setSavingGeneral(true);
                  await saveGlobalSettings(newSettings);
                  setSavingGeneral(false);
                  
                  setIsColorsOpen(true);
                  setTimeout(() => {
                    alert("הצבעים הוחלו בהצלחה!");
                  }, 100);
                }
              }}
            />

            {/* Generate Site Button Section */}
            {(canGenerateSite || hasMiniSiteSlug) && (
              <div className="w-full p-6 bg-[#111] border-t border-white/5 flex flex-col items-center justify-center">
                {hasMiniSiteSlug ? (
                  <Button 
                    onClick={() => router.push(`/${settings?.miniSiteSlug}`)}
                    className="w-full max-w-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg transition-all"
                  >
                    <Globe className="w-6 h-6" />
                    עבור לאתר שלך
                  </Button>
                ) : isMiniSiteModalOpen ? (
                  <div className="w-full p-8 bg-[#181818] border border-white/10 rounded-3xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black !text-white flex items-center gap-3">
                        <Globe className="w-8 h-8 text-indigo-500" />
                        קבע את הסיומת של כתובת האתר שלך
                      </h2>
                      <button 
                        onClick={() => setIsMiniSiteModalOpen(false)}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-2" dir="ltr">
                        <span className="text-slate-400 font-mono text-sm bg-[#111] border border-white/10 px-4 py-3.5 rounded-xl select-none shrink-0 w-full sm:w-auto text-center sm:text-left">
                          /
                        </span>
                        <input
                          type="text"
                          value={slugName}
                          onChange={(e) => setSlugName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="e.g. my-awesome-site"
                          className="flex-1 w-full p-3.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-white transition-all font-mono"
                          dir="ltr"
                          required
                        />
                      </div>
                      
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-200/80 text-sm" dir="rtl">
                        <strong>שים לב:</strong> יש להזין אותיות באנגלית, מספרים ומקפים בלבד (לדוגמה: my-site).
                        <br />
                        הכתובת היא קבועה ולא תהיה ניתנת להחלפה לאחר מכן.
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-end gap-3" dir="rtl">
                        <Button 
                          onClick={() => setIsMiniSiteModalOpen(false)}
                          variant="outline"
                          className="bg-transparent border-white/10 hover:bg-white/5 text-white"
                        >
                          ביטול
                        </Button>
                        <Button 
                          onClick={handleGenerateMiniSite}
                          disabled={generatingMiniSite || !slugName.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8"
                        >
                          {generatingMiniSite ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                          {generatingMiniSite ? "מייצר אתר..." : "המשך ויצירת מיני-סייט"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={() => setIsMiniSiteModalOpen(true)}
                      className="w-full max-w-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg transition-all"
                    >
                      <Wand2 className="w-6 h-6" />
                      בוא נחולל אתר
                    </Button>
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      זיהינו שמילאת את כל הפרטים הנדרשים (שם, חזון, סלוגן, נתוני התקשרות ושירות אחד לפחות). כעת ניתן לייצר מיני סייט אוטומטי בלחיצת כפתור!
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* AI Improvement Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)}>
        <Modal.Content className="max-w-md w-full bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh] p-0 overflow-hidden">
          <div dir="rtl" className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 shrink-0 bg-white z-10 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              שיפור ניסוח עם Gemini 3.1
            </h3>
            <Modal.Close className="text-slate-400 hover:text-slate-600 relative top-auto right-auto left-auto" />
          </div>

          {/* AI Result Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 relative">
            {aiResult ? (
              <div className="relative group h-full flex flex-col">
                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col relative pb-16 min-h-[300px]">
                  <RichTextEditor
                    value={aiResult}
                    onChange={(val) => setAiResult(val)}
                    placeholder="התוצאה תופיע כאן..."
                  />
                  
                  {/* Icons pinned to bottom of textarea */}
                  <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                    <button 
                      onClick={handleCopyAiResult} 
                      className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                      title="העתק טקסט"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? "הועתק" : "העתק"}
                    </button>
                    <button 
                      onClick={handleReplaceVision} 
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                      title="החלף טקסט קיים"
                    >
                      <Check className="w-4 h-4" />
                      החלף טקסט
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400">
                 {aiLoading ? (
                   <div className="flex flex-col items-center gap-4">
                     <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                     <p className="text-sm animate-pulse">Gemini מנסח מחדש...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                       <Wand2 className="w-8 h-8 text-purple-500" />
                     </div>
                     <p className="text-sm text-center font-medium text-slate-500">הכנס הנחיות למטה כדי לקבל ניסוח משופר.</p>
                     <p className="text-xs text-center text-slate-400">הטקסט הנוכחי ישלח ל-AI כדי לשפר ולדייק אותו.</p>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Bottom Fixed Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <p className="text-xs text-slate-500 mb-2 font-medium">הנחיות ל-AI (אופציונלי):</p>
            <div className="flex items-center gap-2 relative">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !aiLoading && companyVision.trim()) {
                    handleImproveWithAI();
                  }
                }}
                placeholder="לדוגמה: קצר את הטקסט, הוסף אימוג'י..."
                className="w-full pl-[85px] pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
              <Button 
                onClick={handleImproveWithAI} 
                disabled={aiLoading || !companyVision.trim()} 
                className="absolute left-1.5 top-1.5 bottom-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                {aiLoading ? "" : "שלח"}
              </Button>
            </div>
          </div>
          </div>
        </Modal.Content>
      </Modal>


    </div>
  );
}
