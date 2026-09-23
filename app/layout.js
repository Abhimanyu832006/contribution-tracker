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

// Applies the user's saved theme choice (if any) before the first paint
// — reading localStorage and setting data-theme here, ahead of React
// hydration, is what avoids a flash of the OS-default theme for anyone
// who's explicitly overridden it. Falls through silently (stays on the
// OS-driven default) if localStorage is unavailable or empty.
const themeInitScript = `
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
