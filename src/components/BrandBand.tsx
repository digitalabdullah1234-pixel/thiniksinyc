"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, motion, type AnimationPlaybackControls } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { Brand, PictureBrand, VectorBrand } from "@/content/brands";
import { useLive } from "@/lib/live";
import styles from "./BrandBand.module.css";

/** Wider than this (width / height) and the mark is a wordmark: it names itself. */
const WORDMARK_RATIO = 2.2;
/** Hovering a row slows it to this fraction of its speed, so a logo can be read. */
const HOVER_SPEED = 0.15;

/**
 * The logo band on a paper strip: the clients and partners ThinkSync has
 * worked with drift toward the reading start, and under them the brands it
 * installs drift the other way. Every logo is in its own colours. Each row carries its own label.
 */
export function BrandBand({ clients, brands, labels }: { clients: Brand[]; brands: Brand[]; labels: { clients: string; brands: string } }) {
  return (
    <div className={styles.band}>
      {clients.length > 0 && (
        <div className={styles.line} data-kind="clients">
          <span className={styles.label}>{labels.clients}</span>
          <Row brands={clients} toward="start" />
        </div>
      )}
      {brands.length > 0 && (
        <div className={styles.line}>
          <span className={styles.label}>{labels.brands}</span>
          <Row brands={brands} toward="end" />
        </div>
      )}
    </div>
  );
}

/**
 * One row. The group is laid out twice and the track moves by exactly one
 * group (50%), so the loop is seamless. It runs only while live, and the
 * direction follows the reading direction.
 */
function Row({ brands, toward }: { brands: Brand[]; toward: "start" | "end" }) {
  const { dir } = useLanguage();
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const live = useLive(viewRef);
  const liveRef = useRef(false);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  // Declared first, so on mount `liveRef` is set before the loop is created.
  useEffect(() => {
    liveRef.current = live;
    const c = controls.current;
    if (!c) return;
    if (live) c.play();
    else c.pause();
  }, [live]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Toward the reading start: left in English (negative x), right in Arabic.
    const sign = dir === "rtl" ? 1 : -1;
    const keyframes = toward === "start" ? ["0%", `${50 * sign}%`] : [`${50 * sign}%`, "0%"];
    // About the same pace whatever the row holds: five seconds a logo, and a short row no faster than forty.
    const c = animate(track, { x: keyframes }, { duration: Math.max(40, brands.length * 5), ease: "linear", repeat: Infinity });
    controls.current = c;
    if (!liveRef.current) c.pause();
    return () => {
      c.stop();
      controls.current = null;
    };
  }, [dir, toward, brands.length]);

  const setSpeed = (speed: number) => {
    if (controls.current) controls.current.speed = speed;
  };

  return (
    <div
      ref={viewRef}
      className={styles.view}
      onPointerEnter={() => setSpeed(HOVER_SPEED)}
      onPointerLeave={() => setSpeed(1)}
    >
      <div ref={trackRef} className={styles.track}>
        <Group brands={brands} />
        <Group brands={brands} copy />
      </div>
    </div>
  );
}

function Group({ brands, copy = false }: { brands: Brand[]; copy?: boolean }) {
  return (
    <div className={styles.group} aria-hidden={copy || undefined}>
      {brands.map((brand) => (
        <motion.span
          key={brand.name || ("src" in brand ? brand.src : "")}
          data-brand=""
          className={styles.brand}
          whileHover={{ y: -3, scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          {"src" in brand ? <Picture brand={brand} /> : <Vector brand={brand} />}
        </motion.span>
      ))}
    </div>
  );
}

/** A logo from its paths, cropped to its own bounds; wordmarks stand alone, symbols get their name. */
function Vector({ brand }: { brand: VectorBrand }) {
  const [x, y, w, h] = brand.box;
  const wordmark = w / h > WORDMARK_RATIO;
  const height = brand.height ?? (wordmark ? 20 : 25);
  const width = Math.round(((height * w) / h) * 10) / 10;

  return (
    <>
      <svg viewBox={`${x} ${y} ${w} ${h}`} width={width} height={height} aria-hidden focusable="false">
        <path d={brand.path} style={{ fill: brand.color ?? "var(--color-ink)" }} />
        {brand.more?.map((part) => (
          <path key={part.color} d={part.path} style={{ fill: part.color }} />
        ))}
      </svg>
      {wordmark ? <span className="sr-only">{brand.name}</span> : <span className={styles.name}>{brand.name}</span>}
    </>
  );
}

/** A logo kept as a picture: shown in its own colours, or (a white shape on clear) painted in its tint. */
function Picture({ brand }: { brand: PictureBrand }) {
  const width = Math.round(brand.height * brand.ratio);
  const named = brand.name ? { role: "img", "aria-label": brand.name } : { "aria-hidden": true };
  if (brand.tint) {
    const mask = `url(${brand.src})`;
    return <span {...named} className={styles.tinted} style={{ width, height: brand.height, background: brand.tint, WebkitMaskImage: mask, maskImage: mask } as CSSProperties} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- a small logo, shown at its own size
  return <img src={brand.src} alt={brand.name} width={width} height={brand.height} loading="lazy" decoding="async" className={styles.picture} />;
}
