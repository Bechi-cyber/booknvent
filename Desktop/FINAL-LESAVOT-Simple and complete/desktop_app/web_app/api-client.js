/**
 * LESAVOT API Client
 *
 * This module provides a client for interacting with the LESAVOT API.
 * It includes error handling, retry logic, and offline support.
 */

class ApiClient {
  constructor() {
    // API configuration
    this.baseUrl = 'http://localhost:3000/api';
    this.apiVersion = 'v1';
    this.token = localStorage.getItem('jwt_token');
    this.refreshToken = localStorage.getItem('refresh_token');

    // Retry configuration
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.retryStatusCodes = [408, 429, 500, 502, 503, 504];

    // Offline support
    this.offlineMode = false;
    this.offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');

    // Event listeners
    this.eventListeners = {};

    // Check connection status
    this.checkConnection();

    // Add event listeners for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Check if the device is online
   */
  checkConnection() {
    this.offlineMode = !navigator.onLine;
    if (this.offlineMode) {
      this.emit('offline');
    } else {
      this.emit('online');
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.offlineMode = false;
    this.emit('online');
    this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.offlineMode = true;
    this.emit('offline');
  }

  /**
   * Process queued requests when coming back online
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} queued requests`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const item of queue) {
      try {
        const { method, endpoint, data, timestamp } = item;

        // Skip if the request is too old (more than 24 hours)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
          console.warn(`Skipping expired request: ${method} ${endpoint}`);
          continue;
        }

        // Execute the request
        await this.request(method, endpoint, data, { skipQueue: true });

        this.emit('queueProcessed', { success: true, method, endpoint });
      } catch (error) {
        console.error('Error processing queued request:', error);
        this.emit('queueProcessed', { success: false, error });
      }
    }

    this.emit('queueEmpty');
  }

  /**
   * Save offline queue to localStorage
   */
  saveOfflineQueue() {
    localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
  }

  /**
   * Add a request to the offline queue
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   */
  queueRequest(method, endpoint, data) {
    this.offlineQueue.push({
      method,
      endpoint,
      data,
      timestamp: Date.now()
    });

    this.saveOfflineQueue();
    this.emit('queueUpdated', this.offlineQueue);
  }

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   * @param {string} refreshToken - Refresh token (optional)
   */
  setToken(token, refreshToken = null) {
    this.token = token;
    localStorage.setItem('jwt_token', token);

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Get the authentication headers
   * @returns {Object} - Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => callback(data));
  }

  /**
   * Refresh the authentication token
   * @returns {Promise<Object>} - Response data
   */
  async refreshAuthToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      if (data.token) {
        this.setToken(data.token, data.refreshToken);
        return data;
      } else {
        throw new Error('No token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearToken();
      this.emit('authError', { message: 'Session expired. Please log in again.' });
      throw error;
    }
  }

  /**
   * Make a request to the API with retry logic
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    // Check if we're offline and this request should be queued
    if (this.offlineMode && !options.skipQueue) {
      // Only queue certain types of requests
      const canQueue = method === 'POST' || method === 'PUT' || method === 'PATCH';

      if (canQueue) {
        this.queueRequest(method, endpoint, data);
        this.emit('requestQueued', { method, endpoint });
        return { queued: true, offline: true };
      } else {
        throw new Error('Cannot perform this operation while offline');
      }
    }

    // Add API version to endpoint if not already present
    let fullEndpoint = endpoint;
    if (!endpoint.includes(`/${this.apiVersion}/`) && !endpoint.startsWith(`/${this.apiVersion}/`)) {
      fullEndpoint = endpoint.startsWith('/')
        ? `/${this.apiVersion}${endpoint}`
        : `/${this.apiVersion}/${endpoint}`;
    }

    const url = `${this.baseUrl}${fullEndpoint}`;
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const options = {
          method,
          headers: this.getHeaders(),
          credentials: 'include'
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        // Handle token expiration
        if (response.status === 401 && this.refreshToken && !options.isRefreshing) {
          try {
            await this.refreshAuthToken();
            // Retry the request with the new token
            return this.request(method, endpoint, data, { ...options, isRefreshing: true });
          } catch (refreshError) {
            // If refresh fails, clear tokens and throw the original error
            this.clearToken();
            throw new Error('Session expired. Please log in again.');
          }
        }

        // Parse response
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = text ? { message: text } : {};
        }

        // Handle error responses
        if (!response.ok) {
          // Check if we should retry
          if (this.retryStatusCodes.includes(response.status) && retries < this.maxRetries) {
            retries++;
            const delay = this.retryDelay * Math.pow(2, retries - 1);
            console.warn(`Request failed with status ${response.status}. Retrying in ${delay}ms... (${retries}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // Format error for consistent handling
          const error = new Error(responseData.message || `Request failed with status ${response.status}`);
          error.status = response.status;
          error.data = responseData;
          throw error;
        }

        return responseData;
      } catch (error) {
        // Network errors should be retried
        if (error.name === 'TypeError' && error.message === 'Failed to fetch' && retries < this.maxRetries) {
          retries++;
          const delay = this.retryDelay * Math.pow(2, retries - 1);
          console.warn(`Network error. Retrying in ${delay}ms... (${retries}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Check if we went offline during the request
        if (error.name === 'TypeError' && error.message === 'Failed to fetch' && !navigator.onLine) {
          this.offlineMode = true;
          this.emit('offline');

          // Queue the request if possible
          if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !options.skipQueue) {
            this.queueRequest(method, endpoint, data);
            this.emit('requestQueued', { method, endpoint });
            return { queued: true, offline: true };
          }
        }

        console.error(`API Error (${method} ${endpoint}):`, error);
        throw error;
      }
    }

    // If we get here, all retries failed
    throw new Error(`Request failed after ${this.maxRetries} retries`);
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  // Authentication API

  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Response data
   */
  async register(userData) {
    try {
      const response = await this.post('/auth/signup', userData);
      if (response.token) {
        this.setToken(response.token, response.refreshToken);
        this.emit('auth', { event: 'registered', user: response.user });
      }
      return response;
    } catch (error) {
      this.emit('authError', { event: 'register', error });
      throw error;
    }
  }

  /**
   * Log in a user
   * @param {Object} credentials - User credentials
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<Object>} - Response data
   */
  async login(credentials, rememberMe = false) {
    try {
      const loginData = { ...credentials, rememberMe };
      const response = await this.post('/auth/login', loginData);

      // Handle MFA challenge
      if (response.mfaRequired) {
        this.emit('auth', { event: 'mfaRequired', user: response.user, factors: response.mfaFactors });
        return response;
      }

      // Normal login success
      if (response.token) {
        this.setToken(response.token, response.refreshToken);
        this.emit('auth', { event: 'loggedIn', user: response.user });
      }

      return response;
    } catch (error) {
      this.emit('authError', { event: 'login', error });
      throw error;
    }
  }

  /**
   * Complete MFA verification
   * @param {Object} mfaData - MFA verification data
   * @returns {Promise<Object>} - Response data
   */
  async verifyMfa(mfaData) {
    try {
      const response = await this.post('/auth/mfa/verify', mfaData);

      if (response.token) {
        this.setToken(response.token, response.refreshToken);
        this.emit('auth', { event: 'mfaVerified', user: response.user });
      }

      return response;
    } catch (error) {
      this.emit('authError', { event: 'mfaVerify', error });
      throw error;
    }
  }

  /**
   * Log out the current user
   * @returns {Promise<Object>} - Response data
   */
  async logout() {
    try {
      const response = await this.post('/auth/logout');
      this.clearToken();
      this.emit('auth', { event: 'loggedOut' });
      return response;
    } catch (error) {
      // Still clear token even if the server request fails
      this.clearToken();
      this.emit('auth', { event: 'loggedOut' });
      throw error;
    }
  }

  /**
   * Get the current user
   * @returns {Promise<Object>} - Response data
   */
  async getCurrentUser() {
    try {
      const response = await this.get('/auth/me');
      this.emit('auth', { event: 'userFetched', user: response.user });
      return response;
    } catch (error) {
      // If 401, clear token and emit auth error
      if (error.status === 401) {
        this.clearToken();
        this.emit('authError', { event: 'sessionExpired', error });
      }
      throw error;
    }
  }

  /**
   * Update user password
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} - Response data
   */
  async updatePassword(passwordData) {
    try {
      const response = await this.patch('/auth/update-password', passwordData);
      this.emit('auth', { event: 'passwordUpdated' });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'updatePassword', error });
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response data
   */
  async forgotPassword(email) {
    try {
      const response = await this.post('/auth/forgot-password', { email });
      this.emit('auth', { event: 'passwordResetRequested', email });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'forgotPassword', error });
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(token, password) {
    try {
      const response = await this.post(`/auth/reset-password/${token}`, { password });
      this.emit('auth', { event: 'passwordReset' });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'resetPassword', error });
      throw error;
    }
  }

  /**
   * Enable MFA for current user
   * @returns {Promise<Object>} - Response data with QR code
   */
  async enableMfa() {
    try {
      const response = await this.post('/auth/mfa/enable');
      this.emit('auth', { event: 'mfaEnabled', data: response.data });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'enableMfa', error });
      throw error;
    }
  }

  /**
   * Disable MFA for current user
   * @returns {Promise<Object>} - Response data
   */
  async disableMfa() {
    try {
      const response = await this.post('/auth/mfa/disable');
      this.emit('auth', { event: 'mfaDisabled' });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'disableMfa', error });
      throw error;
    }
  }

  /**
   * Get MFA status for current user
   * @returns {Promise<Object>} - Response data
   */
  async getMfaStatus() {
    return this.get('/auth/mfa/status');
  }

  // User API

  /**
   * Update user profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} - Response data
   */
  async updateProfile(profileData) {
    try {
      const response = await this.patch('/users/update-profile', profileData);
      this.emit('profile', { event: 'profileUpdated', profile: response.data.profile });
      return response;
    } catch (error) {
      this.emit('profileError', { event: 'updateProfile', error });
      throw error;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} - Response data
   */
  async getPreferences() {
    return this.get('/users/preferences');
  }

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} - Response data
   */
  async updatePreferences(preferences) {
    return this.patch('/users/preferences', preferences);
  }

  /**
   * Delete user account
   * @returns {Promise<Object>} - Response data
   */
  async deleteAccount() {
    try {
      const response = await this.delete('/users/delete-account');
      this.clearToken();
      this.emit('auth', { event: 'accountDeleted' });
      return response;
    } catch (error) {
      this.emit('authError', { event: 'deleteAccount', error });
      throw error;
    }
  }

  // Steganography API

  /**
   * Save steganography operation to history
   * @param {Object} operationData - Operation data
   * @returns {Promise<Object>} - Response data
   */
  async saveOperation(operationData) {
    try {
      const response = await this.post('/steganography/history', operationData);
      this.emit('history', { event: 'operationSaved', operation: response.data.operation });
      return response;
    } catch (error) {
      // If offline, store in local history
      if (this.offlineMode || (error.name === 'TypeError' && error.message === 'Failed to fetch')) {
        const localHistory = JSON.parse(localStorage.getItem('local_history') || '[]');
        const operation = {
          ...operationData,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          local: true
        };

        localHistory.push(operation);
        localStorage.setItem('local_history', JSON.stringify(localHistory));

        this.emit('history', { event: 'operationSavedLocally', operation });
        return { data: { operation }, local: true };
      }

      this.emit('historyError', { event: 'saveOperation', error });
      throw error;
    }
  }

  /**
   * Get steganography history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response data
   */
  async getHistory(params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/steganography/history${queryString ? `?${queryString}` : ''}`;

      // Try to get from server
      try {
        const response = await this.get(endpoint);

        // Merge with local history if offline mode was used
        const localHistory = JSON.parse(localStorage.getItem('local_history') || '[]');
        if (localHistory.length > 0) {
          // Filter local history based on params
          const filteredLocalHistory = localHistory.filter(item => {
            if (params.type && item.type !== params.type) return false;
            if (params.mode && item.mode !== params.mode) return false;
            return true;
          });

          // Add local items to the response
          response.data.history = [...filteredLocalHistory, ...response.data.history];
          response.results += filteredLocalHistory.length;

          // Sort by date
          response.data.history.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }

        return response;
      } catch (error) {
        // If offline, return local history only
        if (this.offlineMode || (error.name === 'TypeError' && error.message === 'Failed to fetch')) {
          const localHistory = JSON.parse(localStorage.getItem('local_history') || '[]');

          // Filter local history based on params
          let filteredHistory = [...localHistory];
          if (params.type) {
            filteredHistory = filteredHistory.filter(item => item.type === params.type);
          }
          if (params.mode) {
            filteredHistory = filteredHistory.filter(item => item.mode === params.mode);
          }

          // Sort by date
          filteredHistory.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });

          // Handle pagination
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

          return {
            status: 'success',
            results: paginatedHistory.length,
            pagination: {
              total: filteredHistory.length,
              page,
              limit,
              pages: Math.ceil(filteredHistory.length / limit)
            },
            data: {
              history: paginatedHistory
            },
            local: true
          };
        }

        throw error;
      }
    } catch (error) {
      this.emit('historyError', { event: 'getHistory', error });
      throw error;
    }
  }

  /**
   * Delete steganography history entry
   * @param {string} id - History entry ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteHistoryEntry(id) {
    try {
      // Check if it's a local entry
      if (id.startsWith('local_')) {
        const localHistory = JSON.parse(localStorage.getItem('local_history') || '[]');
        const updatedHistory = localHistory.filter(item => item.id !== id);
        localStorage.setItem('local_history', JSON.stringify(updatedHistory));

        this.emit('history', { event: 'entryDeleted', id });
        return { status: 'success', local: true };
      }

      // Otherwise delete from server
      const response = await this.delete(`/steganography/history/${id}`);
      this.emit('history', { event: 'entryDeleted', id });
      return response;
    } catch (error) {
      this.emit('historyError', { event: 'deleteHistoryEntry', error });
      throw error;
    }
  }

  /**
   * Clear all steganography history
   * @param {boolean} includeLocal - Whether to clear local history as well
   * @returns {Promise<Object>} - Response data
   */
  async clearHistory(includeLocal = true) {
    try {
      // Clear local history if requested
      if (includeLocal) {
        localStorage.removeItem('local_history');
      }

      // Try to clear server history
      try {
        const response = await this.delete('/steganography/history');
        this.emit('history', { event: 'historyCleared' });
        return response;
      } catch (error) {
        // If offline but local was cleared, return success
        if (includeLocal && (this.offlineMode || (error.name === 'TypeError' && error.message === 'Failed to fetch'))) {
          this.emit('history', { event: 'historyCleared', local: true });
          return { status: 'success', local: true };
        }

        throw error;
      }
    } catch (error) {
      this.emit('historyError', { event: 'clearHistory', error });
      throw error;
    }
  }

  /**
   * Save content to library
   * @param {Object} contentData - Content data
   * @returns {Promise<Object>} - Response data
   */
  async saveContent(contentData) {
    return this.post('/steganography/content', contentData);
  }

  /**
   * Get saved content
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response data
   */
  async getSavedContent(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/steganography/content${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get saved content by ID
   * @param {string} id - Content ID
   * @returns {Promise<Object>} - Response data
   */
  async getContentById(id) {
    return this.get(`/steganography/content/${id}`);
  }

  /**
   * Update saved content
   * @param {string} id - Content ID
   * @param {Object} contentData - Content data
   * @returns {Promise<Object>} - Response data
   */
  async updateContent(id, contentData) {
    return this.patch(`/steganography/content/${id}`, contentData);
  }

  /**
   * Delete saved content
   * @param {string} id - Content ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteContent(id) {
    return this.delete(`/steganography/content/${id}`);
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// Make it available globally
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}

export default apiClient;
