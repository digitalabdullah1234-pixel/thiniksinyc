"use client";

import { motion } from "framer-motion";
import type { Service } from "@/content/services";
import { EASE } from "@/lib/motion";
import { DarkSection, type GlowSpec } from "./DarkSection";
import { SectionHeading } from "./SectionHeading";
import { Consent, EmailUs, FieldError, FormOrDone, Optional, SendButton, SendError, ServiceSelect, useInquiry } from "./contact/form";
import s from "./contact/Contact.module.css";

/** The night's green glows, as in the other dark sections: one behind the heading, one under the form. */
const GLOWS: GlowSpec[] = [
  { x: "12%", y: "22%", size: "50rem", color: "emerald", drift: 30 },
  { x: "88%", y: "82%", size: "46rem", color: "teal", drift: 30 },
];

/** The rings' radii, as parts of the largest; the inner ones a touch brighter. */
const RINGS = [0.3, 0.52, 0.76, 1];

/**
 * Quiet white rings rising from the foot of the reading side, as a signal
 * goes out: drawn once as the section comes in, then still. They sit over the
 * night and under its faded foot, so their lower halves sink into the white.
 */
function Rings() {
  return (
    <svg className={s.rings} viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden focusable="false">
      {RINGS.map((r, i) => {
        const R = r * 100;
        return (
          <motion.path
            key={r}
            d={`M 0 ${100 + R} A ${R} ${R} 0 0 0 0 ${100 - R}`}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.36 - i * 0.06}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.8, delay: 0.25 + i * 0.14, ease: EASE }}
          />
        );
      })}
    </svg>
  );
}

/**
 * Start a project, on the same night as the other dark sections (the owner
 * asked for it on 2026-11-15; it was the brand green). A large heading on the reading side;
 * beside it the form with its fields as quiet white lines: full name, email,
 * company (optional), a service, and a message (optional). Sent to the admin's
 * Requests tab and by email (POST /api/contact). The night thins out into the
 * white of Why us above and of the footer below.
 */
export function Contact({ services }: { services: Service[] }) {
  const q = useInquiry(services, "contact");
  const { t } = q;
  return (
    <DarkSection id="contact" glows={GLOWS} above="white" below="white">
      <Rings />
      <div className={`shell ${s.wrap}`}>
        <div className={s.info}>
          <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} intro={t.intro} tone="dark" />
          <EmailUs q={q} className={s.email} />
        </div>

        <motion.div className={s.formCol} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.9, ease: EASE }}>
          <FormOrDone q={q}>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void q.submit();
              }}
              className={s.form}
            >
              <div className={s.field}>
                <label htmlFor={q.ids.name} className={s.label}>
                  {t.name}
                </label>
                <input className={s.input} {...q.field("name")} placeholder={t.namePh} required />
                <FieldError id={q.ids.name} text={q.error("name")} />
              </div>
              <div className={s.field}>
                <label htmlFor={q.ids.email} className={s.label}>
                  {t.email}
                </label>
                <input className={s.input} {...q.field("email")} placeholder={t.emailPh} required />
                <FieldError id={q.ids.email} text={q.error("email")} />
              </div>
              <div className={s.field}>
                <label htmlFor={q.ids.company} className={s.label}>
                  {t.company}
                  <Optional q={q} />
                </label>
                <input className={s.input} {...q.field("company")} placeholder={t.companyPh} />
                <FieldError id={q.ids.company} text="" />
              </div>
              <div className={s.field}>
                <label id={`${q.ids.service}-label`} htmlFor={q.ids.service} className={s.label}>
                  {t.service}
                </label>
                <ServiceSelect q={q} />
                <FieldError id={q.ids.service} text={q.error("service")} />
              </div>
              <div className={`${s.field} ${s.full}`}>
                <label htmlFor={q.ids.message} className={s.label}>
                  {t.message}
                  <Optional q={q} />
                </label>
                <textarea className={`${s.input} ${s.area}`} {...q.field("message")} rows={4} placeholder={t.messagePh} />
              </div>
              <div className={`${s.full} ${s.actions}`}>
                <SendButton q={q} />
                <Consent q={q} />
              </div>
              <SendError q={q} className={s.full} />
            </form>
          </FormOrDone>
        </motion.div>
      </div>
    </DarkSection>
  );
}
