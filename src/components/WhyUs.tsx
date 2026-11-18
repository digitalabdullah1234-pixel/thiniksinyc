"use client";

import { useId, useRef } from "react";
import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { WhyHeading, WhyPoint } from "@/content/why";
import { EASE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";
import styles from "./why/WhyUs.module.css";

/*
 * The drawing, in its own units (the SVG's viewBox): two rings of radius R on
 * one line, their centres the same distance either side of the middle. That
 * distance runs from APART (a gap between the rings) to JOINED (overlapping).
 */
const VIEW_W = 660;
const VIEW_H = 340;
const R = 150;
const MID = VIEW_W / 2;
const APART = 168;
const JOINED = 84;
/**
 * A name rests in the middle of the part of its ring that stays its own once
 * the two have joined (MID - R). While the rings stand apart that is a little
 * off the ring's centre, so the name starts this far out, as a share of the
 * drawing's width, and comes in as the rings do.
 */
const NAME_DRIFT = ((R - APART) / VIEW_W) * 100;
/** The word where the rings meet has only the width of the overlap to sit in; a longer one is left out. */
const CORE_MAX_LETTERS = 9;

// Each ring draws itself once, when the drawing first comes into view; its name follows.
const ring: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.25, delay: i * 0.12, ease: EASE }, opacity: { duration: 0.2, delay: i * 0.12 } },
  }),
};
const name: Variants = {
  hidden: { opacity: 0 },
  show: (i: number) => ({ opacity: 1, transition: { duration: 0.6, delay: 0.75 + i * 0.12, ease: EASE } }),
};
// The shared part waits for its two rings: a quick scroll never shows green between half-drawn lines.
const shared: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, delay: 1, ease: EASE } },
};
// Each reason rises in after the one before it.
const row: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.75, delay: i * 0.09, ease: EASE } }),
};

/**
 * Why us. Two rings, the client's business and ThinkSync, stand apart the way
 * a client and a vendor do. As the section scrolls in they slide into each
 * other; the part they share fills green and takes the headline's green word:
 * partners, not vendors. The admin's reasons run beside the drawing, which
 * stays in view while they pass. Hidden when there are no reasons.
 */
export function WhyUs({ heading, points }: { heading: WhyHeading; points: WhyPoint[] }) {
  const { lang, dir } = useLanguage();
  const art = useRef<HTMLDivElement>(null);
  const clip = useId();
  // From the drawing entering at the foot of the screen to its middle reaching the middle of it.
  const { scrollYProgress } = useScroll({ target: art, offset: ["start 0.96", "center 0.56"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.6 });
  /** Half the distance between the two centres. */
  const half = useTransform(p, [0, 1], [APART, JOINED]);
  const ax = useTransform(half, (v) => MID - v);
  const bx = useTransform(half, (v) => MID + v);
  // The names keep to their rings: out with them at first, in as they join.
  // "you" is on the reading side (left in English, right in Arabic).
  const out = dir === "rtl" ? -1 : 1;
  const youX = useTransform(p, (v) => `${out * NAME_DRIFT * (1 - v)}%`);
  const usX = useTransform(p, (v) => `${-out * NAME_DRIFT * (1 - v)}%`);
  // The shared word comes up once the overlap is wide enough to hold it.
  const coreOpacity = useTransform(p, [0, 0.72, 1], [0, 0, 1]);

  if (!points.length) return null;

  const you = heading.rings.you[lang].trim();
  const us = heading.rings.us[lang].trim();
  const accent = heading.accent[lang].trim();
  const core = accent && accent.length <= CORE_MAX_LETTERS ? accent : "";

  return (
    <section id="why" className={styles.section}>
      <div className={`shell ${styles.grid}`}>
        <div className={styles.head}>
          <SectionHeading title={heading.title[lang]} accent={heading.accent[lang] || undefined} tone="light" />
        </div>
        <motion.div ref={art} className={styles.art} aria-hidden initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <div className={styles.stage}>
            <svg className={styles.svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
              <defs>
                <clipPath id={clip}>
                  <motion.circle cx={ax} cy={VIEW_H / 2} r={R} />
                </clipPath>
              </defs>
              {/* What the two share: the second ring's disc, cut to the first ring. */}
              <motion.circle className={styles.lens} cx={bx} cy={VIEW_H / 2} r={R} clipPath={`url(#${clip})`} variants={shared} />
              <motion.circle className={styles.ring} cx={ax} cy={VIEW_H / 2} r={R} variants={ring} custom={0} />
              <motion.circle className={styles.ring} cx={bx} cy={VIEW_H / 2} r={R} variants={ring} custom={1} />
            </svg>
            {you ? (
              <motion.div className={styles.layer} style={{ x: youX }} variants={name} custom={0}>
                <span className={`${styles.name} ${styles.you}`}>{you}</span>
              </motion.div>
            ) : null}
            {us ? (
              <motion.div className={styles.layer} style={{ x: usX }} variants={name} custom={1}>
                <span className={`${styles.name} ${styles.us}`}>{us}</span>
              </motion.div>
            ) : null}
            {core ? (
              <motion.div className={styles.layer} variants={shared}>
                <motion.span className={`${styles.name} ${styles.core}`} style={{ opacity: coreOpacity }}>
                  {core}
                </motion.span>
              </motion.div>
            ) : null}
          </div>
        </motion.div>
        <motion.ol className={styles.list} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {points.map((pt, i) => (
            <motion.li key={pt.id} className={styles.row} variants={row} custom={i}>
              <span className={styles.n} dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className={styles.title}>{pt.title[lang]}</h3>
                <p className={styles.text}>{pt.text[lang]}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
