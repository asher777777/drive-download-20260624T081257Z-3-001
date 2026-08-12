"use client";

import React, { useState, useEffect } from "react";
import { SmartWorkerConfig, DEFAULT_SMART_WORKER_CONFIG } from "@/lib/types/office";
import { 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Folder, 
  Loader2, 
  Check, 
  Bot, 
  Sliders, 
  Cpu, 
  Lock, 
  Users, 
  MessageSquare, 
  Database, 
  Code2, 
  FileText, 
  Wrench
} from "lucide-react";

interface SmartWorkerSettingsProps {
  officeSlug: string;
  workerSlug?: string;
  config?: SmartWorkerConfig;
  onSaveSuccess?: (savedConfig: SmartWorkerConfig) => void;
}

// ---------------------------------------------------------------------------
// CONSTANTS & DESCRIPTIVE LABELS
// ---------------------------------------------------------------------------

const AI_CAPABILITIES_OPTIONS = [
  { id: "text_response", label: "תשובה בטקסט", labelEn: "Text Response", icon: MessageSquare },
  { id: "research", label: "מחקר", labelEn: "Research", icon: Cpu },
  { id: "read_documents", label: "קריאת מסמכים", labelEn: "Read Documents", icon: FileText },
  { id: "generate_images", label: "יצירת תמונות", labelEn: "Generate Images", icon: Sparkles },
  { id: "generate_videos", label: "יצירת סרטונים", labelEn: "Generate Videos", icon: Bot },
  { id: "write_code", label: "כתיבת קוד", labelEn: "Code Writing", icon: Code2 },
];

const PRIMARY_ROLES_OPTIONS = [
  { id: "Advisor", label: "יועץ (Advisor)" },
  { id: "Code Writer", label: "כותב קוד (Code Writer)" },
  { id: "Content Writer", label: "כותב תוכן (Content Writer)" },
  { id: "Analytics", label: "אנליטיקה (Analytics)" },
  { id: "Page Builder", label: "בונה עמודים (Page Builder)" },
  { id: "Project Manager", label: "מנהל פרויקטים (Project Manager)" },
  { id: "Automations Manager", label: "מנהל אוטומציות (Automations Manager)" },
  { id: "Campaigns Manager", label: "מנהל קמפיינים (Campaigns Manager)" },
  { id: "Accountant", label: "מנהל חשבונות (Accountant)" },
  { id: "Security Manager", label: "מנהל אבטחה (Security Manager)" },
];

const COLLABORATING_WORKERS = [
  { id: "dotty-creative-worker", name: "Dotty", role: "Creative & Content Agent" },
  { id: "alex-security-worker", name: "Alex", role: "Security & Access Manager" },
  { id: "sarah-campaigns-worker", name: "Sarah", role: "Campaigns & Growth Specialist" },
  { id: "michael-finance-worker", name: "Michael", role: "Finance & Accounts Agent" },
];

const GOOGLE_TTS_VOICES = [
  { id: "en-US-Studio-O", name: "Google Studio Male (O)", lang: "en-US" },
  { id: "en-US-Studio-Q", name: "Google Studio Female (Q)", lang: "en-US" },
  { id: "en-US-Neural2-D", name: "Google Neural2 Male (D)", lang: "en-US" },
  { id: "en-US-Wavenet-D", name: "Google Wavenet Deep Male (D)", lang: "en-US" },
  { id: "he-IL-Wavenet-A", name: "Hebrew Wavenet (עברית)", lang: "he-IL" },
];

const TONE_STYLE_OPTIONS = [
  { id: "Authoritative", label: "סמכותי (Authoritative)" },
  { id: "Friendly", label: "חברי (Friendly)" },
  { id: "Formal", label: "רשמי (Formal)" },
  { id: "Professional", label: "מקצועי (Professional)" },
  { id: "Short & Focused", label: "קצר וממוקד (Short & Focused)" },
  { id: "Long & Consultative", label: "ארוך והתייעצותי (Long & Consultative)" },
  { id: "Sales-driven", label: "מכרתי (Sales-driven)" },
  { id: "Down-to-earth", label: "בגובה העיניים (Down-to-earth)" },
];

