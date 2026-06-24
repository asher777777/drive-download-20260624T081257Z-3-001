"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, LayoutGrid, Edit3, ArrowRight } from "lucide-react";
import { ServiceListClient } from "./ServiceListClient";
import { ServiceForm } from "./ServiceForm";
import { Button } from "@/components/ui/Button";

interface ServicesDashboardClientProps {
  initialServices: any[];
}

export function ServicesDashboardClient({ initialServices }: ServicesDashboardClientProps) {
  const [showList, setShowList] = useState(false);

  const openCreateModal = () => {
    // ServiceForm listens for this global event to open
    const event = new CustomEvent("open-ai-modal", { detail: "create-service" });
    window.dispatchEvent(event);
  };

  if (showList) {
    return (
      <div className="space-y-6 w-full max-w-5xl mx-auto px-4 py-6 h-full overflow-y-auto pb-32" dir="rtl">
        {/* We keep ServiceForm hidden here just so it's mounted and can listen to events */}
        <div className="hidden"><ServiceForm /></div>
        
        <ServiceListClient initialServices={initialServices} />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-start pt-12 md:pt-24 min-h-full w-full relative px-4"
      style={{ height: 'calc(100vh - 12rem)' }} // Account for top and bottom navs
      dir="rtl"
    >
      {/* ServiceForm needs to be mounted to open its modal */}
      <div className="hidden"><ServiceForm /></div>

      {/* Dotted Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 2px, transparent 2px)",
          backgroundSize: "32px 32px"
        }}
      />

      <div className="relative z-10 w-full max-w-[320px] mx-auto flex flex-col gap-8 items-center">
        
        <button
          onClick={openCreateModal}
          className="w-full relative group overflow-hidden rounded-[3rem] bg-gradient-to-b from-indigo-500 to-indigo-700 p-[3px] shadow-[0_15px_35px_-10px_rgba(99,102,241,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
        >
          <div className="w-full h-full bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-[3rem] px-6 py-6 flex items-center justify-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
            <Sparkles className="w-7 h-7 text-white drop-shadow-md relative z-10" />
            <span className="text-xl font-black text-white drop-shadow-md tracking-tight relative z-10">
              יצירת תוכן חדש
            </span>
          </div>
        </button>

        <button
          onClick={() => setShowList(true)}
          className="w-full relative group overflow-hidden rounded-[3rem] bg-gradient-to-b from-blue-500 to-blue-700 p-[3px] shadow-[0_15px_35px_-10px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
        >
          <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-[3rem] px-6 py-6 flex items-center justify-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
            <LayoutGrid className="w-7 h-7 text-white drop-shadow-md relative z-10" />
            <span className="text-xl font-black text-white drop-shadow-md tracking-tight relative z-10">
              התוכן שלי
            </span>
          </div>
        </button>

        <Link
          href="/dashboard/mosaic"
          className="w-full relative group overflow-hidden rounded-[3rem] bg-gradient-to-b from-purple-500 to-purple-700 p-[3px] shadow-[0_15px_35px_-10px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] text-center block"
        >
          <div className="w-full h-full bg-gradient-to-b from-purple-400 to-purple-600 rounded-[3rem] px-6 py-6 flex items-center justify-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
            <Edit3 className="w-7 h-7 text-white drop-shadow-md relative z-10" />
            <span className="text-xl font-black text-white drop-shadow-md tracking-tight relative z-10">
              עריכת האתר
            </span>
          </div>
        </Link>

      </div>
    </div>
  );
}
