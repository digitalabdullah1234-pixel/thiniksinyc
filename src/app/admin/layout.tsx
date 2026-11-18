import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, IBM_Plex_Sans_Arabic, Inter, JetBrains_Mono } from "next/font/google";
import { Ground } from "./motion";
import { THEME_COOKIE, readTheme } from "./theme";
import "./admin.css";

export const metadata: Metadata = {
  title: "ThinkSync admin",
  robots: { index: false, follow: false },
};

// The site's own faces (headings, text, Arabic), and a mono for small numbers.
const display = Bricolage_Grotesque({ variable: "--a-display", subsets: ["latin"], display: "swap" });
const sans = Inter({ variable: "--a-sans", subsets: ["latin"], display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--a-arabic", subsets: ["arabic"], weight: ["400", "500", "600"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--a-mono", subsets: ["latin"], weight: ["500"], display: "swap" });

/**
 * The admin has its own page shell: none of the site's intro, cursor or page
 * transitions. Glass over a slowly drifting night-green light ("night"), or
 * frosted white ("frost"), whichever the admin last picked.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en">
      <body className={`a-body ${display.variable} ${sans.variable} ${arabic.variable} ${mono.variable}`} data-theme={theme}>
        <Ground />
        {children}
      </body>
    </html>
  );
}
