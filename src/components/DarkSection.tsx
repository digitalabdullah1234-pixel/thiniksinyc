"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView, usePageVisible } from "@/lib/visibility";

export interface GlowSpec {
  /** CSS position of the glow's centre inside the section. */
  x: string;
  y: string;
  /** CSS diameter. */
  size: string;
  color: "emerald" | "teal" | "cool" | "mint" | "deep";
  /** Drift amplitude in px. */
  drift?: number;
}

/**
 * The aurora's palette, at alphas that keep white body text above 4.5:1 once
 * the scrim is on top (the same budget the hero's canvas works to).
 */
const COLORS: Record<GlowSpec["color"], string> = {
  emerald: "rgba(16, 152, 90, 0.42)",
  teal: "rgba(20, 200, 166, 0.22)",
  cool: "rgba(47, 111, 237, 0.2)",
  // For the brand-green ground: a lighter green that lifts it, and a deep one that sinks it.
  mint: "rgba(92, 226, 160, 0.2)",
  deep: "rgba(2, 38, 21, 0.5)",
};

/**
 * The section's own colour. "night": the hero's near-black green. "green": the
 * brand green (Start a project), deep enough that white type and the pale mint
 * accent keep at least 4.5:1 on it.
 */
export type Ground = "night" | "green";

const GREEN = "linear-gradient(160deg, #0b7341 0%, #08643a 45%, #064f2f 100%)";

/** Seconds per drift loop, mismatched so no two glows ever sync up. */
const PERIODS = [23, 29, 19];

/** A light ground a dark section can meet: plain white, the brand band's paper, or the page's own ground. */
export type LightGround = "white" | "paper" | "ground";

const FADE_TO: Record<LightGround, string> = { white: "", paper: " fade-paper", ground: " fade-ground" };

/** How far, in px, the night stops short of an edge that fades into a light ground. */
const EDGE = 2;

interface DarkSectionProps {
  id: string;
  glows: GlowSpec[];
  children: ReactNode;
  className?: string;
  /**
   * The light ground right above and right below this section. Where one is
   * named, the night thins out into it (see `.fade-up` / `.fade-down` in
   * globals.css) instead of ending on an edge, and the section keeps that
   * band clear of its contents.
   */
  above?: LightGround;
  below?: LightGround;
  ground?: Ground;
}

/**
 * A section set on the hero's night (or, with `ground="green"`, on the brand
 * green): the same ground, soft aurora glows that
 * drift on long loops, a scrim that sets the contrast floor, and film grain.
 *
 * The glows only move while the section is on screen in a visible tab, and
 * never under reduced motion — continuous motion is paid for only when seen.
 */
export function DarkSection({ id, glows, children, className, above, below, ground = "night" }: DarkSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const onScreen = useInView(ref);
  const pageVisible = usePageVisible();
  const active = onScreen && pageVisible && !reduced;
  const green = ground === "green";
  // Over the green the haze runs through lighter greens; over the night, through deep ones.
  const fadeFrom = green ? " fade-green" : "";

  // `overflow-clip`, not `overflow-hidden`: a hidden overflow is still a
  // scroll container, so focusing a control inside (or scrollIntoView) can
  // scroll the section's own contents and slide the glow layer off its edge.
  return (
    <section
      ref={ref}
      id={id}
      className={`relative isolate overflow-clip text-white ${className ?? ""}`}
      // The fade's band is the section's own room (its contents start where the ground is night again),
      // and two pixels of its light end lie over the neighbour.
      style={
        above || below
          ? {
              paddingTop: above ? "calc(var(--fade) * 0.86)" : undefined,
              paddingBottom: below ? "calc(var(--fade) * 0.92)" : undefined,
              marginTop: above ? -2 : undefined,
              marginBottom: below ? -2 : undefined,
            }
          : undefined
      }
    >
      {/*
        The night itself. It is this layer's ground, not the section's, and at a faded edge it stops two
        pixels short: at 110%, 125% or 175% display scaling the section's edge falls between two device
        pixels, and the fade (trimmed along that same edge) only part-covers the last row, so a night that
        reached the edge showed through as a grey hairline. Held back, its edge lies under the fade's solid end.
      */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 -z-10 overflow-clip ${green ? "" : "bg-abyss"}`}
        style={{ top: above ? EDGE : 0, bottom: below ? EDGE : 0, background: green ? GREEN : undefined }}
      >
        {glows.map((g, i) => {
          const d = g.drift ?? 40;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: g.x,
                top: g.y,
                width: g.size,
                height: g.size,
                marginLeft: `calc(${g.size} / -2)`,
                marginTop: `calc(${g.size} / -2)`,
                background: `radial-gradient(circle, ${COLORS[g.color]} 0%, transparent 68%)`,
              }}
              animate={
                active
                  ? { x: [0, d, -d * 0.6, 0], y: [0, -d * 0.7, d, 0], scale: [1, 1.08, 0.96, 1] }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={
                active
                  ? { duration: PERIODS[i % PERIODS.length], repeat: Infinity, ease: "easeInOut" }
                  : { duration: reduced ? 0 : 1.2 }
              }
            />
          );
        })}
        {/* The contrast floor, and the texture that hides gradient banding. */}
        {green ? null : <div className="absolute inset-0 bg-abyss/30" />}
        <div className="grain" />
      </div>
      {above ? <div aria-hidden className={`fade-up${FADE_TO[above]}${fadeFrom}`} /> : null}
      {below ? <div aria-hidden className={`fade-down${FADE_TO[below]}${fadeFrom}`} /> : null}
      {children}
    </section>
  );
}
