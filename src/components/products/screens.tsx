import { useId, type ReactNode } from "react";
import type { Product } from "@/content/products";
import type { Lang } from "@/lib/translations";
import k from "./Screens.module.css";

/*
 * What a product's phone shows until the admin gives it a real screenshot,
 * drawn as SVG (390 by 800) so it scales like one: Boka's day of bookings,
 * Parkio's parking level, and for any other product its launch screen, the
 * product's letter and name and nothing claimed about what it does. In Arabic
 * each drawing is mirrored, as an Arabic app would be.
 */

interface ScreenProps {
  product: Product;
  lang: Lang;
  rtl: boolean;
}

type Anchor = "start" | "middle" | "end";

/** Mirrors a drawing for Arabic: x measured from the other edge, text anchored the other way. */
function mirror(width: number, rtl: boolean) {
  return {
    X: (x: number, w = 0) => (rtl ? width - x - w : x),
    A: (a: Anchor): Anchor => (rtl && a !== "middle" ? (a === "start" ? "end" : "start") : a),
    /** Forward along the reading direction: 1, or -1 in Arabic. */
    d: rtl ? -1 : 1,
  };
}
type Mirror = ReturnType<typeof mirror>;

const c = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");
const w = (en: string, ar: string): Record<Lang, string> => ({ en, ar });

const T = {
  today: w("Today", "اليوم"),
  confirmed: w("Confirmed", "مؤكد"),
  level: w("Level 1", "الطابق 1"),
  freeSpaces: w("Free spaces", "مواقف شاغرة"),
  of: w("of", "من"),
  recent: w("Recent", "الأحدث"),
};
const DAYS: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
};
const HALLS: Record<Lang, string[]> = {
  en: ["Grand Hall", "Hall A", "Hall B", "Majlis"],
  ar: ["القاعة الكبرى", "قاعة أ", "قاعة ب", "المجلس"],
};
const EVENTS: Record<Lang, string[]> = {
  en: ["Wedding", "Conference", "Graduation", "Dinner"],
  ar: ["حفل زفاف", "مؤتمر", "حفل تخرج", "عشاء"],
};

const letterOf = (p: Product) => (p.name.en || p.name.ar).trim().charAt(0).toUpperCase() || "•";
const nameIn = (p: Product, lang: Lang) => p.name[lang] || p.name.en;

/* ------------------------------------------------------------ shared parts */

/** The status bar: the time, signal and battery. */
function StatusBar({ m }: { m: Mirror }) {
  const { X, A } = m;
  return (
    <g>
      <text className={c(k.t, k.ink)} x={X(32)} y="36" textAnchor={A("start")} fontSize="15" fontWeight="600">
        9:41
      </text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className={k.ink} x={X(298 + i * 6, 4)} y={35 - (i + 1) * 3} width="4" height={(i + 1) * 3} rx="1" />
      ))}
      <rect className={k.inkLine} x={X(330, 26)} y="24.5" width="26" height="12" rx="3.5" />
      <rect className={k.ink} x={X(332.5, 18)} y="27" width="18" height="7" rx="2" />
    </g>
  );
}

/** The app's header: its tile and name. */
function Head({ m, product, lang }: { m: Mirror; product: Product; lang: Lang }) {
  const { X, A } = m;
  return (
    <g>
      <rect className={k.acc} x={X(24, 40)} y="64" width="40" height="40" rx="12" />
      <text className={c(k.h, k.on)} x={X(44)} y="91" textAnchor="middle" fontSize="20">
        {letterOf(product)}
      </text>
      <text className={c(k.h, k.ink)} x={X(76)} y="93" textAnchor={A("start")} fontSize="26">
        {nameIn(product, lang)}
      </text>
    </g>
  );
}

/** The tab bar and home indicator. */
function TabBar({ m }: { m: Mirror }) {
  const { X } = m;
  return (
    <g>
      <rect className={k.panelFlat} x="0" y="736" width="390" height="64" />
      <line className={k.line} x1="0" x2="390" y1="736" y2="736" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className={i === 0 ? k.acc : k.faint} x={X(56 + i * 92, 22)} y="750" width="22" height="22" rx="7" />
      ))}
      <rect className={k.ink} x="140" y="786" width="110" height="5" rx="2.5" />
    </g>
  );
}

