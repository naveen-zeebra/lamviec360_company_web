import { apiRequest } from "./client";

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

export async function listCompanyJobs() {
  return apiRequest("/jobs", {
    method: "GET",
    authType: "company",
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
  return apiRequest(`/jobs/${id}`, {
    method: "GET",
    authType: "company",
  });
}

export async function updateCompanyJob(id, jobData) {
  return apiRequest(`/jobs/${id}`, {
    method: "PUT",
    authType: "company",
    body: jobData,
  });
}

export async function setCompanyJobStatus(id, status) {
  return apiRequest(`/jobs/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
    authType: "company",
  });
}

export async function duplicateCompanyJob(id) {
  return apiRequest(`/jobs/${id}/duplicate`, {
    method: "POST",
    authType: "company",
  });
}

export async function deleteCompanyJob(id) {
  return apiRequest(`/jobs/${id}`, {
    method: "DELETE",
    authType: "company",
  });
}

export async function listCompanyCandidates({ jobId, stage } = {}) {
  const params = {};
  if (jobId) params.job_id = jobId;
  if (stage) params.stage = stage;
  return apiRequest("/applicants", {
    method: "GET",
    authType: "company",
    params,
  });
}

export async function updateCandidateStage(id, { stage, rejectionTemplateId, rejectionNote }) {
  return apiRequest(`/applicants/${id}/status`, {
    method: "PATCH",
    authType: "company",
    body: {
      status: stage,
      rejection_template_id: rejectionTemplateId,
      rejection_note: rejectionNote,
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
