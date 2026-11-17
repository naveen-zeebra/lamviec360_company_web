import { apiRequest } from './client.js';

/**
 * Fetch active monthly events for the Employer Landing / Events Widget.
 * Calls the dedicated endpoint GET /api/v1/homepage-events/active
 */
export async function fetchActiveCompanyEvents() {
  try {
    const res = await apiRequest('/homepage-events/active', {
      method: 'GET',
    });
    return res?.data || [];
  } catch (err) {
    console.warn('Failed to fetch active company events:', err?.message || err);
    return [];
  }
}

/**
 * Record a click on an event destination link.
 * @param {number} eventId
 */
export async function trackCompanyEventClick(eventId) {
  if (!eventId) return;
  try {
    await apiRequest(`/homepage-events/${eventId}/click`, {
      method: 'POST',
    });
  } catch (err) {
    console.warn('Failed to track company event click:', err?.message || err);
  }
}
