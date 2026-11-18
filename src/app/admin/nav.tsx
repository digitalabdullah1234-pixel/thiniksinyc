"use client";

/**
 * The admin's way around: a glass sidebar on wide screens, a top bar and a
 * tab bar on phones. A green pill slides to the section you open.
 */

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { logout } from "./actions";
import { Icon } from "./icons";
import { EASE, ITEM, Logo, SPRING, STAGGER, ThemeSwitch, ThemeToggle } from "./motion";
import type { Theme } from "./theme";

export type Section = "services" | "work" | "products" | "why" | "requests";
export type NavItem = { id: Section; label: string; short: string; count: number; fresh?: number };

const pad = (n: number) => String(n).padStart(2, "0");

// The sidebar comes in once per visit; moving between pages keeps it still.
let entered = false;

export function SideNav({ items, active, site, theme }: { items: NavItem[]; active: Section; site: string; theme: Theme }) {
  const first = !entered;
  useEffect(() => {
    entered = true;
  }, []);

  return (
    <>
      <motion.aside className="a-side a-glass a-rim" initial={first ? { opacity: 0, x: -18 } : false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, ease: EASE }}>
        <Link href="/" className="a-side-brand" aria-label="ThinkSync admin, home">
          <Logo />
        </Link>
        <span className="a-eyebrow a-side-tag">Admin</span>
        <div>
          <div className="a-nav-label">Website</div>
          <motion.nav className="a-nav" initial={first ? "hidden" : false} animate="show" variants={STAGGER(0.05, 0.15)}>
            {items.map((it) => (
              <motion.div key={it.id} variants={ITEM}>
                <Link href={`/?tab=${it.id}`} className="a-nav-item" aria-current={active === it.id ? "page" : undefined}>
                  {active === it.id && <motion.span layoutId="a-nav-pill" className="a-pill" transition={SPRING} />}
                  <Icon name={it.id} />
                  <span>{it.label}</span>
                  {it.fresh ? <span className="a-new">{it.fresh} new</span> : <span className="a-count">{pad(it.count)}</span>}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </div>
        <div className="a-side-foot">
          <ThemeSwitch initial={theme} />
          <a className="a-nav-item" href={site} target="_blank" rel="noreferrer">
            <Icon name="external" />
            View site
          </a>
          <form action={logout}>
            <button type="submit" className="a-nav-item">
              <Icon name="logout" />
              Sign out
            </button>
          </form>
        </div>
      </motion.aside>

      <motion.header className="a-mtop a-glass a-float a-rim" initial={first ? { opacity: 0, y: -12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <Link href="/" aria-label="ThinkSync admin, home">
          <Logo />
        </Link>
        <div className="a-acts">
          <ThemeToggle initial={theme} />
          <a className="a-btn a-icon" href={site} target="_blank" rel="noreferrer" aria-label="View site">
            <Icon name="external" />
          </a>
          <form action={logout}>
            <button type="submit" className="a-btn a-icon" aria-label="Sign out">
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </motion.header>

      <motion.nav className="a-tabbar a-glass a-float a-rim" aria-label="Sections" initial={first ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}>
        {items.map((it) => (
          <Link key={it.id} href={`/?tab=${it.id}`} className="a-tab" aria-current={active === it.id ? "page" : undefined}>
            {active === it.id && <motion.span layoutId="a-tab-pill" className="a-tab-pill" transition={SPRING} />}
            <Icon name={it.id} />
            <span>{it.short}</span>
            {it.fresh ? <span className="a-badge">{it.fresh}</span> : null}
          </Link>
        ))}
      </motion.nav>
    </>
  );
}
