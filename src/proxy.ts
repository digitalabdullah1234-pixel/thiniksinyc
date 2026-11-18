import { NextResponse, type NextRequest } from "next/server";
import { isAdminHost, requestHost } from "@/lib/admin-host";
import { ADMIN_COOKIE, validToken } from "@/lib/admin-token";

/**
 * The admin on its own domain (see admin-host.ts). There the panel has clean
 * addresses (/, /login, /services/web) that map onto the app's /admin pages;
 * on the site's domain /admin answers "not found". Both domains point at this
 * one app, so a save in the panel reaches the site at once: same data folder,
 * same page cache. Locally the panel is at admin.localhost:3000.
 */
const isAdminPath = (path: string) => path === "/admin" || path.startsWith("/admin/");

/** An address that ends in a file type (the logo, the tab icon, an uploaded picture): no page to map it to. */
const FILE = /\.[a-zA-Z0-9]+$/;

/** The sign-in form is a username and a password; a post without a session may be no larger than this. */
const SIGN_IN_MAX = 16 * 1024;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = requestHost(request.headers);

  // A visitor who came over plain http (Cloudflare says so in CF-Visitor) goes
  // to https, whatever the "Always Use HTTPS" switch in Cloudflare is set to.
  if (/^[a-z0-9.-]+$/.test(host) && request.headers.get("cf-visitor")?.includes('"scheme":"http"')) {
    return NextResponse.redirect(`https://${host}${pathname}${search}`, 308);
  }

  const admin = isAdminHost(host);
  // The app's page for this address: on the admin's domain, everything lives under /admin.
  const page = admin ? `/admin${pathname === "/" ? "" : pathname}` : pathname;

  /*
   * Posts. The site takes one (the contact form, to /api/contact), and in the
   * panel only the sign-in form may post without a signed-in admin, and only
   * a small one. The actions check the session again; this turns strangers
   * away before Next reads a body that may be up to 75 MB. It holds for every
   * address, also one that ends in a file type or matches no page: Next runs
   * an action whatever address it is posted to.
   */
  if (request.method === "POST" && pathname !== "/api/contact") {
    if (!admin) return new NextResponse("Method not allowed", { status: 405 });
    if (!validToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
      if (page !== "/admin/login") return new NextResponse("Forbidden", { status: 403 });
      // Browsers always say how long a form is; without that the size can't be checked first.
      const length = request.headers.get("content-length");
      if (!length || !/^\d+$/.test(length)) return new NextResponse("Length required", { status: 411 });
      if (Number(length) > SIGN_IN_MAX) return new NextResponse("Request too large", { status: 413 });
    }
  }

  if (admin) {
    // The uploaded pictures the panel previews, and the files that come with the site.
    if (pathname.startsWith("/media/") || (FILE.test(pathname) && !isAdminPath(pathname))) return NextResponse.next();
    // An old /admin/… address: the same page without the prefix. Next sends a
    // same-domain address on as a relative one, so it stays right behind
    // Cloudflare/Traefik whether they speak http or https.
    if (isAdminPath(pathname)) {
      return NextResponse.redirect(new URL((pathname.slice("/admin".length) || "/") + search, request.url), 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = page;
    return NextResponse.rewrite(url);
  }
  // An address that matches no page, so the site's own "not found" page answers.
  if (isAdminPath(pathname)) return NextResponse.rewrite(new URL("/__admin-elsewhere", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything but Next's own built files (scripts, styles, fonts), which take no posts and need no mapping.
  matcher: ["/((?!_next/static/|_next/image).*)"],
};
