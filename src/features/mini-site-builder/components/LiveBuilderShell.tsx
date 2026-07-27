"use client";

import React, { useState } from "react";
import { 
  Coins, 
  Sparkles, 
  Send, 
  Loader2, 
  Building2, 
  CheckCircle2, 
  Bot, 
  User, 
  Plus, 
  Trash2, 
  Wand2, 
  ImageIcon,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle
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

interface LiveBuilderShellProps {
  initialCoins: number;
  userName: string;
}

export function LiveBuilderShell({ initialCoins, userName }: LiveBuilderShellProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [highlightCoins, setHighlightCoins] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  // Inputs
  const [pitchInput, setPitchInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [sloganInput, setSloganInput] = useState("");
  const [visionInput, setVisionInput] = useState("");
  const [newPersonaTitle, setNewPersonaTitle] = useState("");
  const [newPersonaDesc, setNewPersonaDesc] = useState("");
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");

  // Step 1: Pitch Challenge
  const handlePitchSubmit = async () => {
    if (!pitchInput.trim()) return;
    setLoading(true);
    try {
      const res = await submitPitchChallenge(pitchInput);
      if (res.success) {
        setCoins(res.coins);
        setHighlightCoins(true);
        setState((prev) => ({ ...prev, pitchProblem: pitchInput, currentStep: 2 }));
        setCurrentStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2A: Company Name
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setLoading(true);
    try {
      const res = await saveBuilderProgress({ companyName: nameInput, currentStep: 2 });
      if (res.success) {
        setState((prev) => ({ ...prev, companyName: nameInput }));
        setCurrentStep(3); // move to vision
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2B: Vision & Slogan
  const handleSaveVision = async () => {
    if (!visionInput.trim()) return;
    setLoading(true);
    try {
      // Shorten vision
      const shortRes = await deductAiTextCoins(visionInput, "חזון החברה ותמצית");
      setCoins(shortRes.newBalance);

      const res = await saveBuilderProgress({ 
        slogan: sloganInput, 
        companyVision: visionInput, 
        shortVision: visionInput.slice(0, 100) 
      });
      
      if (res.success) {
        setState((prev) => ({ 
          ...prev, 
          slogan: sloganInput, 
          companyVision: visionInput, 
          shortVision: visionInput.slice(0, 100) 
        }));
        setCurrentStep(4); // move to personas
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Personas
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
    setNewPersonaTitle("");
    setNewPersonaDesc("");
  };

  // Step 4: Services
  const handleAddServicePage = async () => {
    if (!newServiceTitle.trim()) return;
    setLoading(true);
    try {
      const res = await createServicePageWithAI(newServiceTitle, newServiceDesc || pitchInput);
      if (res.success && res.servicePage) {
        setCoins(res.newBalance);
        const updated = [...(state.servicePages || []), res.servicePage];
        setState((prev) => ({ ...prev, servicePages: updated }));
        saveBuilderProgress({ servicePages: updated });
        setNewServiceTitle("");
        setNewServiceDesc("");
      } else {
        alert(res.error || "שגיאה ביצירת עמוד שירות");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 5: AI Logo
  const handleGenerateLogo = async () => {
    setLoading(true);
    try {
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
      } else {
        alert(res.error || "שגיאה ביצירת הלוגו");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Contact Info
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
        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070b14] text-white p-4 sm:p-6 flex flex-col gap-6" dir="rtl">
      {/* Top Bar with Agent Header & Coins Badge */}
      <div className="w-full flex items-center justify-between bg-[#0f172a] border border-white/10 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0f172a] rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">מיכאל - היועץ הדיגיטלי האישי</h2>
            <p className="text-xs text-indigo-400 font-semibold">בניית מיני-סייט בלייב בהנחיית AI</p>
          </div>
        </div>

        <CoinBalanceBadge coins={coins} highlight={highlightCoins} />
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* RIGHT SIDE: Agent Interaction Panel (7 cols) */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6">
          
          {/* Step 1: Pitch Challenge */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>אתגר הפיץ' הראשוני</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  שלום {userName}! אני מיכאל. לפני שאנחנו מתחילים לבנות את המיני-סייט שלך, יש לי שאלה אחת קריטית עבורך:
                </p>
                <p className="font-bold text-white text-base bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                  איזו בעיה הגעת לפתור בעולם? 🎯
                </p>
                <p className="text-xs text-amber-300">
                  ספר לי עליה – אם אראה שהבעיה שלך אמיתית ושווה לפתור אותה, אשקיע בך ואעניק לך מיד 100 מטבעות במתנה!
                </p>
              </div>

              <textarea
                value={pitchInput}
                onChange={(e) => setPitchInput(e.target.value)}
                placeholder="הזן כאן את הבעיה שהעסק שלך מגיע לפתור..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition min-h-[120px]"
              />

              <button
                onClick={handlePitchSubmit}
                disabled={loading || !pitchInput.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>שלח לסוכן וקבל 100 מטבעות</span>
              </button>
            </div>
          )}

          {/* Step 2: Company Name */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <p className="text-slate-200 text-sm">
                  מדהים! העברתי לך כעת 100 מטבעות במתנה 🪙. בוא נבסס את הזהות של המותג שלך:
                </p>
                <h3 className="font-bold text-white text-base">איזה שם בחרת לחברה שלך?</h3>
              </div>

              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="הזן את שם החברה..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />

              <button
                onClick={handleSaveName}
                disabled={loading || !nameInput.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>המשך לשלב החזון והסלוגן</span>
              </button>
            </div>
          )}

          {/* Step 3: Vision & Slogan */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <h3 className="font-bold text-white text-base">מה החזון והסלוגן של {state.companyName}?</h3>
                <p className="text-xs text-slate-300">
                  מחקרים מראים שחברות עם חזון מוגדר מגיעות רחוק פי כמה! (תמחור AI: 1 מטבע לכל 1,000 מילים)
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={sloganInput}
                  onChange={(e) => setSloganInput(e.target.value)}
                  placeholder="הזן סלוגן קצר..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />

                <textarea
                  value={visionInput}
                  onChange={(e) => setVisionInput(e.target.value)}
                  placeholder="כתוב את חזון העסק שלך..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition min-h-[100px]"
                />
              </div>

              <button
                onClick={handleSaveVision}
                disabled={loading || !visionInput.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>אשר חזון והמשך לפרסונות הלקוח</span>
              </button>
            </div>
          )}

          {/* Step 4: Personas */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                <h3 className="font-bold text-white text-base">הגדרת פרסונות לקוח ונקודות כאב</h3>
                <p className="text-xs text-slate-300">מי הלקוחות שאתה פותר עבורם את הבעיה?</p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newPersonaTitle}
                  onChange={(e) => setNewPersonaTitle(e.target.value)}
                  placeholder="כותרת נקודת הכאב (למשל: מחסור בזמן)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <input
                  type="text"
                  value={newPersonaDesc}
                  onChange={(e) => setNewPersonaDesc(e.target.value)}
                  placeholder="תיאור הפתרון עבור המשתמש"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <button
                  onClick={handleAddPersona}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>הוסף כרטיס כאב</span>
                </button>
              </div>

              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl transition"
              >
                המשך לעמודי שירותים
              </button>
            </div>
          )}

          {/* Step 5: Service Pages & AI Logo */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                <h3 className="font-bold text-white text-base">הקמת עמודי שירות ויצירת לוגו AI</h3>
                <p className="text-xs text-slate-300">
                  יצירת עמוד שירות ב-AI עולה 10 מטבעות (ו-1 מטבע ליום). יצירת לוגו מבוסס הֶקְשֵׁר עולה 10 מטבעות.
                </p>
              </div>

              {/* Logo Generation Section */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">יצירת לוגו ב-AI ב-10 מטבעות</span>
                  <button
                    onClick={handleGenerateLogo}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span>חולל לוגו ב-AI</span>
                  </button>
                </div>
              </div>

              {/* Service Page Form */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="שם השירות / מוצר (למשל: ייעוץ אישי)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <button
                  onClick={handleAddServicePage}
                  disabled={loading || !newServiceTitle.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>צור עמוד שירות (10 מטבעות)</span>
                </button>
              </div>

              <button
                onClick={() => setCurrentStep(6)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl transition"
              >
                המשך לפרטי התקשרות וכפתור "אנחנו כאן"
              </button>
            </div>
          )}

          {/* Step 6: Contact Info */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                <h3 className="font-bold text-white text-base">פרטי התקשרות וכפתור "אנחנו כאן"</h3>
                <p className="text-xs text-slate-300">
                  כל פרט שתמלא יהפוך לאייקון דינמי בתוך כפתור "אנחנו כאן".
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="מספר טלפון"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="כתובת אימייל"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
                <input
                  type="text"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="מספר ווצאפ"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
                />
              </div>

              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-base shadow-2xl transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>סיים בנייה ועבור לדשבורד</span>
              </button>
            </div>
          )}

        </div>

        {/* LEFT SIDE: Live Preview Panel (5 cols) */}
        <div className="lg:col-span-6 h-[600px] lg:h-auto min-h-[500px]">
          <LiveBuilderPreview state={state} />
        </div>

      </div>
    </div>
  );
}
