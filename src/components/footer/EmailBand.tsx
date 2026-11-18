"use client";

import { useRef, type ReactNode } from "react";
import { motion, useAnimationFrame, useInView, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

interface EmailBandProps {
  /** Draws one stretch of the band. `copy` is true for every repeat after the first, which stays out of the tab order and away from screen readers. */
  item: (copy: boolean) => ReactNode;
  /** How many stretches make one run: enough that a run is wider than any screen. */
  repeat?: number;
  /** Pixels per second at rest. */
  speed?: number;
  /** 1 slides to the left, -1 to the right. */
  direction?: 1 | -1;
  className?: string;
}

/**
 * A row that slides without end. It runs only while on screen, eases almost
 * to a stop under the mouse, stops while one of its links has the keyboard,
 * and quickens a little while the page is being scrolled (Motion's
 * useVelocity on the page's scroll, smoothed by a spring).
 */
export function EmailBand({ item, repeat = 4, speed = 42, direction = 1, className }: EmailBandProps) {
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { margin: "120px" });
  const x = useMotionValue(0);
  const rate = useRef(1);
  const hover = useRef(false);
  const focus = useRef(false);

  // Scroll speed → a smooth boost, at most three times the resting speed.
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-2, 0, 2], { clamp: true });

  useAnimationFrame((_, delta) => {
    const el = track.current;
    if (!inView || !el) return;
    const half = el.scrollWidth / 2;
    if (!half) return;
    const target = focus.current ? 0 : hover.current ? 0.12 : 1;
    rate.current += (target - rate.current) * Math.min(1, delta / 200);
    const move = direction * speed * rate.current * (1 + Math.abs(boost.get())) * (Math.min(delta, 64) / 1000);
    x.set(wrap(-half, 0, x.get() - move));
  });

  const run = (first: boolean) => (
    <div aria-hidden={first ? undefined : true} style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
      {Array.from({ length: repeat }, (_, n) => (
        <div key={n} aria-hidden={first && n > 0 ? true : undefined} style={{ display: "contents" }}>
          {item(!(first && n === 0))}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={box}
      className={className}
      style={{ overflow: "clip", direction: "ltr" }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hover.current = true;
      }}
      onPointerLeave={() => {
        hover.current = false;
      }}
      onFocus={() => {
        focus.current = true;
      }}
      onBlur={() => {
        focus.current = false;
      }}
    >
      <motion.div ref={track} style={{ x, display: "flex", width: "max-content" }}>
        {run(true)}
        {run(false)}
      </motion.div>
    </div>
  );
}
