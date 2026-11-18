"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Service } from "@/content/services";
import type { Project } from "@/content/projects";
import { POSTER_COLOR, type Product } from "@/content/products";
import type { WhyPoint } from "@/content/why";
import type { Localized, Media } from "@/content/types";
import { requireAdmin, signIn, signOut } from "@/lib/admin-auth";
import { removeUpload, saveUpload, setWhyHeading, updateInquiries, updateProducts, updateProjects, updateServices, updateWhy } from "@/lib/store";

/** What a form shows after a failed save. */
export type FormState = { error?: string } | undefined;

// Reading the form

const text = (d: FormData, key: string, max: number) => String(d.get(key) ?? "").trim().slice(0, max);

/** A field in both languages; Arabic falls back to English when left empty. */
function both(d: FormData, key: string, max: number): Localized {
  const en = text(d, `${key}_en`, max);
  return { en, ar: text(d, `${key}_ar`, max) || en };
}

/** A list typed one per line (or split by commas), in both languages. Arabic items line up with English ones. */
function lists(d: FormData, key: string, split: RegExp): Localized<string[]> {
  const read = (lang: string) =>
    text(d, `${key}_${lang}`, 3000)
      .split(split)
      .map((s) => s.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 20);
  const en = read("en");
  const ar = read("ar");
  return { en, ar: en.map((item, i) => ar[i] ?? item) };
}

