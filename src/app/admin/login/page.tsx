import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "../forms";
import { Skyline, ThemeSwitch } from "../motion";
import { THEME_COOKIE, readTheme } from "../theme";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/");
  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <main className="a-center">
      <Skyline />
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <div className="a-login a-glass a-rim">
          <h1>Admin not set up</h1>
          <p>The server can&apos;t keep the admin&apos;s session secret. Make the data folder (DATA_DIR) writable, or set ADMIN_SECRET (16+ characters), then restart.</p>
        </div>
      )}
      <div className="a-corner">
        <ThemeSwitch initial={theme} />
      </div>
    </main>
  );
}
