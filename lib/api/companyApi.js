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

export async function getCompanyCandidateCounts({ jobId } = {}) {
  const params = {};
  if (jobId) params.job_id = jobId;
  return apiRequest("/applicants/stage-counts", {
    method: "GET",
    authType: "company",
    params,
  });
}

export async function updateCandidateStage(id, { stage, rejectionTemplateId, rejectionNote, rating }) {
  return apiRequest(`/applicants/${id}/status`, {
    method: "PATCH",
    authType: "company",
    body: {
      status: stage,
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
  return apiRequest(`/applicants/${id}/schedule-interview`, {
    method: "POST",
    authType: "company",
    body: {
      round_name: interviewData.roundName || interviewData.round,
      scheduled_at: interviewData.scheduledAt || interviewData.at,
      duration_min: interviewData.durationMin || 45,
      mode: interviewData.mode || "video",
      location_or_link: interviewData.locationOrLink || interviewData.location || interviewData.meetingLink || "",
      instructions: interviewData.instructions || "",
      interviewers: interviewData.interviewers || [],
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

export async function downloadApplicantVerificationDocument(applicantId, docId, fallbackFileName = "verification_document") {
  const token = getCompanyToken();
  const url = `${API_BASE_URL}/applicants/${applicantId}/verification-documents/${docId}/download`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let errDetail = "Failed to download verification document";
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errJson.message || errDetail;
    } catch (_) {}
    throw new Error(errDetail);
  }
  const disposition = res.headers.get("Content-Disposition");
  let fileName = fallbackFileName;
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename=["']?([^"']+)["']?/);
    if (match && match[1]) fileName = match[1];
  }
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
  return true;
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




// ─────────────────────────────────────────────────────────────────────────────
// EMP-FR-030: Talent Search & Candidate Discovery API Methods
// ─────────────────────────────────────────────────────────────────────────────

export async function searchTalent(params = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.skills) query.set("skills", params.skills);
  if (params.job_title) query.set("job_title", params.job_title);
  if (params.location && params.location !== "All") query.set("location", params.location);
  if (params.min_experience !== undefined && params.min_experience !== null && params.min_experience !== "") {
    query.set("min_experience", params.min_experience);
  }
  if (params.max_experience !== undefined && params.max_experience !== null && params.max_experience !== "") {
    query.set("max_experience", params.max_experience);
  }
  if (params.education_level && params.education_level !== "All") {
    query.set("education_level", params.education_level);
  }
  if (params.min_salary !== undefined && params.min_salary !== null && params.min_salary !== "") {
    query.set("min_salary", params.min_salary);
  }
  if (params.max_salary !== undefined && params.max_salary !== null && params.max_salary !== "") {
    query.set("max_salary", params.max_salary);
  }
  if (params.availability && params.availability !== "all") {
    query.set("availability", params.availability);
  }
  if (params.page) query.set("page", params.page);
  if (params.page_size) query.set("page_size", params.page_size);

  const qs = query.toString();
  return apiRequest(`/talent/search${qs ? `?${qs}` : ""}`, {
    method: "GET",
    authType: "company",
  });
}

export async function getTalentProfile(profileId) {
  return apiRequest(`/talent/${profileId}`, {
    method: "GET",
    authType: "company",
  });
}

export async function inviteTalent(profileId, payload) {
  return apiRequest(`/talent/${profileId}/invite`, {
    method: "POST",
    authType: "company",
    body: payload,
  });
}
