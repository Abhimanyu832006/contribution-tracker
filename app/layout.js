import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Contribution Tracker",
  description:
    "Log, verify, and visualize team project contributions in one place.",
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
