import { apiRequest, API_BASE_URL, getCompanyToken } from "./client";

export async function getCompanyProfile() {
  return apiRequest("/profile", {
    method: "GET",
    authType: "company",
  });
}

export async function updateCompanyProfile(patch) {
  return apiRequest("/profile", {
    method: "PUT",
    authType: "company",
    body: patch,
  });
}

export async function getCompanyDashboard() {
  return apiRequest("/dashboard", {
    method: "GET",
    authType: "company",
  });
}

export async function listCompanyJobs(params = {}) {
  const query = {
    page: params.page || 1,
    page_size: params.pageSize || params.page_size || 100,
    ...(params.status ? { status: params.status } : {}),
  };
  return apiRequest("/jobs", {
    method: "GET",
    authType: "company",
    params: query,
  });
}

export async function createCompanyJob(jobData) {
  return apiRequest("/jobs", {
    method: "POST",
    authType: "company",
    body: jobData,
  });
}

export async function getCompanyJobDetail(id) {
  return apiRequest(`/jobs/${encodeURIComponent(id)}`, {
    method: "GET",
    authType: "company",
  });
}

export async function updateCompanyJob(id, jobData) {
  return apiRequest(`/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    authType: "company",
    body: jobData,
  });
}

export async function setCompanyJobStatus(id, status) {
  return apiRequest(`/jobs/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
    authType: "company",
  });
}

export async function duplicateCompanyJob(id) {
  return apiRequest(`/jobs/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
    authType: "company",
  });
}

export async function deleteCompanyJob(id) {
  return apiRequest(`/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authType: "company",
  });
}

export async function listCompanyCandidates({
  jobId,
  stage,
  status,
  search,
  minScore,
  minExperience,
  maxExperience,
  sortBy,
  sortOrder,
  page = 1,
  pageSize = 25,
} = {}) {
  const params = {};
  if (jobId) params.job_id = jobId;
  if (status || stage) params.status = status || stage;
  if (search) params.search = search;
  if (minScore) params.min_score = minScore;
  if (minExperience !== undefined && minExperience !== null) params.min_experience = minExperience;
  if (maxExperience !== undefined && maxExperience !== null) params.max_experience = maxExperience;
  if (sortBy) params.sort_by = sortBy;
  if (sortOrder) params.sort_order = sortOrder;
  if (page) params.page = page;
  if (pageSize) params.page_size = pageSize;

  return apiRequest("/applicants", {
    method: "GET",
    authType: "company",
    params,
  });
}

