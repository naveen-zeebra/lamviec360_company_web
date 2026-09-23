import { apiRequest, setCompanyToken, removeCompanyToken } from "./client";

export async function registerCompany({
  company_name,
  reg_number = "VN-" + Date.now().toString().slice(-6),
  industry = "Technology",
  size = "11-50",
  website = "https://example.com",
  contact_name,
  email,
  password,
}) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: {
      company_name,
      reg_number,
      industry,
      size,
      website,
      contact_name,
      full_name: contact_name,
      user_type: "company",
      email,
      password,
    },
  });
  if (data?.data?.access_token) {
    setCompanyToken(data.data.access_token);
  }
  return data;
}

export async function verifyCompanyEmail({ email, code }) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: { email, code },
  });
}

export async function initiateCompanyLogin({ email, password }) {
  return apiRequest("/auth/login/initiate", {
    method: "POST",
    body: { email, password },
  });
}

export async function verifyCompanyOtp({ session_token, code }) {
  const data = await apiRequest("/auth/login/verify-otp", {
    method: "POST",
    body: { session_token, code },
  });
  if (data?.access_token) {
    setCompanyToken(data.access_token);
  }
  return data;
}

export async function getInvitationByToken(token) {
  return apiRequest(`/auth/invite/${token}`, {
    method: "GET",
  });
}

export async function activateTeamInvitation({ invite_token, name, password }) {
  const data = await apiRequest("/auth/activate-invite", {
    method: "POST",
    body: { invite_token, name, password },
  });
  if (data?.access_token) {
    setCompanyToken(data.access_token);
  }
  return data;
}

export async function getCompanyMe() {
  return apiRequest("auth/me", {
    method: "GET",
    authType: "company",
  });
}

export function logoutCompany() {
  removeCompanyToken();
}