export function SmartWorkerSettings({
  officeSlug,
  workerSlug = "david",
  config,
  onSaveSuccess,
}: SmartWorkerSettingsProps) {
  const [formData, setFormData] = useState<SmartWorkerConfig>(
    config || DEFAULT_SMART_WORKER_CONFIG
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromptAssisting, setIsPromptAssisting] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const schemaHeader = `root\\${officeSlug}\\${workerSlug}`;

  // Fetch existing settings on mount
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/office/${officeSlug}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.smartWorkerConfig) {
            setFormData(data.smartWorkerConfig);
          }
        }
      } catch (err) {
        console.error("Failed to load smart worker config:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [officeSlug]);

  // Toggle Handlers
  const togglePermission = (key: keyof SmartWorkerConfig["permissions"]) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const toggleArrayItem = (field: "ai_capabilities" | "primary_roles" | "collaboration", value: string) => {
    setFormData((prev) => {
      const arr = prev[field] || [];
      const updated = arr.includes(value) ? arr.filter((i) => i !== value) : [...arr, value];
      return { ...prev, [field]: updated };
    });
  };

  // AI Prompt Assistant Trigger
  const handleAIPromptAssist = async () => {
    setIsPromptAssisting(true);
    try {
      const res = await fetch(`/api/office/${officeSlug}/prompt-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.refinedPrompt) {
          setFormData((prev) => ({
            ...prev,
            general_prompt: data.refinedPrompt,
            conversation_history_id: data.conversation_history_id || prev.conversation_history_id,
          }));
        }
      }
    } catch (err) {
      console.error("AI Prompt Assist error:", err);
    } finally {
      setIsPromptAssisting(false);
    }
  };

  // TTS Voice Preview Player
  const handleVoicePreview = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const voiceObj = GOOGLE_TTS_VOICES.find((v) => v.id === formData.tts_voice_id);
      const text = voiceObj?.lang === "he-IL" 
        ? "שלום, זהו שימוע דוגמה של קול ה-TTS המועדף עליך." 
        : `Hello, this is a sample preview of the ${voiceObj?.name || "selected"} voice.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceObj?.lang || "en-US";
      setIsPlayingVoice(true);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch(`/api/office/${officeSlug}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smartWorkerConfig: formData }),
      });

      if (!res.ok) {
        throw new Error("Save request failed");
      }

      const data = await res.json();
      setSaveMessage("Configuration saved successfully!");
      if (onSaveSuccess) onSaveSuccess(formData);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: any) {
      console.error("Error saving smart worker config:", err);
      setSaveMessage("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-amber-400">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Loading Smart Worker Schema...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-black/90 text-white rounded-3xl border border-amber-400/40 shadow-2xl space-y-6 select-none" dir="rtl">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & SCHEMA DEFINITION                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-400/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              הגדרות עובד חכם והרשאות
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Smart Worker Settings & Permission Matrix Module
          </p>
        </div>

        {/* Schema Header Header Badge */}
        <div className="bg-slate-950 border border-amber-400/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300 dir-ltr">
            {schemaHeader}
          </span>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div className="p-3 bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold rounded-xl text-center animate-fadeIn">
          {saveMessage}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. AI CAPABILITIES (יכולות AI)                                */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>יכולות AI (AI Capabilities)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {AI_CAPABILITIES_OPTIONS.map((cap) => {
            const IconComp = cap.icon;
            const isSelected = formData.ai_capabilities?.includes(cap.id);
            return (
              <button
                key={cap.id}
                type="button"
                onClick={() => toggleArrayItem("ai_capabilities", cap.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-400/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComp className="w-4 h-4 text-amber-400" />
                  <div className="text-right">
                    <span className="text-xs font-bold block leading-tight">{cap.label}</span>
                    <span className="text-[10px] text-slate-400 block dir-ltr">{cap.labelEn}</span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? "bg-amber-400 border-amber-400 text-black" : "border-slate-700"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PERMISSION MATRIX (סוג הרשאה)                              */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>מטריצת הרשאות (Permission Matrix)</span>
        </h3>
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* System DB Read */}
            <div className="p-3 bg-black/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">קריאה בסיס הנתונים של המערכת</span>
                <span className="text-[10px] text-slate-400 block dir-ltr">system_db_read</span>
              </div>
              <button
                type="button"
                onClick={() => togglePermission("system_db_read")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formData.permissions?.system_db_read ? "bg-amber-400" : "bg-slate-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  formData.permissions?.system_db_read ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* Office DB Read */}
            <div className="p-3 bg-black/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">קריאה בסיס הנתונים של בעל המשרד</span>
                <span className="text-[10px] text-slate-400 block dir-ltr">root\{officeSlug}\{workerSlug}</span>
              </div>
              <button
                type="button"
                onClick={() => togglePermission("office_db_read")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formData.permissions?.office_db_read ? "bg-amber-400" : "bg-slate-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  formData.permissions?.office_db_read ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* DB Write Edit Delete */}
            <div className="p-3 bg-black/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">כתיבה \ עריכה \ מחיקה בסיס הנתונים</span>
                <span className="text-[10px] text-slate-400 block dir-ltr">db_write_edit_delete</span>
              </div>
              <button
                type="button"
                onClick={() => togglePermission("db_write_edit_delete")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formData.permissions?.db_write_edit_delete ? "bg-amber-400" : "bg-slate-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  formData.permissions?.db_write_edit_delete ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* Code Files Write Edit Delete */}
            <div className="p-3 bg-black/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">כתיבה \ עריכה \ מחיקה קבצי קוד</span>
                <span className="text-[10px] text-slate-400 block dir-ltr">code_files_write_edit_delete</span>
              </div>
              <button
                type="button"
                onClick={() => togglePermission("code_files_write_edit_delete")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formData.permissions?.code_files_write_edit_delete ? "bg-amber-400" : "bg-slate-800"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  formData.permissions?.code_files_write_edit_delete ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PRIMARY ROLES (תפקיד עיקרי - בחירה מרובה)                   */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>תפקיד עיקרי של העובד (בחירה מרובה)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_ROLES_OPTIONS.map((r) => {
            const isSelected = formData.primary_roles?.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleArrayItem("primary_roles", r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-md"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-amber-400/50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. COLLABORATION (שיתוף פעולה עם עובדים נוספים)               */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>שיתוף פעולה עם עובדים חכמים נוספים</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {COLLABORATING_WORKERS.map((w) => {
            const isSelected = formData.collaboration?.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleArrayItem("collaboration", w.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-right transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-400/40"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{w.name}</span>
                  <span className="text-[10px] text-slate-400 block">{w.role}</span>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? "bg-amber-400 border-amber-400 text-black" : "border-slate-700"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. TONE & STYLE AND GOOGLE TTS VOICE                          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tone Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-400 block">בחירת סגנון - הטון (Tone & Style)</label>
          <select
            value={formData.tone_style || "Professional"}
            onChange={(e) => setFormData({ ...formData, tone_style: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {TONE_STYLE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Google TTS Voice Selection & Preview */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-400 block">בחירת קול ב-TTS של Google Studio</label>
          <div className="flex items-center gap-2">
            <select
              value={formData.tts_voice_id || "en-US-Studio-O"}
              onChange={(e) => setFormData({ ...formData, tts_voice_id: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {GOOGLE_TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleVoicePreview}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="שמע דוגמת קול"
            >
              {isPlayingVoice ? (
                <VolumeX className="w-4 h-4 animate-pulse text-slate-950" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-950" />
              )}
              <span>שמע</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. GENERAL PROMPT & AI ASSIST                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-400 block">הנחיה כללית (General Prompt)</label>
          
          <button
            type="button"
            onClick={handleAIPromptAssist}
            disabled={isPromptAssisting}
            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isPromptAssisting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>עזרה עם AI (Prompt Engineer)</span>
          </button>
        </div>

        <textarea
          value={formData.general_prompt || ""}
          onChange={(e) => setFormData({ ...formData, general_prompt: e.target.value })}
          rows={4}
          placeholder="הכנס את ההנחיה הכללית של העובד החכם..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
        />

        {formData.conversation_history_id && (
          <span className="text-[10px] text-slate-400 block dir-ltr">
            Gemini Context Cache ID: {formData.conversation_history_id}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER SAVE BUTTON (Folder Icon Rule Compliance)              */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-14 h-14 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          title="שמור הגדרות עובד חכם (Save Smart Worker Config)"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
          ) : (
            <Folder className="w-6 h-6 text-black fill-black" />
          )}
        </button>
      </div>
    </div>
  );
}
