import type { Accent, ImageMedia, Localized } from "./types";

/** The built-in live screens a service card can show. */
export type ServiceScreenKey =
  | "software"
  | "cctv"
  | "access"
  | "network"
  | "servers"
  | "wifi"
  | "iptv"
  | "pbx"
  | "cloud"
  | "support";

/** Icons a service can be shown with (Lucide icons, by these names). */
export type ServiceIcon =
  | "code"
  | "camera"
  | "fingerprint"
  | "network"
  | "server"
  | "wifi"
  | "tv"
  | "phone"
  | "cloud"
  | "wrench";

/**
 * The group a service is filed under: a category id. Each category in use
 * gets a tab of its own (see serviceCategories), so a new id here adds a tab.
 */
export type ServiceCategory = string;

export interface CategoryInfo {
  id: ServiceCategory;
  label: Localized;
}

/** Labels and tab order for the known categories. */
export const SERVICE_CATEGORIES: CategoryInfo[] = [
  { id: "software", label: { en: "Software", ar: "البرمجيات" } },
  { id: "infrastructure", label: { en: "Infrastructure", ar: "البنية التحتية" } },
  { id: "security", label: { en: "Security", ar: "الأمن" } },
  { id: "support", label: { en: "Support", ar: "الدعم" } },
];

export interface CategoryTab extends CategoryInfo {
  /** The services filed under it, in list order. */
  services: Service[];
}

/** "cloud-hosting" -> "Cloud hosting": a readable label for a category added without one. */
const labelOf = (id: string) => {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * The categories the services use, in tab order: the known ones first (in
 * SERVICE_CATEGORIES order), then any others in the order they first appear.
 * Categories with no services get no tab.
 */
export function serviceCategories(services: Service[] = SERVICES): CategoryTab[] {
  const known = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]));
  const groups = new Map<ServiceCategory, Service[]>();
  for (const service of services) {
    const group = groups.get(service.category);
    if (group) group.push(service);
    else groups.set(service.category, [service]);
  }
  const order = [
    ...SERVICE_CATEGORIES.map((c) => c.id).filter((id) => groups.has(id)),
    ...[...groups.keys()].filter((id) => !known.has(id)),
  ];
  return order.map((id) => {
    const info = known.get(id) ?? { id, label: { en: labelOf(id), ar: labelOf(id) } };
    return { ...info, services: groups.get(id) ?? [] };
  });
}

/** What fills a service card: a photo (the services section uses these), or one of the built-in live screens. */
export type ServiceMedia = { kind: "screen"; screen: ServiceScreenKey } | ImageMedia;

export interface Service {
  /** Stable slug: the key in lists, forms and the admin. */
  id: string;
  title: Localized;
  description: Localized;
  /** Short tags under the card's line (stacks, methods). */
  points: Localized<string[]>;
  /** What a visitor can tick in the contact form once they pick this service. */
  options: Localized<string[]>;
  category: ServiceCategory;
  /** Shown on the card's screen when the service has no media. */
  icon: ServiceIcon;
  /** The card's hover tint. */
  accent: Accent;
  /** A live screen or a picture. Without one, the screen shows the icon. */
  media?: ServiceMedia;
  /** Prefer a large tile, with its live screen, in the services grid. */
  featured?: boolean;
}

/**
 * The services, in display order: the list the site starts with. The admin
 * panel keeps its own copy (data/services.json) once it has been saved; the
 * services section, the contact form's service list and the footer all read
 * that one list.
 */
