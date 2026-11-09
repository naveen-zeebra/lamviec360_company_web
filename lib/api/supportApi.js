import { apiRequest } from "./client.js";

export const COMPANY_SUPPORT_CATEGORIES = [
  { value: "BILLING", label: { vi: "Thanh toán & Gói dịch vụ", en: "Billing & Plans" } },
  { value: "ACCOUNT", label: { vi: "Tài khoản công ty & Phân quyền", en: "Company Account & Roles" } },
  { value: "CONTENT", label: { vi: "Kiểm duyệt & Tin tuyển dụng", en: "Job Posting & Moderation" } },
  { value: "TECHNICAL", label: { vi: "Sự cố kỹ thuật hệ thống", en: "Technical System Issue" } },
  { value: "OTHER", label: { vi: "Hỗ trợ doanh nghiệp khác", en: "Other Support" } },
];

export const COMPANY_SUPPORT_PRIORITIES = [
  { value: "LOW", label: { vi: "Thấp", en: "Low" } },
  { value: "MEDIUM", label: { vi: "Bình thường", en: "Medium" } },
  { value: "HIGH", label: { vi: "Cao", en: "High" } },
  { value: "URGENT", label: { vi: "Khẩn cấp", en: "Urgent" } },
];

/**
 * Submit an employer / company support case.
 * Internal database IDs are auto-resolved from session state.
 */
export async function submitCompanySupportTicket({
  subject,
  category = "BILLING",
  priority = "MEDIUM",
  message,
  submitter_name,
  submitter_email,
  company_id = null,
  job_id = null,
}) {
  return await apiRequest("/support/submit", {
    method: "POST",
    body: {
      subject,
      category,
      priority,
      message,
      submitter_name,
      submitter_email,
      submitter_role: "EMPLOYER",
      company_id: company_id ? Number(company_id) : null,
      job_id: job_id ? Number(job_id) : null,
    },
  });
}

/**
 * Track an existing employer support ticket and load admin replies.
 */
export async function trackCompanySupportTicket(ticketNumber) {
  return await apiRequest(`/support/track/${encodeURIComponent(ticketNumber.trim())}`, {
    method: "GET",
  });
}

/**
 * Send an employer reply to the support thread.
 */
export async function replyToCompanySupportTicket(ticketNumber, { message, submitter_name }) {
  return await apiRequest(`/support/track/${encodeURIComponent(ticketNumber.trim())}/reply`, {
    method: "POST",
    body: {
      message,
      submitter_name,
    },
  });
}


/**
 * List support tickets submitted by current company or user email.
 */
export async function listMyCompanyTickets({ email, company_id }) {
  const params = {};
  if (email) params.email = email;
  if (company_id) params.company_id = company_id;
  return await apiRequest("/support/my-tickets", {
    method: "GET",
    params,
  });
}
