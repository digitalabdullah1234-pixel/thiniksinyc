import type { Localized } from "./types";

/** One of ThinkSync's own software products. */
export interface Product {
  /** Stable slug: the key in lists and the admin. */
  id: string;
  /** The product's name. A brand, so usually the same in both languages. */
  name: Localized;
  /** What it is for, in a few words. */
  tagline: Localized;
  /** A sentence or two more. May be empty. */
  description: Localized;
  /** Its own site or store page. Without one, its poster's button leads to the contact form. */
  link?: string;
  /**
   * A screenshot of the app, shown inside the phone on its poster (a tall
   * picture fits best). Without one the phone shows a drawn screen instead
   * (components/products/screens.tsx).
   */
  image?: string;
  /**
   * The poster's colour, picked in the admin: "night" or "green" (the two
   * hand-made gradients), or any "#rrggbb". Without one, the posters take
   * night and green in turn.
   */
  color?: string;
}

/** A colour the admin may store for a poster. */
export const POSTER_COLOR = /^(night|green|#[0-9a-f]{6})$/;

/** The ready colours offered in the admin, before the free picker. */
export const POSTER_PRESETS: { value: string; label: string; swatch: string }[] = [
  { value: "night", label: "Night", swatch: "linear-gradient(165deg, #113a29, #0a2118 44%, #06120d)" },
  { value: "green", label: "Green", swatch: "linear-gradient(165deg, #138a50, #0b6e3d 46%, #07492a)" },
  { value: "#0d0f0e", label: "Black", swatch: "linear-gradient(165deg, #2a2d2b, #0d0f0e 46%, #060707)" },
];

/** How a poster is coloured: its tone, and for a free colour the colour itself. */
export function posterTone(product: Product, index: number): { tone: "night" | "green" | "custom"; color?: string } {
  const c = product.color;
  if (c === "night" || c === "green") return { tone: c };
  if (c && POSTER_COLOR.test(c)) return { tone: "custom", color: c };
  return { tone: index % 2 ? "green" : "night" };
}

/**
 * A light colour needs dark words. Relative luminance (WCAG): at 0.2, white
 * and near-black words read equally well (about 4:1); above it, dark words
 * read better.
 */
export function lightColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2;
}

/**
 * The products the "Our products" section starts with, in display order; the
 * admin keeps its own copy (data/products.json) once saved. Only what the
 * owner has said about each: its name and what it is for. Nothing else is
 * claimed until he adds it.
 */
export const PRODUCTS: Product[] = [
  {
    id: "boka",
    name: { en: "Boka", ar: "Boka" },
    tagline: { en: "Hall and venue booking", ar: "حجز القاعات والمرافق" },
    description: { en: "", ar: "" },
  },
  {
    id: "parkio",
    name: { en: "Parkio", ar: "Parkio" },
    tagline: { en: "Parking management", ar: "إدارة مواقف السيارات" },
    description: { en: "", ar: "" },
  },
];
