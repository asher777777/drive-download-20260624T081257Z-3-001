import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import DottyChatClient from "@/app/dotty/DottyChatClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const docSnap = await adminDb.collection("digital_offices").doc(slug).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        title: `${data?.companyName || "Digital Office"} | Dotty`,
      };
    }
  } catch (e) {}
  return { title: "Digital Office | Dotty" };
}

export default async function OfficePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id || null;

  let officeData = null;
  try {
    const officeDoc = await adminDb
      .collection("digital_offices")
      .doc(slug)
      .get();
    if (!officeDoc.exists) {
      return notFound();
    }
    officeData = officeDoc.data();
  } catch (error) {
    console.error("Failed to load office", error);
    return notFound();
  }

  // Determine role based on ownership
  const isOwner = userId && officeData?.ownerId === userId;
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const userRole = isSuperAdmin
    ? "MASTER_ADMIN"
    : isOwner
      ? "MANAGER"
      : "END_USER";

  return (
    <DottyChatClient userRole={userRole} userId={userId} officeSlug={slug} />
  );
}
