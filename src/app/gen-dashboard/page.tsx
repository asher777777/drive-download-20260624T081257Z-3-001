import Link from "next/link";
import { 
  User, 
  Plus,
  TrendingUp,
  Megaphone,
  Mic,
  MessageCircle,
  Wrench,
  Cog,
  Calculator,
  PieChart,
  Menu
} from "lucide-react";

export const metadata = {
  title: "המחולל | ראשי",
  description: "ממשק פסיפס מעוינים מתקדם",
};

export default function GenDashboardPage() {
  return (
    <div 
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50"
      dir="rtl"
    >
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
            {/* Top (1,1) -> Hamburger Menu */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center relative">
              <button 
                className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 transition-transform group border border-amber-500/30 z-30"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Menu className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
            
            {/* Top-Right (originally UP) -> Marketing / Growth Hacker */}
            <Link 
              href="/dashboard/campaigns"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Composite Icon: Marketing Persona */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
                  <Megaphone className="absolute top-0 right-0 w-5 h-5 md:w-7 md:h-7 text-amber-500/80 stroke-[1.5]" />
                  <TrendingUp className="absolute top-4 left-0 w-5 h-5 md:w-6 md:h-6 text-amber-200/80 stroke-[1.5]" />
                </div>
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">שיווק</span>
              </div>
            </Link>

            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 invisible" /> {/* (1,3) */}


            {/* Row 2 */}
            {/* Top-Left -> Projects & Automations */}
            <Link 
              href="/dashboard/generator"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Composite Icon: Builder Persona */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
                  <Cog className="absolute top-0 right-0 w-5 h-5 md:w-7 md:h-7 text-amber-500/80 stroke-[1.5]" />
                  <Wrench className="absolute top-4 left-0 w-5 h-5 md:w-6 md:h-6 text-amber-200/80 stroke-[1.5]" />
                </div>
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">פרויקטים</span>
              </div>
            </Link>

            {/* Center (2,2) -> Cosmic Generator Logo */}
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.5)] flex items-center justify-center overflow-hidden relative z-20"
            >
              {/* Complex Cosmic Swirl CSS Animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-600 to-black opacity-90" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent,rgba(245,158,11,0.2),transparent,rgba(252,211,77,0.5),transparent)] animate-spin-slow blur-sm mix-blend-screen" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[conic-gradient(from_180deg,transparent,rgba(245,158,11,0.6),transparent,rgba(254,240,138,0.8),transparent)] animate-[spin_4s_linear_infinite_reverse] blur-md mix-blend-screen" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,211,77,0.8)_0%,transparent_50%)] mix-blend-overlay" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-screen" />
              
              <div 
                className="relative z-10 flex flex-col items-center justify-center"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Optionally replace with an actual img tag if user provides the swirl image */}
                {/* <img src="/cosmic-swirl.png" alt="Cosmic Generator" className="absolute w-40 h-40 opacity-80" /> */}
                <span className="text-white font-black text-2xl md:text-4xl tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">המחולל</span>
              </div>
            </div>

            {/* Bottom-Right -> Communities & Contacts */}
            <Link 
              href="/dashboard/crm"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Composite Icon: Community Persona */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
                  <Mic className="absolute top-1 right-2 w-5 h-5 md:w-6 md:h-6 text-amber-500/80 stroke-[1.5]" />
                  <MessageCircle className="absolute top-3 left-0 w-5 h-5 md:w-7 md:h-7 text-amber-200/80 stroke-[1.5]" />
                </div>
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">קהילות</span>
              </div>
            </Link>


            {/* Row 3 */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 invisible" /> {/* (3,1) */}

            {/* Bottom-Left -> Accounting */}
            <Link 
              href="/dashboard/receipts"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-[#0a0a0a] border border-amber-500/60 hover:bg-[#111] transition-colors shadow-2xl flex items-center justify-center group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-amber-500/10 to-transparent transition-opacity duration-500" />
              
              <div 
                className="flex flex-col items-center justify-center text-center p-4 relative z-10"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Composite Icon: Accountant Persona */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 md:w-14 md:h-14 text-amber-400 stroke-[1.5]" />
                  <Calculator className="absolute top-2 right-1 w-5 h-5 md:w-6 md:h-6 text-amber-500/80 stroke-[1.5]" />
                  <PieChart className="absolute top-0 left-1 w-5 h-5 md:w-6 md:h-6 text-amber-200/80 stroke-[1.5]" />
                </div>
                <span className="text-amber-500 font-bold tracking-wide text-sm md:text-lg">הנהלת חשבונות</span>
              </div>
            </Link>

            {/* Bottom (3,3) -> Floating Action Button (Plus) */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center relative">
              <button 
                className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-105 transition-transform hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] group border border-amber-500/30 z-30"
                style={{ transform: "rotate(-45deg)" }}
              >
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