export const SERVICES: Service[] = [
  {
    id: "web",
    title: { en: "Web Development", ar: "تطوير المواقع" },
    description: {
      en: "Marketing sites, dashboards and commerce platforms built on modern stacks. Performance-first, SEO-ready, instrumented from day one.",
      ar: "مواقع تسويقية ولوحات تحكم ومنصات تجارة إلكترونية مبنية بأحدث التقنيات. الأداء أولًا، جاهزة لمحركات البحث، ومراقَبة من اليوم الأول.",
    },
    points: { en: ["Next.js", "Remix", "Edge"], ar: ["Next.js", "Remix", "Edge"] },
    options: {
      en: ["New website", "Website redesign", "Dashboard or portal", "Online store", "Landing page", "SEO & performance"],
      ar: ["موقع جديد", "إعادة تصميم موقع", "لوحة تحكم أو بوابة", "متجر إلكتروني", "صفحة هبوط", "تحسين محركات البحث والأداء"],
    },
    category: "software",
    icon: "code",
    accent: "software",
    media: {
      kind: "image",
      src: "/services/software.webp",
      alt: { en: "Code on a developer's monitor in a dimly lit studio", ar: "شيفرة برمجية على شاشة مطوّر في غرفة خافتة الإضاءة" },
    },
  },
  {
    id: "mobile",
    title: { en: "Mobile Apps", ar: "تطبيقات الجوال" },
    description: {
      en: "Native-feel iOS and Android products with consistent design language, offline support and release pipelines that ship weekly.",
      ar: "تطبيقات iOS وAndroid بإحساس أصلي ولغة تصميم موحّدة، تعمل دون اتصال، مع خطوط إصدار تُطلق تحديثًا كل أسبوع.",
    },
    points: { en: ["Swift", "Kotlin", "React Native"], ar: ["Swift", "Kotlin", "React Native"] },
    options: {
      en: ["iOS app", "Android app", "iOS and Android", "App redesign", "New features", "Publish to the stores"],
      ar: ["تطبيق iOS", "تطبيق Android", "iOS وAndroid معًا", "إعادة تصميم تطبيق", "ميزات جديدة", "النشر على المتاجر"],
    },
    category: "software",
    icon: "phone",
    accent: "pbx",
    media: {
      kind: "image",
      src: "/services/mobile.webp",
      alt: { en: "A hand holding a smartphone in a stairwell", ar: "يد تمسك هاتفًا ذكيًا على درج" },
    },
  },
  {
    id: "systems",
    title: { en: "Custom Systems", ar: "الأنظمة المخصصة" },
    description: {
      en: "Internal tools, ERPs, booking engines, back-office. We model the domain first, then build the smallest system that changes the outcome.",
      ar: "أدوات داخلية وأنظمة ERP ومحركات حجز وأنظمة إدارة خلفية. نفهم طبيعة عملك أولًا، ثم نبني أصغر نظام يغيّر النتيجة.",
    },
    points: { en: ["Postgres", "Event driven", "Self host"], ar: ["Postgres", "قائم على الأحداث", "استضافة ذاتية"] },
    options: {
      en: ["ERP", "Booking system", "Internal tool", "Back-office", "Integrations & APIs", "Replace an old system"],
      ar: ["نظام ERP", "نظام حجوزات", "أداة داخلية", "نظام إدارة خلفي", "التكاملات وواجهات API", "استبدال نظام قديم"],
    },
    category: "software",
    icon: "server",
    accent: "servers",
    media: {
      kind: "image",
      src: "/services/cloud.webp",
      alt: { en: "Live analytics dashboards on a monitor", ar: "لوحات تحليلات مباشرة على شاشة" },
    },
  },
  {
    id: "ai",
    title: { en: "AI Solutions", ar: "حلول الذكاء الاصطناعي" },
    description: {
      en: "Production-grade LLM features, retrieval pipelines and agentic workflows. We ship evaluated, measurable AI — not demos.",
      ar: "ميزات نماذج لغوية جاهزة للإنتاج، وخطوط استرجاع للمعرفة، وسير عمل بوكلاء أذكياء. نسلّم ذكاءً اصطناعيًا مُقيَّمًا وقابلًا للقياس، لا عروضًا تجريبية.",
    },
    points: { en: ["RAG", "Evals", "Agents"], ar: ["RAG", "التقييم", "الوكلاء الأذكياء"] },
    options: {
      en: ["AI chatbot", "Search our documents (RAG)", "AI agents & automation", "Add AI to our product", "Evaluate an AI feature"],
      ar: ["مساعد محادثة ذكي", "البحث في مستنداتنا (RAG)", "وكلاء أذكياء وأتمتة", "إضافة الذكاء الاصطناعي لمنتجنا", "تقييم ميزة ذكاء اصطناعي"],
    },
    category: "software",
    icon: "cloud",
    accent: "cloud",
    media: {
      kind: "image",
      src: "/services/ai.webp",
      alt: { en: "A glowing green AI chip on a circuit board", ar: "شريحة ذكاء اصطناعي خضراء متوهجة على لوحة إلكترونية" },
    },
  },
  {
    id: "networking",
    title: { en: "Enterprise Networking", ar: "الشبكات المؤسسية" },
    description: {
      en: "Fast, segmented networks for offices, warehouses and venues: routing, VLANs, core switching and firewalls, SD-WAN and VPN links between branches, and high-density Wi-Fi indoors and out.",
      ar: "شبكات سريعة ومقسّمة للمكاتب والمستودعات والمنشآت: توجيه وشبكات VLAN وتحويل مركزي وجدران حماية، وربط الفروع عبر SD-WAN وVPN، وشبكات Wi-Fi عالية الكثافة داخل المباني وخارجها.",
    },
    points: { en: ["SD-WAN & VPN", "VLAN", "Enterprise Wi-Fi"], ar: ["SD-WAN وVPN", "VLAN", "Wi-Fi للمؤسسات"] },
    options: {
      en: ["Network design & setup", "Connect our branches (SD-WAN / VPN)", "Firewall setup", "Office or warehouse Wi-Fi", "Outdoor or venue Wi-Fi", "Fix a slow or unstable network"],
      ar: ["تصميم الشبكة وتركيبها", "ربط الفروع (SD-WAN / VPN)", "إعداد جدار الحماية", "Wi-Fi للمكتب أو المستودع", "Wi-Fi خارجي أو للمنشآت", "إصلاح شبكة بطيئة أو غير مستقرة"],
    },
    category: "infrastructure",
    icon: "network",
    accent: "network",
    media: {
      kind: "image",
      src: "/services/networking.webp",
      alt: { en: "Fibre optic cables plugged into network switches in a rack", ar: "كابلات ألياف ضوئية موصولة بمحوّلات شبكة داخل خزانة" },
    },
  },
  {
    id: "virtualization",
    title: { en: "Virtualization & Cloud", ar: "الخوادم الافتراضية والسحابة" },
    description: {
      en: "Private cloud on Proxmox VE or VMware with high availability, encrypted remote access and SMB file sharing, and server replication with automated backups, so you recover fast.",
      ar: "سحابة خاصة على Proxmox VE أو VMware بتوفر عالٍ، ووصول عن بُعد مشفّر ومشاركة ملفات SMB، ونسخ متماثل للخوادم مع نسخ احتياطي تلقائي لاستعادة سريعة.",
    },
    points: { en: ["Proxmox VE", "VMware", "Backup & recovery"], ar: ["Proxmox VE", "VMware", "النسخ الاحتياطي والاستعادة"] },
    options: {
      en: ["Private cloud / virtualization", "Move our servers to VMs", "Secure remote access", "File sharing & storage", "Automated backups", "Disaster recovery"],
      ar: ["سحابة خاصة / افتراضية", "نقل خوادمنا إلى أجهزة افتراضية", "وصول آمن عن بُعد", "مشاركة الملفات والتخزين", "نسخ احتياطي تلقائي", "التعافي من الكوارث"],
    },
    category: "infrastructure",
    icon: "server",
    accent: "servers",
    media: {
      kind: "image",
      src: "/services/virtualization.webp",
      alt: { en: "A server rack with green status lights", ar: "خزانة خوادم بأضواء حالة خضراء" },
    },
  },
  {
    id: "telephony",
    title: { en: "Telephony & IP-PBX", ar: "الهاتف وأنظمة IP-PBX" },
    description: {
      en: "Enterprise IP-PBX on FreePBX, Issabel, Yeastar or Grandstream UCM: extensions routed across branches, IVR menus, secure SIP trunks, and desk phones provisioned and maintained in bulk.",
      ar: "أنظمة IP-PBX للمؤسسات على FreePBX وIssabel وYeastar وGrandstream UCM: تحويلات داخلية بين الفروع، وقوائم IVR، وخطوط SIP آمنة، وهواتف مكتبية تُجهَّز وتُصان بالجملة.",
    },
    points: { en: ["IP-PBX", "SIP & VoIP", "IVR"], ar: ["IP-PBX", "SIP وVoIP", "الرد الآلي IVR"] },
    options: {
      en: ["New IP-PBX system", "Move to VoIP / SIP trunks", "Connect our branches", "IVR / auto attendant", "Desk phones setup", "Maintain our phone system"],
      ar: ["نظام IP-PBX جديد", "الانتقال إلى VoIP وخطوط SIP", "ربط الفروع", "الرد الآلي IVR", "تجهيز الهواتف المكتبية", "صيانة نظام الهاتف"],
    },
    category: "infrastructure",
    icon: "phone",
    accent: "pbx",
    media: {
      kind: "image",
      src: "/services/telephony.webp",
      alt: { en: "An IP desk phone on a dark office desk", ar: "هاتف IP مكتبي على مكتب داكن" },
    },
  },
  {
    id: "automation",
    title: { en: "Smart Home Automation", ar: "أتمتة المنازل الذكية" },
    description: {
      en: "Lighting, AC, smart switches and scheduled scenes for villas, offices and commercial spaces, with motion, occupancy and temperature sensors that cut energy costs, plus background audio and meeting-room displays.",
      ar: "إضاءة وتكييف ومفاتيح ذكية ومشاهد مجدولة للفلل والمكاتب والمساحات التجارية، مع حساسات للحركة والإشغال والحرارة تخفّض تكاليف الطاقة، إضافة إلى الصوت الخلفي وشاشات قاعات الاجتماعات.",
    },
    points: { en: ["Lighting & AC", "Energy sensors", "Audio & display"], ar: ["الإضاءة والتكييف", "حساسات الطاقة", "الصوت والعرض"] },
    options: {
      en: ["Villa automation", "Office or commercial space", "Lighting & AC control", "Energy-saving sensors", "Background audio", "Meeting-room display & presentation"],
      ar: ["أتمتة فيلا", "مكتب أو مساحة تجارية", "التحكم في الإضاءة والتكييف", "حساسات توفير الطاقة", "نظام صوت خلفي", "شاشات وعرض لقاعات الاجتماعات"],
    },
    category: "infrastructure",
    icon: "wifi",
    accent: "wifi",
    media: {
      kind: "image",
      src: "/services/automation.webp",
      alt: { en: "A finger pressing a smart wall control panel", ar: "إصبع يضغط على لوحة تحكم ذكية في الجدار" },
    },
  },
  {
    id: "iptv",
    title: { en: "IPTV & Hospitality TV", ar: "IPTV وتلفزيون الضيافة" },
    description: {
      en: "Interactive IPTV for hotels, resorts and residential complexes, welcome screens and digital signage run from one place, and multi-channel HD streams carried over LAN or fibre without bottlenecks.",
      ar: "IPTV تفاعلي للفنادق والمنتجعات والمجمعات السكنية، وشاشات ترحيب ولافتات رقمية تُدار من مكان واحد، وبث HD متعدد القنوات عبر الشبكة أو الألياف دون اختناق.",
    },
    points: { en: ["Hotel IPTV", "Digital signage", "HD streaming"], ar: ["IPTV للفنادق", "اللافتات الرقمية", "بث عالي الدقة"] },
    options: {
      en: ["Hotel / resort IPTV", "Residential complex TV", "Welcome screens & info channels", "Digital signage & menus", "HD channel distribution"],
      ar: ["IPTV للفندق أو المنتجع", "تلفزيون للمجمع السكني", "شاشات ترحيب وقنوات معلومات", "لافتات وقوائم رقمية", "توزيع قنوات عالية الدقة"],
    },
    category: "infrastructure",
    icon: "tv",
    accent: "iptv",
    media: {
      kind: "image",
      src: "/services/iptv.webp",
      alt: { en: "A hotel room TV showing a welcome screen", ar: "تلفزيون غرفة فندقية يعرض شاشة ترحيب" },
    },
  },
  {
    id: "surveillance",
    title: { en: "Smart Surveillance", ar: "المراقبة الذكية" },
    description: {
      en: "HD CCTV on Uniview, Dahua and Hikvision NVRs, AI that tells people from vehicles and guards the perimeter, and control rooms with multi-screen walls, PTZ control and remote live view.",
      ar: "كاميرات مراقبة عالية الدقة على مسجلات Uniview وDahua وHikvision، وذكاء اصطناعي يميّز الأشخاص من المركبات ويحمي المحيط، وغرف تحكم بشاشات متعددة وتحكم PTZ وبث مباشر عن بُعد.",
    },
    points: { en: ["CCTV & NVR", "AI analytics", "Control rooms"], ar: ["CCTV وNVR", "تحليلات ذكية", "غرف التحكم"] },
    options: {
      en: ["New CCTV system", "Upgrade old cameras", "AI detection (people / vehicles)", "Perimeter protection", "Control room / video wall", "Remote live viewing"],
      ar: ["نظام كاميرات جديد", "ترقية الكاميرات القديمة", "كشف ذكي (أشخاص / مركبات)", "حماية المحيط", "غرفة تحكم / جدار عرض", "مشاهدة مباشرة عن بُعد"],
    },
    category: "security",
    icon: "camera",
    accent: "cctv",
    media: {
      kind: "image",
      src: "/services/surveillance.webp",
      alt: { en: "Rows of security cameras on a grey wall", ar: "صفوف من كاميرات المراقبة على جدار رمادي" },
    },
  },
  {
    id: "smart-locks",
    title: { en: "Smart Locks & Access", ar: "الأقفال الذكية والدخول" },
    description: {
      en: "Keyless doors that open by fingerprint, face, RFID card, passcode or mobile app, hotel keycard systems with remote unlock and temporary guest codes, and a live log of every entry.",
      ar: "أبواب بلا مفاتيح تُفتح بالبصمة أو الوجه أو بطاقة RFID أو رمز سري أو تطبيق الجوال، وأنظمة بطاقات للفنادق مع فتح عن بُعد ورموز مؤقتة للضيوف، وسجل مباشر لكل دخول.",
    },
    points: { en: ["Keyless entry", "Hotel keycards", "Access logs"], ar: ["دخول بلا مفاتيح", "بطاقات الفنادق", "سجلات الدخول"] },
    options: {
      en: ["Smart locks for home or office", "Hotel keycard system", "Fingerprint / face access", "Mobile app & remote unlock", "Guest or temporary codes", "Connect to our security system"],
      ar: ["أقفال ذكية للمنزل أو المكتب", "نظام بطاقات للفندق", "دخول بالبصمة أو الوجه", "تطبيق جوال وفتح عن بُعد", "رموز للضيوف أو مؤقتة", "الربط بنظامنا الأمني"],
    },
    category: "security",
    icon: "fingerprint",
    accent: "access",
    media: {
      kind: "image",
      src: "/services/smart-locks.webp",
      alt: { en: "A smart lock on a door, opened from a phone app", ar: "قفل ذكي على باب يُفتح من تطبيق على الهاتف" },
    },
  },
  {
    id: "biometric",
    title: { en: "Biometric & Attendance", ar: "البصمة وأنظمة الحضور" },
    description: {
      en: "Fingerprint, face recognition and RFID terminals for doors and time attendance, synced across every device and into your HR and payroll software.",
      ar: "أجهزة بصمة وتعرّف على الوجه وبطاقات RFID للأبواب والحضور والانصراف، متزامنة بين كل الأجهزة ومع برامج الموارد البشرية والرواتب لديك.",
    },
    points: { en: ["Fingerprint & face", "RFID", "HR & payroll sync"], ar: ["البصمة والوجه", "RFID", "ربط الموارد البشرية والرواتب"] },
    options: {
      en: ["Attendance devices", "Biometric door access", "Face recognition", "RFID cards", "Sync with HR / payroll", "Several branches"],
      ar: ["أجهزة الحضور والانصراف", "دخول الأبواب بالبصمة", "التعرّف على الوجه", "بطاقات RFID", "الربط مع الموارد البشرية والرواتب", "عدة فروع"],
    },
    category: "security",
    icon: "fingerprint",
    accent: "access",
    media: {
      kind: "image",
      src: "/services/biometric.webp",
      alt: { en: "A fingerprint glowing on a scanner", ar: "بصمة إصبع متوهجة على جهاز مسح" },
    },
  },
];
