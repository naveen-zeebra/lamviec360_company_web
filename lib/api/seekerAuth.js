import { apiRequest, setSeekerToken, removeSeekerToken } from "./client";

export async function registerSeeker({ name, email, password }) {
  return apiRequest("/auth/seeker/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function verifySeekerEmail({ email, code }) {
  return apiRequest("/auth/seeker/verify-email", {
    method: "POST",
    body: { email, code },
  });
}

export async function loginSeeker({ email, password }) {
  const data = await apiRequest("/auth/seeker/login", {
    method: "POST",
    body: { email, password },
  });
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function googleSeekerLogin({ email, name, google_id = "google_sso" }) {
  const data = await apiRequest("/auth/seeker/google", {
    method: "POST",
    body: { email, name, google_id },
  });
  if (data?.access_token) {
    setSeekerToken(data.access_token);
  }
  return data;
}

export async function getSeekerMe() {
  return apiRequest("/auth/seeker/me", {
    method: "GET",
    authType: "seeker",
  });
}

export function logoutSeeker() {
  removeSeekerToken();
}
