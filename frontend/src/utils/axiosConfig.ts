import axios from 'axios';


// Create axios instance with default config
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add device fingerprint for admin requests if present
    const deviceFingerprint = localStorage.getItem('deviceFingerprint');
    if (deviceFingerprint && config.headers) {
      config.headers['x-device-fingerprint'] = deviceFingerprint;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // --- GLOBAL 401 HANDLER: ENTERPRISE-GRADE ---
        // Remove all authentication/session data
        localStorage.removeItem('token');
        sessionStorage.clear(); // Clear all session data (including any phone verification, etc.)
        // Optionally, trigger a global logout event for context-aware logout
        try {
          window.dispatchEvent(new Event('agriconnect-logout'));
        } catch {}
        // Redirect to login page
        window.location.href = '/login';
      }
      return Promise.reject({
        message: data.message || 'An error occurred',
        details: data.details,
        status: status
      });
    } else if (error.request) {
      return Promise.reject({
        message: 'No response received from server',
        status: 0
      });
    } else {
      return Promise.reject({
        message: error.message || 'An error occurred',
        status: 0
      });
    }
  }
);

// Global 401 handler: log out and redirect on authentication error
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on /login or /register
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 