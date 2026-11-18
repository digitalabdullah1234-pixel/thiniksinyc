"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { lightColor, posterTone, type Product } from "@/content/products";
import type { Lang, SiteContent } from "@/lib/translations";
import { useIntroDone } from "@/lib/intro";
import { EASE, press, useSettleChildren } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";
import { ProductScreen } from "./products/screens";
import styles from "./products/Products.module.css";

const two = (n: number) => String(n).padStart(2, "0");
/** Matches the phone's width inside a poster (Products.module.css). */
const SCREEN_SIZES = "(width < 40rem) 36vw, 16rem";
/** How a poster answers the pointer. */
const HOVER = { duration: 0.55, ease: EASE } as const;
/** Posters past the fourth come in with it: a long row must not keep its end waiting. */
const wait = (i: number) => Math.min(i, 3) * 0.12;

// The entrance, played once when the row scrolls into view: each poster
// rises, its name climbs up its edge out of a slot, its phone swings up from
// the foot. One after another along the row.
const rise: Variants = {
  hidden: { opacity: 0, y: 44 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: wait(i), ease: EASE } }),
};
// The name's box is turned half round (it reads upward), so "up the edge" is a move towards +y here.
const climb: Variants = {
  hidden: { opacity: 0, y: "-104%" },
  show: (i: number) => ({
    opacity: 1,
    y: "0%",
    transition: { duration: 1.15, delay: 0.12 + wait(i), ease: EASE, opacity: { duration: 0.01, delay: 0.12 + wait(i) } },
  }),
};
const swing = (lean: number): Variants => ({
  hidden: { y: "30%", rotate: lean * 2.8 },
  show: (i: number) => ({ y: "0%", rotate: lean, transition: { duration: 1.25, delay: 0.18 + wait(i), ease: EASE } }),
});

/**
 * True while the row holds more posters than fit, so it slides sideways.
 * Measured again whenever the row or the window changes size, and after every
 * render (React re-reads a store's snapshot once the page is updated), so a
 * product added or removed in the admin is counted too.
 */
function useSlides(row: HTMLElement | null) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!row) return () => {};
      const sizes = new ResizeObserver(onChange);
      sizes.observe(row);
      window.addEventListener("resize", onChange);
      return () => {
        sizes.disconnect();
        window.removeEventListener("resize", onChange);
      };
    },
    [row],
  );
  return useSyncExternalStore(
    subscribe,
    () => !!row && row.scrollWidth > row.clientWidth + 1,
    () => false,
  );
}

/**
 * Our products: ThinkSync's own software, each as a poster. Its name runs up
 * the poster's edge in large type; beside it, what the product is for and its
 * button; from the foot, a phone with the product's screen leans out, and
 * stands up when the poster is pointed at.
 *
 * One, two or three products share the page's width, side by side on one
 * line: they hold their places while the page scrolls. More than fit stand in a
 * row that slides sideways (a swipe, a trackpad, or the arrows), so the
 * section stays one poster tall however many the admin adds. Hidden when
 * there are none.
 */
export function Products({ list }: { list: Product[] }) {
  const { t, lang, dir } = useLanguage();
  const { products } = t;
  const { more } = t.projects;
  const rtl = dir === "rtl";
  const row = useRef<HTMLUListElement>(null);
  // The row as state too: what measures it must run again once the row is on the page.
  const [rowEl, setRowEl] = useState<HTMLUListElement | null>(null);
  const attachRow = useCallback((el: HTMLUListElement | null) => {
    row.current = el;
    setRowEl(el);
  }, []);
  const introDone = useIntroDone();
  const slides = useSlides(rowEl);
  const { scrollXProgress } = useScroll({ container: row });
  // Arabic scrolls the other way (scrollLeft runs negative): the bar fills from the right.
  const fill = useTransform(scrollXProgress, (p) => Math.min(1, Math.abs(p)));
  const [ends, setEnds] = useState({ first: true, last: false });

  useMotionValueEvent(fill, "change", (p) => setEnds({ first: p < 0.01, last: p > 0.99 }));
  // Whatever happens to the entrance, no poster or name is left unseen.
  useSettleChildren(row, "[data-settle]", introDone, 2600);

  /** One poster along, in the reading direction. */
  const step = (by: number) => {
    const el = row.current;
    const slot = el?.firstElementChild;
    if (!el || !slot) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: by * (slot.getBoundingClientRect().width + gap) * (rtl ? -1 : 1), behavior: "smooth" });
  };

  if (!list.length) return null;

  return (
    <section id="products" className={styles.section}>
      <div className={`shell ${styles.head}`}>
        <SectionHeading
          tone="light"
          eyebrow={products.eyebrow}
          title={products.title}
          accent={products.titleAccent}
          intro={products.intro}
          className="max-w-3xl"
        />
        {slides && (
          <div className={styles.arrows}>
            <motion.button type="button" aria-label={more.prev} disabled={ends.first} onClick={() => step(-1)} {...press}>
              {rtl ? <ArrowRight size={18} aria-hidden /> : <ArrowLeft size={18} aria-hidden />}
            </motion.button>
            <motion.button type="button" aria-label={more.next} disabled={ends.last} onClick={() => step(1)} {...press}>
              {rtl ? <ArrowLeft size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
            </motion.button>
          </div>
        )}
      </div>

      <motion.ul
        ref={attachRow}
        className={styles.row}
        data-count={Math.min(list.length, 4)}
        initial="hidden"
        whileInView={introDone ? "show" : undefined}
        viewport={{ once: true, amount: 0.2 }}
      >
        {list.map((product, i) => (
          <Poster
            key={product.id}
            product={product}
            index={i}
            count={list.length}
            lang={lang}
            rtl={rtl}
            labels={products}
          />
        ))}
      </motion.ul>

      {slides && (
        <div className="shell">
          <div className={styles.bar} aria-hidden>
            <motion.i style={{ scaleX: fill, transformOrigin: rtl ? "100% 50%" : "0% 50%" }} />
          </div>
        </div>
      )}
    </section>
  );
}

