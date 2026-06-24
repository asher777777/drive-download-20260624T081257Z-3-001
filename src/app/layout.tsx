import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { getGlobalSettings } from "@/features/settings/actions";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings("1");
  const faviconUrl = settings?.siteLogoUrl || "/favicon.ico";
  
  return {
    title: "מחולל הקהילות",
    description: "המערכת לבניית קהילות, שיווק תוכן, עמודי נחיתה ו-CRM",
    icons: {
      icon: [
        { url: faviconUrl },
        { url: faviconUrl, sizes: "16x16", type: "image/png" },
        { url: faviconUrl, sizes: "32x32", type: "image/png" },
      ],
      shortcut: faviconUrl,
      apple: faviconUrl,
    }
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getGlobalSettings("1");
  const faviconUrl = settings?.siteLogoUrl || "/favicon.ico";

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={faviconUrl} key="dynamic-favicon" />
        <link rel="shortcut icon" href={faviconUrl} key="dynamic-shortcut-favicon" />
        <link rel="apple-touch-icon" href={faviconUrl} key="dynamic-apple-favicon" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
