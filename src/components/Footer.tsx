"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { EASE } from "@/lib/motion";
import { EmailBand } from "./footer/EmailBand";
import styles from "./footer/Footer.module.css";

/** Ink at rest; the brand's text green under the mouse or the keyboard. */
const SOLID = { rest: { color: "#16211c" }, hover: { color: "#0b7c43" } };
/** An outline at rest (a white fill hides the contours inside the letters); filled green under the mouse or the keyboard. */
const OUTLINE = {
  rest: { color: "#ffffff", "--stroke": "#b9bfbb" },
  hover: { color: "#0b7c43", "--stroke": "#0b7c43" },
};

const LINE = { rest: { scaleX: 0 }, hover: { scaleX: 1 } };

/** One email in the band: a real link, solid or outlined, with the brand's green square after it. */
function Mail({ email, outline, copy }: { email: string; outline?: boolean; copy: boolean }) {
  return (
    <span className={styles.item}>
      <motion.a
        href={`mailto:${email}`}
        tabIndex={copy ? -1 : undefined}
        className={styles.mail}
        data-outline={outline || undefined}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
        variants={outline ? OUTLINE : SOLID}
        transition={{ duration: 0.3, ease: EASE }}
      >
        {email}
      </motion.a>
      <i className={styles.sq} aria-hidden />
    </span>
  );
}

/**
 * The footer, as the owner asked (2026-11-15): only the email, the studio in
 * Medina, "© 2026 ThinkSync Company" and the privacy page. On white, the
 * email slides by between two hairlines, solid and outlined in turn and soft
 * at both edges; under it one ruled row on the site's grid: the studio, the
 * © line, the privacy page.
 */
export function Footer() {
  const { t, dir, lang } = useLanguage();
  const { footer } = t;
  const email = t.contact.info.email;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <motion.nav className={styles.frame} aria-label={lang === "ar" ? "البريد" : "Email"} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, ease: EASE }}>
        <EmailBand
          className={styles.band}
          direction={dir === "rtl" ? -1 : 1}
          item={(copy) => (
            <>
              <Mail email={email} copy={copy} />
              <Mail email={email} copy outline />
            </>
          )}
        />
      </motion.nav>

      <motion.div className={`shell ${styles.row}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7, delay: 0.15, ease: EASE }}>
        <div className={styles.cell}>
          <span className={styles.label}>{footer.studio}</span>
          <span className={styles.city}>{footer.city}</span>
        </div>
        <div className={`${styles.cell} ${styles.middle}`}>
          <span className={styles.value}>
            © {year} {footer.company}
          </span>
        </div>
        <div className={`${styles.cell} ${styles.end}`}>
          <Link href="/privacy" className={styles.value}>
            <motion.span className={styles.link} initial="rest" animate="rest" whileHover="hover" whileFocus="hover">
              {footer.privacy}
              <motion.i aria-hidden variants={LINE} transition={{ duration: 0.4, ease: EASE }} />
            </motion.span>
          </Link>
        </div>
      </motion.div>
    </footer>
  );
}