interface PosterProps {
  product: Product;
  index: number;
  count: number;
  lang: Lang;
  rtl: boolean;
  labels: SiteContent["products"];
}

function Poster({ product, index, count, lang, rtl, labels }: PosterProps) {
  const [hot, setHot] = useState(false);
  const name = product.name[lang] || product.name.en;
  const description = product.description[lang];
  const external = !!product.link;
  const href = product.link ?? "#contact";
  const label = external ? labels.ctaVisit : labels.ctaAsk;
  const target = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  // The phone leans towards the words, whichever side they are on.
  const lean = rtl ? 5 : -5;
  // The poster's colour (picked in the admin, else night and green in turn); a light one takes dark words.
  const { tone, color } = posterTone(product, index);
  const dark = !!color && lightColor(color);
  const ink = dark ? "#0b1a12" : "#ffffff";

  /*
   * With a description, the CSS keeps room for three lines of it, and the
   * phone sinks below that room. Here the room is measured instead: the
   * words' real foot plus the same space a poster without a description
   * leaves (11.75rem against its ~9rem of words), so a one-line description
   * lowers the phone only by that line.
   */
  const copyRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const copy = copyRef.current;
    const phone = phoneRef.current;
    if (!description || !copy || !phone) return;
    const fit = () => phone.style.setProperty("--words", `max(11.75rem, calc(${copy.offsetTop + copy.offsetHeight}px + 2.75rem))`);
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(copy);
    return () => {
      watch.disconnect();
      phone.style.removeProperty("--words");
    };
  }, [description]);

  return (
    <li className={styles.slot}>
      <motion.article
        className={styles.poster}
        variants={rise}
        custom={index}
        data-settle
        onHoverStart={() => setHot(true)}
        onHoverEnd={() => setHot(false)}
      >
        <motion.div
          className={styles.face}
          data-tone={tone}
          data-ink={dark ? "dark" : undefined}
          data-desc={description ? "" : undefined}
          style={{ "--chars": Math.max(1, Array.from(name).length), ...(color ? { "--tone": color } : {}) } as CSSProperties}
          animate={{ y: hot ? -8 : 0 }}
          transition={HOVER}
        >
          {/* A product alone needs no place in a count. */}
          {count > 1 ? (
            <span className={styles.n}>
              <span dir="ltr">
                {two(index + 1)} / {two(count)}
              </span>
            </span>
          ) : null}

          <span className={styles.nameBox} aria-hidden>
            <motion.span className={styles.big} data-script={/[؀-ۿ]/.test(name) ? "ar" : undefined} variants={climb} custom={index} data-settle>
              {name}
            </motion.span>
          </span>

          <div className={styles.copy} ref={copyRef}>
            <h3 className={styles.name}>{name}</h3>
            <p className={styles.tagline}>{product.tagline[lang]}</p>
            {description ? <p className={styles.desc}>{description}</p> : null}
            <motion.a
              href={href}
              className={styles.cta}
              aria-label={`${label}: ${name}`}
              {...target}
              animate={{ backgroundColor: hot ? (dark ? "rgba(11, 26, 18, 1)" : "rgba(255, 255, 255, 1)") : dark ? "rgba(11, 26, 18, 0)" : "rgba(255, 255, 255, 0)", color: hot ? (dark ? "#ffffff" : "#0b2a1c") : ink }}
              transition={HOVER}
            >
              <span>{label}</span>
              <motion.span className={styles.arrow} animate={{ x: hot ? (rtl ? -3 : 3) : 0, y: hot ? -3 : 0 }} transition={HOVER}>
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
              </motion.span>
            </motion.a>
          </div>

          <motion.div className={styles.phone} ref={phoneRef} variants={swing(lean)} custom={index}>
            <motion.div className={styles.stand} animate={{ rotate: hot ? -lean : 0, y: hot ? "-3.5%" : "0%" }} transition={{ duration: 0.7, ease: EASE }}>
              <motion.span className={styles.halo} animate={{ scale: hot ? 1.07 : 1, opacity: hot ? 1 : 0.8 }} transition={{ duration: 0.9, ease: EASE }} aria-hidden>
                <i />
                <i />
              </motion.span>
              <div className={styles.device}>
                <div className={styles.screen}>
                  {product.image ? (
                    <Image src={product.image} alt="" fill sizes={SCREEN_SIZES} className={styles.shot} />
                  ) : (
                    <ProductScreen product={product} lang={lang} rtl={rtl} />
                  )}
                  <span className={styles.island} aria-hidden />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* The whole poster is its button: this covers it for the pointer; the button above is the one keyboards and readers meet. */}
          <a href={href} className={styles.hit} tabIndex={-1} aria-hidden {...target} />
        </motion.div>
      </motion.article>
    </li>
  );
}
