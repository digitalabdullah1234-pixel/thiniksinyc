// Headless Chrome probe: open a page, optionally set a cookie, run JS, save screenshots.
// node probe.mjs '<json steps>'   steps: {url,w,h,cookie?:{name,value,domain},wait,actions:[{eval|shot|wait|click}]}
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const cfg = JSON.parse(process.argv[2]);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(path.join(tmpdir(), "probe-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run", `--window-size=${cfg.w},${cfg.h}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") logs.push("console.error: " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
  else if (msg.method === "Runtime.exceptionThrown") logs.push("exception: " + msg.params.exceptionDetails.exception?.description);
};
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: cfg.w, height: cfg.h, deviceScaleFactor: cfg.dpr ?? 1, mobile: !!cfg.mobile });
for (const c of cfg.cookies ?? (cfg.cookie ? [cfg.cookie] : [])) await send("Network.setCookie", { ...c, path: "/" });
await send("Page.navigate", { url: cfg.url });
await sleep(cfg.wait ?? 6000);
for (const a of cfg.actions ?? []) {
  if (a.wait) await sleep(a.wait);
  if (a.eval) {
    const r = await send("Runtime.evaluate", { expression: a.eval, returnByValue: true, awaitPromise: true });
    console.log(JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? r));
  }
  if (a.shot) {
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(a.shot, Buffer.from(r.result.data, "base64"));
    console.log("saved " + a.shot);
  }
}
if (logs.length) console.log(logs.join("\n"));
ws.close();
chrome.kill();
