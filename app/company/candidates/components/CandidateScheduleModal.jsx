"use client";

import React from "react";
import Icon from "../../../../components/ds/Icon";
import Button from "../../../../components/ds/Button";

export default function CandidateScheduleModal({
  lang,
  t,
  scheduleCandidate,
  setScheduleCandidate,
  activeJob,
  scheduleData,
  setScheduleData,
  handleScheduleSubmit,
}) {
  if (!scheduleCandidate) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 md:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
              📅
            </div>
            <div>
              <h3 className="text-base font-black text-ink">
                {t(lang, "Schedule Candidate Interview")}
              </h3>
              <p className="text-xs text-muted">
                {t(lang, "Candidate")}:{" "}
                <strong className="text-ink">{scheduleCandidate.name}</strong> •{" "}
                {activeJob?.title || "Job Application"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScheduleCandidate(null)}
            className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form
          onSubmit={handleScheduleSubmit}
          className="space-y-4 flex-1 overflow-y-auto pr-1"
        >
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {t(lang, "Interview Title / Round Name")}
            </label>
            <input
              type="text"
              required
              value={scheduleData.round}
              onChange={(e) =>
                setScheduleData({ ...scheduleData, round: e.target.value })
              }
              placeholder="e.g. First Round Technical & Product Interview"
              className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Interview Format")}
              </label>
              <select
                value={scheduleData.mode}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, mode: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
              >
                <option value="video">🎥 {t(lang, "Video Call (Online)")}</option>
                <option value="phone">📞 {t(lang, "Phone Call")}</option>
                <option value="on-site">📍 {t(lang, "On-site Interview")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Duration (Minutes)")}
              </label>
              <select
                value={scheduleData.durationMin}
                onChange={(e) =>
                  setScheduleData({
                    ...scheduleData,
                    durationMin: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
              >
                <option value={30}>30 {t(lang, "Minutes")}</option>
                <option value={45}>45 {t(lang, "Minutes")}</option>
                <option value={60}>60 {t(lang, "Minutes")}</option>
                <option value={90}>90 {t(lang, "Minutes")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Date")}
              </label>
              <input
                type="date"
                required
                value={scheduleData.date}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, date: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Time")}
              </label>
              <input
                type="time"
                required
                value={scheduleData.time}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, time: e.target.value })
                }
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {scheduleData.mode === "video"
                ? t(lang, "Video Meeting Link")
                : t(lang, "Location / Office Address")}
            </label>
            <input
              type="text"
              required
              value={
                scheduleData.mode === "video"
                  ? scheduleData.meetingLink
                  : scheduleData.location
              }
              onChange={(e) =>
                scheduleData.mode === "video"
                  ? setScheduleData({
                      ...scheduleData,
                      meetingLink: e.target.value,
                      location: "Google Meet",
                    })
                  : setScheduleData({
                      ...scheduleData,
                      location: e.target.value,
                    })
              }
              placeholder={
                scheduleData.mode === "video"
                  ? "e.g. https://meet.google.com/lv3-xxxx"
                  : "e.g. Floor 8, VNG Campus, District 7, Ho Chi Minh City"
              }
              className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Interviewer Name")}
              </label>
              <input
                type="text"
                value={scheduleData.interviewerName}
                onChange={(e) =>
                  setScheduleData({
                    ...scheduleData,
                    interviewerName: e.target.value,
                  })
                }
                placeholder="e.g. Talent Acquisition Team"
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t(lang, "Interviewer Role")}
              </label>
              <input
                type="text"
                value={scheduleData.interviewerRole}
                onChange={(e) =>
                  setScheduleData({
                    ...scheduleData,
                    interviewerRole: e.target.value,
                  })
                }
                placeholder="e.g. Recruiter / Engineering Lead"
                className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {t(lang, "Instructions for Candidate")}
            </label>
            <textarea
              rows={2}
              value={scheduleData.instructions}
              onChange={(e) =>
                setScheduleData({
                  ...scheduleData,
                  instructions: e.target.value,
                })
              }
              placeholder={t(
                lang,
                "Please prepare your portfolio / setup camera and microphone."
              )}
              className="w-full rounded-lg border border-line bg-card p-2.5 text-xs text-ink font-semibold focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setScheduleCandidate(null)}
            >
              {t(lang, "Cancel")}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {t(lang, "Confirm & Send Invitation")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

