/**
 * -------------------------------------------------------
 * File: lib/storage/index.js
 * Description: Universal multi-tier storage driver (local, session, cookie)
 * -------------------------------------------------------
 */
import { STORAGE_CONFIG, getScopedKey } from "../../config/storage.config";

// --- Cookie Operations ---
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name, value, days = STORAGE_CONFIG.cookieDefaults.maxAgeDays) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = STORAGE_CONFIG.cookieDefaults.secure ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${
    STORAGE_CONFIG.cookieDefaults.path
  }; SameSite=${STORAGE_CONFIG.cookieDefaults.sameSite}${secure}`;
}

function removeCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${STORAGE_CONFIG.cookieDefaults.path}`;
}

// --- Universal AppStorage API ---
export const AppStorage = {
  /**
   * Retrieves an item by config descriptor or string key.
   * If configEntry has a legacyKey, checks scoped key first, then falls back to legacyKey.
   */
  get(configEntry) {
    if (typeof window === "undefined" || !configEntry) return null;
    const entry = typeof configEntry === "string" ? { key: configEntry, type: "local" } : configEntry;
    if (!entry?.key) return null;
    const scopedKey = getScopedKey(entry.key);

    let val = null;
    switch (entry.type) {
      case "cookie":
        val = getCookie(scopedKey);
        if (!val && entry.legacyKey) val = getCookie(entry.legacyKey);
        break;
      case "session":
        val = sessionStorage.getItem(scopedKey);
        if (!val && entry.legacyKey) val = sessionStorage.getItem(entry.legacyKey);
        break;
      case "local":
      default:
        val = localStorage.getItem(scopedKey);
        if (!val && entry.legacyKey) {
          val = localStorage.getItem(entry.legacyKey);
          if (val) {
            localStorage.setItem(scopedKey, val);
          }
        }
        break;
    }
    return val;
  },

  /**
   * Saves an item to the appropriate storage driver.
   */
  set(configEntry, value) {
    if (typeof window === "undefined" || !configEntry || value === undefined || value === null) return;
    const entry = typeof configEntry === "string" ? { key: configEntry, type: "local" } : configEntry;
    if (!entry?.key) return;
    const scopedKey = getScopedKey(entry.key);
    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);

    switch (entry.type) {
      case "cookie":
        setCookie(scopedKey, serialized);
        break;
      case "session":
        sessionStorage.setItem(scopedKey, serialized);
        break;
      case "local":
      default:
        localStorage.setItem(scopedKey, serialized);
        break;
    }
  },

  /**
   * Removes an item from the appropriate storage driver (and removes legacy key if defined).
   */
  remove(configEntry) {
    if (typeof window === "undefined" || !configEntry) return;
    const entry = typeof configEntry === "string" ? { key: configEntry, type: "local" } : configEntry;
    if (!entry?.key) return;
    const scopedKey = getScopedKey(entry.key);

    switch (entry.type) {
      case "cookie":
        removeCookie(scopedKey);
        if (entry.legacyKey) removeCookie(entry.legacyKey);
        break;
      case "session":
        sessionStorage.removeItem(scopedKey);
        if (entry.legacyKey) sessionStorage.removeItem(entry.legacyKey);
        break;
      case "local":
      default:
        localStorage.removeItem(scopedKey);
        if (entry.legacyKey) localStorage.removeItem(entry.legacyKey);
        break;
    }
  },

  /**
   * Clears all storage keys belonging to the current baseName + stage
   */
  clearStageData() {
    if (typeof window === "undefined") return;
    const prefix = `${STORAGE_CONFIG.baseName}_${STORAGE_CONFIG.stage}_`;

    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => localStorage.removeItem(k));
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch (_) {}
  },
};

export { STORAGE_CONFIG, getScopedKey };
export default AppStorage;
