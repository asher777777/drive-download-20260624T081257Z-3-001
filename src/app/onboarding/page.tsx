import { getAllServices } from "@/features/services/actions";
import { auth } from "@/lib/auth";
import { getGlobalSettings } from "@/features/settings/actions";
import { OnboardingClient } from "./OnboardingClient";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }
  throw new Error("Unauthorized");
}

export default async function OnboardingPage() {
  const services = await getAllServices();
  const ownerId = await getUserId();
  const session = await auth();
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "משתמש";

  const globalSettings = await getGlobalSettings(ownerId);

  return (
    <div className="w-full relative min-h-full pt-0 md:pt-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <OnboardingClient
          initialSettings={globalSettings}
          initialServices={services}
          userName={userName}
        />
      </div>
    </div>
  );
}
