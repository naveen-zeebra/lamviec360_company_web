/**
 * -------------------------------------------------------
 * File: config/index.js
 * Description: Application environment & API configuration (Company Web)
 * -------------------------------------------------------
 */
// ================================
// Environment Detection
// ================================

const rawEnv =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT)) ||
  "local";

export const ENVIRONMENT = rawEnv.toLowerCase();

// ================================
// Multi-Environment Configuration
// ================================

const ENV_URLS = {
  production: {
    apiTarget:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCTION_API_TARGET) ||
      "https://api.lamviec360.com",
    baseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCTION_BASE_URL) ||
      "https://api.lamviec360.com/api/v1/company",
    s3ImageBaseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCTION_S3_IMAGE_BASE_URL) ||
      "https://api.lamviec360.com/uploads",
    seekerUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCTION_SEEKER_URL) ||
      "https://lamviec360.com",
  },
  develop: {
    apiTarget:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEVELOP_API_TARGET) ||
      "https://devapi.lamviec360.com",
    baseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEVELOP_BASE_URL) ||
      "https://devapi.lamviec360.com/api/v1/company",
    s3ImageBaseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEVELOP_S3_IMAGE_BASE_URL) ||
      "https://devapi.lamviec360.com/uploads",
    seekerUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEVELOP_SEEKER_URL) ||
      "https://devjobseeker.lamviec360.com",
  },
  local: {
    apiTarget:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOCAL_API_TARGET) ||
      "http://localhost:8002",
    baseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOCAL_BASE_URL) ||
      "http://localhost:8002/api/v1/company",
    s3ImageBaseUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOCAL_S3_IMAGE_BASE_URL) ||
      "http://localhost:8002/uploads",
    seekerUrl:
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOCAL_SEEKER_URL) ||
      "http://localhost:3001",
  },
};

// Select active environment URLs (default to local if unknown)
const activeEnvConfig = ENV_URLS[ENVIRONMENT] ?? ENV_URLS.local;

// Direct overrides take priority if defined in .env.local
const resolvedBaseUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  activeEnvConfig.baseUrl;

const resolvedSeekerUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SEEKER_URL) ||
  activeEnvConfig.seekerUrl;

// ================================
// Exports
// ================================

/** Base API URL for Company / Employer microservice requests */
export const API_BASE_URL = (resolvedBaseUrl || "").replace(/\/$/, "");

/** Base URL for resolving uploaded media / S3 file keys */
export const S3_IMAGE_BASE_URL = (activeEnvConfig.s3ImageBaseUrl || "").replace(/\/$/, "");

/** Public host of the backend API Gateway */
export const API_TARGET = (activeEnvConfig.apiTarget || "http://localhost:8002").replace(/\/$/, "");

/** Public jobseeker portal URL */
export const SEEKER_URL = (resolvedSeekerUrl || "http://localhost:3001").replace(/\/$/, "");

/** Network request timeout in milliseconds */
export const API_TIMEOUT =
  Number(
    typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_API_TIMEOUT || process.env.API_TIMEOUT)
  ) || 30000;

export default {
  ENVIRONMENT,
  API_BASE_URL,
  API_TARGET,
  S3_IMAGE_BASE_URL,
  SEEKER_URL,
  API_TIMEOUT,
};
