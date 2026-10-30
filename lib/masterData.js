"use client";

import { useState, useEffect } from "react";
import { API_TARGET } from "../config/index.js";

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
  try {
    // Try public master-data endpoint or fallback to local
    const targetUrl = API_TARGET ? `${API_TARGET}/api/v1/master-data` : "http://localhost:8002/api/v1/master-data";
    const res = await fetch(targetUrl, { headers: { Accept: "application/json" } });
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
    // Graceful offline fallback
    console.debug("Master data fetch error (using cached/default):", err.message);
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

