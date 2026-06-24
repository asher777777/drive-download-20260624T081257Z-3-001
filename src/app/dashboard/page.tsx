import { getAllServices } from "@/features/services/actions";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText, ExternalLink, Edit, Users, Globe, Coins, ShieldCheck } from "lucide-react";
import { StatBadge } from "@/components/ui/StatBadge";

import { BrandingTab } from "@/components/dashboard/BrandingTab";
import { WhatToGenerateTab } from "@/components/dashboard/WhatToGenerateTab";
import { ServicesTab } from "@/components/dashboard/ServicesTab";
import { adminDb, getUserDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";



async function getUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }
  throw new Error("Unauthorized");
}

export default async function DashboardPage() {
  const services = await getAllServices();
  const ownerId = await getUserId();

  // Query CRM stats for current owner
  const [contactCount, totalSpentResult] = await Promise.all([
    adminDb.collection("contacts")
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active")
      .get()
      .then((s: any) => s.size)
      .catch(() => 0),
    adminDb.collection("contacts")
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active")
      .get()
      .then((snap: any) => {
        let sum = 0;
        snap.docs.forEach((doc: any) => {
          sum += doc.data().total_spent || 0;
        });
        return sum;
      })
      .catch(() => 0)
  ]);

  const session = await auth();
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "משתמש";
  const hour = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })).getHours();
  let greeting = "שלום";
  if (hour >= 5 && hour < 12) greeting = "בוקר טוב";
  else if (hour >= 12 && hour < 17) greeting = "צהריים טובים";
  else if (hour >= 17 && hour < 21) greeting = "ערב טוב";
  else greeting = "לילה טוב";

  const classicDashboard = (
    <div className="space-y-6 text-right pb-8" dir="rtl">
      
      {/* Stats Badges Row */}
      <div className="-mt-4 md:-mt-8 flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 w-full pt-4 px-2 md:px-0">
        <StatBadge 
          icon={<Users className="w-4 h-4 text-indigo-400" />} 
          value={contactCount} 
          label="חברי קהילה ב-CRM" 
          description="מספר אנשי הקשר וחברי הקהילה הרשומים במערכת ה-CRM"
          badgeColorClass="bg-indigo-500/10 border-indigo-500/20"
        />
        <StatBadge 
          icon={<Globe className="w-4 h-4 text-purple-400" />} 
          value={services.length} 
          label="עמודי שירות ודפים" 
          description="עמודי שירות ודפי נחיתה פעילים באתר שנוצרו על ידי ה-AI"
          badgeColorClass="bg-purple-500/10 border-purple-500/20"
        />
        <StatBadge 
          icon={<Coins className="w-4 h-4 text-emerald-400" />} 
          value={`₪${totalSpentResult.toLocaleString("he-IL")}`} 
          label="סה״כ תרומות/עסקאות" 
          description="סך התרומות והתשלומים שהתקבלו החודש מחברי הקהילה ב-CRM"
          badgeColorClass="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatBadge 
          icon={<ShieldCheck className="w-4 h-4 text-blue-400" />} 
          value="תקין" 
          label="תקינות המערכת" 
          description="מצב חיבורי השרת, ה-Database וה-API של Gemini"
          badgeColorClass="bg-blue-500/10 border-blue-500/20"
        />
      </div>

      {/* Greeting */}
      <div className="px-4 md:px-2 mt-8 mb-2">
        <div className="text-base md:text-lg font-medium text-white drop-shadow-sm">{greeting}, {userName} ✨</div>
      </div>

      {/* Branding Tab */}
      <BrandingTab />

      {/* What To Generate Tab */}
      <WhatToGenerateTab />

      {/* Services Tab */}
      <ServicesTab />

      {/* Interactive Quick Actions Bar */}
      {/* Removed DashboardQuickActions from here as it is rendered globally in DashboardShell.tsx */}


    </div>
  );

  return (
    <div className="w-full relative min-h-full pt-0 md:pt-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {classicDashboard}
      </div>
    </div>
  );
}
