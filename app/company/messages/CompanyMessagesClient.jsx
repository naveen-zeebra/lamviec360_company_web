"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RequirePermission from "../../../components/company/RequirePermission";
import { Avatar, Button } from "../../../components/ds";
import Icon from "../../../components/ds/Icon";
import Toast, { useToast } from "../../../components/ds/Toast";
import { useLang, t } from "../../../utils/lang";
import {
  can,
  getAuth,
  listCompanyMessageThreadsStore,
  getApplicantMessagesStore,
  sendApplicantMessageStore,
} from "../../../lib/companyStore";

export default function CompanyMessagesClient() {
  const [lang] = useLang();
  const searchParams = useSearchParams();
  const initialAppId = searchParams?.get("applicationId");
  const [toast, setToast] = useToast();

  const manage = can(getAuth().role, "candidates.manage");
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState(initialAppId ? Number(initialAppId) : null);

  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const list = await listCompanyMessageThreadsStore();
      setThreads(Array.isArray(list) ? list : []);
      if (!selectedAppId && list?.length > 0) {
        setSelectedAppId(list[0].application_id);
      }
    } catch (err) {
      console.warn("Failed to load company DM threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreadDetail = async (appId) => {
    if (!appId) return;
    setLoadingChat(true);
    try {
      const res = await getApplicantMessagesStore(appId);
      setActiveThread(res?.thread || null);
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
      setThreads((prev) =>
        prev.map((th) =>
          Number(th.application_id) === Number(appId) ? { ...th, unread_count: 0 } : th
        )
      );
    } catch (err) {
      setToast(err?.message || t(lang, "Unable to load thread"));
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (selectedAppId) {
      loadThreadDetail(selectedAppId);
    }
  }, [selectedAppId]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (th) =>
        (th.candidate_name || "").toLowerCase().includes(q) ||
        (th.job_title || "").toLowerCase().includes(q) ||
        (th.last_message_preview || "").toLowerCase().includes(q)
    );
  }, [threads, search]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!manage || !selectedAppId || !draft.trim()) return;
    setSending(true);
    try {
      const res = await sendApplicantMessageStore(selectedAppId, draft.trim());
      if (res?.message) setMessages((prev) => [...prev, res.message]);
      if (res?.thread) {
        setActiveThread(res.thread);
        setThreads((prev) =>
          prev.map((th) =>
            Number(th.application_id) === Number(selectedAppId) ? res.thread : th
          )
        );
      }
      setDraft("");
    } catch (err) {
      setToast(err?.message || t(lang, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  return (
    <RequirePermission action="candidates.view">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              {t(lang, "Direct Messages")}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              {t(lang, "Two-way conversations with applied candidates who allowed recruiter contact at registration.")}
            </p>
          </div>
          <Link href="/company/candidates">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold">
              <Icon name="users" size={14} />
              {t(lang, "Back to Candidate Pipeline")}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-line bg-card shadow-xs overflow-hidden min-h-[600px]">
          {/* Thread list */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-line flex flex-col">
            <div className="p-3.5 border-b border-line bg-sunken/30">
              <div className="relative">
                <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(lang, "Search candidate or job...")}
                  className="w-full rounded-xl border border-line bg-card pl-8 pr-3 py-2 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {loadingThreads ? (
                <div className="p-8 text-center text-xs text-muted">
                  {t(lang, "Loading conversations...")}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted space-y-2">
                  <Icon name="message-square" size={26} className="mx-auto text-muted/50" />
                  <p className="font-semibold text-ink">{t(lang, "No applicants found")}</p>
                  <p>{t(lang, "Applicants will appear here once candidates apply to your open jobs.")}</p>
                </div>
              ) : (
                filteredThreads.map((th) => {
                  const isSelected = Number(th.application_id) === Number(selectedAppId);
                  return (
                    <button
                      key={th.application_id}
                      type="button"
                      onClick={() => setSelectedAppId(th.application_id)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected ? "bg-brand/5 border-l-4 border-l-brand" : "hover:bg-sunken/40"
                      }`}
                    >
                      <Avatar name={th.candidate_name} size={38} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-ink truncate">{th.candidate_name}</span>
                          {th.unread_count > 0 && (
                            <span className="rounded-full bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                              {th.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-brand truncate mt-0.5">{th.job_title}</p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-[11px] text-muted truncate">
                            {th.last_message_preview || (th.allow_recruiter_dm ? t(lang, "Ready to message") : t(lang, "Disabled by policy"))}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            th.allow_recruiter_dm
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {th.allow_recruiter_dm ? t(lang, "Allowed") : t(lang, "Locked")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active thread pane */}
          <div className="lg:col-span-8 flex flex-col bg-card">
            {!selectedAppId || !activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-muted text-xs">
                <Icon name="message-square" size={32} className="mb-2 text-muted/40" />
                <p>{t(lang, "Select an applicant to start or view a Direct Message thread.")}</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-sunken/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={activeThread.candidate_name} size={40} />
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-ink truncate">{activeThread.candidate_name}</h2>
                      <p className="text-xs text-muted truncate">
                        {activeThread.job_title} · {activeThread.application_status}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                    activeThread.allow_recruiter_dm
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    <Icon name={activeThread.allow_recruiter_dm ? "check-circle" : "lock"} size={12} />
                    {activeThread.allow_recruiter_dm ? t(lang, "Messaging Allowed") : t(lang, "Disabled by Account Policy")}
                  </span>
                </div>

                {/* Lock notice */}
                {!activeThread.allow_recruiter_dm && (
                  <div className="m-4 rounded-xl border border-dashed border-slate-300 bg-sunken/50 p-4 text-xs text-muted">
                    <strong className="block text-ink">{t(lang, "Direct Messages Disabled by Candidate Policy")}</strong>
                    <span>{t(lang, "This candidate did not check recruiter Direct Message contact permission in their account policy.")}</span>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[430px]">
                  {loadingChat ? (
                    <div className="py-10 text-center text-xs text-muted">{t(lang, "Loading messages...")}</div>
                  ) : messages.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted">{t(lang, "No messages in this conversation yet.")}</div>
                  ) : (
                    messages.map((m) => {
                      const isRecruiter = m.sender_role === "recruiter";
                      return (
                        <div key={m.id} className={`flex flex-col ${isRecruiter ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isRecruiter ? "bg-brand text-white rounded-br-sm" : "bg-sunken border border-line text-ink rounded-bl-sm"
                            }`}
                          >
                            <div className={`text-[10px] font-bold mb-1 ${isRecruiter ? "text-white/80" : "text-muted"}`}>
                              {m.sender_name} · {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                            </div>
                            <p className="m-0 whitespace-pre-wrap">{m.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Composer */}
                {activeThread.allow_recruiter_dm && manage && (
                  <form onSubmit={handleSend} className="p-4 border-t border-line flex gap-2.5 bg-card">
                    <textarea
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t(lang, "Write a direct message to the candidate...")}
                      className="flex-1 rounded-xl border border-line bg-card px-3.5 py-2 text-xs text-ink focus:border-brand focus:outline-none resize-none"
                    />
                    <Button type="submit" variant="primary" disabled={sending || !draft.trim()} className="px-4 text-xs font-bold gap-1.5">
                      <Icon name="send" size={14} />
                      {sending ? t(lang, "Sending...") : t(lang, "Send")}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Toast msg={toast} />
    </RequirePermission>
  );
}
