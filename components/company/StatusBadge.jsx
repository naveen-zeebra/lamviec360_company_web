import Badge from "../ds/Badge";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

const JOB = {
  Draft: { tone: "neutral", icon: "file" },
  Published: { tone: "success", icon: "globe" },
  Paused: { tone: "warning", icon: "pause" },
  Closed: { tone: "neutral", icon: "archive" },
};

const STAGE = {
  Applied: { tone: "brand", icon: "inbox" },
  Screening: { tone: "warning", icon: "search" },
  Shortlisted: { tone: "brand", icon: "list-checks" },
  "Interview Scheduled": { tone: "warning", icon: "calendar" },
  "Offer Sent": { tone: "success", icon: "gift" },
  Hired: { tone: "success", icon: "check-circle" },
  Rejected: { tone: "error", icon: "x-circle" },
};

const MEMBER = {
  Active: { tone: "success", icon: "check-circle" },
  Pending: { tone: "warning", icon: "clock" },
  Inactive: { tone: "neutral", icon: "slash" },
  Expired: { tone: "neutral", icon: "clock" },
  Revoked: { tone: "error", icon: "x-circle" },
};

const STAGE_SYNONYMS = {
  applied: "Applied",
  screening: "Screening",
  reviewing: "Screening",
  shortlisted: "Shortlisted",
  "interview scheduled": "Interview Scheduled",
  interviewing: "Interview Scheduled",
  interview: "Interview Scheduled",
  "offer sent": "Offer Sent",
  offer_sent: "Offer Sent",
  hired: "Hired",
  rejected: "Rejected",
};

const MAPS = { job: JOB, stage: STAGE, member: MEMBER };

export default function StatusBadge({ kind = "job", value = "", lang }) {
  const map = MAPS[kind] || JOB;
  let resolvedKey = value;
  if (kind === "stage" && value) {
    const lower = String(value).toLowerCase().trim();
    resolvedKey = STAGE_SYNONYMS[lower] || value;
  }
  const cfg = map[resolvedKey] || { tone: "neutral", icon: "circle" };
  return (
    <Badge tone={cfg.tone}>
      <Icon name={cfg.icon} size={11} /> {t(lang, resolvedKey)}
    </Badge>
  );
}
