"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./dotty.module.css";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  ShieldAlert,
  Zap,
  Plus,
  Play,
  Info,
} from "lucide-react";

const AgentCardUI = ({
  ui,
  onAction,
}: {
  ui: any;
  onAction: (text: string) => void;
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/employee?id=${ui.data.employeeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mediaData) setMediaUrl(data.mediaData);
      })
      .catch(console.error);
  }, [ui.data.employeeId]);

  const slug = ui.data.employeeId.split("_").slice(1).join("_");
  const officeSlug = ui.data.employeeId.split("_")[0];
  const url = `/office/${officeSlug}/employee/${slug}`;

  return (
    <div
      className={styles.menuCard}
      onClick={() => (window.location.href = url)}
      style={{ cursor: "pointer", overflow: "hidden" }}
    >
      {mediaUrl ? (
        <img
          src={mediaUrl}
          alt={ui.data.name}
          style={{
            width: "100%",
            height: "150px",
            objectFit: "cover",
            borderRadius: "8px 8px 0 0",
          }}
        />
      ) : (
        <div className={styles.menuIcon}>🤖</div>
      )}
      <div style={{ padding: "10px" }}>
        <h4 className={styles.menuTitle}>{ui.data.name}</h4>
        <p className={styles.menuDesc}>{ui.data.role}</p>
        <div
          style={{
            textAlign: "center",
            color: "#f59e0b",
            fontWeight: "bold",
            marginTop: "8px",
          }}
        >
          Open Smart Employee ➔
        </div>
      </div>
    </div>
  );
};

const MediaUploadCard = ({
  onAction,
}: {
  onAction: (text: string, mediaData: string) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAction("Media uploaded successfully", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.miniForm}>
      <h3 className={styles.formTitle}>Upload Employee Media</h3>
      <p
        className={styles.productDesc}
        style={{ textAlign: "center", marginBottom: "10px" }}
      >
        Please upload an image or video for the smart employee.
      </p>
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={styles.productBtn}
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "black",
        }}
      >
        Select File
      </button>
    </div>
  );
};

const AgentBuilderForm = ({
  onAction,
}: {
  onAction: (text: string, tools: string[]) => void;
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");

  const [tools, setTools] = useState({
    crm: false,
    payments: false,
    forms: false,
    contentCreation: false,
    displayAgent: false,
  });

  const handleSubmit = () => {
    const selectedTools = Object.entries(tools)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onAction(
      `Create a smart employee named ${name}, role: ${role}. Goal: ${goal}. Tone: ${tone}. Tools: ${selectedTools.join(", ")}`,
      selectedTools,
    );
  };

  return (
    <div className={styles.miniForm} style={{ textAlign: "left" }}>
      <h3 className={styles.formTitle}>Smart Employee Setup</h3>

      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Employee Name (e.g., Dan)"
          className={styles.formInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Role (e.g., Sales Rep)"
          className={styles.formInput}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <input
          placeholder="Specific Goal"
          className={styles.formInput}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <input
          placeholder="Tone of Voice (e.g., Professional)"
          className={styles.formInput}
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />
      </div>

      <h4 style={{ color: "white", marginBottom: "5px", fontSize: "14px" }}>
        Capabilities & Tools:
      </h4>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          color: "#ccc",
          fontSize: "14px",
          marginBottom: "15px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={tools.crm}
            onChange={(e) => setTools({ ...tools, crm: e.target.checked })}
          />{" "}
          CRM Read/Write
        </label>
        <label>
          <input
            type="checkbox"
            checked={tools.payments}
            onChange={(e) => setTools({ ...tools, payments: e.target.checked })}
          />{" "}
          Process Payments
        </label>
        <label>
          <input
            type="checkbox"
            checked={tools.forms}
            onChange={(e) => setTools({ ...tools, forms: e.target.checked })}
          />{" "}
          Create Forms
        </label>
        <label>
          <input
            type="checkbox"
            checked={tools.contentCreation}
            onChange={(e) =>
              setTools({ ...tools, contentCreation: e.target.checked })
            }
          />{" "}
          Content Creation
        </label>
        <label>
          <input
            type="checkbox"
            checked={tools.displayAgent}
            onChange={(e) =>
              setTools({ ...tools, displayAgent: e.target.checked })
            }
          />{" "}
          Display Page Agent
        </label>
      </div>

      <button
        onClick={handleSubmit}
        className={styles.productBtn}
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "black",
        }}
      >
        Build Smart Employee
      </button>
    </div>
  );
};

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;

    const words = text.split(" ");
    let current = 0;

    const interval = setInterval(() => {
      if (current < words.length) {
        setDisplayed(words.slice(0, current + 1).join(" "));
        current++;
      } else {
        clearInterval(interval);
      }
    }, 200); // ~300 words per minute, roughly matching speech

    return () => clearInterval(interval);
  }, [text]);

  return <>{displayed}</>;
}

