"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { CompanyServicesSection } from "./CompanyServicesSection";
import { getGlobalSettings } from "@/features/settings/actions";

const scrollToCenter = (e: React.MouseEvent<HTMLElement>) => {
  const target = e.currentTarget;
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

export function ServicesTab() {
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [companyVision, setCompanyVision] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getGlobalSettings();
      setCompanyVision(data.companyVision || "");
    }
    load();
  }, []);

  return (
    <div className="w-full space-y-0">
      {/* Outer Tab Header */}
      <div className="w-full bg-[#181818] border-y border-white/5" dir="rtl">
        <button
          onClick={(e) => {
            const next = !isMainOpen;
            setIsMainOpen(next);
            if (next) scrollToCenter(e);
          }}
          className="w-full p-4 sm:p-5 bg-[#181818] hover:bg-[#202020] flex items-center justify-between font-bold text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-sm sm:text-base">השירותים שלנו</span>
          </div>
          {isMainOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>

        {/* Outer Tab Content */}
        {isMainOpen && (
          <div className="w-full bg-[#111] border-t border-white/5 animate-in fade-in duration-200">
            <CompanyServicesSection companyVision={companyVision} />
          </div>
        )}
      </div>
    </div>
  );
}
