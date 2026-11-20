import { API_BASE_URL, SEEKER_URL, API_TIMEOUT } from "../../config/index.js";
import { AppStorage, STORAGE_CONFIG, getScopedKey } from "../storage/index.js";

export { API_BASE_URL, SEEKER_URL, API_TIMEOUT, AppStorage, STORAGE_CONFIG };

export const COMPANY_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.COMPANY_TOKEN.key);
export const COMPANY_REFRESH_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.COMPANY_REFRESH_TOKEN.key);
export const SEEKER_TOKEN_KEY = getScopedKey(STORAGE_CONFIG.keys.SEEKER_TOKEN.key);

export function getSeekerToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.SEEKER_TOKEN);
}

export function setSeekerToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.SEEKER_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_TOKEN);
  }
}

export function removeSeekerToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.SEEKER_TOKEN);
}

export function getCompanyToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.COMPANY_TOKEN);
}

export function setCompanyToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.COMPANY_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_TOKEN);
  }
}

export function removeCompanyToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_TOKEN);
}

export function getCompanyRefreshToken() {
  return AppStorage.get(STORAGE_CONFIG.keys.COMPANY_REFRESH_TOKEN);
}

export function setCompanyRefreshToken(token) {
  if (token) {
    AppStorage.set(STORAGE_CONFIG.keys.COMPANY_REFRESH_TOKEN, token);
  } else {
    AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_REFRESH_TOKEN);
  }
}

export function removeCompanyRefreshToken() {
  AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_REFRESH_TOKEN);
}

let companyRefreshPromise = null;

async function tryRefreshCompanyToken() {
  const refreshToken = getCompanyRefreshToken();
  if (!refreshToken) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      removeCompanyToken();
      removeCompanyRefreshToken();
      return null;
    }
    const json = await res.json();
    const newAccessToken = json?.data?.access_token || json?.access_token;
    const newRefreshToken = json?.data?.refresh_token || json?.refresh_token;
    if (newAccessToken) {
      setCompanyToken(newAccessToken);
      if (newRefreshToken) {
        setCompanyRefreshToken(newRefreshToken);
      }
      return newAccessToken;
    }
  } catch (_) {
    removeCompanyToken();
    removeCompanyRefreshToken();
    return null;
  }
  return null;
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
      // Automatic token refresh on 401 for company authenticated requests
      if (
        res.status === 401 &&
        authType === "company" &&
        !endpoint.includes("/auth/refresh") &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/register")
      ) {
        if (!companyRefreshPromise) {
          companyRefreshPromise = tryRefreshCompanyToken().finally(() => {
            companyRefreshPromise = null;
          });
        }
        const newToken = await companyRefreshPromise;
        if (newToken) {
          // Retry original request with fresh token
          reqHeaders["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...config, headers: reqHeaders });
          if (retryRes.ok) {
            const retryCt = retryRes.headers.get("content-type");
            return retryCt && retryCt.includes("application/json") ? await retryRes.json() : await retryRes.text();
          }
        }

        // If refresh failed, clear tokens and immediately redirect to login page
        removeCompanyToken();
        removeCompanyRefreshToken();
        if (STORAGE_CONFIG?.keys?.COMPANY_AUTH) {
          AppStorage.remove(STORAGE_CONFIG.keys.COMPANY_AUTH);
        }
        if (typeof window !== "undefined" && !window.location.pathname.includes("/employer-login")) {
          window.location.href = "/employer-login";
        }
      }

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
