/**
 * Centralized API client for the Notification Management System.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.detail || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

// 1. Triggers & Templates Matrix
export const api = {
  // Triggers
  getTriggers: () => request('/triggers/'),
  createTrigger: (data) => request('/triggers/', { method: 'POST', body: JSON.stringify(data) }),
  deleteTrigger: (id) => request(`/triggers/${id}/`, { method: 'DELETE' }),
  fireTrigger: (slug, context = {}) => request(`/triggers/${slug}/fire/`, { method: 'POST', body: JSON.stringify({ context }) }),

  // Templates
  updateTemplate: (id, data) => request(`/templates/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleTemplate: (id) => request(`/templates/${id}/toggle/`, { method: 'POST' }),
  testSendTemplate: (id, recipient, customVars = {}) => 
    request(`/templates/${id}/test-send/`, { method: 'POST', body: JSON.stringify({ recipient, custom_vars: customVars }) }),
  syncWhatsAppTemplate: (id) => request(`/templates/${id}/sync-whatsapp/`, { method: 'POST' }),

  // Logs
  getLogs: () => request('/logs/'),
  clearLogs: () => request('/logs/clear/', { method: 'DELETE' }),

  // System Status
  getStatus: () => request('/status/'),

  // Web Push
  getVapidKey: () => request('/webpush/vapid-key/'),
  subscribePush: (subscription) => request('/webpush/subscribe/', { method: 'POST', body: JSON.stringify(subscription) }),

  // Auth & Trigger Events
  login: (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  getMe: () => request('/auth/me/'),
  simulateEvent: (triggerSlug, context = {}) => request('/auth/simulate-event/', { method: 'POST', body: JSON.stringify({ trigger_slug: triggerSlug, context }) })
};

/**
 * Utility to convert VAPID base64 string to Uint8Array for PushManager
 */
export function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
