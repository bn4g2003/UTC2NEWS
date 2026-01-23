/**
 * API Client Configuration
 * Configures the generated OpenAPI client with authentication and base URL
 */

import axios from 'axios';
import { OpenAPI } from '@/api/core/OpenAPI';
import { API_CONFIG, AUTH_CONFIG } from '@/config/constants';

/**
 * Axios instance for direct API calls
 */
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAuthToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Initialize the API client with configuration
 */
export function initializeApiClient() {
  // Set base URL from environment
  OpenAPI.BASE = API_CONFIG.BASE_URL;

  // Enable credentials for CORS
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';

  // Set token resolver to get token from storage
  OpenAPI.TOKEN = async () => {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      return token || '';
    } catch (error) {
      console.error('Error retrieving token:', error);
      return '';
    }
  };

  // Set custom headers
  OpenAPI.HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Set authentication token in the API client and cookie
 */
export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    // Save to localStorage
    localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
    OpenAPI.TOKEN = token;
    
    // Save to cookie for middleware
    document.cookie = `auth-token=${token}; path=/; max-age=${AUTH_CONFIG.JWT_EXPIRY}; SameSite=Lax`;
  } else {
    // Clear from localStorage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    OpenAPI.TOKEN = undefined;
    
    // Clear from cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}

/**
 * Clear authentication token
 */
export function clearAuthToken() {
  setAuthToken(null);
}

// Initialize the API client on module load
if (typeof window !== 'undefined') {
  initializeApiClient();
}
