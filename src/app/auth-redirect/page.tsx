import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllServices } from "@/features/services/actions";

export const dynamic = "force-dynamic";

export default async function AuthRedirect() {
  const session = await auth();
  
  if (!session) {
    redirect("/");
  }

  const role = (session.user as any)?.role;
  
  if (role === "SUPERADMIN") {
    redirect("/admin");
  } else {
    // Check if the user has any services setup.
    // If they have no services, they haven't completed onboarding.
    const services = await getAllServices();
    if (services && services.length > 0) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }
}
