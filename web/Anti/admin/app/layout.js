import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MouseGradient from "@/components/MouseGradient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Money Heist Portal - La Casa de Papel",
  description: "Character and quote portal for Money Heist fans",
  icons: {
    icon: "https://imgs.search.brave.com/-2Ly8SCjz7ixcI_eHHhMMVlc9fPokfVQCOxrPtUfQR0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5ncGxheS5jb20v/d3AtY29udGVudC91/cGxvYWRzLzEzL01v/bmV5LUhlaXN0LURw/LVBORy1IRC1RdWFs/aXR5LnBuZw",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MouseGradient />
        {children}
      </body>
    </html>
  );
}
