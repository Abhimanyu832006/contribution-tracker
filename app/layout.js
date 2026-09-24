import { Bangers, Plus_Jakarta_Sans } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import DotField from "@/components/DotField";
import "./globals.css";

// Comic Neue's body weight was part of the legibility problem too —
// Plus Jakarta Sans is a clean, high-x-height workhorse that keeps
// labels/meta text crisp at small sizes, while Titan One still carries
// all the comic personality on headlines and numbers.
const interfaceFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-ui",
});

// Bangers, take two: its tight counters caused the original legibility
// problem, so this time it leans entirely on wide letter-spacing (see
// .hero-display/.label-mono/.stamp-solid/.brutal-btn in globals.css)
// instead of a stroke to keep letters from touching — no -webkit-
// text-stroke on word-shaped text this time, only on solitary digits
// (.stat-num), which have no neighboring letterform to blob into.
const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-comic-display",
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
    <html
      lang="en"
      className={`${interfaceFont.variable} ${bangers.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <DotField />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
