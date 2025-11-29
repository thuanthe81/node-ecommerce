/**
 * API Client Configuration
 *
 * This module configures the axios HTTP client for the frontend application.
 * It includes several interceptors that handle:
 *
 * 1. Authentication: Automatically adds JWT access tokens to requests
 * 2. Admin Cache-Busting: Prevents caching of admin API responses to ensure
 *    administrators always see fresh, real-time data
 * 3. Token Refresh: Automatically refreshes expired tokens and retries failed requests
 *
 * ## Admin API Cache-Busting
 *
 * All requests to `/admin` endpoints are automatically configured to prevent caching:
 * - Cache-Control, Pragma, and Expires headers are added to all admin requests
 * - GET requests receive a unique timestamp query parameter (_t)
 * - This ensures administrators always see current data without stale cache interference
 *
 * The cache-busting mechanism is transparent to API consumers - no changes are needed
 * to individual API functions. Simply use this client for all API calls.
 *
 * @module api-client
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Request interceptor for admin API cache-busting
 *
 * Ensures that all admin API calls never use cached data by:
 * 1. Adding cache-busting headers (Cache-Control, Pragma, Expires)
 * 2. Appending timestamp query parameter to GET requests
 *
 * This guarantees administrators always see the most current information
 * when managing the platform.
 *
 * Admin endpoints are identified by:
 * - URLs containing '/admin'
 * - Requests with Authorization header (authenticated admin users)
 */
apiClient.interceptors.request.use(
  (config) => {
    // Check if this is an admin API call
    // Admin calls are either explicitly to /admin endpoints or authenticated requests
    const isAdminEndpoint = config.url?.includes('/admin');
    const isAuthenticatedRequest = !!config.headers.Authorization;

    // Apply cache-busting to admin endpoints and authenticated requests
    // This ensures admin operations always get fresh data
    if (isAdminEndpoint || isAuthenticatedRequest) {
      // Add cache-busting headers for all requests
      // These headers prevent browser and intermediate caches from storing responses
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache'; // HTTP/1.0 backward compatibility
      config.headers['Expires'] = '0'; // Prevent caching

      // Add timestamp query parameter for GET requests as additional cache-busting
      // This ensures each request has a unique URL, preventing URL-based caching
      // The backend allows extra query parameters to pass through without validation errors
      if (config.method?.toUpperCase() === 'GET') {
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}_t=${Date.now()}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Don't redirect to login if we're on the order confirmation page
        // This allows guest users to view their order after checkout
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isOrderConfirmation =  currentPath.includes('/checkout') || currentPath.includes('/orders/') || currentPath.includes('/confirmation');

          if (!isOrderConfirmation) {
            window.location.href = '/login';
            // Dispatch custom event for authentication failure
            // This will be handled by AuthContext to perform client-side navigation
            // window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;