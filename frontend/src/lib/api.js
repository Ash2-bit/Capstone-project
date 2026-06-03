import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// Create Axios client instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sapulidiku_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Global API call helper utilizing Axios.
 * Handles automatic serialization, request methods, and consistent error catching.
 */
export async function apiRequest(path, options = {}) {
  try {
    const config = {
      url: path,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers || {},
    };

    // If body is FormData (such as report submission with photos), let Axios handle content boundary
    if (options.body instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    let errorMessage = 'Terjadi kesalahan pada jaringan.';
    if (error.response) {
      errorMessage = error.response.data?.message || `HTTP error! Status: ${error.response.status}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
}

export const publicApi = {
  getHomeStats: () => apiRequest('/api/public/home'),
  getMapData: (sessionId) => apiRequest(`/api/public/sessions/${sessionId}/map-data`),
  getPrintableReport: (sessionId) => apiRequest(`/api/public/sessions/${sessionId}/report`),
  submitReport: (formData) => apiRequest('/api/public/reports', {
    method: 'POST',
    body: formData,
  }),
};

export const adminApi = {
  login: (email, password) => apiRequest('/api/admin/login', {
    method: 'POST',
    body: { email, password },
  }),

  // Provinces
  getProvinces: () => apiRequest('/api/admin/provinces'),
  createProvince: (name) => apiRequest('/api/admin/provinces', {
    method: 'POST',
    body: { name },
  }),
  updateProvince: (id, name) => apiRequest(`/api/admin/provinces/${id}`, {
    method: 'PUT',
    body: { name },
  }),
  deleteProvince: (id) => apiRequest(`/api/admin/provinces/${id}`, {
    method: 'DELETE',
  }),

  // SAR Bases
  getSarBases: () => apiRequest('/api/admin/sar-bases'),
  createSarBase: (data) => apiRequest('/api/admin/sar-bases', {
    method: 'POST',
    body: data,
  }),
  updateSarBase: (id, data) => apiRequest(`/api/admin/sar-bases/${id}`, {
    method: 'PUT',
    body: data,
  }),
  deleteSarBase: (id) => apiRequest(`/api/admin/sar-bases/${id}`, {
    method: 'DELETE',
  }),

  // Reports
  getReports: () => apiRequest('/api/admin/reports'),
  getReportById: (id) => apiRequest(`/api/admin/reports/${id}`),
  updateReport: (id, data) => apiRequest(`/api/admin/reports/${id}`, {
    method: 'PUT',
    body: data,
  }),
  deleteReport: (id) => apiRequest(`/api/admin/reports/${id}`, {
    method: 'DELETE',
  }),

  // Sessions
  getSessions: () => apiRequest('/api/admin/sessions'),
  getSessionById: (id) => apiRequest(`/api/admin/sessions/${id}`),
  createSession: (data) => apiRequest('/api/admin/sessions', {
    method: 'POST',
    body: data,
  }),
  deleteSession: (id) => apiRequest(`/api/admin/sessions/${id}`, {
    method: 'DELETE',
  }),
};

export function getStorageUrl(photoPath) {
  if (!photoPath) return null;
  return `${API_URL}/storage/${photoPath}`;
}
