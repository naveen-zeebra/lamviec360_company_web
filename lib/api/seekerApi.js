import { apiRequest } from "./client";

export async function getSeekerProfile() {
  return apiRequest("/seeker/profile", {
    method: "GET",
    authType: "seeker",
  });
}

export async function updateSeekerProfile(patch) {
  return apiRequest("/seeker/profile", {
    method: "PUT",
    authType: "seeker",
    body: patch,
  });
}

export async function saveSeekerResume({ fileName, size = 0, mimeType = "", dataUrl = "" }) {
  return apiRequest("/seeker/resume", {
    method: "POST",
    authType: "seeker",
    body: {
      file_name: fileName,
      size,
      mime_type: mimeType,
      data_url: dataUrl,
    },
  });
}

export async function fetchSeekerResumeDownload() {
  return apiRequest("/seeker/resume/download", {
    method: "GET",
    authType: "seeker",
  });
}

export async function removeSeekerResume() {
  return apiRequest("/seeker/resume", {
    method: "DELETE",
    authType: "seeker",
  });
}

export async function fetchSeekerApplications() {
  return apiRequest("/seeker/applications", {
    method: "GET",
    authType: "seeker",
  });
}

export async function applyToJob(jobId, { resumeFileName, coverLetter, answers = {} }) {
  return apiRequest(`/seeker/jobs/${jobId}/apply`, {
    method: "POST",
    authType: "seeker",
    body: {
      resume_file_name: resumeFileName,
      cover_letter: coverLetter,
      answers,
    },
  });
}

export async function withdrawApplication(appId) {
  return apiRequest(`/seeker/applications/${appId}/withdraw`, {
    method: "POST",
    authType: "seeker",
  });
}

export async function fetchSavedJobs() {
  return apiRequest("/seeker/saved-jobs", {
    method: "GET",
    authType: "seeker",
  });
}

export async function toggleSavedJob(jobId) {
  return apiRequest(`/seeker/saved-jobs/${jobId}/toggle`, {
    method: "POST",
    authType: "seeker",
  });
}

export async function fetchSeekerInterviews() {
  return apiRequest("/seeker/interviews", {
    method: "GET",
    authType: "seeker",
  });
}

export async function respondToInterview(id, status, note = "") {
  return apiRequest(`/seeker/interviews/${id}/respond`, {
    method: "POST",
    authType: "seeker",
    body: {
      status,
      note,
    },
  });
}

export async function fetchSeekerNotifications() {
  return apiRequest("/seeker/notifications", {
    method: "GET",
    authType: "seeker",
  });
}

export async function markSeekerNotificationRead(id) {
  return apiRequest(`/seeker/notifications/${id}/read`, {
    method: "PATCH",
    authType: "seeker",
  });
}