/** A ring that fills to `part` of the way round. */
function Ring({ cx, cy, r, part, width }: { cx: number; cy: number; r: number; part: number; width: number }) {
  const round = 2 * Math.PI * r;
  return (
    <g>
      <circle className={k.ringTrack} cx={cx} cy={cy} r={r} strokeWidth={width} />
      <circle
        className={k.ringFill}
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={`${round * part} ${round}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </g>
  );
}

/** A chevron pointing along `dir` (1 right, -1 left). */
const chevron = (x: number, y: number, dir: number) => `M${x - 5 * dir} ${y - 8} l${10 * dir} 8 l${-10 * dir} 8`;

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg className={k.screen} viewBox="0 0 390 800" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <rect className={k.bg} width="390" height="800" />
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------- Boka */

/** from, to, hall, event, highlighted */
const DAY_CARDS: [string, string, number, number, boolean?][] = [
  ["10:00", "13:00", 1, 1],
  ["16:00", "20:00", 0, 2, true],
  ["18:00", "21:00", 3, 3],
  ["19:00", "23:00", 2, 0],
];

/** Boka: the week's days, and today's bookings, hall by hall. */
function Boka({ product, lang, rtl }: ScreenProps) {
  const m = mirror(390, rtl);
  const { X, A } = m;
  const plus = X(334);
  return (
    <Frame>
      <StatusBar m={m} />
      <Head m={m} product={product} lang={lang} />
      <circle className={k.faint} cx={X(346)} cy="84" r="18" />
      {DAYS[lang].map((day, i) => {
        const x = 24 + i * 70;
        const on = i === 1;
        return (
          <g key={day}>
            <rect className={on ? k.acc : k.panel} x={X(x, 62)} y="128" width="62" height="74" rx="18" />
            <text className={c(k.t, on ? k.onMute : k.mute)} x={X(x + 31)} y="156" textAnchor="middle" fontSize="11">
              {day}
            </text>
            <text className={c(k.h, on ? k.on : k.ink)} x={X(x + 31)} y="186" textAnchor="middle" fontSize="20">
              {9 + i}
            </text>
          </g>
        );
      })}
      <text className={c(k.t, k.ink)} x={X(24)} y="244" textAnchor={A("start")} fontSize="17" fontWeight="600">
        {T.today[lang]}
      </text>
      {DAY_CARDS.map(([from, to, hall, ev, on], i) => {
        const y = 262 + i * 104;
        return (
          <g key={i}>
            <rect className={on ? k.accPanel : k.panel} x={X(24, 342)} y={y} width="342" height="92" rx="20" />
            <text className={c(k.h, k.ink)} x={X(46)} y={y + 41} textAnchor={A("start")} fontSize="17">
              {from}
            </text>
            <text className={c(k.t, k.mute)} x={X(46)} y={y + 64} textAnchor={A("start")} fontSize="12">
              {to}
            </text>
            <line className={k.line} x1={X(112)} x2={X(112)} y1={y + 20} y2={y + 72} />
            <text className={c(k.t, k.ink)} x={X(130)} y={y + 41} textAnchor={A("start")} fontSize="16" fontWeight="600">
              {EVENTS[lang][ev]}
            </text>
            <text className={c(k.t, k.mute)} x={X(130)} y={y + 64} textAnchor={A("start")} fontSize="12">
              {HALLS[lang][hall]}
            </text>
            <rect className={k.soft} x={X(266, 84)} y={y + 33} width="84" height="26" rx="13" />
            <text className={c(k.t, k.accInk)} x={X(308)} y={y + 50} textAnchor="middle" fontSize="11" fontWeight="600">
              {T.confirmed[lang]}
            </text>
          </g>
        );
      })}
      <circle className={k.acc} cx={plus} cy="690" r="28" />
      <path className={k.onStroke} d={`M${plus} 678v24M${plus - 12} 690h24`} />
      <TabBar m={m} />
    </Frame>
  );
}

/* ------------------------------------------------------------------ Parkio */

/** The level: 1 is a parked car, 0 a free space. */
const LOT = [
  [1, 1, 0, 1, 1, 1],
  [1, 0, 1, 1, 0, 1],
];
/** The whole car park's count, of which this level is a part. */
const TOTAL = 32;
const FREE = 8;

/** One space: a parked car facing the lane, the chosen free space, or a free one. */
function Bay({ m, x, y, bw, bh, taken, toward, chosen, label }: { m: Mirror; x: number; y: number; bw: number; bh: number; taken: boolean; toward: "up" | "down"; chosen?: boolean; label?: string }) {
  const { X } = m;
  if (taken) {
    const cw = bw * 0.62;
    const ch = bh * 0.74;
    const cx = x + (bw - cw) / 2;
    const cy = y + (bh - ch) / 2;
    const gw = cw * 0.74;
    const gh = ch * 0.2;
    const gy = toward === "down" ? cy + ch - gh - ch * 0.1 : cy + ch * 0.1;
    return (
      <g>
        <rect className={k.car} x={X(cx, cw)} y={cy} width={cw} height={ch} rx={cw * 0.3} />
        <rect className={k.glass} x={X(cx + (cw - gw) / 2, gw)} y={gy} width={gw} height={gh} rx={gh * 0.4} />
      </g>
    );
  }
  if (chosen) {
    return (
      <g>
        <rect className={k.accPanel} x={X(x + 5, bw - 10)} y={y + 5} width={bw - 10} height={bh - 10} rx="9" />
        <text className={c(k.h, k.accInk)} x={X(x + bw / 2)} y={y + bh / 2 + 5} textAnchor="middle" fontSize="13">
          {label}
        </text>
      </g>
    );
  }
  return <rect className={k.soft} x={X(x + 7, bw - 14)} y={y + 7} width={bw - 14} height={bh - 14} rx="8" />;
}

/** Parkio: the free spaces, and one level's map with a space picked. */
function Parkio({ product, lang, rtl }: ScreenProps) {
  const m = mirror(390, rtl);
  const { X, A, d } = m;
  const x0 = 51;
  const bw = 48;
  const bh = 80;
  const rows: { y: number; toward: "up" | "down" }[] = [
    { y: 336, toward: "down" },
    { y: 496, toward: "up" },
  ];
  return (
    <Frame>
      <StatusBar m={m} />
      <Head m={m} product={product} lang={lang} />
      <rect className={k.soft} x={X(268, 98)} y="70" width="98" height="30" rx="15" />
      <text className={c(k.t, k.accInk)} x={X(317)} y="90" textAnchor="middle" fontSize="12" fontWeight="600">
        {T.level[lang]}
      </text>

      <rect className={k.panel} x={X(20, 350)} y="124" width="350" height="172" rx="22" />
      <text className={c(k.t, k.mute)} x={X(44)} y="162" textAnchor={A("start")} fontSize="14">
        {T.freeSpaces[lang]}
      </text>
      <text className={c(k.h, k.ink)} x={X(44)} y="232" textAnchor={A("start")} fontSize="62">
        {FREE}
      </text>
      <text className={c(k.t, k.mute)} x={X(44)} y="264" textAnchor={A("start")} fontSize="14">
        {`${T.of[lang]} ${TOTAL}`}
      </text>
      <Ring cx={X(298)} cy={210} r={44} part={FREE / TOTAL} width={12} />

      <rect className={k.panel} x={X(20, 350)} y="312" width="350" height="288" rx="22" />
      {rows.map((row, r) => (
        <g key={r}>
          {Array.from({ length: 7 }, (_, b) => (
            <line key={b} className={k.mark} x1={X(x0 + b * bw)} x2={X(x0 + b * bw)} y1={row.y} y2={row.y + bh} />
          ))}
          {LOT[r].map((taken, b) => (
            <Bay key={b} m={m} x={x0 + b * bw} y={row.y} bw={bw} bh={bh} taken={!!taken} toward={row.toward} chosen={r === 1 && b === 1} label="B2" />
          ))}
        </g>
      ))}
      <line className={k.mark} x1={X(x0)} x2={X(x0 + 6 * bw)} y1="336" y2="336" />
      <line className={k.mark} x1={X(x0)} x2={X(x0 + 6 * bw)} y1="576" y2="576" />
      <line className={k.dash} x1={X(64)} x2={X(326)} y1="456" y2="456" />
      {[120, 195, 270].map((x) => (
        <path key={x} className={k.chev} d={chevron(X(x), 456, d)} />
      ))}

      <text className={c(k.t, k.ink)} x={X(24)} y="640" textAnchor={A("start")} fontSize="14" fontWeight="600">
        {T.recent[lang]}
      </text>
      {["08:12", "08:27"].map((time, j) => {
        const yy = 656 + j * 36;
        return (
          <g key={time}>
            <rect className={k.car} x={X(24, 30)} y={yy} width="30" height="20" rx="6" />
            <rect className={k.faint} x={X(66, 110 - j * 16)} y={yy + 5} width={110 - j * 16} height="9" rx="4.5" />
            <text className={c(k.t, k.mute)} x={X(366)} y={yy + 14} textAnchor={A("end")} fontSize="12">
              {time}
            </text>
          </g>
        );
      })}
      <TabBar m={m} />
    </Frame>
  );
}

/* ------------------------------------------------------- any other product */

/** A product's launch screen: its letter on the brand's tile, and its name. */
function Launch({ product, lang, rtl }: ScreenProps) {
  const m = mirror(390, rtl);
  const tile = useId();
  const name = nameIn(product, lang);
  // The name is set as large as its length lets it be inside the screen.
  const size = Math.max(18, Math.min(34, Math.floor(560 / Math.max(1, name.length))));
  return (
    <Frame>
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d58f" />
          <stop offset="1" stopColor="#0b7c43" />
        </linearGradient>
      </defs>
      <StatusBar m={m} />
      <circle className={k.halo} cx="195" cy="338" r="150" />
      <circle className={k.halo} cx="195" cy="338" r="104" />
      <rect x="131" y="274" width="128" height="128" rx="38" fill={`url(#${tile})`} />
      <text className={c(k.h, k.on)} x="195" y="364" textAnchor="middle" fontSize="72">
        {letterOf(product)}
      </text>
      <text className={c(k.h, k.ink)} x="195" y="466" textAnchor="middle" fontSize={size}>
        {name}
      </text>
      <rect className={k.ink} x="140" y="786" width="110" height="5" rx="2.5" />
    </Frame>
  );
}

/**
 * The drawn screen for a product without a picture. Boka and Parkio have
 * their own; anything else shows its launch screen.
 */
export function ProductScreen(props: ScreenProps) {
  if (props.product.id === "boka") return <Boka {...props} />;
  if (props.product.id === "parkio") return <Parkio {...props} />;
  return <Launch {...props} />;
}