export async function exportCandidatesCsv({
  jobId,
  stage,
  status,
  search,
  minScore,
  minExperience,
  maxExperience,
} = {}) {
  const params = {};
  if (jobId) params.job_id = jobId;
  if (status || stage) params.status = status || stage;
  if (search) params.search = search;
  if (minScore) params.min_score = minScore;
  if (minExperience !== undefined && minExperience !== null) params.min_experience = minExperience;
  if (maxExperience !== undefined && maxExperience !== null) params.max_experience = maxExperience;

  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/applicants/export-csv${qs ? `?${qs}` : ""}`, {
    method: "GET",
    authType: "company",
  });
}

export async function getCompanyCandidateCounts({ jobId } = {}) {
  const params = {};
  if (jobId) params.job_id = jobId;
  return apiRequest("/applicants/stage-counts", {
    method: "GET",
    authType: "company",
    params,
  });
}

export async function updateCandidateStage(id, { stage, status, recruiter_notes, rejectionTemplateId, rejectionNote, rating }) {
  const finalStatus = (status || stage || "").toLowerCase();
  const noteText = recruiter_notes || rejectionNote || "";
  return apiRequest(`/applicants/${id}/status`, {
    method: "PATCH",
    authType: "company",
    body: {
      status: finalStatus,
      recruiter_notes: noteText,
      rejection_template_id: rejectionTemplateId,
      rejection_note: rejectionNote,
      rating,
    },
  });
}

export async function updateCandidateRating(id, rating) {
  return apiRequest(`/applicants/${id}/status`, {
    method: "PATCH",
    authType: "company",
    body: {
      rating,
    },
  });
}

export async function bulkUpdateCandidateStage({ applicationIds, stage, rejectionTemplateId, rejectionNote }) {
  return apiRequest("/applicants/bulk-stage", {
    method: "POST",
    authType: "company",
    body: {
      application_ids: applicationIds,
      status: stage,
      rejection_template_id: rejectionTemplateId,
      rejection_note: rejectionNote,
    },
  });
}

export async function addCandidateNote(id, text) {
  return apiRequest(`/applicants/${id}/notes`, {
    method: "POST",
    authType: "company",
    body: { text },
  });
}

export async function scheduleCandidateInterview(id, interviewData) {
  let interviewersList = ["Talent Acquisition Team"];
  if (Array.isArray(interviewData.interviewers) && interviewData.interviewers.length > 0) {
    interviewersList = interviewData.interviewers.map((i) => {
      if (typeof i === "string") return i;
      if (i && typeof i === "object") {
        return i.name ? `${i.name}${i.role ? ` (${i.role})` : ""}` : (i.role || "Interviewer");
      }
      return "Interviewer";
    });
  } else if (interviewData.interviewerName) {
    interviewersList = [
      `${interviewData.interviewerName}${interviewData.interviewerRole ? ` (${interviewData.interviewerRole})` : ""}`
    ];
  }

  const scheduledAt =
    interviewData.scheduledAt ||
    interviewData.at ||
    (interviewData.date ? `${interviewData.date} ${interviewData.time || "14:00"}` : new Date().toISOString());

  return apiRequest(`/applicants/${id}/schedule-interview`, {
    method: "POST",
    authType: "company",
    body: {
      round_name: interviewData.roundName || interviewData.round || "First Round Technical & Product Interview",
      scheduled_at: scheduledAt,
      duration_min: Number(interviewData.durationMin) || 45,
      mode: interviewData.mode || "video",
      location_or_link: interviewData.locationOrLink || interviewData.meetingLink || interviewData.location || "Google Meet",
      instructions: interviewData.instructions || interviewData.instructionsVi || "",
      interviewers: interviewersList,
      documents: interviewData.documents || ["CV / Resume"],
    },
  });
}

export async function getCompanyTeam() {
  return apiRequest("/team", {
    method: "GET",
    authType: "company",
  });
}

export async function inviteTeamMember({ email, role, message = "" }) {
  return apiRequest("/team/invite", {
    method: "POST",
    authType: "company",
    body: { email, role, message },
  });
}

export async function revokeTeamInvitation(id) {
  return apiRequest(`/team/invites/${id}`, {
    method: "DELETE",
    authType: "company",
  });
}

export async function resendTeamInvitation(id) {
  return apiRequest(`/team/invites/${id}/resend`, {
    method: "POST",
    authType: "company",
  });
}

export async function updateTeamMemberRole(id, role) {
  return apiRequest(`/team/members/${id}/role`, {
    method: "PATCH",
    authType: "company",
    body: { role },
  });
}

export async function setTeamMemberStatus(id, status) {
  return apiRequest(`/team/members/${id}/status`, {
    method: "PATCH",
    authType: "company",
    body: { status },
  });
}

export async function purgeCompanyData(months = 6) {
  return apiRequest(`/data-retention/purge?months=${months}`, {
    method: "POST",
    authType: "company",
  });
}

export async function changeCompanyPassword({ currentPassword, newPassword }) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    authType: "company",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export async function getApplicantVerificationDocuments(applicantId) {
  return apiRequest(`/applicants/${applicantId}/verification-documents`, {
    method: "GET",
    authType: "company",
  });
}

export async function requestApplicantVerificationDocuments(applicantId, documentTypes = [], notes = "") {
  return apiRequest(`/applicants/${applicantId}/request-documents`, {
    method: "POST",
    authType: "company",
    body: {
      document_types: documentTypes,
      notes: notes,
    },
  });
}

export async function searchTalent(params = {}) {
  const query = new URLSearchParams();
  const searchParams = { ...params };
  if (searchParams.q && !searchParams.keyword) {
    searchParams.keyword = searchParams.q;
  }
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, String(v));
    }
  });
  const qs = query.toString();
  return apiRequest(`/talent/search${qs ? `?${qs}` : ""}`, {
    method: "GET",
    authType: "company",
  });
}

export async function getTalentCandidateDetail(candidateId) {
  return apiRequest(`/talent/${candidateId}`, {
    method: "GET",
    authType: "company",
  });
}

export async function requestCandidateContact(candidateId, jobId = null, message = "") {
  return apiRequest(`/talent/${candidateId}/request-contact`, {
    method: "POST",
    authType: "company",
    body: {
      job_id: jobId,
      message: message,
    },
  });
}

export async function messageTalentCandidate(candidateId, jobId = null, message = "") {
  return apiRequest(`/talent/${candidateId}/message`, {
    method: "POST",
    authType: "company",
    body: {
      job_id: jobId,
      message: message,
    },
  });
}

export async function downloadApplicantVerificationDocument(applicantId, docId, fallbackFileName = "verification_document") {
  throw new Error("Direct file download is prohibited for confidential prior-employment documents. View-only access allowed.");
}

export async function getCompanyRoles() {
  return apiRequest("/team/roles", {
    method: "GET",
    authType: "company",
  });
}

export async function createCustomRole(data) {
  return apiRequest("/team/roles", {
    method: "POST",
    authType: "company",
    body: data,
  });
}

export async function listCompanyRejectionTemplates() {
  const res = await apiRequest("/templates/rejection", {
    method: "GET",
    authType: "company",
  });
  return res?.data || res;
}

export async function createCompanyRejectionTemplate(payload) {
  const res = await apiRequest("/templates/rejection", {
    method: "POST",
    authType: "company",
    body: payload,
  });
  return res?.data || res;
}

export async function updateCompanyRejectionTemplate(id, payload) {
  const res = await apiRequest(`/templates/rejection/${id}`, {
    method: "PUT",
    authType: "company",
    body: payload,
  });
  return res?.data || res;
}

export async function getApplicantDetail(applicationId) {
  return apiRequest(`/applicants/${applicationId}`, {
    method: "GET",
    authType: "company",
  });
}

export function getBackendAssetUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const base = API_BASE_URL.replace(/\/api\/v1\/company\/?$/, "");
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${normalized}`;
}

