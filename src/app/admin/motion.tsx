"use client";

/**
 * The admin's moving parts, all Framer Motion: the drifting light behind the
 * glass, things rising in, rows that glide when reordered and slide out when
 * deleted, the delete dialog, the "saved" toast, the theme switch and the
 * Medina clock.
 */

import { useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Icon } from "./icons";
import { THEME_COOKIE, type Theme } from "./theme";

export const EASE = [0.22, 1, 0.36, 1] as const;
/** A soft spring with a little give: pills, dialogs, the toast. */
export const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const;
/** Rows finding their new place after a move. */
const GLIDE = { type: "spring", stiffness: 300, damping: 30 } as const;

/** Something that rises into place: from a little lower, blurred, transparent. */
export const ITEM: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE }, transitionEnd: { filter: "none" } },
};

/** A container whose motion children rise one after another. */
export const STAGGER = (each = 0.07, first = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: first } },
});

const noop = () => () => {};
/** True once running in the browser (portals need document.body). */
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

// ---------------------------------------------------------------- the ground

/** The light behind the glass: three soft pools drifting slowly, and grain. */
export function Ground() {
  const drift = (d: number) => ({ duration: d, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }) as const;
  return (
    <div className="a-ground" aria-hidden>
      <motion.i className="a-blob a-b1" animate={{ x: ["0vmax", "8vmax"], y: ["0vmax", "6vmax"], scale: [1, 1.08] }} transition={drift(26)} />
      <motion.i className="a-blob a-b2" animate={{ x: ["0vmax", "-10vmax"], y: ["0vmax", "8vmax"], scale: [1, 0.94] }} transition={drift(32)} />
      <motion.i className="a-blob a-b3" animate={{ x: ["0vmax", "-6vmax"], y: ["0vmax", "-8vmax"], scale: [1, 1.1] }} transition={drift(38)} />
      <div className="a-grain" />
    </div>
  );
}

/** Riyadh's skyline under the sign-in card, a green light running along its roofs. */
const SKY =
  "M0 190V168h70v-14h46v22h40v-40h34v28h52v-18h40v32h44L426 34l6-30 6 30 52 156h40v-48h36v-22h44v36h50v-26h40v60h28V52c6 34 20 58 38 66 18-8 32-32 38-66v138h34v-44h44v20h46v-34h40v58h30l14-128h30l14 128h40v-28h48v-36h44v46h52v-22h56v40h70";
export function Skyline() {
  return (
    <svg className="a-skyline" viewBox="0 0 1440 190" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <path d={SKY} />
      <circle cx="432" cy="86" r="9" />
      <path d="M731 70h70" />
      <motion.path className="a-run" d={SKY} initial={{ pathLength: 0.03, pathSpacing: 1, pathOffset: 0 }} animate={{ pathOffset: 1 }} transition={{ duration: 9, ease: "linear", repeat: Infinity }} />
    </svg>
  );
}

// ------------------------------------------------------------------ entrances

