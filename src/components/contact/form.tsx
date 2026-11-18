"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, CircleAlert, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { serviceCategories, type Service } from "@/content/services";
import { inquiryForm, inquiryHeading, validEmail } from "@/content/inquiry";
import { EASE } from "@/lib/motion";
import { ServiceIconMark } from "@/components/services/screens";
import k from "./form.module.css";

/*
 * The parts of the Start a project form, drawn for the section's brand green:
 * its state and sending, the service picker, the send button, the thank-you.
 */

export type Status = "idle" | "sending" | "success" | "error";

export const EMAIL = "info@thinksync.sa";

const EMPTY = { name: "", email: "", company: "", message: "" };
type Text = keyof typeof EMPTY;
type Checked = "name" | "email" | "service";

const AUTOCOMPLETE: Record<Text, string> = { name: "name", email: "email", company: "organization", message: "off" };

/**
 * The form's state and sending: name, email, company (optional), one service
 * and a message (optional), sent to POST /api/contact with the service's name
 * in English. `id` keeps the fields' ids apart.
 */
export function useInquiry(services: Service[], id: string) {
  const { lang } = useLanguage();
  const t = useMemo(() => {
    const out = {} as Record<keyof typeof inquiryForm | keyof typeof inquiryHeading, string>;
    for (const [key, value] of Object.entries({ ...inquiryForm, ...inquiryHeading })) out[key as keyof typeof out] = value[lang];
    return out;
  }, [lang]);
  const [fields, setFields] = useState(EMPTY);
  const [service, setService] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  // A field's problem shows once it has been left, or once the visitor tried to send without it.
  const [touched, setTouched] = useState<Partial<Record<Checked, boolean>>>({});
  const [sent, setSent] = useState({ name: "", email: "" });
  const chosen = services.find((s) => s.id === service);

  const problems: Record<Checked, string> = {
    name: fields.name.trim() ? "" : t.errName,
    email: validEmail(fields.email) ? "" : t.errEmail,
    service: service ? "" : t.errService,
  };
  const error = (key: Checked) => (touched[key] ? problems[key] : "");
  const ids = { name: `${id}-name`, email: `${id}-email`, company: `${id}-company`, message: `${id}-message`, service: `${id}-service` };

  /** The props of a text field: value, change, autocomplete, and its problem for screen readers. */
  const field = (key: Text) => {
    const checked = key === "name" || key === "email";
    const bad = checked && error(key);
    return {
      id: ids[key],
      name: key,
      value: fields[key],
      autoComplete: AUTOCOMPLETE[key],
      onChange: (e: { target: { value: string } }) => setFields((f) => ({ ...f, [key]: e.target.value })),
      onBlur: checked ? () => setTouched((x) => ({ ...x, [key]: true })) : undefined,
      "aria-invalid": bad ? true : undefined,
      "aria-describedby": bad ? `${ids[key]}-error` : undefined,
      ...(key === "email" ? { type: "email", inputMode: "email" as const, dir: "ltr" as const, spellCheck: false } : {}),
      ...(key === "message" ? { maxLength: 3000 } : {}),
      ...(key === "name" ? { maxLength: 120 } : {}),
      ...(key === "company" ? { maxLength: 160 } : {}),
    };
  };

  const choose = (next: string) => {
    setService(next);
    setTouched((x) => ({ ...x, service: true }));
  };

  /** Sends the request. With something missing it marks it, moves to it, and sends nothing. */
  const submit = async () => {
    const keys: Checked[] = ["name", "email", "service"];
    setTouched({ name: true, email: true, service: true });
    const first = keys.find((key) => problems[key]);
    if (first) {
      document.getElementById(ids[first])?.focus();
      return false;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The service's name in English whatever the page language, so the team reads one set of names.
        body: JSON.stringify({ ...fields, service: chosen?.title.en ?? "" }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setSent({ name: fields.name.trim(), email: fields.email.trim() });
      setStatus("success");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  };

  const reset = () => {
    setFields(EMPTY);
    setService("");
    setTouched({});
    setStatus("idle");
  };

  return { lang, t, fields, field, service, choose, chosen, services, error, status, submit, reset, ids, sent };
}

export type Inquiry = ReturnType<typeof useInquiry>;

/** A field's problem, read out as it appears. Its line is kept, so nothing below it jumps. */
export function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <span className={k.errorSlot}>
      <AnimatePresence initial={false}>
        {text ? (
          <motion.span id={`${id}-error`} role="alert" className={k.error} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
            <CircleAlert size={14} strokeWidth={2.2} aria-hidden className={k.errorIcon} />
            {text}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

/** "(optional)" after a label. */
export function Optional({ q }: { q: Inquiry }) {
  return <span className={k.optional}>({q.t.optional})</span>;
}

/**
 * The service picker: a line field that opens a white list of the services
 * grouped by category, each with its icon. Keyboard: arrows move, Enter or
 * Space picks, Escape closes, a letter jumps to the next service starting with it.
 */
export function ServiceSelect({ q }: { q: Inquiry }) {
  const { lang } = useLanguage();
  const groups = useMemo(() => serviceCategories(q.services), [q.services]);
  const flat = useMemo(() => groups.flatMap((g) => g.services), [groups]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = `${q.ids.service}-list`;
  const bad = q.error("service");

  const show = () => {
    const i = Math.max(0, flat.findIndex((s) => s.id === q.service));
    setActive(i);
    // Open upwards when the window has no room under the field.
    const r = root.current?.getBoundingClientRect();
    if (r) setUp(window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
    setOpen(true);
  };
  const pick = (i: number) => {
    const s = flat[i];
    if (s) q.choose(s.id);
    setOpen(false);
  };

  // Close on a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = flat.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab") {
      setOpen(false);
      return;
    } else if (e.key.length === 1) {
      const ch = e.key.toLowerCase();
      const from = (active + 1) % flat.length;
      const order = [...flat.slice(from), ...flat.slice(0, from)];
      const hit = order.find((s) => s.title[lang].toLowerCase().startsWith(ch));
      if (hit) setActive(flat.indexOf(hit));
    } else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className={k.select} data-open={open || undefined} data-invalid={bad ? true : undefined}>
      <button
        type="button"
        id={q.ids.service}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={bad ? true : undefined}
        aria-describedby={bad ? `${q.ids.service}-error` : undefined}
        aria-labelledby={`${q.ids.service}-label ${q.ids.service}`}
        className={k.trigger}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        {q.chosen ? (
          <span className={k.value}>
            <ServiceIconMark icon={q.chosen.icon} size={18} />
            {q.chosen.title[lang]}
          </span>
        ) : (
          <span className={k.placeholder}>{q.t.servicePh}</span>
        )}
        <ChevronDown size={18} strokeWidth={2} aria-hidden className={k.chevron} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={listId}
            role="listbox"
            aria-labelledby={`${q.ids.service}-label`}
            className={k.list}
            data-up={up || undefined}
            initial={{ opacity: 0, y: up ? 6 : -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: up ? 4 : -4, scale: 0.985 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {groups.map((g) => (
              <li key={g.id} role="presentation">
                <p className={k.group} id={`${listId}-g-${g.id}`}>
                  {g.label[lang]}
                </p>
                <ul role="group" aria-labelledby={`${listId}-g-${g.id}`}>
                  {g.services.map((s) => {
                    const i = flat.indexOf(s);
                    const selected = s.id === q.service;
                    return (
                      <li
                        key={s.id}
                        id={`${listId}-${i}`}
                        data-i={i}
                        role="option"
                        aria-selected={selected}
                        data-active={i === active || undefined}
                        className={k.option}
                        onPointerEnter={() => setActive(i)}
                        onClick={() => pick(i)}
                      >
                        <ServiceIconMark icon={s.icon} size={17} />
                        <span>{s.title[lang]}</span>
                        {selected && <Check size={16} strokeWidth={2.5} aria-hidden className={k.tick} />}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The send button: the site's bevelled call to action, white on the green. */
export function SendButton({ q }: { q: Inquiry }) {
  return (
    <motion.button type="submit" disabled={q.status === "sending"} className={k.send} whileTap={{ scale: 0.985 }}>
      <span>{q.status === "sending" ? q.t.sending : q.t.submit}</span>
      <ArrowUpRight size={18} strokeWidth={2} aria-hidden className={k.sendArrow} />
    </motion.button>
  );
}

/** The line beside the button, with the privacy policy linked. */
export function Consent({ q }: { q: Inquiry }) {
  return (
    <p className={k.consent}>
      {q.t.consentBefore}
      <Link href="/privacy">{q.t.consentLink}</Link>
      {q.t.consentAfter}
    </p>
  );
}

/** When sending failed. */
export function SendError({ q, className }: { q: Inquiry; className?: string }) {
  return q.status === "error" ? (
    <p role="alert" className={`${k.sendError} ${className ?? ""}`}>
      <CircleAlert size={16} strokeWidth={2.2} aria-hidden className={k.errorIcon} />
      {q.t.error}
    </p>
  ) : null;
}

/** "Prefer email? info@thinksync.sa" */
export function EmailUs({ q, className }: { q: Inquiry; className?: string }) {
  return (
    <p className={`${k.emailUs} ${className ?? ""}`}>
      <span>{q.t.emailUs}</span>
      <a href={`mailto:${EMAIL}`} dir="ltr">
        <Mail size={16} strokeWidth={1.75} aria-hidden />
        {EMAIL}
      </a>
    </p>
  );
}

/** What stands in the form's place once the request is sent. */
function Done({ q }: { q: Inquiry }) {
  const text = q.t.doneText.replace("{name}", q.sent.name).replace("{email}", q.sent.email);
  return (
    <motion.div role="status" className={k.done} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
      <span className={k.doneMark} aria-hidden>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.25, ease: EASE }} />
        </svg>
      </span>
      <p className={k.doneTitle}>{q.t.done}</p>
      <p className={k.doneText}>{text}</p>
      <button type="button" className={k.again} onClick={q.reset}>
        {q.t.again}
      </button>
    </motion.div>
  );
}

/** Swaps the form for the thank-you once sent, with a soft cross-fade. */
export function FormOrDone({ q, children }: { q: Inquiry; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {q.status === "success" ? (
        <Done key="done" q={q} />
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