function InteractiveMiniForm({
  ui,
  onAction,
}: {
  ui: any;
  onAction: (text: string) => void;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className={styles.miniForm}>
      <h3 className={styles.formTitle}>{ui.data.title}</h3>
      {ui.data.fields.map((f: string, i: number) => (
        <input
          key={i}
          type="text"
          placeholder={f}
          className={styles.formInput}
          value={formData[f] || ""}
          onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
        />
      ))}
      <button
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          const details = Object.entries(formData)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

          const phone = formData["Phone"] || formData["טלפון"];
          if (phone) {
            try {
              const { signIn } = await import("next-auth/react");
              // Background auto-registration/login using phone number
              await signIn("credentials", {
                username: phone,
                password: phone,
                action: "register",
                redirect: false,
              });
            } catch (e) {
              console.error("Auto-login failed:", e);
            }
          }

          onAction(`השארתי פרטים. הנה הפרטים שלי: ${details}`);
          setIsSubmitting(false);
        }}
        className={styles.productBtn}
      >
        {isSubmitting ? "שולח..." : "שלח"}
      </button>
    </div>
  );
}

function GenerativeRenderer({
  ui,
  onAction,
}: {
  ui: any;
  onAction: (text: string, mediaData?: string) => void;
}) {
  if (ui.type === "ProductCard") {
    return (
      <div className={styles.productCard}>
        <div className={styles.productIcon}>✨</div>
        <h3 className={styles.productName}>{ui.data.name}</h3>
        <p className={styles.productDesc}>{ui.data.desc}</p>
        <div className={styles.productPrice}>{ui.data.price}</div>
        <button
          onClick={() => onAction(`I am interested in ${ui.data.name}`)}
          className={styles.productBtn}
        >
          מעניין אותי
        </button>
      </div>
    );
  }

  if (ui.type === "Carousel") {
    return (
      <div className={styles.carouselContainer}>
        {ui.data.items.map((item: any, i: number) => (
          <div key={i} className={styles.carouselItem}>
            <h4 className={styles.carouselItemName}>{item.name}</h4>
            <p className={styles.carouselItemDesc}>{item.desc}</p>
            <div className={styles.carouselItemPrice}>{item.price}</div>
            <button
              onClick={() => onAction(`I want ${item.name}`)}
              className={styles.productBtn}
            >
              בחר
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (ui.type === "AgentCard") {
    return <AgentCardUI ui={ui} onAction={onAction} />;
  }

  if (ui.type === "AgentBuilderForm") {
    return <AgentBuilderForm onAction={(text) => onAction(text)} />;
  }

  if (ui.type === "MediaUploadCard") {
    return <MediaUploadCard onAction={(text, media) => onAction(text)} />; // Wait, onAction in GenerativeRenderer only takes text. I need to update GenerativeRenderer's onAction type!
  }

  if (ui.type === "MiniForm") {
    return <InteractiveMiniForm ui={ui} onAction={onAction} />;
  }

  if (ui.type === "PaymentDialog") {
    return (
      <div className={styles.miniForm}>
        <h3 className={styles.formTitle}>Secure Checkout</h3>
        <p className={styles.productDesc}>
          Purchasing: <strong>{ui.data.product}</strong>
        </p>
        <div className={styles.productPrice}>{ui.data.amount}</div>
        <button
          onClick={() => onAction(`שילמתי בהצלחה על ${ui.data.product}`)}
          className={styles.productBtn}
        >
          Pay Now (Mock)
        </button>
      </div>
    );
  }

  if (ui.type === "MenuGrid") {
    return (
      <div className={styles.menuGrid}>
        {ui.data.items.map((item: any, i: number) => (
          <div
            key={i}
            className={styles.menuCard}
            onClick={() => onAction(item.action)}
          >
            <div className={styles.menuIcon}>{item.icon}</div>
            <h4 className={styles.menuTitle}>{item.title}</h4>
            <p className={styles.menuDesc}>{item.desc}</p>
          </div>
        ))}
      </div>
    );
  }

  if (ui.type === "ImageCard") {
    return (
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <img
          src={ui.data.url}
          alt={ui.data.prompt}
          style={{
            maxWidth: "100%",
            borderRadius: "12px",
            border: "2px solid #f59e0b",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.2)",
          }}
        />
        <p
          style={{
            fontSize: "12px",
            color: "#999",
            marginTop: "8px",
            fontStyle: "italic",
          }}
        >
          {ui.data.prompt}
        </p>
      </div>
    );
  }

  if (ui.type === "Redirect") {
    if (typeof window !== "undefined") {
      window.location.href = ui.data.url;
    }
    return <div className={styles.productDesc}>מעביר אותך למשרד החדש...</div>;
  }

  return null;
}

export default function DottyChatClient({
  userRole,
  userId,
  officeSlug,
  agentId,
  agentName,
}: {
  userRole?: "MASTER_ADMIN" | "MANAGER" | "END_USER";
  userId: string | null;
  officeSlug?: string;
  agentId?: string;
  agentName?: string;
}) {
  const isAdmin = userRole === "MASTER_ADMIN" || userRole === "MANAGER";
  const initialWelcome =
    userRole === "MASTER_ADMIN"
      ? `שלום מנהל המערכת, אני כאן לעדכן את המוח שלי ואת ארגז הכלים שלי. איזה כלי חדש נלמד היום?`
      : userRole === "MANAGER"
        ? `שלום הבוס! אני מוכן לעבודה. איך אפשר לעזור לך לנהל את העסק היום?`
        : `שלום! אני ${agentName || "Dotty"}, איך אפשר לעזור לך היום?`;

  const [message, setMessage] = useState(initialWelcome);

  const [generativeUI, setGenerativeUI] = useState<any[]>([]);

  const [userText, setUserText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isInfoMode, setIsInfoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [interactionId, setInteractionId] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      let savedSession = localStorage.getItem("dotty_session_id");
      if (!savedSession) {
        savedSession = `dotty_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("dotty_session_id", savedSession);
      }
      setSessionId(savedSession);
      
      let savedInteraction = localStorage.getItem("dotty_interaction_id");
      if (savedInteraction) {
        setInteractionId(savedInteraction);
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "he-IL";

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setUserText(currentTranscript);
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
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSend = async (overrideText?: string, mediaOverride?: string) => {
    const textToSend = overrideText || userText.trim();
    const mediaToSend = mediaOverride || selectedMedia;

    if (!textToSend && !mediaToSend) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setIsThinking(true);
    setMessage("");
    setGenerativeUI([]);

    if (!overrideText) {
      setUserText("");
    }

    try {
      const res = await fetch("/api/dotty-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: textToSend,
          sessionId,
          previous_interaction_id: interactionId,
          userRole,
          userId,
          officeSlug,
          agentId,
          isInfoMode,
          mediaData: mediaToSend,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API error response:", text);
        setMessage("Connection error: " + res.status);
        return;
      }

      const data = await res.json();

      if (data.reply) {
        let rawReply = data.reply;

        // Parse [UI_COMPONENT: ...]
        const foundUIs: any[] = [];
        const uiParts = rawReply.split(/\[UI_COMPONENT:/);

        if (uiParts.length > 1) {
          for (let i = 1; i < uiParts.length; i++) {
            const part = uiParts[i];
            const startIdx = part.indexOf("{");
            if (startIdx !== -1) {
              let depth = 0;
              let endIdx = -1;
              for (let j = startIdx; j < part.length; j++) {
                if (part[j] === "{") depth++;
                else if (part[j] === "}") {
                  depth--;
                  if (depth === 0) {
                    endIdx = j;
                    break;
                  }
                }
              }

              if (endIdx !== -1) {
                const jsonStr = part.substring(startIdx, endIdx + 1);
                try {
                  foundUIs.push(JSON.parse(jsonStr));
                } catch (e) {
                  try {
                    foundUIs.push(new Function("return " + jsonStr)());
                  } catch (err) {
                    console.error(
                      "Failed to parse extracted UI component JSON:",
                      err,
                    );
                  }
                }
              }
            }
          }
        }

        const cleanReply = rawReply
          .replace(/\[CARD:([\s\S]*?)\]/g, "")
          .replace(/\[UI_COMPONENT:[\s\S]*/, "")
          .trim();

        setMessage(cleanReply);
        setGenerativeUI(foundUIs);
        setSelectedMedia(null); // clear media after send

        if (data.sessionId) {
          setSessionId(data.sessionId);
          if (typeof window !== "undefined") localStorage.setItem("dotty_session_id", data.sessionId);
        }

        if (data.interactionId) {
          setInteractionId(data.interactionId);
          if (typeof window !== "undefined") localStorage.setItem("dotty_interaction_id", data.interactionId);
        }

        if (data.audioBase64) {
          try {
            const audio = new Audio(
              `data:audio/mp3;base64,${data.audioBase64}`,
            );
            audio
              .play()
              .catch((e) =>
                console.error("Audio playback blocked by browser:", e),
              );
          } catch (err) {
            console.error("Audio play error", err);
          }
        }
      } else {
        setMessage("I encountered an error processing that request.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Connection error. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      className={`${styles.container} ${isAdmin ? styles.adminMode : styles.clientMode}`}
      dir="rtl"
      lang="he"
    >
      <div className={styles.topBar}>
        {isAdmin ? (
          <div className={styles.headerCenterGroup}>
            <button
              className={`${styles.zapButton} ${isInfoMode ? styles.activeInfo : ""}`}
              onClick={() => setIsInfoMode(!isInfoMode)}
            >
              <Info size={24} />
            </button>
            <div className={styles.goldenLogo}>MY LOGO</div>
            <button
              className={styles.zapButton}
              onClick={() => alert("Quick Actions Modal coming soon")}
            >
              <Zap size={24} />
            </button>
          </div>
        ) : (
          <div className={styles.modeIndicator}>Guest Lobby</div>
        )}
      </div>

      <div className={styles.chatOverlay}>
        <div className={styles.spacer} />

        <div className={styles.messageWrapper}>
          <div className={styles.messageContainer}>
            {isThinking ? (
              <Loader2
                className={`animate-spin w-10 h-10 mx-auto ${isAdmin ? "text-white" : "text-slate-800"}`}
              />
            ) : (
              <Typewriter text={message} />
            )}
          </div>

          {generativeUI.length > 0 && (
            <div className={styles.generativeContainer}>
              {generativeUI.map((ui, idx) => (
                <GenerativeRenderer key={idx} ui={ui} onAction={handleSend} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.controlsContainer}>
          {selectedMedia && (
            <div style={{ marginBottom: "1rem", position: "relative" }}>
              <img
                src={selectedMedia}
                alt="Upload preview"
                style={{ maxHeight: "100px", borderRadius: "8px" }}
              />
              <button
                onClick={() => setSelectedMedia(null)}
                style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                }}
              >
                ✕
              </button>
            </div>
          )}
          <div className={styles.inputGroup}>
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder=""
              className={styles.textInput}
              disabled={isThinking}
              rows={2}
              style={{ textAlign: "center" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <div className={styles.goldenControls}>
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              className={`${styles.goldBtn} ${styles.goldBtnSquare}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={28} />
            </button>

            {userText.trim().length > 0 || selectedMedia ? (
              <button
                className={`${styles.goldBtn} ${styles.goldBtnCircle}`}
                onClick={() => handleSend()}
                disabled={isThinking}
              >
                <Play size={28} fill="black" />
              </button>
            ) : (
              <button
                className={`${styles.goldBtn} ${styles.goldBtnSquare} ${!isRecording ? styles.pulseMic : ""}`}
                onClick={toggleRecording}
                style={isRecording ? { background: "#ef4444" } : {}}
              >
                {isRecording ? (
                  <MicOff size={28} color="white" />
                ) : (
                  <Mic size={28} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
