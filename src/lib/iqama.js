// Iqama expiry helpers — shared status/dates logic.
// Thresholds: red = expired or <= 30 days, yellow = 31–60 days, green = > 60 days.

export const STATUS = {
  red: {
    key: "red",
    label: "Critical",
    bg: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    dot: "bg-rose-500",
    iconWrap: "bg-rose-500/10 text-rose-500",
    accent: "border-l-rose-500",
  },
  yellow: {
    key: "yellow",
    label: "Warning",
    bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    dot: "bg-amber-500",
    iconWrap: "bg-amber-500/10 text-amber-500",
    accent: "border-l-amber-500",
  },
  green: {
    key: "green",
    label: "Safe",
    bg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    dot: "bg-emerald-500",
    iconWrap: "bg-emerald-500/10 text-emerald-500",
    accent: "border-l-emerald-500",
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Arabic-Indic (٤٦٠) / Urdu digits (۴۶۰) ko ASCII mein badal dein
const AR_DIGITS = /[\u0660-\u0669]/g;
const UR_DIGITS = /[\u06F0-\u06F9]/g;

// Tolerant expiry-date parser — "YYYY-MM-DD", "DD/MM/YYYY", "DD.MM.YY",
// Arabic/Urdu digits aur extra spaces sab theek ho jate hain.
// Return: local-midnight Date, ya null agar format samajh nahi aa rahi.
export function parseExpiryDate(raw) {
  if (!raw && raw !== 0) return null;
  let s = String(raw)
    .replace(AR_DIGITS, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(UR_DIGITS, (c) => String(c.charCodeAt(0) - 0x06F0))
    .trim();
  if (!s) return null;

  let y, m, d;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/); // DD/MM/YYYY (Saudi convention)
    if (!match) {
      // Textual month formats — "15-Oct-2026", "15 Oct 2026", "Oct 15, 2026", "October 15 2026"
      const MONTHS = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8,
        sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, dez: 12,
      };
      const mName = (tok) => {
        const k = tok.toLowerCase().replace(/\.\s*$/, "");
        const pre = k.slice(0, 3);
        return MONTHS[pre] || MONTHS[k.slice(0, 4)] || null;
      };
      match = s.match(/^([a-z]+)\.?\s+[-/.]?\s*(\d{1,2})(?:st|nd|rd|th)?\s*,?\s+(\d{2,4})$/i); // Oct 15, 2026
      if (match) {
        m = mName(match[1]);
        d = Number(match[2]);
        y = Number(match[3]);
      } else {
        match = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s*[-/. ]\s*([a-z]+)\.?,?\s*[-/. ]+\s*(\d{2,4})$/i); // 15 Oct 2026
        if (!match) return null;
        d = Number(match[1]);
        m = mName(match[2]);
        y = Number(match[3]);
      }
      if (!m) return null;
      if (y < 100) y += 2000;
    } else {
      let a = Number(match[1]);
      let b = Number(match[2]);
      y = Number(match[3]);
      if (y < 100) y += 2000;
      // pehla >12 ho to wahi day — warna agar doosra >12 ho to swap kar dein (MM/DD input)
      if (!(a > 12) && b > 12) {
        d = b;
        m = a;
      } else {
        d = a;
        m = b;
      }
    }
  }

  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  // Feb 30 type auto-normalization reject karo (date wapas match kare to valid)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

// days remaining until expiry (negative = already expired)
// Invalid/missing expiry ka sentinel — filters ne roomadan sabali "future makhloot" break mein data chhupaya tha
export const INVALID_DAYS = -9999;

export function daysLeft(expiryDate) {
  // Missing ya unparseable format wali expiry bhi "warning needing action" hai —
  // NaN larkar green status mein record chhup jata tha aur filters tootte the.
  const exp = parseExpiryDate(expiryDate);
  if (!exp) return INVALID_DAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / DAY_MS);
}

export function getStatus(expiryDate) {
  const d = daysLeft(expiryDate);
  if (d <= 30) return { ...STATUS.red, days: d };
  if (d <= 60) return { ...STATUS.yellow, days: d };
  return { ...STATUS.green, days: d };
}

// Countdown label used inside the status badge, like the reference:
// red expired → "Expired (X days ago)", otherwise → "X Days Left"
export function daysLabel(days) {
  if (days <= INVALID_DAYS) return "Expiry date invalid";
  if (days < 0) return `Expired (${Math.abs(days)} days ago)`;
  if (days === 0) return "Expires today";
  if (days === 1) return "1 Day Left";
  return `${days} Days Left`;
}

// YYYY-MM-DD
export function formatDate(iso) {
  if (!iso) return "—";
  return iso;
}
