import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    redirect("/dashboard");
  }
}
