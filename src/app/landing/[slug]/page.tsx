import { redirect } from "next/navigation";

export default async function LandingFallbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
