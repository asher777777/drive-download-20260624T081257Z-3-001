"use client";

import { useState } from "react";
import { Plus, List, ArrowRight, Banknote, CreditCard, Activity } from "lucide-react";
import { RhombusMenu } from "@/components/layout/RhombusMenu";
import { AddIncomeModal } from "@/components/incomes/AddIncomeModal";
import { IncomesHistoryModal } from "@/components/incomes/IncomesHistoryModal";
import { Income } from "@/features/incomes/types";

interface IncomesDashboardClientProps {
  incomes: Income[];
}

export function IncomesDashboardClient({ incomes }: IncomesDashboardClientProps) {
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const addIncomeIcon = (
    <div className="relative w-16 h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform duration-300">
      <Banknote className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
      <Plus className="absolute top-2 right-2 w-5 h-5 md:w-7 md:h-7 text-green-500/80 stroke-[2]" />
    </div>
  );

  const historyIcon = (
    <div className="relative w-16 h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform duration-300">
      <List className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
      <Activity className="absolute top-2 left-2 w-5 h-5 md:w-6 md:h-6 text-amber-500/80 stroke-[1.5]" />
    </div>
  );

  const paymentIcon = (
    <div className="relative w-16 h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform duration-300 opacity-50 cursor-not-allowed">
      <CreditCard className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
    </div>
  );

  const backIcon = (
    <div className="relative w-16 h-16 md:w-20 md:h-20 group-hover:scale-110 transition-transform duration-300">
      <ArrowRight className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
    </div>
  );

  const centerContent = (
    <>
      <span className="text-white font-black text-xl md:text-2xl tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] text-center">ניהול<br/>הכנסות</span>
    </>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <RhombusMenu
        topRight={{
          label: "הוסף הכנסה",
          icon: addIncomeIcon,
          onClick: () => setIsAddIncomeOpen(true)
        }}
        topLeft={{
          label: "עמוד תשלום (בקרוב)",
          icon: paymentIcon,
          href: "#"
        }}
        bottomRight={{
          label: "היסטוריית הכנסות",
          icon: historyIcon,
          onClick: () => setIsHistoryOpen(true)
        }}
        bottomLeft={{
          label: "ראשי",
          icon: backIcon,
          href: "/gen-dashboard",
        }}
        center={{
          content: centerContent
        }}
      />

      {isAddIncomeOpen && (
        <AddIncomeModal 
          onClose={() => setIsAddIncomeOpen(false)}
        />
      )}

      <IncomesHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        incomes={incomes}
      />
    </div>
  );
}
