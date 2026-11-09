import { apiRequest } from './client.js';

/**
 * Fetch active promotional banners for employer dashboard.
 */
export async function fetchActiveCompanyBanners(placement = 'EMPLOYER_DASHBOARD') {
  try {
    const res = await apiRequest('/banners/active', {
      method: 'GET',
      params: { placement },
    });
    return res?.data || [];
  } catch (err) {
    console.warn('Failed to fetch company banners:', err?.message || err);
    return [];
  }
}

/**
 * Record a click on an employer banner.
 * @param {number} bannerId
 */
export async function trackCompanyBannerClick(bannerId) {
  if (!bannerId) return;
  try {
    await apiRequest(`/banners/${bannerId}/click`, {
      method: 'POST',
    });
  } catch (err) {
    console.warn('Failed to track company banner click:', err?.message || err);
  }
}

