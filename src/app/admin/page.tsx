import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getInquiries, getProducts, getProjects, getServices, getWhy, getWhyHeading } from "@/lib/store";
import { FEATURED_MAX, splitWork } from "@/content/projects";
import { POSTER_PRESETS } from "@/content/products";
import { deleteInquiry, deleteProduct, deleteProject, deleteService, deleteWhy, markInquiriesSeen, moveProduct, moveProject, moveService, moveWhy } from "./actions";
import { WhyHeadingForm } from "./forms";
import { Icon } from "./icons";
import { ConfirmButton, Rise, Row, RowList, SavedToast } from "./motion";
import type { Section } from "./nav";
import { Head, Shell, siteAddress } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One row of a list: its place, picture, names in both languages, a line,
 * tags, and its buttons. Called as a function (not a component), so the row
 * itself is the keyed child the list animates.
 */
function item({ id, index, thumb, letter, tags = [], title, ar, line, edit, up, down, remove }: { id: string; index: number; thumb?: string; letter?: string; tags?: ReactNode[]; title: string; ar: string; line: string; edit: string; up: () => Promise<void>; down: () => Promise<void>; remove: () => Promise<void> }) {
  return (
    <Row key={id} className={thumb || letter ? "" : "a-plain"}>
      <span className="a-num">{pad(index + 1)}</span>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className={letter ? "a-thumb a-top" : "a-thumb"} />
      ) : letter ? (
        <span className="a-thumb a-letter" aria-hidden>
          {letter}
        </span>
      ) : null}
      <div className="a-txt">
        <div className="a-tline">
          <strong>{title}</strong>
          <span className="a-ar" dir="rtl">
            {ar}
          </span>
        </div>
        {line && <p className="a-desc">{line}</p>}
        {tags.length > 0 && <div className="a-chips">{tags}</div>}
      </div>
      <div className="a-acts">
        <Link href={edit} className="a-btn">
          <Icon name="edit" />
          Edit
        </Link>
        <span className="a-seg">
          <form action={up}>
            <button type="submit" aria-label="Move up">
              <Icon name="up" />
            </button>
          </form>
          <form action={down}>
            <button type="submit" aria-label="Move down">
              <Icon name="down" />
            </button>
          </form>
        </span>
        <form action={remove}>
          <ConfirmButton title={`Delete “${title}”?`} label={`Delete ${title}`}>
            <Icon name="trash" />
          </ConfirmButton>
        </form>
      </div>
    </Row>
  );
}

const chip = (text: string, green?: boolean) => (
  <em key={text} className={green ? "a-chip a-chip-g" : "a-chip"}>
    {text}
  </em>
);

function AddButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="a-btn a-primary">
      <Icon name="plus" />
      {children}
    </Link>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <Rise delay={0.15}>
      <p className="a-empty-note">{children}</p>
    </Rise>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const q = await searchParams;
  const tab: Section = q.tab === "work" || q.tab === "products" || q.tab === "why" || q.tab === "requests" ? q.tab : "services";
  const [services, projects, products, why, whyHeading, inquiries, site] = await Promise.all([getServices(), getProjects(), getProducts(), getWhy(), getWhyHeading(), getInquiries(), siteAddress()]);
  const story = new Set(splitWork(projects).story.map((p) => p.id));
  const fresh = inquiries.filter((i) => !i.seen).length;

  return (
    <Shell section={tab}>
      {q.saved && <SavedToast site={site} />}

      {/* A new key per tab: switching tabs plays the entrance again. */}
      <section key={tab}>
        {tab === "services" && (
          <>
            <Head title="Services" count={services.length} note="Shown in this order on the site: the services section, the contact form and the footer.">
              <AddButton href="/services/new">Add service</AddButton>
            </Head>
            <RowList>
              {services.map((s, i) =>
                item({
                  id: s.id,
                  index: i,
                  thumb: s.media?.kind === "image" ? s.media.src : undefined,
                  tags: s.points.en.map((t) => chip(t)),
                  title: s.title.en,
                  ar: s.title.ar,
                  line: s.description.en,
                  edit: `/services/${s.id}`,
                  up: moveService.bind(null, s.id, -1),
                  down: moveService.bind(null, s.id, 1),
                  remove: deleteService.bind(null, s.id),
                }),
              )}
            </RowList>
            {!services.length && <Empty>No services. The section is hidden until you add one.</Empty>}
          </>
        )}

        {tab === "work" && (
          <>
            <Head title="Our Work" count={projects.length} note={`Shown in this order. The featured ones (up to ${FEATURED_MAX}; with none ticked, the first ${FEATURED_MAX}) play in the big scroll story; the rest sit in the “More work” row under it.`}>
              <AddButton href="/work/new">Add project</AddButton>
            </Head>
            <RowList>
              {projects.map((p, i) => {
                const video = p.media.find((m) => m.kind === "video");
                const image = p.media.find((m) => m.kind === "image")?.src ?? (video?.kind === "video" ? video.poster : undefined);
                return item({
                  id: p.id,
                  index: i,
                  thumb: image,
                  tags: [story.has(p.id) ? chip("Scroll story", true) : chip("More work"), ...(video ? [chip("Video")] : [])],
                  title: p.title.en,
                  ar: p.title.ar,
                  line: p.description.en,
                  edit: `/work/${p.id}`,
                  up: moveProject.bind(null, p.id, -1),
                  down: moveProject.bind(null, p.id, 1),
                  remove: deleteProject.bind(null, p.id),
                });
              })}
            </RowList>
            {!projects.length && <Empty>No projects yet. The section shows its empty state until you add one.</Empty>}
          </>
        )}

        {tab === "products" && (
          <>
            <Head
              title="Our Products"
              count={products.length}
              note={
                <>
                  Our own software, each a poster under Our Work, in this order. Up to three stand side by side; with more, the row slides sideways.{" "}
                  <a href={`${site}#products`} target="_blank" rel="noreferrer">
                    See it on the site ↗
                  </a>
                </>
              }
            >
              <AddButton href="/products/new">Add product</AddButton>
            </Head>
            <RowList>
              {products.map((p, i) => {
                const preset = POSTER_PRESETS.find((c) => c.value === p.color);
                const colour = p.color ? (
                  <em key="colour" className="a-chip">
                    <i className="a-swatch-dot" style={{ background: preset?.swatch ?? p.color }} />
                    {preset?.label ?? p.color}
                  </em>
                ) : null;
                return item({
                  id: p.id,
                  index: i,
                  thumb: p.image,
                  letter: (p.name.en || p.name.ar).trim().charAt(0).toUpperCase() || "•",
                  tags: [...(colour ? [colour] : []), ...(p.link ? [chip("Has a link")] : [])],
                  title: p.name.en,
                  ar: p.name.ar,
                  line: p.tagline.en,
                  edit: `/products/${p.id}`,
                  up: moveProduct.bind(null, p.id, -1),
                  down: moveProduct.bind(null, p.id, 1),
                  remove: deleteProduct.bind(null, p.id),
                });
              })}
            </RowList>
            {!products.length && <Empty>No products. The section is hidden until you add one.</Empty>}
          </>
        )}

        {tab === "why" && (
          <>
            <Head title="Why us" note="The headline over the two circles, and the points beside them." />
            <WhyHeadingForm heading={whyHeading} />
            <Rise delay={0.2}>
              <div className="a-head">
                <h2 className="a-sub">
                  Points <span className="a-muted">{pad(why.length)}</span>
                </h2>
                <AddButton href="/why/new">Add point</AddButton>
              </div>
              <p className="a-note">Shown under the headline, beside the two circles, in this order.</p>
            </Rise>
            <RowList>
              {why.map((p, i) =>
                item({
                  id: p.id,
                  index: i,
                  title: p.title.en,
                  ar: p.title.ar,
                  line: p.text.en,
                  edit: `/why/${p.id}`,
                  up: moveWhy.bind(null, p.id, -1),
                  down: moveWhy.bind(null, p.id, 1),
                  remove: deleteWhy.bind(null, p.id),
                }),
              )}
            </RowList>
            {!why.length && <Empty>No points. The section is hidden until you add one.</Empty>}
          </>
        )}

        {tab === "requests" && (
          <>
            <Head title="Requests" count={inquiries.length} note="Everything sent through the “Start a project” form, newest first.">
              {fresh > 0 && (
                <form action={markInquiriesSeen}>
                  <button type="submit" className="a-btn">
                    <Icon name="check" />
                    Mark all as read
                  </button>
                </form>
              )}
            </Head>
            <RowList>
              {inquiries.map((r) => (
                <Row key={r.id} className={`a-req${r.seen ? "" : " a-unread"}`}>
                  <span className="a-avatar" aria-hidden>
                    {(r.name.trim().charAt(0) || "?").toUpperCase()}
                  </span>
                  <div className="a-txt">
                    <div className="a-tline">
                      <strong>
                        {r.name}
                        {r.company && <span className="a-muted"> · {r.company}</span>}
                      </strong>
                      {!r.seen && chip("New", true)}
                    </div>
                    <div className="a-meta">
                      {r.email ? (
                        <a href={`mailto:${r.email}`} dir="ltr">
                          {r.email}
                        </a>
                      ) : r.phone ? (
                        <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                          {r.phone}
                        </a>
                      ) : null}
                      <span>{new Date(r.at).toLocaleString("en-GB", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="a-chips">
                      {chip(r.service || "No service picked", !!r.service)}
                      {r.options?.map((o) => chip(o))}
                    </div>
                    {r.notes && <p className="a-quote">{r.notes}</p>}
                  </div>
                  <div className="a-acts">
                    {r.email && (
                      <a className="a-btn" href={`mailto:${r.email}`}>
                        <Icon name="mail" />
                        Reply
                      </a>
                    )}
                    <form action={deleteInquiry.bind(null, r.id)}>
                      <ConfirmButton title={`Delete the request from ${r.name}?`} detail="It is removed from this list. This cannot be undone." label={`Delete the request from ${r.name}`}>
                        <Icon name="trash" />
                      </ConfirmButton>
                    </form>
                  </div>
                </Row>
              ))}
            </RowList>
            {!inquiries.length && <Empty>No requests yet. They appear here as soon as someone sends the contact form.</Empty>}
          </>
        )}
      </section>
    </Shell>
  );
}
