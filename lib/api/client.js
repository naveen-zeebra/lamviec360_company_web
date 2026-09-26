import { API_BASE_URL, SEEKER_URL, API_TIMEOUT } from "../../config/index.js";

export { API_BASE_URL, SEEKER_URL, API_TIMEOUT };

export const SEEKER_TOKEN_KEY = "lv360_seeker_token";
export const COMPANY_TOKEN_KEY = "lv360_company_token";

export function getSeekerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SEEKER_TOKEN_KEY);
}

export function setSeekerToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(SEEKER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SEEKER_TOKEN_KEY);
  }
}

export function removeSeekerToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEEKER_TOKEN_KEY);
}

export function getCompanyToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COMPANY_TOKEN_KEY);
}

export function setCompanyToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(COMPANY_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(COMPANY_TOKEN_KEY);
  }
}

export function removeCompanyToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COMPANY_TOKEN_KEY);
}

export async function apiRequest(endpoint, { method = "GET", body, headers = {}, authType = null, params = null } = {}) {
  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, v);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const reqHeaders = { ...headers };

  if (body && !(body instanceof FormData) && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (authType === "seeker") {
    const token = getSeekerToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  } else if (authType === "company") {
    const token = getCompanyToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok || (data && typeof data === "object" && data.success === false)) {
      let errorMsg = !res.ok ? `Request failed with status ${res.status}` : "Operation failed";
      if (data && typeof data === "object") {
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail
            .map((item) => {
              if (typeof item === "string") return item;
              const field = item.loc ? item.loc.filter((l) => l !== "body").join(".") : "";
              return field ? `${field}: ${item.msg}` : item.msg;
            })
            .join(", ");
        } else if (typeof data.detail === "string" && data.detail.trim()) {
          errorMsg = data.detail;
        } else if (typeof data.message === "string" && data.message.trim()) {
          errorMsg = data.message;
        } else if (typeof data.error === "string" && data.error.trim()) {
          errorMsg = data.error;
        } else if (data.error && typeof data.error.message === "string") {
          errorMsg = data.error.message;
        }
      } else if (typeof data === "string" && data.trim()) {
        errorMsg = data;
      }
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status && error.status < 500) {
      console.warn(`API [${method} ${endpoint}] (${error.status}):`, error.message || error);
    } else {
      console.error(`API Error [${method} ${endpoint}]:`, error.message || error);
    }
    throw error;
  }
}
