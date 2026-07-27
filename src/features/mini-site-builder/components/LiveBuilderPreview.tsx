"use client";

import React from "react";
import { 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageCircle, 
  Globe, 
  Share2, 
  CheckCircle2, 
  Layers,
  HeartHandshake
} from "lucide-react";
import { BuilderStateData } from "../actions/builderActions";

interface LiveBuilderPreviewProps {
  state: BuilderStateData;
  isMobile?: boolean;
}

export function LiveBuilderPreview({ state, isMobile }: LiveBuilderPreviewProps) {
  const {
    companyName,
    slogan,
    pitchProblem,
    companyVision,
    personas = [],
    servicePages = [],
    logoUrl,
    primaryColor = "#4f46e5",
    secondaryColor = "#0f172a",
    contactPhone,
    contactEmail,
    contactWhatsApp,
    contactFacebook,
    contactInstagram,
    contactTikTok,
  } = state;

  const hasContactDetails = contactPhone || contactEmail || contactWhatsApp || contactFacebook || contactInstagram || contactTikTok;

  return (
    <div 
      className="w-full h-full bg-[#0a0f1d] text-white overflow-y-auto custom-scrollbar flex flex-col font-sans transition-all duration-300 rounded-3xl border border-white/10 shadow-2xl relative"
      dir="rtl"
    >
      {/* 1. Header Section */}
      <header className="w-full bg-[#111827]/90 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-30 flex items-center justify-between shadow-md">
        {/* Right side: Logo or Temporary Icon */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-lg" />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-inner"
              style={{ backgroundColor: primaryColor }}
            >
              {companyName ? companyName.slice(0, 2).toUpperCase() : <Building2 className="w-5 h-5" />}
            </div>
          )}
        </div>

        {/* Center side: Company Name & Slogan */}
        <div className="flex flex-col items-center text-center mx-auto px-2">
          <h1 className="text-base sm:text-lg font-black text-white leading-tight">
            {companyName || "שם החברה שלך"}
          </h1>
          {slogan && (
            <p className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]">
              {slogan}
            </p>
          )}
        </div>

        {/* Left side: Floating "אנחנו כאן" Contact Button */}
        <div className="relative group">
          <button 
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>אנחנו כאן</span>
          </button>

          {/* Dynamic Icons Dropdown */}
          {hasContactDetails && (
            <div className="absolute left-0 mt-2 bg-[#1f293d] border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-40 animate-in fade-in">
              {contactWhatsApp && (
                <a href={`https://wa.me/${contactWhatsApp}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition">
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {contactFacebook && (
                <a href={contactFacebook} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {contactInstagram && (
                <a href={contactInstagram} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition">
                  <Share2 className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="p-6 sm:p-10 flex flex-col items-center text-center space-y-4 bg-gradient-to-b from-[#111827] to-[#0a0f1d] border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ברוכים הבאים לפורטל החדש</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
          {companyName ? `ברוכים הבאים ל-${companyName}` : "פתרון מנצח שמקדם אותך קדימה"}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
          {pitchProblem || "כאן יופיע תיאור הבעיה והפתרון הייחודי שהעסק שלך מציע בעולם."}
        </p>

        <div className="flex gap-3 pt-2">
          <button 
            className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xl transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            צור קשר עכשיו
          </button>
        </div>
      </section>

      {/* 3. Vision & About Section */}
      {companyVision && (
        <section className="p-6 sm:p-8 bg-[#111827]/50 border-b border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            <span>החזון שלנו</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5">
            {companyVision}
          </p>
        </section>
      )}

      {/* 4. Customer Personas & Pain Points Section */}
      {personas.length > 0 && (
        <section className="p-6 sm:p-8 border-b border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>הפתרון שלנו לנקודות הכאב שלך</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personas.map((persona) => (
              <div key={persona.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-right">
                <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>{persona.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pr-8">
                  {persona.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Services Pages Section */}
      {servicePages.length > 0 && (
        <section className="p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>השירותים והמוצרים שלנו</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {servicePages.map((service) => (
              <div key={service.id} className="rounded-2xl bg-[#111827] border border-white/10 overflow-hidden shadow-lg flex flex-col">
                {service.imageUrl && (
                  <img src={service.imageUrl} alt={service.title} className="h-32 w-full object-cover" />
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{service.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{service.description}</p>
                  </div>
                  <button 
                    className="w-full mt-3 py-1.5 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    למידע נוסף
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
