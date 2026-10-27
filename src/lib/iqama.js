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

// days remaining until expiry (negative = already expired)
export function daysLeft(expiryDate) {
  if (!expiryDate) return -9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiryDate}T00:00:00`);
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
