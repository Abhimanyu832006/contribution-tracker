import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-ui",
});

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Contribution Tracker",
  description:
    "Log, verify, and visualize team project contributions in one place.",
  openGraph: {
    title: "Contribution Tracker",
    description:
      "Log, verify, and visualize team project contributions in one place.",
    siteName: "Contribution Tracker",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contribution Tracker",
    description:
      "Log, verify, and visualize team project contributions in one place.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
