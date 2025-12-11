import type { Metadata } from "next";
import { Geist, Geist_Mono, Playwrite_NG_Modern } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playWrite = Playwrite_NG_Modern({
  variable: "--font-playwrite-ng",
});

export const metadata: Metadata = {
  title: "framebox",
  description:
    "framebox adalah cara baru merayakan momen. Pilih frame, bagikan ceritamu, dan tunjukkan versi dirimu dengan cara berbeda!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playWrite.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
