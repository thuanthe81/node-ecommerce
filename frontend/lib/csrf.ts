/**
 * CSRF Token Service
 *
 * Handles fetching and managing CSRF tokens for secure API requests.
 * The backend requires CSRF tokens for certain endpoints like order cancellation.
 */

import axios from 'axios';

interface CsrfTokenResponse {
  csrfToken: string;
  message: string;
}

class CsrfService {
  private token: string | null = null;
  private tokenPromise: Promise<string> | null = null;

  /**
   * Get a CSRF token, fetching it if not already cached
   */
  async getToken(): Promise<string> {
    // If we already have a token, return it
    if (this.token) {
      return this.token;
    }

    // If we're already fetching a token, wait for that request
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Fetch a new token
    this.tokenPromise = this.fetchToken();

    try {
      this.token = await this.tokenPromise;
      return this.token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Fetch a new CSRF token from the server
   */
  private async fetchToken(): Promise<string> {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get<CsrfTokenResponse>(`${baseURL}/csrf/token`, {
        withCredentials: true, // Important: include cookies for CSRF
      });

      console.log('CSRF token fetched successfully');
      return response.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw new Error('Failed to obtain CSRF token');
    }
  }

  /**
   * Clear the cached token (useful when token becomes invalid)
   */
  clearToken(): void {
    this.token = null;
    this.tokenPromise = null;
  }

  /**
   * Add CSRF token to request headers
   */
  async addTokenToHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      ...headers,
      'x-csrf-token': token,
    };
  }
}

// Export singleton instance
export const csrfService = new CsrfService();

/**
 * Helper function to add CSRF token to axios config
 */
export async function withCsrfToken(config: any = {}) {
  const token = await csrfService.getToken();

  return {
    ...config,
    headers: {
      ...config.headers,
      'x-csrf-token': token,
    },
    withCredentials: true, // Important: include cookies for CSRF
  };
}