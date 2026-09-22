import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans-ui",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-ui",
});

export const metadata = {
  title: "Contribution Tracker",
  description:
    "Log, verify, and visualize team project contributions in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
