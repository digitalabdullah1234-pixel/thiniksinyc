"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { CodeXml, Server, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { processHeading, processPhases } from "@/content/process";
import type { Localized } from "@/content/types";
import { EASE } from "@/lib/motion";
import { DarkSection, type GlowSpec } from "./DarkSection";
import { SectionHeading } from "./SectionHeading";
import { PROCESS_PHOTOS } from "./process/photos";
import s from "./process/Process.module.css";

const GLOWS: GlowSpec[] = [
  { x: "8%", y: "18%", size: "50rem", color: "emerald" },
  { x: "92%", y: "80%", size: "44rem", color: "teal" },
];

const TRACKS = ["software", "hardware"] as const;
type Track = (typeof TRACKS)[number];

const TRACK: Record<Track, { Icon: LucideIcon; label: Localized }> = {
  software: { Icon: CodeXml, label: { en: "Software", ar: "البرمجيات" } },
  hardware: { Icon: Server, label: { en: "Hardware", ar: "الأجهزة" } },
};

const N = processPhases.length;

const two = (n: number) => String(n).padStart(2, "0");

/** One phase's card. It holds at the top while the next one slides over it, sinking back a little. */
function Card({ n, progress }: { n: number; progress: MotionValue<number> }) {
  const { lang } = useLanguage();
  const phase = processPhases[n];
  const start = n / N;
  // Each card ends a step smaller than the one over it, so the deck shows its edges.
  const scale = useTransform(progress, [start, 1], [1, 1 - (N - 1 - n) * 0.035]);
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / N), 1], [0, 0.55, 0.55]);

  return (
    <li className={s.slot} style={{ top: `calc(var(--stack-top) + ${n} * var(--stack-step))` }}>
      <motion.article className={s.card} style={{ scale }}>
        <div className={s.text}>
          <div className={s.top}>
            <span className={s.no}>{two(n + 1)}</span>
            <span className={s.count}>/ {two(N)}</span>
          </div>
          <h3 className={s.name}>{phase.name[lang]}</h3>
          <div className={s.steps}>
            {TRACKS.map((track) => {
              const { Icon, label } = TRACK[track];
              return (
                <div key={track} className={s.step}>
                  <span className={s.tag} data-track={track}>
                    <Icon size={13} strokeWidth={2} aria-hidden />
                    {label[lang]}
                  </span>
                  <b>{phase[track].title[lang]}</b>
                  <span>{phase[track].text[lang]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.pics}>
          {TRACKS.map((track) => {
            const photo = PROCESS_PHOTOS[n][track];
            return (
              <div key={track} className={s.pic} data-track={track}>
                <Image src={photo.src} alt={photo.alt[lang]} fill sizes="(min-width: 64rem) 26vw, 50vw" className={s.photo} style={photo.pos ? { objectPosition: photo.pos } : undefined} draggable={false} />
              </div>
            );
          })}
        </div>

        <motion.div className={s.dim} style={{ opacity: dim }} aria-hidden />
      </motion.article>
    </li>
  );
}

/**
 * Our process, as a stack of cards: each phase is a card with its software
 * step, its hardware step and a real photo of each. As you scroll, the cards
 * hold at the top of the screen one over another, the ones underneath sinking
 * back, until all six lie in a deck.
 */
export function Process() {
  const { lang } = useLanguage();
  const deck = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: deck, offset: ["start start", "end end"] });

  return (
    <DarkSection id="process" glows={GLOWS} above="white" below="white">
      <div className={`shell ${s.wrap}`}>
        <div className={s.head}>
          <SectionHeading eyebrow={processHeading.eyebrow[lang]} title={processHeading.title[lang]} accent={processHeading.accent[lang]} tone="dark" className={s.heading} />
          <p className={s.intro}>{processHeading.intro[lang]}</p>
        </div>

        <motion.ol ref={deck} className={s.deck} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.8, ease: EASE }}>
          {processPhases.map((_, n) => (
            <Card key={n} n={n} progress={scrollYProgress} />
          ))}
        </motion.ol>
      </div>
    </DarkSection>
  );
}
