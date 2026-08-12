"use client";

import React, { useState, useEffect, useRef } from "react";
import { SmartOfficeDocument, SmartOfficeTab } from "@/lib/types/office";
import { SmartOfficeEditor } from "./SmartOfficeEditor";
import { 
  Mic, 
  MicOff, 
  Send, 
  Loader2, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  Check,
  Info,
  Users,
  AlertCircle,
  Activity,
  Bug,
  Folder,
  Volume2,
  History,
  MessageSquare,
  User,
  Bot,
  PanelLeftOpen,
  PanelLeftClose
} from "lucide-react";

// ---------------------------------------------------------------------------
// TYPEWRITER EFFECT COMPONENT FOR MOVIE SUBTITLES
// ---------------------------------------------------------------------------

function TypewriterText({ text, speed = 35 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

// ---------------------------------------------------------------------------
// GENERATIVE JSON CARDS RENDERER (Inline Canvas Cards)
// ---------------------------------------------------------------------------

function InsightCard({ data }: { data: any }) {
  const IconCmp = data.icon === "Users" ? Users : data.icon === "AlertCircle" ? AlertCircle : data.icon === "Activity" ? Activity : data.icon === "Bug" ? Bug : Info;
  return (
    <div className="w-full max-w-sm my-1.5 p-2.5 bg-slate-900/90 border border-amber-400/50 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md text-left">
      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
        <IconCmp className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-slate-100">{data.title || "Insight Notification"}</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">{data.text}</p>
      </div>
    </div>
  );
}

function MultiSelectGrid({ data, onAction }: { data: any; onAction: (text: string) => void }) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const toggleItem = (title: string) => {
    if (selectedItems.includes(title)) {
      setSelectedItems(selectedItems.filter((i) => i !== title));
    } else {
      setSelectedItems([...selectedItems, title]);
    }
  };

  return (
    <div className="w-full max-w-sm my-1.5 p-3 bg-slate-900/90 border border-amber-400/50 rounded-2xl shadow-xl text-center space-y-2">
      <h4 className="text-xs font-bold text-amber-400">{data.title || "Select Available Tools:"}</h4>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {(data.items || []).map((item: any, i: number) => {
          const title = typeof item === 'string' ? item : item.title;
          const isActive = selectedItems.includes(title);
          return (
            <button
              key={i}
              onClick={() => toggleItem(title)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500/20 border border-amber-400 text-amber-300 shadow-md"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-amber-400/50"
              }`}
            >
              {isActive && <Check className="w-3 h-3 text-amber-400" />}
              {title}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onAction(selectedItems.length > 0 ? `Selected tools: ${selectedItems.join(", ")}` : "No tools selected")}
        className="mt-1 w-7 h-7 mx-auto bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
      >
        <Folder className="w-3.5 h-3.5 text-black" />
      </button>
    </div>
  );
}

function MiniFormCard({ data, onAction }: { data: any; onAction: (text: string) => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  return (
    <div className="w-full max-w-sm my-1.5 p-3 bg-slate-900/90 border border-amber-400/50 rounded-2xl shadow-xl space-y-2 text-left">
      <h4 className="text-xs font-bold text-amber-400 text-center">{data.title || "Fill Form Details"}</h4>
      {(data.fields || []).map((f: string, i: number) => (
        <input
          key={i}
          type="text"
          placeholder={f}
          value={formData[f] || ""}
          onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
        />
      ))}
      <button
        onClick={() => {
          const details = Object.entries(formData).map(([k, v]) => `${k}: ${v}`).join(", ");
          onAction(`Form submitted: ${details}`);
        }}
        className="w-full py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
      >
        Submit
      </button>
    </div>
  );
}

function GenerativeRenderer({ ui, onAction }: { ui: any; onAction: (text: string) => void }) {
  if (!ui || !ui.type) return null;
  if (ui.type === "InsightCard") return <InsightCard data={ui.data} />;
  if (ui.type === "MultiSelectGrid") return <MultiSelectGrid data={ui.data} onAction={onAction} />;
  if (ui.type === "MiniForm") return <MiniFormCard data={ui.data} onAction={onAction} />;
  return null;
}

// ---------------------------------------------------------------------------
// MAIN SMART OFFICE CLIENT
// ---------------------------------------------------------------------------

interface SmartOfficeClientProps {
  initialOffice: SmartOfficeDocument;
  userRole?: string;
  userId?: string | null;
}

export function SmartOfficeClient({
  initialOffice,
  userId = null,
}: SmartOfficeClientProps) {
  const [office, setOffice] = useState<SmartOfficeDocument>(initialOffice);
  const [currentTabIdx, setCurrentTabIdx] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Voice & Subtitle Input States
  const [userQueryInput, setUserQueryInput] = useState("");
  const [isEditingTopText, setIsEditingTopText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Active Agent Response Subtitle
  const [currentAgentSubtitle, setCurrentAgentSubtitle] = useState<{
    text: string;
    uiCards?: any[];
  } | null>(null);

  // Conversation History List for Left Sidebar
  const [historyMessages, setHistoryMessages] = useState<Array<{
    id: string;
    sender: "user" | "agent";
    text: string;
    timestamp: string;
    uiCards?: any[];
  }>>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const [speechSupported, setSpeechSupported] = useState(true);

  // Gemini State Management
  const [sessionId, setSessionId] = useState("");
  const [interactionId, setInteractionId] = useState("");

  const recognitionRef = useRef<any>(null);
  const topTextareaRef = useRef<HTMLTextAreaElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  const isManagerOrAdmin = true;

  const tabs = office.tabs && office.tabs.length > 0 ? office.tabs : initialOffice.tabs;
  const currentTab: SmartOfficeTab = tabs[currentTabIdx % tabs.length];

  // Speech Recognition & Session Initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storagePrefix = `office_sess_${office.slug}`;
      let savedSession = localStorage.getItem(`${storagePrefix}_id`);
      if (!savedSession) {
        savedSession = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem(`${storagePrefix}_id`, savedSession);
      }
      setSessionId(savedSession);

      let savedInteraction = localStorage.getItem(`${storagePrefix}_interaction_id`);
      if (savedInteraction) {
        setInteractionId(savedInteraction);
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setUserQueryInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, [office.slug]);

  // Focus textarea when editing
  useEffect(() => {
    if (isEditingTopText && topTextareaRef.current) {
      topTextareaRef.current.focus();
      const len = topTextareaRef.current.value.length;
      topTextareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditingTopText]);

  // Auto-scroll history panel to bottom
  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [historyMessages]);

  // Infinite Carousel Navigation
  const handlePrevTab = () => {
    setCurrentTabIdx((prev) => (prev - 1 + tabs.length) % tabs.length);
  };

  const handleNextTab = () => {
    setCurrentTabIdx((prev) => (prev + 1) % tabs.length);
  };

  // TTS Speech Synthesis
  const speakText = (text: string, audioBase64?: string | null) => {
    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play().catch(console.error);
        return;
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setUserQueryInput("");
      setIsEditingTopText(true);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("Speech recognition restart warning:", e);
      }
    }
  };

  const handleSendChat = async (overrideQuery?: string) => {
    const inputQuery = (overrideQuery || userQueryInput).trim();
    if (!inputQuery) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append User Request to History Sidebar
    const userMsg = {
      id: `u_${Date.now()}`,
      sender: "user" as const,
      text: inputQuery,
      timestamp: timeStr,
    };
    setHistoryMessages((prev) => [...prev, userMsg]);

    setUserQueryInput("");
    setIsEditingTopText(false);
    setIsThinking(true);

    try {
      const res = await fetch(`/api/office/${office.slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: inputQuery,
          currentTab,
          agentName: office.agentName,
          sessionId,
          previous_interaction_id: interactionId,
          userId: userId || (typeof window !== "undefined" ? localStorage.getItem("david_user_id") || "david_user_001" : "david_user_001"),
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();
      const replyMessage = data.reply || "Analytics processed successfully.";

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.interactionId) {
        setInteractionId(data.interactionId);
        if (typeof window !== "undefined") {
          localStorage.setItem(`office_sess_${office.slug}_interaction_id`, data.interactionId);
        }
      }

      // Update active agent response
      setCurrentAgentSubtitle({
        text: replyMessage,
        uiCards: data.uiComponents || [],
      });

      // Append Agent Reply to History Sidebar
      const agentMsg = {
        id: `a_${Date.now()}`,
        sender: "agent" as const,
        text: replyMessage,
        timestamp: timeStr,
        uiCards: data.uiComponents || [],
      };
      setHistoryMessages((prev) => [...prev, agentMsg]);

      speakText(replyMessage, data.audioBase64);
    } catch (err: any) {
      console.error(err);
      const errMsg = "Connection issue. Please try again.";
      setCurrentAgentSubtitle({
        text: errMsg,
      });
      setHistoryMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, sender: "agent", text: errMsg, timestamp: timeStr },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const isUserSpeakingOrTyping = isRecording || isEditingTopText || userQueryInput.trim().length > 0;

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col justify-between items-center select-none font-sans relative overflow-x-hidden"
      dir="ltr"
      lang="en"
    >
      {/* ------------------------------------------------------------- */}
      {/* GOLD TOP HEADER                                               */}
      {/* ------------------------------------------------------------- */}
      <header className="w-full bg-[#FFC800] pt-4 pb-6 px-4 flex flex-col items-center justify-center relative shadow-lg z-20">
        {/* Toggle Left Conversation History Panel Button */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="absolute left-4 top-4 bg-slate-950 hover:bg-black text-[#FFC800] border border-amber-400/60 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          title={isHistoryOpen ? "Hide History Sidebar" : "Show History Sidebar"}
        >
          {isHistoryOpen ? <PanelLeftClose className="w-4 h-4 text-[#FFC800]" /> : <PanelLeftOpen className="w-4 h-4 text-[#FFC800]" />}
          <span className="hidden sm:inline">Requests & Answers</span>
          {historyMessages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black">
              {historyMessages.length}
            </span>
          )}
        </button>

        {/* Centered Diamond Rhombus Logo Badge */}
        <div className="relative">
          <div className="w-56 sm:w-64 h-16 bg-black border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-2xl px-4 py-1">
            <span className="text-[#FFC800] font-black text-xl sm:text-2xl tracking-widest leading-none">
              {office.headerBrand || "M.A.M"}
            </span>
            <span className="text-white text-xs sm:text-sm font-semibold tracking-tight mt-0.5 opacity-90">
              {office.headerSubtitle || "Smart digital offices"}
            </span>
          </div>
        </div>

        {/* Manager / Admin Toggle Button */}
        {isManagerOrAdmin && (
          <button
            onClick={() => setIsEditorOpen(true)}
            className="absolute right-4 top-4 bg-slate-900/90 hover:bg-slate-800 text-[#FFC800] border border-amber-400/60 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Edit Office Configuration"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FFC800]" />
            <span>Edit Office</span>
          </button>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR: REQUESTS & ANSWERS CONVERSATION HISTORY PANEL    */}
      {/* ------------------------------------------------------------- */}
      {isHistoryOpen && (
        <aside className="fixed left-3 top-24 bottom-24 z-40 w-72 sm:w-80 bg-slate-950/95 border-2 border-amber-400/50 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300 animate-fadeIn">
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-amber-400/30 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-400 tracking-wide">
                Requests & Answers Log
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {historyMessages.length} messages
            </span>
          </div>

          {/* Sidebar Messages Timeline */}
          <div ref={historyScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {historyMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-amber-400/40" />
                <p className="text-xs font-medium">No conversation history yet.</p>
                <p className="text-[10px] text-slate-400">Speak or type a prompt to see live requests and answers here.</p>
              </div>
            ) : (
              historyMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    if (msg.sender === "agent") {
                      setCurrentAgentSubtitle({ text: msg.text, uiCards: msg.uiCards });
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                    msg.sender === "user"
                      ? "bg-slate-900/90 border-amber-400/40 text-amber-300 ml-4 hover:border-amber-400"
                      : "bg-slate-900/90 border-slate-800 text-slate-100 mr-2 hover:border-amber-400/50 shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      {msg.sender === "user" ? (
                        <>
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400">User Request</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-white">{office.agentName} Answer</span>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs font-medium leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BODY - CANVAS AREA                                            */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 w-full max-w-lg px-4 pt-2 pb-0 flex flex-col justify-between items-center relative z-10">
        {/* ----------------------------------------------------------- */}
        {/* TOP LIVE EDITABLE SUBTITLE CANVAS ZONE                       */}
        {/* ----------------------------------------------------------- */}
        <div className="w-full text-center space-y-2 min-h-[110px] pt-2">
          {isUserSpeakingOrTyping ? (
            /* USER RECORDING OR EDITING/TYPING: Live zero-delay text & inline editing! */
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <span className="animate-pulse flex items-center gap-1.5">
                  {isRecording ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>Live Speech Acquisition...</span>
                    </>
                  ) : (
                    <span>Edit / Add Words:</span>
                  )}
                </span>
              </div>

              {/* Interactive Live Editable Subtitle Text Box */}
              <div className="relative group bg-slate-950/90 border-2 border-amber-400/70 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md">
                <textarea
                  ref={topTextareaRef}
                  value={userQueryInput}
                  onChange={(e) => setUserQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder={isRecording ? "Listening to your voice..." : "Type or speak your prompt..."}
                  rows={3}
                  className="w-full bg-transparent text-[#FFC800] font-extrabold text-lg sm:text-xl text-center focus:outline-none resize-none leading-snug tracking-wide"
                />

                <div className="flex items-center justify-between mt-1 px-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className="text-amber-400/80 font-medium">Click text to edit or type words freely</span>
                  <button
                    onClick={() => handleSendChat()}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3 text-slate-950" />
                  </button>
                </div>
              </div>
            </div>
          ) : currentAgentSubtitle ? (
            /* AGENT RESPONSE SUBTITLE: Displays David's active answer + click-to-edit option */
            <div className="space-y-2 transition-all duration-300">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <span>{office.agentName}</span>
                {isPlayingAudio && <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
              </div>

              {/* Subtitles: MAX 5 LINES STRICTLY ENFORCED via line-clamp-5 + Typewriter */}
              <div 
                className="group relative cursor-pointer inline-block"
                onClick={() => {
                  setUserQueryInput("");
                  setIsEditingTopText(true);
                }}
              >
                <p className="text-[#FFC800] font-extrabold text-lg sm:text-xl tracking-wide leading-snug line-clamp-5 px-2 drop-shadow-md">
                  "<TypewriterText text={currentAgentSubtitle.text} />"
                </p>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-amber-400/80 block mt-0.5 font-medium">
                  Click to reply or edit question
                </span>
              </div>

              {/* Rendered JSON Cards */}
              {currentAgentSubtitle.uiCards && currentAgentSubtitle.uiCards.map((ui, uiIdx) => (
                <GenerativeRenderer key={uiIdx} ui={ui} onAction={(text) => handleSendChat(text)} />
              ))}
            </div>
          ) : (
            /* INITIAL DEFAULT STATE */
            <div className="relative inline-flex items-center justify-center gap-2 group max-w-full">
              <div 
                className="flex items-center justify-center gap-2 cursor-pointer p-2 rounded-2xl hover:bg-slate-900/50 transition-all border border-transparent hover:border-amber-400/30" 
                onClick={() => {
                  setUserQueryInput("");
                  setIsEditingTopText(true);
                }}
              >
                <h2 className="text-[#FFC800] font-extrabold text-xl sm:text-2xl tracking-wide drop-shadow-md leading-snug">
                  <TypewriterText text={currentTab.subtitle || "smart strategy & lead intelligence"} />
                </h2>
                <button
                  className="p-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-[#FFC800] hover:bg-amber-500/20 transition-all shrink-0"
                  title="Click to edit or speak"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FFC800]" />
                </button>
              </div>
            </div>
          )}

          {isThinking && (
            <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900/80 border border-amber-400/30 rounded-xl text-[#FFC800] text-xs w-fit mx-auto animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#FFC800]" />
              <span>{office.agentName} is analyzing personal & system data...</span>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* PINNED BOTTOM STACK: Image & Carousel Arrows Pinned to Button */}
        {/* ----------------------------------------------------------- */}
        <div className="mt-auto pt-4 pb-1 flex flex-col items-center justify-end w-full">
          {/* SMART WORKER IMAGE / VIDEO: Compact height, pinned right above analyze-mode */}
          <div className="relative w-full max-w-[110px] sm:max-w-[130px] h-18 sm:h-22 flex items-center justify-center mb-[3px]">
            {currentTab.mediaType === "video" || currentTab.mediaUrl?.toLowerCase().includes(".mp4") ? (
              <video
                src={currentTab.mediaUrl}
                autoPlay
                loop={currentTab.loopMedia !== false}
                muted={currentTab.mutedMedia !== false}
                playsInline
                className="w-full h-full object-contain drop-shadow-lg"
              />
            ) : (
              <img
                src={currentTab.mediaUrl || "/edoffice/ed.webp"}
                alt={currentTab.title}
                className="w-full h-full object-contain drop-shadow-lg"
              />
            )}
          </div>

          {/* CAROUSEL NAVIGATION ROW: <<< growth-mode. >>> (Pinned 3px above the diamond button) */}
          <div className="w-full flex items-center justify-between px-6 mb-[3px]">
            {/* Left Arrow Button <<< */}
            <button
              onClick={handlePrevTab}
              className="flex items-center text-white hover:text-[#FFC800] transition-transform active:scale-95 group cursor-pointer"
              aria-label="Previous tab"
            >
              <span className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-[#FFC800] tracking-tighter">
                &lt;&lt;&lt;
              </span>
            </button>

            {/* Active Tab Title */}
            <div className="text-center px-2">
              <span className="text-[#FFC800] font-extrabold text-lg sm:text-xl tracking-wider leading-none block">
                {currentTab.title}
              </span>
            </div>

            {/* Right Arrow Button >>> */}
            <button
              onClick={handleNextTab}
              className="flex items-center text-white hover:text-[#FFC800] transition-transform active:scale-95 group cursor-pointer"
              aria-label="Next tab"
            >
              <span className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-[#FFC800] tracking-tighter">
                &gt;&gt;&gt;
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* GOLD BOTTOM FOOTER & GOLDEN MICROPHONE DIAMOND BUTTON         */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full bg-[#FFC800] pt-8 pb-4 px-4 flex flex-col items-center justify-center relative shadow-2xl z-20">
        {/* Centered Golden Microphone Action Button ("Check with David.") */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <button
            onClick={() => {
              if (userQueryInput.trim() && !isRecording) {
                handleSendChat();
              } else {
                toggleRecording();
              }
            }}
            className={`w-44 sm:w-48 h-16 bg-slate-950 hover:bg-black border-2 border-amber-300 rounded-2xl flex flex-col items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group ${
              isRecording ? "ring-4 ring-amber-400/50 animate-pulse" : ""
            }`}
          >
            {userQueryInput.trim().length > 0 && !isRecording ? (
              <span className="text-[#FFC800] font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                <span>Send Query</span>
                <Send className="w-4 h-4 text-[#FFC800]" />
              </span>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="p-1 rounded-full bg-amber-500/20 text-[#FFC800]">
                  {isRecording ? (
                    <MicOff className="w-5 h-5 text-red-400 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-[#FFC800]" />
                  )}
                </div>
                <span className="text-[#FFC800] font-bold text-xs sm:text-sm tracking-wide mt-0.5">
                  {isRecording ? "Stop Recording" : office.agentTitle || `Check with ${office.agentName}.`}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Footer Agent Text */}
        <div className="mt-3 text-center">
          <h1 className="text-black font-black text-3xl sm:text-4xl tracking-tight">
            {office.officeName || `${office.agentName}'s office.`}
          </h1>
        </div>
      </footer>

      {/* Admin Editor Modal */}
      {isEditorOpen && (
        <SmartOfficeEditor
          office={office}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaveSuccess={(updated) => setOffice(updated)}
        />
      )}
    </div>
  );
}
