import type { Localized } from "./types";

/**
 * The "Start a project" form: its heading and field labels. The form asks for
 * a name, an email, the company (optional), one service and a message box
 * (optional). No phone number: the team replies by email.
 */

export const inquiryHeading: { eyebrow: Localized; title: Localized; accent: Localized; intro: Localized } = {
  eyebrow: { en: "Get in touch", ar: "تواصل معنا" },
  title: { en: "Start a project", ar: "ابدأ مشروعك" },
  accent: { en: "project", ar: "مشروعك" },
  intro: {
    en: "Tell us who you are and what you need. Our team will reply within one business day.",
    ar: "أخبرنا من أنت وما الذي تحتاجه، وسيرد عليك فريقنا خلال يوم عمل واحد.",
  },
};

export const inquiryForm = {
  name: { en: "Full name", ar: "الاسم الكامل" },
  namePh: { en: "Your name", ar: "اسمك" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  emailPh: { en: "you@company.com", ar: "you@company.com" },
  company: { en: "Company name", ar: "اسم الشركة" },
  companyPh: { en: "Your company", ar: "اسم شركتك" },
  service: { en: "Service", ar: "الخدمة" },
  servicePh: { en: "Select a service", ar: "اختر الخدمة" },
  message: { en: "Message", ar: "رسالتك" },
  messagePh: { en: "Tell us about your project: what you need, where, and by when.", ar: "أخبرنا عن مشروعك: ما الذي تحتاجه، وأين، ومتى." },
  optional: { en: "optional", ar: "اختياري" },
  submit: { en: "Send request", ar: "إرسال الطلب" },
  sending: { en: "Sending…", ar: "جارٍ الإرسال…" },
  // The note under the button, with "privacy policy" linked to /privacy.
  consentBefore: { en: "By submitting, you agree to our ", ar: "بإرسال الطلب، فإنك توافق على " },
  consentLink: { en: "privacy policy", ar: "سياسة الخصوصية" },
  consentAfter: { en: ". We never share details with third parties.", ar: ". لا نشارك بياناتك مع أي طرف ثالث أبدًا." },
  // What stands in the form's place once it is sent. {name} and {email} are the visitor's.
  done: { en: "Request received", ar: "وصل طلبك" },
  doneText: { en: "Thank you, {name}. We will reply to {email} within one business day.", ar: "شكرًا لك يا {name}. سنرد على {email} خلال يوم عمل واحد." },
  again: { en: "Send another request", ar: "أرسل طلبًا آخر" },
  emailUs: { en: "Prefer email?", ar: "تفضّل البريد؟" },
  error: { en: "Something went wrong. Please try again, or write to info@thinksync.sa.", ar: "حدث خطأ ما. حاول مرة أخرى، أو راسلنا على info@thinksync.sa." },
  errName: { en: "Please tell us your name.", ar: "يرجى كتابة اسمك." },
  errEmail: { en: "Please enter a valid email address.", ar: "يرجى كتابة بريد إلكتروني صحيح." },
  errService: { en: "Please select a service.", ar: "يرجى اختيار خدمة." },
} satisfies Record<string, Localized>;

/** A plain check for an email address: something@something.tld, no spaces. The server checks the same. */
export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
export const validEmail = (v: string) => v.length <= 200 && EMAIL_RE.test(v.trim());
