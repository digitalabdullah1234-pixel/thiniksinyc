import type { Localized } from "@/content/types";

/** A step's photo: the file under public/process, what it shows, and where to hold a crop. */
export interface ProcessPhoto {
  src: string;
  alt: Localized;
  /** The object-position that keeps the subject in a cropped frame. */
  pos?: string;
}

/**
 * A real photo for each step (Unsplash, free licence), in phase order. `pos`
 * is the object-position that keeps the subject in a cropped frame.
 */
export const PROCESS_PHOTOS: Record<"software" | "hardware", ProcessPhoto>[] = [
  {
    software: { src: "/process/plan-software.webp", alt: { en: "A team around a meeting table with laptops", ar: "فريق حول طاولة اجتماعات مع حواسيب محمولة" } },
    hardware: { src: "/process/plan-hardware.webp", alt: { en: "Two engineers in hard hats reviewing plans by a window", ar: "مهندستان بخوذتين تراجعان المخططات بجانب نافذة" }, pos: "50% 40%" },
  },
  {
    software: { src: "/process/design-software.webp", alt: { en: "A designer sketching app wireframes beside a laptop", ar: "مصمم يرسم مخططات واجهات تطبيق بجانب حاسوب محمول" } },
    hardware: { src: "/process/design-hardware.webp", alt: { en: "Building plans and a laptop on a desk", ar: "مخططات مبنى وحاسوب محمول على مكتب" }, pos: "50% 55%" },
  },
  {
    software: { src: "/process/build-software.webp", alt: { en: "Code on a laptop screen", ar: "كود على شاشة حاسوب محمول" } },
    hardware: { src: "/process/build-hardware.webp", alt: { en: "A technician fitting equipment into a server rack", ar: "فني يركّب معدات في خزانة خوادم" }, pos: "50% 35%" },
  },
  {
    software: { src: "/process/test-software.webp", alt: { en: "An app's dashboard checked on a phone", ar: "لوحة تطبيق تُفحص على هاتف" } },
    hardware: { src: "/process/test-hardware.webp", alt: { en: "A technician testing a rack with a handheld tester", ar: "فني يختبر خزانة بجهاز فحص يدوي" } },
  },
  {
    software: { src: "/process/launch-software.webp", alt: { en: "Servers running with green status lights", ar: "خوادم تعمل بأضواء حالة خضراء" } },
    hardware: { src: "/process/launch-hardware.webp", alt: { en: "A handshake over the handover papers", ar: "مصافحة فوق أوراق التسليم" } },
  },
  {
    software: { src: "/process/support-software.webp", alt: { en: "A live analytics dashboard on a laptop", ar: "لوحة تحليلات مباشرة على حاسوب محمول" } },
    hardware: { src: "/process/support-hardware.webp", alt: { en: "A technician servicing a server rack", ar: "فني يصون خزانة خوادم" } },
  },
];
