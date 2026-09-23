import { apiRequest } from "./client";

export async function fetchPublicJobs(params = {}) {
  return apiRequest("/public/jobs", {
    method: "GET",
    params,
  });
}

export async function fetchPublicJobDetail(id) {
  return apiRequest(`/public/jobs/${id}`, {
    method: "GET",
  });
}

export async function fetchMasterData() {
  return apiRequest("/public/master-data", {
    method: "GET",
  });
}
