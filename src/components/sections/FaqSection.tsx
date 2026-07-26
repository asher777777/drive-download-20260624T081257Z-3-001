"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaqItem } from "@/features/home/actions";
import { GlobalSettings } from "@/features/settings/actions";

interface FaqSectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  items?: FaqItem[];
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  globalSettings?: GlobalSettings;
  isEditing?: boolean;
}

export function FaqSection({
  id = "faq",
  title = "שאלות ותשובות נפוצות",
  subtitle = "תשובות לכל השאלות שרציתם לשאול על השירותים והפלטפורמה שלנו",
  items = [],
  backgroundColor,
  titleColor,
  subtitleColor,
  globalSettings,
  isEditing = false
}: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggleItem = (itemId: string) => {
    setOpenId(prev => (prev === itemId ? null : itemId));
  };

  // Derive theme colors with fallback to globalSettings & Golden Flute defaults
  const primaryColor = globalSettings?.primaryColor || "#f59e0b"; // amber-500 default
  const resolvedBg = backgroundColor || globalSettings?.backgroundColor || "transparent";
  const resolvedTitleColor = titleColor || globalSettings?.textColorH2 || globalSettings?.textColor || "#ffffff";
  const resolvedSubtitleColor = subtitleColor || globalSettings?.textColor || "#94a3b8";

  return (
    <section 
      id={id} 
      className="py-20 relative z-20 overflow-hidden" 
      style={{ backgroundColor: resolvedBg }}
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold mb-2"
            style={{ color: primaryColor, borderColor: `${primaryColor}33`, backgroundColor: `${primaryColor}15` }}
          >
            <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
            <span>שאלות ותשובות</span>
          </div>

          <h2 
            className="text-2xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: resolvedTitleColor }}
          >
            {title}
          </h2>

          {subtitle && (
            <p 
              className="text-sm sm:text-base max-w-2xl mx-auto opacity-80"
              style={{ color: resolvedSubtitleColor }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Accordion List */}
        {(!items || items.length === 0) ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 text-slate-400 text-sm">
            אין שאלות להצגה באזור זה כעת.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const isOpen = openId === item.id;
              if (item.isVisible === false) return null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl transition-all duration-300 border overflow-hidden text-start",
                    isOpen
                      ? "bg-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-500/5"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  )}
                  style={isOpen ? { borderColor: `${primaryColor}66` } : undefined}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-start focus:outline-none group"
                  >
                    <span 
                      className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors"
                      style={isOpen ? { color: primaryColor } : undefined}
                    >
                      {item.question}
                    </span>
                    <span 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/80 text-slate-300 transition-transform duration-300 shrink-0",
                        isOpen && "rotate-180"
                      )}
                      style={isOpen ? { backgroundColor: `${primaryColor}22`, color: primaryColor } : undefined}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4 opacity-90">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
