"use client";

import { useState, useEffect } from "react";
import { API_TARGET, API_BASE_URL } from "../config/index.js";

const STORAGE_KEY = "lv360_master_data_v1";

export const DEFAULT_MASTER_DATA = {
  jobTypes: [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Remote",
    "Temporary",
  ],
  companySizes: [
    "1–10",
    "11–50",
    "51–200",
    "201–500",
    "500+",
  ],
  industries: [
    "Technology",
    "Software & IT",
    "Finance & Banking",
    "Manufacturing",
    "Retail & Commerce",
    "Logistics",
    "Hospitality",
    "Healthcare",
    "Education",
    "Other",
  ],
  locations: [
    "Ho Chi Minh City",
    "Hanoi",
    "Da Nang",
    "Can Tho",
    "Hai Phong",
    "Binh Duong",
    "Dong Nai",
    "Remote",
  ],
  departments: [
    "Engineering & Technology",
    "Product & Design",
    "Marketing & Communications",
    "Sales & Business Development",
    "Human Resources & Talent",
    "Finance & Accounting",
    "Customer Success & Operations",
    "Legal & Compliance",
    "Administration",
  ],
};

export function getCachedMasterData() {
  if (typeof window === "undefined") return DEFAULT_MASTER_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MASTER_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MASTER_DATA,
      ...parsed,
    };
  } catch {
    return DEFAULT_MASTER_DATA;
  }
}

export function getMasterData(category) {
  const data = getCachedMasterData();
  const canonical =
    category === "job_types" || category === "types"
      ? "jobTypes"
      : category === "company_sizes" || category === "sizes"
      ? "companySizes"
      : category === "industry"
      ? "industries"
      : category === "cities" || category === "provinces"
      ? "locations"
      : category === "departments" || category === "department"
      ? "departments"
      : category;

  const items = data[canonical];
  return Array.isArray(items) && items.length > 0 ? items : DEFAULT_MASTER_DATA[canonical] || [];
}

export async function fetchMasterData() {
  if (typeof window === "undefined") return DEFAULT_MASTER_DATA;

  const isBrowserLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const endpoints = [];

  // 1. Configured API target
  if (API_TARGET) {
    const isTargetLocal = API_TARGET.includes("localhost") || API_TARGET.includes("127.0.0.1");
    if (!isTargetLocal || isBrowserLocal) {
      endpoints.push(`${API_TARGET}/api/v1/master-data`);
    }
  }

  // 2. Derive origin from API_BASE_URL
  if (API_BASE_URL) {
    try {
      const parsed = new URL(API_BASE_URL);
      const isBaseLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      if (!isBaseLocal || isBrowserLocal) {
        const candidate = `${parsed.origin}/api/v1/master-data`;
        if (!endpoints.includes(candidate)) endpoints.push(candidate);
      }
    } catch {}
  }

  // 3. When running on remote server, try relative path
  if (!isBrowserLocal && typeof window !== "undefined") {
    endpoints.push(`${window.location.origin}/api/v1/master-data`);
    endpoints.push("/api/v1/master-data");
  }

  // 4. Local dev fallback ONLY on localhost
  if (isBrowserLocal) {
    if (!endpoints.includes("http://localhost:8002/api/v1/master-data")) {
      endpoints.push("http://localhost:8002/api/v1/master-data");
    }
    if (!endpoints.includes("http://localhost:8001/api/v1/master-data")) {
      endpoints.push("http://localhost:8001/api/v1/master-data");
    }
  }

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        if (payload && typeof payload === "object") {
          const merged = { ...DEFAULT_MASTER_DATA, ...payload };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  return getCachedMasterData();
}

export function useMasterData() {
  const [data, setData] = useState(getCachedMasterData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMasterData()
      .then((res) => {
        if (mounted && res) {
          setData(res);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return {
    masterData: data,
    jobTypes: data.jobTypes || DEFAULT_MASTER_DATA.jobTypes,
    companySizes: data.companySizes || DEFAULT_MASTER_DATA.companySizes,
    industries: data.industries || DEFAULT_MASTER_DATA.industries,
    locations: data.locations || DEFAULT_MASTER_DATA.locations,
    departments: data.departments || DEFAULT_MASTER_DATA.departments,
    loading,
    refresh: () => fetchMasterData().then(setData),
  };
}

