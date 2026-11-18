import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PrivacyPolicy } from "@/components/privacy/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy · ThinkSync",
  description: "What ThinkSync collects through this site, why, and how to reach us about it.",
};

/** The privacy policy, between the site's header and footer. */
export default function Privacy() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PrivacyPolicy />
      </main>
      <Footer />
    </>
  );
}
