"use client";

import React, { useState, useEffect } from "react";
import RawInputStep from "./RawInputStep";
import SmartGoalsView from "./SmartGoalsView";
import ValidatorStep from "./ValidatorStep";
import WbsCanvasStep from "./WbsCanvasStep";
import { SmartGoals, ValidatorResult, ProjectCharter, WbsTask } from "../types";
import { generateSmartGoals, generateProjectWbs } from "../actions";
import { Sparkles, ArrowLeft, RefreshCw, CheckCircle, Sun, Moon } from "lucide-react";
import Link from "next/link";

type Step = "input" | "smart_goals" | "validator" | "wbs_canvas" | "success";

export default function GeneratorRoot() {
  const [step, setStep] = useState<Step>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  // Captured data
  const [projectTitle, setProjectTitle] = useState("");
  const [smartGoals, setSmartGoals] = useState<SmartGoals | null>(null);
  const [projectType, setProjectType] = useState<"new" | "recurring" | null>(null);
  const [validatorResult, setValidatorResult] = useState<ValidatorResult | null>(null);
  const [charter, setCharter] = useState<ProjectCharter | null>(null);
  const [wbsTasks, setWbsTasks] = useState<WbsTask[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Transitions
  const handleInputSubmit = async (data: { text: string; fileBase64?: string; fileType?: string; fileName?: string }) => {
    setIsLoading(true);
    setError("");
    
    // Extrapolate a name for the project from the input or default
    const titleSnippet = data.text.split("\n")[0].slice(0, 35) || "פרויקט מחולל";
    setProjectTitle(titleSnippet);

    try {
      const res = await generateSmartGoals({
        text: data.text,
        fileBase64: data.fileBase64,
        fileType: data.fileType
      });

      if (res.success && res.data) {
        setSmartGoals(res.data);
        setStep("smart_goals");
      } else {
        setError(res.error || "נכשל בניתוח הרעיון וזיקוק יעדי SMART");
      }
    } catch (err: any) {
      setError("שגיאת תקשורת עם שרת ה-AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartGoalsApprove = () => {
    setStep("validator");
  };

  const handleValidatorSubmit = async (valResult: ValidatorResult, projCharter: ProjectCharter, type: "new" | "recurring") => {
    setValidatorResult(valResult);
    setCharter(projCharter);
    setProjectType(type);
    setIsLoading(true);
    setError("");

    try {
      if (!smartGoals) throw new Error("יעדי SMART חסרים");
      const res = await generateProjectWbs({
        title: projectTitle,
        smartGoals,
        validator: valResult
      });

      if (res.success && res.tasks) {
        setWbsTasks(res.tasks);
        setStep("wbs_canvas");
      } else {
        setError(res.error || "נכשל ביצירת עץ המשימות וה-RACI");
      }
    } catch (err: any) {
      setError("שגיאה ביצירת ה-WBS מול השרת");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComplete = (projectId: string) => {
    setCreatedProjectId(projectId);
    setStep("success");
  };

  const handleReset = () => {
    setStep("input");
    setProjectTitle("");
    setSmartGoals(null);
    setProjectType(null);
    setValidatorResult(null);
    setCharter(null);
    setWbsTasks([]);
    setCreatedProjectId(null);
    setError("");
  };

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white p-6 md:p-10 font-sans transition-colors duration-300" dir="rtl">
      
      {/* Top Breadcrumb / Progress Bar */}
      {step !== "success" && (
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-zinc-900 pb-4 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              className="text-gray-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              <span>חזור ללוח הבקרה</span>
            </Link>
            <button 
              onClick={handleReset}
              className="text-[#f59e0b] hover:underline flex items-center gap-0.5"
            >
              המחולל
            </button>
            <span>/</span>
            <span className="text-zinc-800 dark:text-white">
              {step === "input" && "איסוף חומרי גלם"}
              {step === "smart_goals" && "זיקוק SMART"}
              {step === "validator" && "תיקוף והצהרת אמנה"}
              {step === "wbs_canvas" && "קנבס WBS ו-RACI"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-[#f59e0b]/20 bg-zinc-900/50 hover:bg-zinc-800 text-[#f59e0b] hover:text-white transition-colors cursor-pointer ml-3 flex items-center justify-center"
              title={theme === "dark" ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={`w-3 h-3 rounded-full border ${step === "input" ? "bg-[#f59e0b] border-[#f59e0b]" : "border-gray-700 bg-transparent"}`} />
            <div className={`w-3 h-3 rounded-full border ${step === "smart_goals" ? "bg-[#f59e0b] border-[#f59e0b]" : "border-gray-700 bg-transparent"}`} />
            <div className={`w-3 h-3 rounded-full border ${step === "validator" ? "bg-[#f59e0b] border-[#f59e0b]" : "border-gray-700 bg-transparent"}`} />
            <div className={`w-3 h-3 rounded-full border ${step === "wbs_canvas" ? "bg-[#f59e0b] border-[#f59e0b]" : "border-gray-700 bg-transparent"}`} />
          </div>
        </div>
      )}

      {/* Main step routing switch */}
      <div className="w-full">
        {error && (
          <div className="w-full max-w-xl mx-auto mb-6 text-red-400 text-sm bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={handleReset} className="text-xs bg-red-500 text-black px-3 py-1 rounded-lg font-bold">התחל מחדש</button>
          </div>
        )}

        {step === "input" && (
          <RawInputStep onNext={handleInputSubmit} isLoading={isLoading} />
        )}

        {step === "smart_goals" && smartGoals && (
          <SmartGoalsView 
            smartGoals={smartGoals} 
            onApprove={handleSmartGoalsApprove} 
            onBack={() => setStep("input")} 
          />
        )}

        {step === "validator" && smartGoals && (
          <ValidatorStep 
            title={projectTitle} 
            smartGoals={smartGoals} 
            onNext={handleValidatorSubmit} 
            onBack={() => setStep("smart_goals")} 
          />
        )}

        {step === "wbs_canvas" && charter && (
          <WbsCanvasStep 
            title={projectTitle} 
            projectType={projectType!} 
            charter={charter} 
            initialTasks={wbsTasks} 
            onBack={() => setStep("validator")} 
            onSaveComplete={handleSaveComplete} 
          />
        )}

        {step === "success" && (
          <div className="w-full max-w-md mx-auto text-center py-16 bg-zinc-950 border border-green-500/30 p-8 rounded-2xl shadow-xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-950 flex items-center justify-center border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">פרויקט חולל בהצלחה!</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              הפרויקט "{projectTitle}" ואמנת התקציב שלו ננעלו ונשמרו בהצלחה בבסיס הנתונים הארגוני.&rlm;
              עץ המשימות (WBS) ומערכת ה-RACI מוכנים לשלב 2 של שידוך המשאבים הקהילתיים.
            </p>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-[#f59e0b] text-black font-bold py-3.5 px-8 rounded-xl hover:bg-[#d97706] shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>חולל פרויקט נוסף</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