export function Rise({ children, className, delay = 0, y = 14 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }} transition={{ duration: 0.6, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/** A list whose rows rise in one after another, glide when reordered and slide out when deleted. */
export function RowList({ children, className = "a-rows" }: { children: ReactNode; className?: string }) {
  return (
    <motion.ul className={className} initial="hidden" animate="show" variants={STAGGER(0.07, 0.12)}>
      <AnimatePresence>{children}</AnimatePresence>
    </motion.ul>
  );
}

/** One row: glass, a soft light under the pointer, a small lift on hover. */
export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  const light = (e: PointerEvent<HTMLLIElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - box.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - box.top}px`);
  };
  return (
    <motion.li
      layout="position"
      className={`a-row a-glass a-rim ${className}`}
      variants={ITEM}
      exit={{ opacity: 0, x: 48, scale: 0.98, filter: "blur(6px)", transition: { duration: 0.32, ease: "easeIn" } }}
      whileHover={{ y: -2, transition: { duration: 0.3, ease: EASE } }}
      transition={{ layout: GLIDE }}
      onPointerMove={light}
    >
      {children}
    </motion.li>
  );
}

// ------------------------------------------------------------------- dialogs

/**
 * A delete button that asks first, in a glass dialog. It sits inside the
 * delete form; "Delete" in the dialog submits that form.
 */
export function ConfirmButton({ children, title, detail = "It disappears from the website at once. This cannot be undone.", className = "a-btn a-icon a-danger", label }: { children: ReactNode; title: string; detail?: string; className?: string; label?: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const heading = useId();

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [open]);

  const confirm = () => {
    setOpen(false);
    button.current?.form?.requestSubmit();
  };

  return (
    <>
      <motion.button ref={button} type="button" className={className} aria-label={label} onClick={() => setOpen(true)} whileTap={{ scale: 0.94 }}>
        {children}
      </motion.button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div className="a-scrim" key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
                <motion.div className="a-dialog a-glass a-rim" role="alertdialog" aria-modal="true" aria-labelledby={heading} initial={{ opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: "easeIn" } }}>
                  <span className="a-dlg-ico">
                    <Icon name="trash" />
                  </span>
                  <h2 id={heading}>{title}</h2>
                  <p>{detail}</p>
                  <div className="a-dlg-btns">
                    <button type="button" className="a-btn" onClick={() => setOpen(false)} autoFocus>
                      Cancel
                    </button>
                    <motion.button type="button" className="a-btn a-red" onClick={confirm} whileTap={{ scale: 0.96 }}>
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/** "Saved": drops in from the top after a save, then leaves by itself. */
export function SavedToast({ site }: { site: string }) {
  const [open, setOpen] = useState(true);
  const mounted = useMounted();
  useEffect(() => {
    // A reload must not say "saved" again.
    const url = new URL(location.href);
    url.searchParams.delete("saved");
    history.replaceState(null, "", url.pathname + url.search);
    const t = setTimeout(() => setOpen(false), 3800);
    return () => clearTimeout(t);
  }, []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="a-toast a-glass a-float a-rim" role="status" initial={{ opacity: 0, y: -28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }} exit={{ opacity: 0, y: -16, transition: { duration: 0.25, ease: "easeIn" } }}>
          <span className="a-toast-ok">
            <svg className="a-i" viewBox="0 0 24 24" aria-hidden>
              <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }} />
            </svg>
          </span>
          <span>Saved. The website now shows the change.</span>
          <a href={site} target="_blank" rel="noreferrer">
            View ↗
          </a>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// --------------------------------------------------------------------- clock

// Medina keeps Saudi time, the zone named after Riyadh.
const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit" });
const everyTenSeconds = (tick: () => void) => {
  const t = setInterval(tick, 10_000);
  return () => clearInterval(t);
};

export function Clock({ className = "a-clock" }: { className?: string }) {
  const time = useSyncExternalStore(everyTenSeconds, () => TIME.format(new Date()), () => "--:--");
  return (
    <span className={className}>
      <i className="a-dot" aria-hidden />
      Medina {time}
    </span>
  );
}

// --------------------------------------------------------------------- theme

const listeners = new Set<() => void>();
const onTheme = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const currentTheme = (): Theme => (document.body.dataset.theme === "frost" ? "frost" : "night");
function setTheme(theme: Theme) {
  document.body.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((fn) => fn());
}
const useTheme = (initial: Theme) => useSyncExternalStore(onTheme, currentTheme, () => initial);

/** A · Night glass / B · Frost glass, a pill sliding between them. */
export function ThemeSwitch({ initial }: { initial: Theme }) {
  const theme = useTheme(initial);
  const pill = useId();
  return (
    <div className="a-theme" role="group" aria-label="Look">
      {(["night", "frost"] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
          {theme === t && <motion.span layoutId={pill} className="a-theme-pill" transition={SPRING} />}
          <Icon name={t === "night" ? "moon" : "sun"} />
          <span>{t === "night" ? "Night" : "Frost"}</span>
        </button>
      ))}
    </div>
  );
}

/** The phone's version: one button, the icon turning over. */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const theme = useTheme(initial);
  const next = theme === "night" ? "frost" : "night";
  return (
    <button type="button" className="a-btn a-icon" aria-label={`Switch to the ${next} look`} onClick={() => setTheme(next)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} className="a-flip" initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={{ duration: 0.28, ease: EASE }}>
          <Icon name={theme === "night" ? "moon" : "sun"} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/** The logo: white on night, black on frost. */
export function Logo({ className = "a-logo" }: { className?: string }) {
  return (
    <span className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="a-on-night" src="/thinksync_white.png" alt="ThinkSync" width={558} height={194} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="a-on-frost" src="/thinksync_blacklogo.png" alt="" width={558} height={194} />
    </span>
  );
}
