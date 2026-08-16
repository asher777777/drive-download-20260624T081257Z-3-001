"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Save, Loader2, Check } from "lucide-react";

type Message = {
  id: string;
  question: string;
  answerJson: any;
  isSaving: boolean;
  savedAt: string | null;
};

export default function GeminiCanvasPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentQuestion = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // אנחנו מבקשים באופן מפורש JSON נקי מהמודל
      const promptToModel = `${currentQuestion}\n\nPlease respond with a valid JSON object ONLY. Do not include markdown formatting like \`\`\`json. Just the raw JSON.`;
      
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-code", // נשתמש בנתיב הקוד כדי לקבל תשובות מובנות (JSON)
          prompt: promptToModel,
        }),
      });

      const data = await response.json();
      
      let parsedJson;
      try {
        // ניסיון לנקות במידה והמודל החזיר markdown למרות הבקשה
        let rawText = data.result || "";
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedJson = JSON.parse(rawText);
      } catch (e) {
        // אם לא הצלחנו לפרסס, נציג כאובייקט עם שדה טקסט
        parsedJson = { response: data.result, error: "Failed to parse as JSON" };
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        question: currentQuestion,
        answerJson: parsedJson,
        isSaving: false,
        savedAt: null,
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error("Failed to fetch response:", error);
      alert("אירעה שגיאה בקבלת התשובה.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (msgId: string, question: string, answerJson: any) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, isSaving: true } : msg))
    );

    try {
      const response = await fetch("/api/gemini/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: question.substring(0, 50), // ניקח את 50 התווים הראשונים כשם קובץ
          content: answerJson,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? { ...msg, isSaving: false, savedAt: data.filePath }
              : msg
          )
        );
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("אירעה שגיאה בשמירת הקובץ.");
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, isSaving: false } : msg))
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans" dir="rtl">
      {/* Header */}
      <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-900 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Gemini JSON Canvas
          </h1>
          <p className="text-xs text-neutral-400 mt-1">סביבת עבודה לאובייקטים מבוססי בינה מלאכותית</p>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-60">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-lg">הכנס שאלה למטה והתשובה תרונדר כ-JSON</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* User Question */}
            <div className="self-end max-w-2xl bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md">
              <p className="text-sm font-medium">{msg.question}</p>
            </div>

            {/* AI JSON Canvas */}
            <div className="self-start w-full max-w-4xl flex flex-col gap-2">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg relative group">
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <span className="text-xs text-neutral-400 mr-2 font-mono">response.json</span>
                  </div>
                  
                  <button
                    onClick={() => handleSave(msg.id, msg.question, msg.answerJson)}
                    disabled={msg.isSaving || !!msg.savedAt}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors
                      disabled:opacity-70 disabled:cursor-not-allowed
                      bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
                    dir="rtl"
                  >
                    {msg.isSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> שומר...</>
                    ) : msg.savedAt ? (
                      <><Check className="w-3.5 h-3.5 text-green-400" /> נשמר במערכת</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> שמור קובץ</>
                    )}
                  </button>
                </div>
                
                <div className="p-5 overflow-x-auto text-left" dir="ltr">
                  <pre className="font-mono text-sm text-green-300">
                    <code>{JSON.stringify(msg.answerJson, null, 2)}</code>
                  </pre>
                </div>
              </div>
              
              {msg.savedAt && (
                <p className="text-xs text-neutral-500 mr-2">
                  נשמר בנתיב: <span className="font-mono text-neutral-400" dir="ltr">{msg.savedAt}</span>
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="self-start max-w-4xl flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-5 py-4 rounded-2xl rounded-tl-sm text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-sm font-medium animate-pulse">מייצר תגובת JSON...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-neutral-900 border-t border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="בקש מ-Gemini לייצר מבנה נתונים (למשל: 'צור רשימה של 5 סרטי מדע בדיוני')..."
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-full pl-14 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm disabled:opacity-50 shadow-inner"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute left-2.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-full transition-colors flex items-center justify-center shadow-md disabled:shadow-none"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </footer>
    </div>
  );
}
