// Shared date / time formatting for user-facing strings.
// Pure functions — take `lang` ("EN" | "VN" | "VI"), never touch a store.

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_VN = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

function isVi(lang) {
  return lang === "VN" || lang === "VI";
}

// Accepts "YYYY-MM-DD", "YYYY-MM-DD HH:MM", or an ISO string / Date.
function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalised.length <= 10 ? normalised + "T00:00:00" : normalised);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(lang, value) {
  const d = toDate(value);
  if (!d) return "";
  const months = isVi(lang) ? MONTHS_VN : MONTHS_EN;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(_lang, value) {
  const d = toDate(value);
  if (!d) return "";
  const hasTime = typeof value === "string" ? /\d{1,2}:\d{2}/.test(value) : true;
  if (!hasTime) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateTime(lang, value) {
  const date = formatDate(lang, value);
  const time = formatTime(lang, value);
  if (!date) return "";
  return time ? `${date} · ${time}` : date;
}

// Relative wording: "today", "2 days ago", "in 3 days".
export function relativeTime(lang, value) {
  const d = toDate(value);
  if (!d) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfTarget - startOfToday) / 86400000);
  const vi = isVi(lang);

  if (diffDays === 0) return vi ? "hôm nay" : "today";
  if (diffDays === -1) return vi ? "hôm qua" : "yesterday";
  if (diffDays === 1) return vi ? "ngày mai" : "tomorrow";
  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    if (n < 7) return vi ? `${n} ngày trước` : `${n} days ago`;
    if (n < 30) return vi ? `${Math.round(n / 7)} tuần trước` : `${Math.round(n / 7)} weeks ago`;
    if (n < 365) return vi ? `${Math.round(n / 30)} tháng trước` : `${Math.round(n / 30)} months ago`;
    return vi ? `${Math.round(n / 365)} năm trước` : `${Math.round(n / 365)} years ago`;
  }
  if (diffDays < 7) return vi ? `sau ${diffDays} ngày` : `in ${diffDays} days`;
  if (diffDays < 30) return vi ? `sau ${Math.round(diffDays / 7)} tuần` : `in ${Math.round(diffDays / 7)} weeks`;
  return vi ? `sau ${Math.round(diffDays / 30)} tháng` : `in ${Math.round(diffDays / 30)} months`;
}

// Human file size for résumé metadata.
export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
