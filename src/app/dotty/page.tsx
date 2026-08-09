import { auth } from "@/lib/auth";
import DottyChatClient from "./DottyChatClient";

export default async function DottyPage() {
  const session = await auth();

  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const userRole = isSuperAdmin ? "MASTER_ADMIN" : "END_USER";
  const userId = session?.user?.id || null;

  return <DottyChatClient userRole={userRole} userId={userId} />;
}
