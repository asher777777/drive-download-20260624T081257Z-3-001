"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, Users, Sparkles, CreditCard, Globe, Zap, Mail, LayoutDashboard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { stopImpersonating } from "@/features/users/impersonate";

interface DashboardShellProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  geminiActive: boolean;
  kesherActive: boolean;
  dbActive: boolean;
  userLogoUrl?: string | null;
  miniSiteSlug?: string | null;
  isImpersonating?: boolean;
}

export function DashboardShell({
  children,
  modal,
  userLogoUrl,
  miniSiteSlug,
  isImpersonating,
}: DashboardShellProps) {
  const pathname = usePathname();

  // Top Bar Links (Swapped as per user request)
  const topNavLinks = [
    { href: "/dashboard/crm", label: "ניהול קהילה", icon: Users },
    { href: "/dashboard/receipts", label: "הפקת מסמך", icon: FileText },
    { href: "/dashboard/services", label: "יצירת תוכן", icon: Sparkles },
    { href: miniSiteSlug ? `/${miniSiteSlug}` : "/", label: "מעבר לאתר", icon: Globe, target: miniSiteSlug ? "_blank" : undefined },
  ];

  // Bottom Bar Links
  const bottomNavLinks = [
    { href: "/dashboard", label: "ראשי", icon: LayoutDashboard },
    { href: "/dashboard/automations", label: "אוטומציה", icon: Zap },
    { href: "/dashboard/campaigns", label: "קמפיינים", icon: Mail },
    { href: "/dashboard/settings", label: "הגדרות", icon: Settings },
  ];

  const isWidePage = pathname?.includes("/dashboard/generator");

  if (isWidePage) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-950 text-white overflow-hidden w-full" dir="rtl">
        <div className="flex-grow flex flex-col w-full h-full relative overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 md:items-center md:justify-center overflow-hidden" dir="rtl">
      
      {/* Phone Frame Wrapper */}
      <div className="w-full max-w-[430px] h-[100dvh] md:h-auto md:max-h-[90vh] md:aspect-[9/19] flex flex-col relative overflow-hidden bg-[#0f172a] shadow-2xl mx-auto md:rounded-[3rem] md:border-[8px] md:border-slate-800">
        
        {isImpersonating && (
          <div className="bg-amber-500 text-black text-center text-xs py-1.5 font-bold flex justify-center items-center gap-2">
            אתה מחובר כרגע כמשתמש
            <button
              onClick={async () => {
                await stopImpersonating();
                window.location.href = "/admin/users";
              }}
              className="px-2 py-0.5 bg-black/10 hover:bg-black/20 rounded-md transition-colors text-black flex items-center gap-1 cursor-pointer"
            >
              <LayoutDashboard className="w-3 h-3" />
              חזור לאדמין
            </button>
          </div>
        )}

        {/* Top Navigation Bar */}
        <header className="h-[100px] shrink-0 bg-[#0f172a] text-white flex items-center justify-between px-4 z-50 relative">
          {userLogoUrl && (
            <div className="flex items-center gap-2">
              <img src={userLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            </div>
          )}
          
          <div className="flex flex-row items-center gap-2 flex-1 justify-center">
            
            {/* Top Nav */}
            <nav className="flex items-center justify-center gap-2">
              {topNavLinks.map((link) => {
                const isActive = pathname.startsWith(link.href) && link.href !== "/dashboard";
                const isSettings = link.href === "/dashboard/settings" && pathname.startsWith("/dashboard/settings");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={(link as any).target}
                    className={cn(
                      "group flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-2xl min-w-[70px] border transition-all duration-300 ease-out hover:-translate-y-1",
                      isActive || isSettings
                        ? "border-white/30 bg-white/10 text-white shadow-[0_4px_15px_rgba(255,255,255,0.1)]" 
                        : "border-white/10 bg-transparent text-white/80 hover:bg-white/5 hover:border-white/30 hover:text-white"
                    )}
                  >
                    <link.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", (isActive || isSettings) && "drop-shadow-md text-indigo-300")} />
                    <span className="text-[10px] font-bold">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content Area (The Canvas) */}
        <main className={cn(
          "flex-1 min-h-0 relative w-full flex flex-col rounded-t-[2.5rem] shadow-2xl overflow-hidden border-t border-slate-700/50",
          "bg-[#0f172a] text-white"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar pb-24 p-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Modal Injection */}
        {modal}

        {pathname !== "/dashboard/crm" && <DashboardQuickActions />}

        {/* Bottom Navigation Bar */}
        <footer className="h-[90px] shrink-0 bg-[#0f172a] flex items-center justify-center z-50 px-2 pb-2">
          <div className="w-full flex items-center justify-around gap-2">
            {bottomNavLinks.map((link) => {
              const isActive = pathname.startsWith(link.href) && link.href !== "/";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl min-w-[70px] border transition-all duration-300 ease-out hover:-translate-y-1",
                    isActive
                      ? "border-white/30 bg-white/10 text-white shadow-[0_4px_15px_rgba(255,255,255,0.1)]"
                      : "border-white/10 bg-transparent text-white/80 hover:bg-white/5 hover:border-white/30 hover:text-white"
                  )}
                >
                  <link.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "drop-shadow-sm text-indigo-300")} />
                  <span className="text-[10px] font-bold">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}
