"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useRef, useState, type CSSProperties, type DragEvent, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Service } from "@/content/services";
import type { Project } from "@/content/projects";
import { POSTER_PRESETS, lightColor, type Product } from "@/content/products";
import type { WhyHeading, WhyPoint } from "@/content/why";
import { login, saveProduct, saveProject, saveService, saveWhy, saveWhyHeading, type FormState } from "./actions";
import { Icon } from "./icons";
import { Clock, EASE, ITEM, Logo, STAGGER } from "./motion";

const IMAGES = "image/jpeg,image/png,image/webp,image/avif,image/gif";

function Problem({ state }: { state: FormState }) {
  return (
    <AnimatePresence>
      {state?.error && (
        <motion.p key={state.error} className="a-error a-wide" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
          {state.error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** A glass card with a title, rising in with the rest of the form. */
function Card({ title, hint, children, className = "" }: { title: ReactNode; hint?: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <motion.section className={`a-card a-glass a-rim ${className}`} variants={ITEM} role="group" aria-labelledby={id}>
      <h3 id={id}>
        {title}
        {hint && <small>{hint}</small>}
      </h3>
      {children}
    </motion.section>
  );
}

/** An English field and its Arabic twin, side by side. */
function Pair({ label, name, en, ar, area, hint, required }: { label: string; name: string; en?: string; ar?: string; area?: boolean; hint?: string; required?: boolean }) {
  const Tag = area ? "textarea" : "input";
  return (
    <Card title={label} hint={hint}>
      <div className="a-pair">
        <label className="a-field">
          <span>
            <i className="a-lang">EN</i>English
          </span>
          <Tag name={`${name}_en`} defaultValue={en} required={required} rows={area ? 4 : undefined} />
        </label>
        <label className="a-field">
          <span>
            <i className="a-lang">AR</i>العربية
          </span>
          <Tag name={`${name}_ar`} defaultValue={ar} dir="rtl" rows={area ? 4 : undefined} />
        </label>
      </div>
    </Card>
  );
}

/** A picture (or film) picker: shows the current one, takes a click or a file dropped on it. `tall`: a phone screen's shape. */
function Picture({ label, hint, name, current, accept, video, tall, children }: { label: string; hint?: string; name: string; current?: string; accept: string; video?: boolean; tall?: boolean; children?: ReactNode }) {
  const [preview, setPreview] = useState<string | undefined>(current);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const kind = video ? "video" : "picture";

  const show = (file?: File) => {
    if (file) setPreview(URL.createObjectURL(file));
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !input.current) return;
    const files = new DataTransfer();
    files.items.add(file);
    input.current.files = files.files;
    input.current.dispatchEvent(new Event("input", { bubbles: true }));
    show(file);
  };

  const button = (
    <label className={video ? "a-btn" : "a-btn a-drop-btn"}>
      <Icon name="upload" />
      {preview ? `Replace ${kind}` : `Choose a ${kind}`}
      <input ref={input} className="a-sr" type="file" name={name} accept={accept} onChange={(e) => show(e.target.files?.[0])} />
    </label>
  );

  return (
    <Card title={label} hint={hint}>
      <div
        className={`a-drop${tall ? " a-tall" : ""}${over ? " a-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={preview ?? "none"} style={{ height: "100%" }} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            {preview ? (
              video ? (
                <video src={preview} muted controls playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" />
              )
            ) : (
              <div className="a-drop-empty">
                <Icon name="upload" />
                <span>Drop a {kind} here</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {!video && button}
      </div>
      {video && button}
      {children}
    </Card>
  );
}

/** A checkbox drawn as a switch. */
function Toggle({ name, label, checked }: { name: string; label: ReactNode; checked?: boolean }) {
  return (
    <label className="a-toggle">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={checked} className="a-switch" />
    </label>
  );
}

function LinkField({ value, hint }: { value?: string; hint: string }) {
  return (
    <Card title="Link" hint={hint}>
      <label className="a-field">
        <span>URL</span>
        <span className="a-control">
          <Icon name="link" />
          <input type="url" name="link" defaultValue={value} placeholder="https://" dir="ltr" />
        </span>
      </label>
    </Card>
  );
}

/**
 * Submits through the action without React's automatic form reset, so a
 * refused save (a missing title, a wrong file type) keeps what was typed.
 */
function keep(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

/** The form's glass bar: whether anything changed, Cancel and Save. */
function Save({ pending, dirty, back, fresh, sticky = true }: { pending: boolean; dirty: boolean; back?: string; fresh?: boolean; sticky?: boolean }) {
  const state = pending ? "Saving…" : dirty ? "Unsaved changes" : fresh ? "Fill it in, then save" : "No changes yet";
  return (
    <motion.div className={`a-savebar a-glass a-rim a-wide${sticky ? " a-float a-sticky" : ""}`} variants={ITEM}>
      <span className="a-state">
        <i className={dirty || pending ? "a-dot a-warn" : "a-dot"} aria-hidden />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={state} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {state}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="a-btns">
        {back && (
          <Link href={back} className="a-btn">
            Cancel
          </Link>
        )}
        <motion.button type="submit" className="a-btn a-primary" disabled={pending} whileTap={{ scale: 0.96 }}>
          {pending ? <motion.span className="a-spin" animate={{ rotate: 360 }} transition={{ duration: 0.7, ease: "linear", repeat: Infinity }} /> : <Icon name="check" />}
          {pending ? "Saving…" : "Save"}
        </motion.button>
      </span>
    </motion.div>
  );
}

/** The form element every editor shares: rises in card by card, notices the first change. */
function EditForm({ action, two, children, onDirty }: { action: (data: FormData) => void; two?: boolean; children: ReactNode; onDirty: () => void }) {
  return (
    <motion.form onSubmit={keep(action)} onInput={onDirty} className={two ? "a-form a-form-2" : "a-form"} initial="hidden" animate="show" variants={STAGGER(0.08, 0.1)}>
      {children}
    </motion.form>
  );
}

// ------------------------------------------------------------------ sign in

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <motion.form
      action={action}
      className="a-login a-glass a-rim"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0, y: 26, scale: 0.98, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE, staggerChildren: 0.07, delayChildren: 0.18 }, transitionEnd: { filter: "none" } },
      }}
    >
      <motion.div variants={ITEM}>
        <Logo />
      </motion.div>
      <motion.div variants={ITEM}>
        <span className="a-eyebrow">Admin</span>
        <h1>Welcome back</h1>
        <p>Sign in to edit the website, in English and Arabic.</p>
      </motion.div>
      <motion.label className="a-field" variants={ITEM}>
        <span>Username</span>
        <span className="a-control">
          <Icon name="user" />
          <input name="username" required autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </span>
      </motion.label>
      <motion.label className="a-field" variants={ITEM}>
        <span>Password</span>
        <span className="a-control">
          <Icon name="lock" />
          <input type="password" name="password" required autoComplete="current-password" />
        </span>
      </motion.label>
      <Problem state={state} />
      <motion.button type="submit" className="a-btn a-primary a-big" disabled={pending} variants={ITEM} whileTap={{ scale: 0.98 }}>
        {pending ? <motion.span className="a-spin" animate={{ rotate: 360 }} transition={{ duration: 0.7, ease: "linear", repeat: Infinity }} /> : null}
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <Icon name="arrow" />}
      </motion.button>
      <motion.div className="a-login-foot" variants={ITEM}>
        <span>Protected area</span>
        <Clock />
      </motion.div>
    </motion.form>
  );
}

// ----------------------------------------------------------------- editors

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action, pending] = useActionState(saveService, undefined);
  const [dirty, setDirty] = useState(false);
  const s = service;
  const photo = s?.media?.kind === "image" ? s.media.src : undefined;
  return (
    <EditForm action={action} two onDirty={() => setDirty(true)}>
      <input type="hidden" name="id" value={s?.id ?? ""} />
      <div className="a-col">
        <Picture label="Picture" hint="shown on the service card" name="image" current={photo} accept={IMAGES}>
          {photo && <Toggle name="remove_image" label="Remove the picture" />}
        </Picture>
      </div>
      <div className="a-col">
        <Pair label="Title" name="title" en={s?.title.en} ar={s?.title.ar} required />
        <Pair label="Description" name="description" en={s?.description.en} ar={s?.description.ar} area />
        <Pair label="Tags" name="points" en={s?.points.en.join(", ")} ar={s?.points.ar.join(", ")} hint="comma separated, e.g. Next.js, Remix, Edge" />
      </div>
      <Problem state={state} />
      <Save pending={pending} dirty={dirty} back="/?tab=services" fresh={!s} />
    </EditForm>
  );
}

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState(saveProject, undefined);
  const [dirty, setDirty] = useState(false);
  const p = project;
  const video = p?.media.find((m) => m.kind === "video");
  const image = p?.media.find((m) => m.kind === "image")?.src ?? (video?.kind === "video" ? video.poster : undefined);
  return (
    <EditForm action={action} two onDirty={() => setDirty(true)}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="a-col">
        <Picture label="Picture" hint="the cover" name="image" current={image} accept={IMAGES} />
        <Picture label="Video" hint="optional, MP4, plays on the card" name="video" current={video?.src} accept="video/mp4,video/webm" video>
          {video && <Toggle name="remove_video" label="Remove the video" />}
        </Picture>
      </div>
      <div className="a-col">
        <Pair label="Title" name="title" en={p?.title.en} ar={p?.title.ar} required />
        <Pair label="Description" name="description" en={p?.description.en} ar={p?.description.ar} area />
        <Pair label="Tags" name="tags" en={p?.tags.en.join(", ")} ar={p?.tags.ar.join(", ")} hint="comma separated" />
        <LinkField value={p?.link} hint="optional: the live site or a case study" />
        <Card title="Featured" hint="up to 4 play in the big scroll story; the rest go in the “More work” row under it">
          <Toggle name="featured" label="Play it in the big scroll story" checked={!!p?.featured} />
        </Card>
      </div>
      <Problem state={state} />
      <Save pending={pending} dirty={dirty} back="/?tab=work" fresh={!p} />
    </EditForm>
  );
}

/** The poster's colour: Auto, the ready ones, or any colour from the picker, with a small poster showing it. */
function PosterColor({ value, name }: { value?: string; name: string }) {
  const [color, setColor] = useState(value ?? "");
  const [custom, setCustom] = useState(value?.startsWith("#") && !POSTER_PRESETS.some((p) => p.value === value) ? value : "#1d4ed8");
  const field = useRef<HTMLInputElement>(null);
  const preset = POSTER_PRESETS.find((p) => p.value === color);
  const free = color.startsWith("#") && !preset;
  const background = !color ? "linear-gradient(135deg, #0a2118 0 50%, #0b6e3d 50% 100%)" : preset ? preset.swatch : `linear-gradient(165deg, color-mix(in oklab, ${color} 80%, #fff), ${color} 46%, color-mix(in oklab, ${color} 52%, #000))`;
  const dark = free && lightColor(color);
  const pick = (v: string) => {
    setColor(v);
    // A hidden field changes without an input event: send one, so the save bar sees the change.
    field.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const ring = <motion.span layoutId={`${name}-ring`} className="a-swatch-ring" transition={{ type: "spring", stiffness: 420, damping: 32 }} />;

  const swatch = (v: string, label: string, look?: CSSProperties, className = "") => (
    <button key={label} type="button" role="radio" aria-checked={color === v} className="a-swatch" onClick={() => pick(v)}>
      <i className={className} style={look}>
        {color === v && ring}
      </i>
      {label}
    </button>
  );

  return (
    <Card title="Poster colour" hint="the background of its poster on the site">
      <input ref={field} type="hidden" name={name} value={color} />
      <div className="a-poster" data-ink={dark ? "dark" : undefined}>
        {/* Each new colour fades in over the last. */}
        <AnimatePresence initial={false}>
          <motion.i key={background} className="a-poster-bg" style={{ background }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.35, duration: 0 } }} transition={{ duration: 0.35, ease: EASE }} />
        </AnimatePresence>
        <b>Aa</b>
        <span>{!color ? "Night and green in turn" : preset ? preset.label : color}</span>
      </div>
      <div className="a-swatches" role="radiogroup" aria-label="Poster colour">
        {swatch("", "Auto", undefined, "a-auto")}
        {POSTER_PRESETS.map((p) => swatch(p.value, p.label, { background: p.swatch }))}
        <label className={free ? "a-swatch a-on" : "a-swatch"}>
          <i className="a-picker" style={free ? { background: color } : undefined}>
            {free && ring}
            <input
              type="color"
              value={custom}
              aria-label="Pick your own colour"
              onChange={(e) => {
                setCustom(e.target.value);
                pick(e.target.value);
              }}
              onClick={() => pick(custom)}
            />
          </i>
          Your own
        </label>
      </div>
    </Card>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [dirty, setDirty] = useState(false);
  const p = product;
  return (
    <EditForm action={action} two onDirty={() => setDirty(true)}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="a-col">
        <Picture label="Phone screenshot" hint="optional" name="image" current={p?.image} accept={IMAGES} tall>
          <p className="a-note">Shown inside the phone on the product&rsquo;s poster. A tall screenshot fits best (about 390 × 800); a wider one is cut at the sides. Without one, the phone shows a drawn screen.</p>
          {p?.image && <Toggle name="remove_image" label="Remove the picture" />}
        </Picture>
      </div>
      <div className="a-col">
        <PosterColor name="color" value={p?.color} />
        <Pair label="Name" name="name" en={p?.name.en} ar={p?.name.ar} required hint="the product's own name; leave the Arabic empty to keep the same letters" />
        <Pair label="What it is for" name="tagline" en={p?.tagline.en} ar={p?.tagline.ar} required hint="a few words, e.g. Hall and venue booking" />
        <Pair label="More about it" name="description" en={p?.description.en} ar={p?.description.ar} area hint="optional: one or two sentences" />
        <LinkField value={p?.link} hint="optional: the product's own site. Without one, its button leads to the contact form" />
      </div>
      <Problem state={state} />
      <Save pending={pending} dirty={dirty} back="/?tab=products" fresh={!p} />
    </EditForm>
  );
}

export function WhyHeadingForm({ heading }: { heading: WhyHeading }) {
  const [state, action, pending] = useActionState(saveWhyHeading, undefined);
  const [dirty, setDirty] = useState(false);
  return (
    <EditForm action={action} onDirty={() => setDirty(true)}>
      <Pair label="Headline" name="title" en={heading.title.en} ar={heading.title.ar} required />
      <Pair label="Green words" name="accent" en={heading.accent.en} ar={heading.accent.ar} hint="copied exactly from the headline, e.g. partners. Also shown where the two circles meet, if it is 9 letters or fewer" />
      <Pair label="First circle" name="you" en={heading.rings.you.en} ar={heading.rings.you.ar} hint="the client's side, e.g. Your business" />
      <Pair label="Second circle" name="us" en={heading.rings.us.en} ar={heading.rings.us.ar} hint="your side, e.g. ThinkSync" />
      <Problem state={state} />
      <Save pending={pending} dirty={dirty} sticky={false} />
    </EditForm>
  );
}

export function WhyForm({ point }: { point?: WhyPoint }) {
  const [state, action, pending] = useActionState(saveWhy, undefined);
  const [dirty, setDirty] = useState(false);
  const p = point;
  return (
    <EditForm action={action} onDirty={() => setDirty(true)}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Pair label="Title" name="title" en={p?.title.en} ar={p?.title.ar} required />
      <Pair label="Text" name="text" en={p?.text.en} ar={p?.text.ar} area hint="one or two sentences" />
      <Problem state={state} />
      <Save pending={pending} dirty={dirty} back="/?tab=why" fresh={!p} />
    </EditForm>
  );
}
