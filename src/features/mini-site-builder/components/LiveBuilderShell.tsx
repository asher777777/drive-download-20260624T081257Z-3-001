"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Coins, 
  Sparkles, 
  Send, 
  Loader2, 
  Eye, 
  X, 
  CheckCircle2, 
  Plus, 
  Wand2, 
  Globe, 
  Phone, 
  Mail, 
  MessageCircle,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CoinBalanceBadge } from "./CoinBalanceBadge";
import { LiveBuilderPreview } from "./LiveBuilderPreview";
import { 
  BuilderStateData, 
  saveBuilderProgress, 
  submitPitchChallenge, 
  generateLogoWithAI, 
  createServicePageWithAI,
  PersonaCard
} from "../actions/builderActions";
import { deductAiTextCoins } from "@/features/credits/actions";

interface Message {
  id: string;
  sender: "agent" | "user";
  text: string;
  timestamp: string;
  showPreviewBtn?: boolean;
}

interface LiveBuilderShellProps {
  initialCoins: number;
  userName: string;
}

export function LiveBuilderShell({ initialCoins, userName }: LiveBuilderShellProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [highlightCoins, setHighlightCoins] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [siteSlug, setSiteSlug] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // State data
  const [state, setState] = useState<BuilderStateData>({
    currentStep: 1,
    companyName: "",
    slogan: "",
    companyVision: "",
    shortVision: "",
    personas: [],
    servicePages: [],
  });

  // Chat message history
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "agent",
      text: `שלום ${userName}! אני מיכאל, היועץ הדיגיטלי והקופירייטר האישי שלך ✨. אני שמח ללוות אותך בבניית המיני-סייט והמותג שלך בלייב!`,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: "2",
      sender: "agent",
      text: `לפני שנתקדם, יש לי שאלה אחת קריטית עבורך: איזו בעיה הגעת לפתור בעולם? 🎯 אם אשתכנע שהבעיה שלכם אמיתית ושווה לפתור אותה – אשקיע בך ואעניק לך מיד 100 מטבעות במתנה להתחיל לשווק!`,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    }
  ]);

  // Step inputs
  const [inputVal, setInputVal] = useState("");
  const [sloganInput, setSloganInput] = useState("");
  const [visionQ1, setVisionQ1] = useState("");
  const [visionQ2, setVisionQ2] = useState("");
  const [newPersonaTitle, setNewPersonaTitle] = useState("");
  const [newPersonaDesc, setNewPersonaDesc] = useState("");
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addAgentMessage = (text: string, showPreviewBtn = false) => {
    const msg: Message = {
      id: "msg_" + Date.now() + Math.random(),
      sender: "agent",
      text,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      showPreviewBtn,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const addUserMessage = (text: string) => {
    const msg: Message = {
      id: "msg_" + Date.now() + Math.random(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Helper: Slug generator
  const createSlugFromName = (name: string) => {
    const cleanName = name.trim().toLowerCase();
    const slug = cleanName
      .replace(/[\u0590-\u05FF]/g, (match) => {
        const charMap: Record<string, string> = {
          'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
          'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
          'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
          'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't'
        };
        return charMap[match] || '';
      })
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || "my-site";
  };

  // Step 1: Pitch Submission
  const handlePitchSubmit = async () => {
    if (!inputVal.trim()) return;
    const userProblem = inputVal;
    addUserMessage(userProblem);
    setInputVal("");
    setLoading(true);

    try {
      const res = await submitPitchChallenge(userProblem);
      if (res.success) {
        setCoins(res.coins);
        setHighlightCoins(true);
        setState((prev) => ({ ...prev, pitchProblem: userProblem, currentStep: 2 }));
        
        addAgentMessage(`איזו בעיה חשובה וקריטית! פתרון מרתק בעל אימפקט אמיתי. שוכנעתי לחלוטין! 🪙 העברתי לך כעת 100 מטבעות במתנה להתחיל לבנות ולשווק את האתר!`, true);
        addAgentMessage(`כעת, בוא נבסס את שם העסק. יש לך כבר שם מוכן לחברה, או שתרצה שנעשה סיעור מוחות יחד ונמצא שם מנצח?`);
        
        setCurrentStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Company Name & Slug Generation
  const handleNameSubmit = async () => {
    if (!inputVal.trim()) return;
    const name = inputVal;
    addUserMessage(name);
    setInputVal("");
    setLoading(true);

    try {
      const generatedSlug = createSlugFromName(name);
      setSiteSlug(generatedSlug);

      const res = await saveBuilderProgress({ companyName: name, currentStep: 3 });
      if (res.success) {
        setState((prev) => ({ ...prev, companyName: name }));
        addAgentMessage(`שם מעולה! גזרתי עבורך נתיב אתר ייחודי: /${generatedSlug} 🌐`, true);
        addAgentMessage(`עכשיו נבנה את החזון והסלוגן. כקופירייטר, יש לי שתי שאלות ממוקדות: מה התחושה או הקידום שכל לקוח יחווה אצלכם, ומה הסלוגן שמלווה אתכם?`);
        setCurrentStep(3);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Vision Copywriting Brainstorming
  const handleVisionSubmit = async () => {
    if (!visionQ1.trim()) return;
    const rawVision = `${visionQ1}. ${visionQ2}`.trim();
    addUserMessage(`סלוגן: ${sloganInput} | חזון: ${rawVision}`);
    setLoading(true);

    try {
      // Deduct exact 1 coin for vision copywriting
      const aiCoins = await deductAiTextCoins(rawVision, "ניסוח חזון ב-AI");
      setCoins(aiCoins.newBalance);

      const refinedVision = `אנו ב-${state.companyName} שואפים להוביל שינוי משמעותי: ${rawVision}`;
      const shortSummary = rawVision.slice(0, 100);

      const res = await saveBuilderProgress({ 
        slogan: sloganInput, 
        companyVision: refinedVision, 
        shortVision: shortSummary 
      });

      if (res.success) {
        setState((prev) => ({ 
          ...prev, 
          slogan: sloganInput, 
          companyVision: refinedVision, 
          shortVision: shortSummary 
        }));

        addAgentMessage(`חזון עוצמתי ומנוסח לעילא! ✍️ זיקקתי אותו גם לתמצית חזון קצרה שנשמרה בכרטיס המנהל במערכת.`, true);
        addAgentMessage(`כעת נגדיר את קהל היעד ונקודות הכאב שלהם. מהן נקודות הכאב המרכזיות שהלקוחות שלכם חווים?`);
        setCurrentStep(4);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Add Persona / Pain Point
  const handleAddPersona = () => {
    if (!newPersonaTitle.trim()) return;
    const newP: PersonaCard = {
      id: "persona_" + Date.now(),
      icon: "Sparkles",
      title: newPersonaTitle,
      description: newPersonaDesc || "פתרון ממוקד לנקודת הכאב",
    };
    const updated = [...(state.personas || []), newP];
    setState((prev) => ({ ...prev, personas: updated }));
    saveBuilderProgress({ personas: updated });

    addUserMessage(`נקודת כאב: ${newPersonaTitle} (${newPersonaDesc})`);
    addAgentMessage(`נוסף כרטיס כאב חדש! 🎯 האם תרצה להוסיף נקודות כאב נוספות או שנעבור לעמודי השירותים?`, true);

    setNewPersonaTitle("");
    setNewPersonaDesc("");
  };

  // Step 5: Service Pages & Logo Generation (Logo is placed right before contact info!)
  const handleAddServicePage = async () => {
    if (!newServiceTitle.trim()) return;
    setLoading(true);
    try {
      const res = await createServicePageWithAI(newServiceTitle, state.pitchProblem || "");
      if (res.success && res.servicePage) {
        setCoins(res.newBalance);
        const updated = [...(state.servicePages || []), res.servicePage];
        setState((prev) => ({ ...prev, servicePages: updated }));
        saveBuilderProgress({ servicePages: updated });

        addUserMessage(`עמוד שירות: ${newServiceTitle}`);
        addAgentMessage(`עמוד השירות "${newServiceTitle}" הוקם בהצלחה! (נוכו 10 מטבעות) 🚀`, true);
        setNewServiceTitle("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLogo = async () => {
    setLoading(true);
    try {
      addUserMessage("חולל עבורי לוגו מנצח ב-AI ב-10 מטבעות");
      const res = await generateLogoWithAI({
        companyName: state.companyName || "חברה",
        slogan: state.slogan,
        businessProblem: state.pitchProblem,
        companyVision: state.companyVision,
        services: state.servicePages?.map(s => s.title),
      });

      if (res.success && res.logoUrl) {
        setCoins(res.newBalance);
        setState((prev) => ({ ...prev, logoUrl: res.logoUrl }));
        addAgentMessage(`הלוגו שלך חולל בהצלחה ב-AI! פלטת הצבעים חולצה והוחלה על המיני-סייט 🎨`, true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Contact Details & Finish
  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const res = await saveBuilderProgress({
        contactPhone: phoneInput,
        contactEmail: emailInput,
        contactWhatsApp: whatsappInput,
      });
      if (res.success) {
        setState((prev) => ({
          ...prev,
          contactPhone: phoneInput,
          contactEmail: emailInput,
          contactWhatsApp: whatsappInput,
        }));

        addUserMessage("שמור פרטי התקשרות וסיים בנייה");
        addAgentMessage(`ברכות חמות! המיני-סייט שלך באוויר! 🚀 כל השלבים נשמרו בכרטיס המנהל ב-CRM. מעביר אותך לדשבורד...`, true);

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-4 sm:p-6" dir="rtl">
      
      {/* 1. TOP HEADER: Agent Identity, Slug Link & Eye Preview Button */}
      <header className="w-full max-w-4xl bg-[#0f172a] border border-white/10 p-4 rounded-3xl shadow-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <img 
            src="/wabagent.webp" 
            alt="Agent Michael" 
            className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shadow-md shrink-0" 
          />
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">מיכאל - יועץ דיגיטל וקופירייטר</h2>
            {siteSlug ? (
              <span className="text-xs text-indigo-400 font-mono dir-ltr flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                /{siteSlug}
              </span>
            ) : (
              <span className="text-xs text-indigo-400 font-semibold">בניית מותג ומיני-סייט בלייב</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CoinBalanceBadge coins={coins} highlight={highlightCoins} />

          {/* Eye Modal Preview Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg backdrop-blur-md"
            title="צפה בתצוגה מקדימה"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">תצוגה מקדימה</span>
          </button>
        </div>
      </header>

      {/* 2. AUTHENTIC CHAT AREA */}
      <main className="w-full max-w-4xl flex-1 bg-[#0b1222] border border-white/10 rounded-3xl my-4 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-4 shadow-2xl relative">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.sender === "agent" ? (
                <img src="/wabagent.webp" alt="Agent" className="w-9 h-9 rounded-xl object-cover border border-indigo-500 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  אתה
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl space-y-2 text-sm leading-relaxed shadow-md ${
                msg.sender === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-[#162032] border border-white/10 text-slate-200 rounded-tl-none"
              }`}>
                <p>{msg.text}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{msg.timestamp}</span>

                  {/* Eye Button inside Chat Message */}
                  {msg.showPreviewBtn && (
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>צפה בתצוגה מקדימה 👁️</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      {/* 3. STRICT SINGLE ACTIVE QUESTION STEP FOOTER */}
      <footer className="w-full max-w-4xl bg-[#0f172a] border border-white/10 p-4 rounded-3xl shadow-2xl z-20">
        
        {/* Step 1: Pitch Question */}
        {currentStep === 1 && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePitchSubmit()}
              placeholder="איזו בעיה העסק שלך מגיע לפתור בעולם?..."
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              onClick={handlePitchSubmit}
              disabled={loading || !inputVal.trim()}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>שלח לסוכן</span>
            </button>
          </div>
        )}

        {/* Step 2: Company Name Question */}
        {currentStep === 2 && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              placeholder="מה שם החברה / העסק שלך?..."
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              onClick={handleNameSubmit}
              disabled={loading || !inputVal.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>אשר שם ונתיב</span>
            </button>
          </div>
        )}

        {/* Step 3: Vision & Slogan Copywriting Question */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={sloganInput}
                onChange={(e) => setSloganInput(e.target.value)}
                placeholder="סלוגן קצר שמלווה את העסק..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white"
              />
              <input
                type="text"
                value={visionQ1}
                onChange={(e) => setVisionQ1(e.target.value)}
                placeholder="מה התחושה/השינוי שהלקוח יחווה אצלכם?..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white"
              />
            </div>
            <button
              onClick={handleVisionSubmit}
              disabled={loading || !visionQ1.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>זקק חזון ב-AI והמשך לפרסונות</span>
            </button>
          </div>
        )}

        {/* Step 4: Target Personas Question */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newPersonaTitle}
                onChange={(e) => setNewPersonaTitle(e.target.value)}
                placeholder="כותרת נקודת הכאב של הלקוח..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white"
              />
              <input
                type="text"
                value={newPersonaDesc}
                onChange={(e) => setNewPersonaDesc(e.target.value)}
                placeholder="תיאור הפתרון עבורו..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPersona}
                disabled={!newPersonaTitle.trim()}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף כרטיס כאב</span>
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xl transition"
              >
                המשך לעמודי שירות וסמל מסחרי
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Service Pages & Logo Generation (Placed right before contact info!) */}
        {currentStep === 5 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleGenerateLogo}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shrink-0 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>חולל לוגו ב-AI (10 מטבעות)</span>
              </button>

              <div className="flex-1 flex gap-2 w-full">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="שם עמוד שירות (10 מטבעות)..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <button
                  onClick={handleAddServicePage}
                  disabled={loading || !newServiceTitle.trim()}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shrink-0 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(6)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl transition"
            >
              המשך לפרטי התקשרות וכפתור "אנחנו כאן"
            </button>
          </div>
        )}

        {/* Step 6: Contact Details Question */}
        {currentStep === 6 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="מספר טלפון..."
                className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="אימייל..."
                className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
              <input
                type="text"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="מספר ווצאפ..."
                className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <button
              onClick={handleSaveContact}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm shadow-2xl transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>סיים בנייה ועבור לדשבורד</span>
            </button>
          </div>
        )}

      </footer>

      {/* 4. MODAL LIVE PREVIEW */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[85vh] bg-[#0a0f1d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
            >
              {/* Modal Header */}
              <div className="p-4 bg-[#0f172a] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  <span className="font-black text-sm sm:text-base text-white">תצוגה מקדימה חיה של המיני-סייט</span>
                  {siteSlug && <span className="text-xs text-slate-400">(/${siteSlug})</span>}
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden p-2">
                <LiveBuilderPreview state={state} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
