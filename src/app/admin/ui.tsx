import type { ReactNode } from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { requestHost, siteHost } from "@/lib/admin-host";
import { getInquiries, getProducts, getProjects, getServices, getWhy } from "@/lib/store";
import { Icon } from "./icons";
import { Clock, Rise } from "./motion";
import { SideNav, type NavItem, type Section } from "./nav";
import { THEME_COOKIE, readTheme } from "./theme";

/** The site's address, next to the admin's own (on the admin's domain "/" is the panel). */
export async function siteAddress() {
  return `//${siteHost(requestHost(await headers()))}/`;
}

const LABELS: Record<Section, [string, string]> = {
  services: ["Services", "Services"],
  work: ["Our Work", "Work"],
  products: ["Our Products", "Products"],
  why: ["Why us", "Why us"],
  requests: ["Requests", "Requests"],
};

/** Every signed-in page: the sidebar (or the phone's bars), and the page under a line with where you are and Medina's time. */
export async function Shell({ section, crumb, children }: { section: Section; crumb?: string; children: ReactNode }) {
  const [services, projects, products, why, inquiries, site, jar] = await Promise.all([getServices(), getProjects(), getProducts(), getWhy(), getInquiries(), siteAddress(), cookies()]);
  const counts: Record<Section, number> = { services: services.length, work: projects.length, products: products.length, why: why.length, requests: inquiries.length };
  const fresh = inquiries.filter((i) => !i.seen).length;
  const items: NavItem[] = (Object.keys(LABELS) as Section[]).map((id) => ({ id, label: LABELS[id][0], short: LABELS[id][1], count: counts[id], fresh: id === "requests" ? fresh : undefined }));

  return (
    <div className="a-app">
      <SideNav items={items} active={section} site={site} theme={readTheme(jar.get(THEME_COOKIE)?.value)} />
      <main className="a-main">
        <div className="a-topline">
          <span>
            Website / {LABELS[section][0]}
            {crumb ? ` / ${crumb}` : ""}
          </span>
          <Clock />
        </div>
        {children}
      </main>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A page's title (with its count), its button, and a line about it. */
export function Head({ title, count, kicker, note, children }: { title: string; count?: number; kicker?: string; note?: ReactNode; children?: ReactNode }) {
  return (
    <Rise className="a-headwrap" y={10}>
      {kicker && <span className="a-eyebrow">{kicker}</span>}
      <div className="a-head">
        <h1>
          {title}
          {count !== undefined && <sup>{pad(count)}</sup>}
        </h1>
        {children}
      </div>
      {note && <p className="a-note">{note}</p>}
    </Rise>
  );
}

/** Back to a section's list. */
export function Back({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Rise y={6}>
      <Link href={href} className="a-back">
        <Icon name="back" />
        {children}
      </Link>
    </Rise>
  );
}
