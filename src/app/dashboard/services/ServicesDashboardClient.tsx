"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, LayoutGrid, Edit3, Home, User, Megaphone, TrendingUp, Menu, Plus } from "lucide-react";
import { ServiceListClient } from "./ServiceListClient";
import { ServiceForm } from "./ServiceForm";

interface ServicesDashboardClientProps {
  initialServices: any[];
}

export function ServicesDashboardClient({ initialServices }: ServicesDashboardClientProps) {
  const [showList, setShowList] = useState(false);

  const openCreateModal = () => {
    const event = new CustomEvent("open-ai-modal", { detail: "create-service" });
    window.dispatchEvent(event);
  };

  if (showList) {
    return (
      <div className="space-y-6 w-full max-w-5xl mx-auto px-4 py-6 h-full overflow-y-auto pb-32" dir="rtl">
        <div className="hidden"><ServiceForm /></div>
        <ServiceListClient initialServices={initialServices} />
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50"
      dir="rtl"
    >
      <div className="hidden"><ServiceForm /></div>

      {/* Background gradients removed to ensure clean layout without scroll */ }

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-5xl px-4 py-12">
        
        {/* Rhombus Mosaic Grid Wrapper */}
        <div className="relative mb-20 mt-10">
          <div 
            className="grid grid-cols-3 grid-rows-3 gap-2 md:gap-3 mx-auto"
            style={{ 
              transform: "rotate(45deg)",
              width: "fit-content",
            }}
          >
            {/* Row 1 */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 invisible" /> {/* (1,1) */}
            
            {/* Top-Right (originally UP) -> Create Content */}
            <button 
              onClick={openCreateModal}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-amber-500 mb-3 group-hover:scale-110 transition-transform duration-300 stroke-[1.5]" />
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">יצירת תוכן חדש</span>
              </div>
            </button>

            {/* Right (1,3) -> Hamburger Menu */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center relative">
              <button 
                className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 transition-transform group border border-amber-500/30 z-30"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Menu className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>

            {/* Row 2 */}
            {/* Top-Left (originally LEFT) -> Edit Site */}
            <Link 
              href="/dashboard/mosaic"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Edit3 className="w-8 h-8 md:w-12 md:h-12 text-amber-500 mb-3 group-hover:scale-110 transition-transform duration-300 stroke-[1.5]" />
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">עריכת האתר</span>
              </div>
            </Link>

            {/* Center (2,2) -> Marketing Persona Center */}
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.5)] flex items-center justify-center overflow-hidden relative z-20"
            >
              {/* Complex Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-600 to-black opacity-90" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent,rgba(245,158,11,0.2),transparent,rgba(252,211,77,0.5),transparent)] animate-spin-slow blur-sm mix-blend-screen" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,211,77,0.8)_0%,transparent_50%)] mix-blend-overlay" />
              
              <div 
                className="relative z-10 flex flex-col items-center justify-center"
                style={{ transform: "rotate(-45deg)" }}
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-2">
                  <User className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-white stroke-[1.5] drop-shadow-md" />
                  <Megaphone className="absolute top-0 right-0 w-5 h-5 md:w-7 md:h-7 text-amber-100 stroke-[1.5]" />
                  <TrendingUp className="absolute top-4 left-0 w-5 h-5 md:w-6 md:h-6 text-amber-200 stroke-[1.5]" />
                </div>
                <span className="text-white font-black text-xl md:text-2xl tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">שיווק</span>
              </div>
            </div>

            {/* Bottom-Right (originally RIGHT) -> My Content */}
            <button 
              onClick={() => setShowList(true)}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                <LayoutGrid className="w-8 h-8 md:w-12 md:h-12 text-amber-500 mb-3 group-hover:scale-110 transition-transform duration-300 stroke-[1.5]" />
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">התוכן שלי</span>
              </div>
            </button>


            {/* Row 3 */}
            {/* Left (3,1) -> Floating Action Button (Plus) */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center relative">
              <button 
                className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-105 transition-transform hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] group border border-amber-500/30 z-30"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Bottom-Left (originally DOWN) -> Back to Home */}
            <Link 
              href="/gen-dashboard"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Home className="w-8 h-8 md:w-12 md:h-12 text-amber-500 mb-3 group-hover:scale-110 transition-transform duration-300 stroke-[1.5]" />
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">חזרה לראשי</span>
              </div>
            </Link>

            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 invisible" /> {/* (3,3) */}
          </div>
        </div>

      </div>
    </div>
  );
}
