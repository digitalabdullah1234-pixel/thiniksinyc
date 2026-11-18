// Signs an admin session cookie the way src/lib/admin-token.ts does, for local
// headless checks. Writes it to token.txt next to this file; prints nothing secret.
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Abdullah Umer/Thinksync";
const env = Object.fromEntries(
  (fs.existsSync(`${root}/.env.local`) ? fs.readFileSync(`${root}/.env.local`, "utf8") : "")
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const src = fs.readFileSync(`${root}/src/lib/admin-token.ts`, "utf8");
const user = env.ADMIN_USER?.trim() || src.match(/ADMIN_USER = process\.env\.ADMIN_USER\?\.trim\(\) \|\| "([^"]+)"/)[1];
const hash = src.match(/ADMIN_PASSWORD_HASH = "([^"]+)"/)[1];
const dataDir = env.DATA_DIR ? path.resolve(root, env.DATA_DIR) : `${root}/data`;
const secret = env.ADMIN_SECRET && env.ADMIN_SECRET.length >= 16 ? env.ADMIN_SECRET : fs.readFileSync(`${dataDir}/.admin-secret`, "utf8").trim();
const key = `${secret}:${user}:${env.ADMIN_PASSWORD || hash}`;
const value = String(Date.now() + 6 * 60 * 60 * 1000);
fs.writeFileSync(new URL("./token.txt", import.meta.url), `${value}.${createHmac("sha256", key).update(value).digest("base64url")}`);
console.log("token written");
