/**
 * LESAVOT Frontend Configuration
 * Environment-aware configuration for API endpoints and application settings
 */

(function() {
  'use strict';

  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '';

  const isDevelopment = isLocalhost || window.location.hostname.includes('localhost');
  const isProduction = window.location.hostname.includes('onrender.com') ||
                      window.location.hostname.includes('netlify.app') ||
                      window.location.hostname.includes('vercel.app') ||
                      !isDevelopment;

  // Configuration object
  const CONFIG = {
    // Environment detection
    environment: isDevelopment ? 'development' : 'production',
    isDevelopment: isDevelopment,
    isProduction: isProduction,

    // API Configuration - Production ready
    apiBaseUrl: isDevelopment ? 'http://localhost:3000/api' : 'https://lasavot-backend.onrender.com/api',
    apiVersion: 'v1',

    // Authentication
    tokenKey: 'jwt_token',
    refreshTokenKey: 'refresh_token',

    // Application settings
    debug: isDevelopment,
    enableLogging: isDevelopment,

    // Feature flags
    enableOfflineMode: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: isProduction,

    // UI Configuration
    theme: 'dark',
    language: 'en',

    // File upload limits
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
      audio: ['audio/wav', 'audio/mp3', 'audio/ogg'],
      text: ['text/plain']
    },

    // Steganography settings
    defaultAlgorithm: 'lsb',
    compressionLevel: 6,

    // Security settings
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,

    // Helper methods
    getApiUrl: function(endpoint) {
      const baseUrl = this.apiBaseUrl;
      const version = this.apiVersion;

      // Remove leading slash from endpoint if present
      endpoint = endpoint.replace(/^\//, '');

      // Add version if not already present
      if (!endpoint.includes(`/${version}/`) && !endpoint.startsWith(`${version}/`)) {
        endpoint = `${version}/${endpoint}`;
      }

      return `${baseUrl}/${endpoint}`;
    },

    isFeatureEnabled: function(feature) {
      return this[`enable${feature.charAt(0).toUpperCase() + feature.slice(1)}`] || false;
    },

    toObject: function() {
      const obj = {};
      for (const key in this) {
        if (typeof this[key] !== 'function') {
          obj[key] = this[key];
        }
      }
      return obj;
    }
  };

  // Make configuration globally available
  window.CONFIG = CONFIG;

  // Log configuration in development
  if (CONFIG.debug) {
    console.log('LESAVOT Configuration loaded:', CONFIG.toObject());
    console.log('Environment:', CONFIG.environment);
    console.log('API Base URL:', CONFIG.apiBaseUrl);
  }

  // Dispatch configuration ready event
  document.addEventListener('DOMContentLoaded', function() {
    const event = new CustomEvent('configReady', { detail: CONFIG });
    window.dispatchEvent(event);
  });

})();
