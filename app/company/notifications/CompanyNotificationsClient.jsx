"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Skeleton from "../../../components/ds/Skeleton";
import { useLang, t } from "../../../utils/lang";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../../../lib/companyStore";

const ICONS = { application: "inbox", interview: "calendar", team: "users", quota: "credit-card", billing: "credit-card" };

export default function CompanyNotificationsClient() {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);

  const refresh = () => setItems(listNotifications());

  useEffect(() => {
    refresh();
    setReady(true);
  }, []);

  if (!ready) return <Skeleton height={280} />;

  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold">{t(lang, "Notifications")}</h1>
          <p className="text-sm text-muted">{unread > 0 ? `${unread} ${t(lang, "unread")}` : t(lang, "You're all caught up.")}</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={() => { markAllNotificationsRead(); refresh(); }}>
            {t(lang, "Mark all as read")}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted">
          <h3 className="text-lg">{t(lang, "No notifications")}</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <button
              key={n.id}
              className={[
                "flex w-full items-start gap-3.5 rounded-md border p-4 text-left font-body",
                n.read ? "border-line bg-card" : "border-line-brand bg-brand-subtle",
              ].join(" ")}
              onClick={() => {
                markNotificationRead(n.id);
                refresh();
              }}
            >
              <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-sunken text-brand">
                <Icon name={ICONS[n.type] || "bell"} size={16} />
              </span>
              <span className="flex flex-1 flex-col gap-[3px]">
                <strong className="text-base">{n.title}</strong>
                <span className="text-sm text-muted">{n.message}</span>
                <em className="text-xs not-italic text-faint">{n.date}</em>
              </span>
              {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" aria-label={t(lang, "Unread")} />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