const upload = (d: FormData, key: string) => {
  const f = d.get(key);
  return f instanceof File && f.size > 0 ? f : null;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";

function freshId(title: string, taken: { id: string }[]) {
  const base = slug(title);
  let id = base;
  for (let n = 2; taken.some((x) => x.id === id); n++) id = `${base}-${n}`;
  return id;
}

/** Every page shows this content (the home page, its sections, the footer): rebuild them all. */
const refresh = () => revalidatePath("/", "layout");

function move<T extends { id: string }>(list: T[], id: string, by: number) {
  // The step arrives from the browser: one place up or down, nothing else.
  if (by !== 1 && by !== -1) return;
  const from = list.findIndex((x) => x.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

// Signing in and out

export async function login(_: FormState, d: FormData): Promise<FormState> {
  const error = await signIn(String(d.get("username") ?? ""), String(d.get("password") ?? ""));
  if (error) return { error };
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/login");
}

// Services

export async function saveService(_: FormState, d: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(d, "id", 80);
  const title = both(d, "title", 80);
  if (!title.en) return { error: "The English title is required." };
  const description = both(d, "description", 700);
  const points = lists(d, "points", /[\n,،]/);
  // The contact form no longer offers per-service options (2026-11-14), so the
  // admin stopped asking; a service keeps whatever list it had.
  const options = d.has("options") ? lists(d, "options", /\n/) : null;
  const dropImage = d.get("remove_image") === "on";

  let image: string | null = null;
  try {
    const file = upload(d, "image");
    if (file) image = await saveUpload(file, "image");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const unused: (string | undefined)[] = [];
  await updateServices((list) => {
    const at = list.findIndex((s) => s.id === id);
    const prev = at >= 0 ? list[at] : null;
    const prevImage = prev?.media?.kind === "image" ? prev.media.src : undefined;
    let media = prev?.media;
    if (image) media = { kind: "image", src: image, alt: title };
    else if (dropImage) media = undefined;
    else if (media?.kind === "image") media = { ...media, alt: title };
    if (media?.kind !== "image" || media.src !== prevImage) unused.push(prevImage);

    const service: Service = {
      icon: "code",
      accent: "software",
      category: "software",
      ...prev,
      id: prev?.id ?? freshId(title.en, list),
      title,
      description,
      points,
      options: options ?? prev?.options ?? { en: [], ar: [] },
      media,
    };
    if (prev) list[at] = service;
    else list.push(service);
  });
  await Promise.all(unused.map(removeUpload));
  refresh();
  redirect("/?tab=services&saved=1");
}

export async function deleteService(id: string) {
  await requireAdmin();
  let gone = undefined as Service | undefined;
  await updateServices((list) => {
    gone = list.find((s) => s.id === id);
    return list.filter((s) => s.id !== id);
  });
  if (gone?.media?.kind === "image") await removeUpload(gone.media.src);
  refresh();
  redirect("/?tab=services");
}

export async function moveService(id: string, by: number) {
  await requireAdmin();
  await updateServices((list) => move(list, id, by));
  refresh();
  redirect("/?tab=services");
}

// Projects ("Our work")

const srcs = (media: Media[]) => media.flatMap((m) => (m.kind === "video" ? [m.src, m.poster] : [m.src]));

export async function saveProject(_: FormState, d: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(d, "id", 80);
  const title = both(d, "title", 100);
  if (!title.en) return { error: "The English title is required." };
  const category = both(d, "category", 80);
  const description = both(d, "description", 700);
  const tags = lists(d, "tags", /[\n,،]/);
  const link = text(d, "link", 300);
  if (link && !/^https?:\/\/\S+$/i.test(link)) return { error: "The link must start with http:// or https://" };
  const dropVideo = d.get("remove_video") === "on";
  const featured = d.get("featured") === "on";

  let newImage: string | null = null;
  let newVideo: string | null = null;
  try {
    const img = upload(d, "image");
    const vid = upload(d, "video");
    if (img) newImage = await saveUpload(img, "image");
    if (vid) newVideo = await saveUpload(vid, "video");
  } catch (e) {
    // The picture may already be saved when the video is refused: don't leave it behind.
    await removeUpload(newImage ?? undefined);
    return { error: (e as Error).message };
  }

  let failed = null as string | null;
  const unused: string[] = [];
  await updateProjects((list) => {
    const at = list.findIndex((p) => p.id === id);
    const prev = at >= 0 ? list[at] : null;
    const prevVideo = prev?.media.find((m) => m.kind === "video");
    const prevImage = prev?.media.find((m) => m.kind === "image")?.src ?? (prevVideo?.kind === "video" ? prevVideo.poster : undefined);
    const image = newImage ?? prevImage;
    const video = dropVideo ? undefined : (newVideo ?? prevVideo?.src);
    if (!image) {
      failed = "Add a picture: the section shows it as the project's cover.";
      return list;
    }
    const media: Media[] = video ? [{ kind: "video", src: video, poster: image, alt: title }, { kind: "image", src: image, alt: title }] : [{ kind: "image", src: image, alt: title }];
    if (prev) {
      const kept = new Set(srcs(media));
      unused.push(...srcs(prev.media).filter((s) => !kept.has(s)));
    }
    const project: Project = {
      accent: "software",
      ...prev,
      id: prev?.id ?? freshId(title.en, list),
      title,
      category,
      description,
      tags,
      media,
      link: link || undefined,
      featured,
    };
    if (prev) list[at] = project;
    else list.push(project);
    return list;
  });
  if (failed) {
    await Promise.all([removeUpload(newImage ?? undefined), removeUpload(newVideo ?? undefined)]);
    return { error: failed };
  }
  await Promise.all(unused.map(removeUpload));
  refresh();
  redirect("/?tab=work&saved=1");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  let gone = undefined as Project | undefined;
  await updateProjects((list) => {
    gone = list.find((p) => p.id === id);
    return list.filter((p) => p.id !== id);
  });
  if (gone) await Promise.all(srcs(gone.media).map(removeUpload));
  refresh();
  redirect("/?tab=work");
}

export async function moveProject(id: string, by: number) {
  await requireAdmin();
  await updateProjects((list) => move(list, id, by));
  refresh();
  redirect("/?tab=work");
}

// Our products

export async function saveProduct(_: FormState, d: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(d, "id", 80);
  const name = both(d, "name", 60);
  if (!name.en) return { error: "The product's name is required." };
  const tagline = both(d, "tagline", 120);
  if (!tagline.en) return { error: "Say in a few words what the product is for." };
  const description = both(d, "description", 500);
  const link = text(d, "link", 300);
  if (link && !/^https?:\/\/\S+$/i.test(link)) return { error: "The link must start with http:// or https://" };
  const dropImage = d.get("remove_image") === "on";
  // The poster's colour: one of the ready ones or a "#rrggbb"; anything else (or "auto") means night and green in turn.
  const picked = text(d, "color", 7).toLowerCase();
  const color = POSTER_COLOR.test(picked) ? picked : undefined;

  let newImage: string | null = null;
  try {
    const file = upload(d, "image");
    if (file) newImage = await saveUpload(file, "image");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const unused: (string | undefined)[] = [];
  await updateProducts((list) => {
    const at = list.findIndex((p) => p.id === id);
    const prev = at >= 0 ? list[at] : null;
    const image = newImage ?? (dropImage ? undefined : prev?.image);
    if (prev?.image && prev.image !== image) unused.push(prev.image);
    const product: Product = {
      id: prev?.id ?? freshId(name.en, list),
      name,
      tagline,
      description,
      link: link || undefined,
      image,
      color,
    };
    if (prev) list[at] = product;
    else list.push(product);
  });
  await Promise.all(unused.map(removeUpload));
  refresh();
  redirect("/?tab=products&saved=1");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  let gone = undefined as Product | undefined;
  await updateProducts((list) => {
    gone = list.find((p) => p.id === id);
    return list.filter((p) => p.id !== id);
  });
  await removeUpload(gone?.image);
  refresh();
  redirect("/?tab=products");
}

export async function moveProduct(id: string, by: number) {
  await requireAdmin();
  await updateProducts((list) => move(list, id, by));
  refresh();
  redirect("/?tab=products");
}

// Why us

export async function saveWhy(_: FormState, d: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(d, "id", 80);
  const title = both(d, "title", 100);
  if (!title.en) return { error: "The English title is required." };
  const body = both(d, "text", 400);
  await updateWhy((list) => {
    const at = list.findIndex((p) => p.id === id);
    const point: WhyPoint = { id: at >= 0 ? list[at].id : freshId(title.en, list), title, text: body };
    if (at >= 0) list[at] = point;
    else list.push(point);
  });
  refresh();
  redirect("/?tab=why&saved=1");
}

export async function saveWhyHeading(_: FormState, d: FormData): Promise<FormState> {
  await requireAdmin();
  const title = both(d, "title", 120);
  if (!title.en) return { error: "The English headline is required." };
  await setWhyHeading({ title, accent: both(d, "accent", 60), rings: { you: both(d, "you", 40), us: both(d, "us", 40) } });
  refresh();
  redirect("/?tab=why&saved=1");
}

export async function deleteWhy(id: string) {
  await requireAdmin();
  await updateWhy((list) => list.filter((p) => p.id !== id));
  refresh();
  redirect("/?tab=why");
}

export async function moveWhy(id: string, by: number) {
  await requireAdmin();
  await updateWhy((list) => move(list, id, by));
  refresh();
  redirect("/?tab=why");
}

// Contact requests

export async function deleteInquiry(id: string) {
  await requireAdmin();
  await updateInquiries((list) => list.filter((q) => q.id !== id));
  redirect("/?tab=requests");
}

export async function markInquiriesSeen() {
  await requireAdmin();
  await updateInquiries((list) => list.map((q) => ({ ...q, seen: true })));
  redirect("/?tab=requests");
}
