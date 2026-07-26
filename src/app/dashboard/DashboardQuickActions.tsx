"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wand2, Settings, MessageSquarePlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ContactModal } from "./crm/ContactModal";
import { CreatePageWizard } from "./components/CreatePageWizard";

export function DashboardQuickActions() {
  const router = useRouter();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuickActions = () => setIsQuickActionsOpen(true);
    window.addEventListener("open-quick-actions", handleOpenQuickActions);
    return () => window.removeEventListener("open-quick-actions", handleOpenQuickActions);
  }, []);

  return (
    <>
      <Modal isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)}>
        <Modal.Content className="max-w-md w-full rounded-[2rem] p-6 md:p-8">
          <div dir="rtl" className="w-full relative">
            <Modal.Close className="left-4 right-auto" />
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-6 text-center mt-2">פעולות מהירות</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 1. Add Contact */}
              <button onClick={() => { setIsQuickActionsOpen(false); setIsContactOpen(true); }} className="flex flex-col items-center justify-center gap-3 p-4 md:p-6 bg-white border border-slate-100 hover:border-indigo-500 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">הוסף איש קשר</h3>
              </button>

              {/* 2. Create AI Page */}
              <button onClick={() => { setIsQuickActionsOpen(false); setIsServiceOpen(true); }} className="flex flex-col items-center justify-center gap-3 p-4 md:p-6 bg-white border border-slate-100 hover:border-purple-500 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 flex items-center justify-center bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">צור דף ב-AI</h3>
              </button>

              {/* 3. System Settings */}
              <button onClick={() => { setIsQuickActionsOpen(false); router.push("/dashboard/settings"); }} className="flex flex-col items-center justify-center gap-3 p-4 md:p-6 bg-white border border-slate-100 hover:border-slate-500 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">הגדרות מערכת</h3>
              </button>

              {/* 4. Quick AI Post */}
              <button onClick={() => { setIsQuickActionsOpen(false); router.push("/dashboard/services"); }} className="flex flex-col items-center justify-center gap-3 p-4 md:p-6 bg-white border border-slate-100 hover:border-amber-500 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <MessageSquarePlus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">פוסט מהיר ב-AI</h3>
              </button>
            </div>
          </div>
        </Modal.Content>
      </Modal>

      {/* CRM Contact Creation Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        contact={null}
        onSuccess={() => {
          setIsContactOpen(false);
          alert("איש הקשר התווסף בהצלחה!");
          router.refresh();
        }}
        communities={[]}
      />

      {/* Dynamic AI Page Creator Modal */}
      <CreatePageWizard 
        isOpen={isServiceOpen} 
        onClose={() => setIsServiceOpen(false)} 
      />
    </>
  );
}