export async function deleteCompanyRejectionTemplate(id) {
  const res = await apiRequest(`/templates/rejection/${id}`, {
    method: "DELETE",
    authType: "company",
  });
  return res?.data || res;
}

export async function fetchCompanyNotifications() {
  const res = await apiRequest("/notifications", {
    method: "GET",
    authType: "company",
  });
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function markCompanyNotificationRead(notificationId) {
  const res = await apiRequest(`/notifications/${notificationId}/read`, {
    method: "POST",
    authType: "company",
  });
  return res?.data || res;
}

export async function markAllCompanyNotificationsRead() {
  const res = await apiRequest("/notifications/read-all", {
    method: "POST",
    authType: "company",
  });
  return res?.data || res;
}

export async function listCompanyMessageThreads(params = {}) {
  const res = await apiRequest("/messages/threads", {
    method: "GET",
    authType: "company",
    params,
  });
  return res?.data || (Array.isArray(res) ? res : []);
}

export async function getApplicantMessages(applicationId) {
  const res = await apiRequest(`/applicants/${encodeURIComponent(applicationId)}/messages`, {
    method: "GET",
    authType: "company",
  });
  return res?.data || res;
}

export async function sendApplicantMessage(applicationId, body) {
  const res = await apiRequest(`/applicants/${encodeURIComponent(applicationId)}/messages`, {
    method: "POST",
    authType: "company",
    body: { body },
  });
  return res?.data || res;
}

