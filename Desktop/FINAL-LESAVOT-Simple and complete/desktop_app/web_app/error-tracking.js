/**
 * LESAVOT Error Tracking
 * 
 * This module provides client-side error tracking and reporting.
 * It captures unhandled errors, promise rejections, and API errors.
 */

// Error tracking configuration
const errorTrackingConfig = {
  enabled: true,
  captureUnhandledErrors: true,
  captureUnhandledRejections: true,
  captureNetworkErrors: true,
  captureConsoleErrors: true,
  sampleRate: 1.0, // 1.0 = 100% of errors are reported
  maxErrorsPerMinute: 10,
  apiEndpoint: '/api/v1/metrics/error',
  ignorePatterns: [
    /Script error/i,
    /ResizeObserver loop limit exceeded/i,
    /Network request failed/i,
    /Loading chunk .* failed/i
  ]
};

// Error tracking state
const errorTrackingState = {
  initialized: false,
  errorsThisMinute: 0,
  lastErrorTime: 0,
  originalConsoleError: null,
  originalWindowOnerror: null,
  originalWindowOnunhandledrejection: null
};

/**
 * Initialize error tracking
 */
function initErrorTracking() {
  if (errorTrackingState.initialized) {
    return;
  }
  
  // Save original handlers
  errorTrackingState.originalConsoleError = console.error;
  errorTrackingState.originalWindowOnerror = window.onerror;
  errorTrackingState.originalWindowOnunhandledrejection = window.onunhandledrejection;
  
  // Set up error tracking
  if (errorTrackingConfig.captureUnhandledErrors) {
    window.onerror = handleWindowError;
  }
  
  if (errorTrackingConfig.captureUnhandledRejections) {
    window.onunhandledrejection = handleUnhandledRejection;
  }
  
  if (errorTrackingConfig.captureConsoleErrors) {
    console.error = handleConsoleError;
  }
  
  if (errorTrackingConfig.captureNetworkErrors) {
    setupNetworkErrorTracking();
  }
  
  // Reset error count every minute
  setInterval(() => {
    errorTrackingState.errorsThisMinute = 0;
  }, 60000);
  
  errorTrackingState.initialized = true;
  console.log('Error tracking initialized');
}

/**
 * Handle window.onerror events
 * @param {string} message - Error message
 * @param {string} source - URL where error occurred
 * @param {number} lineno - Line number where error occurred
 * @param {number} colno - Column number where error occurred
 * @param {Error} error - Error object
 * @returns {boolean} - Whether the error was handled
 */
function handleWindowError(message, source, lineno, colno, error) {
  // Call original handler if it exists
  if (typeof errorTrackingState.originalWindowOnerror === 'function') {
    errorTrackingState.originalWindowOnerror.apply(window, arguments);
  }
  
  // Track error
  trackError({
    type: 'uncaught_exception',
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    stack: error && error.stack
  });
  
  // Don't prevent default handling
  return false;
}

/**
 * Handle unhandled promise rejections
 * @param {PromiseRejectionEvent} event - Rejection event
 */
function handleUnhandledRejection(event) {
  // Call original handler if it exists
  if (typeof errorTrackingState.originalWindowOnunhandledrejection === 'function') {
    errorTrackingState.originalWindowOnunhandledrejection.apply(window, arguments);
  }
  
  // Get error details
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : null;
  
  // Track error
  trackError({
    type: 'unhandled_rejection',
    message: message,
    stack: stack
  });
}

/**
 * Handle console.error calls
 */
function handleConsoleError() {
  // Call original console.error
  errorTrackingState.originalConsoleError.apply(console, arguments);
  
  // Get error message
  const args = Array.from(arguments);
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return arg.message;
    } else if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    } else {
      return String(arg);
    }
  }).join(' ');
  
  // Get stack trace if first argument is an Error
  const stack = args[0] instanceof Error ? args[0].stack : null;
  
  // Track error
  trackError({
    type: 'console_error',
    message: message,
    stack: stack
  });
}

/**
 * Set up network error tracking
 */
function setupNetworkErrorTracking() {
  // Patch fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const response = await originalFetch.apply(this, arguments);
      
      // Track failed responses
      if (!response.ok) {
        const url = typeof input === 'string' ? input : input.url;
        trackError({
          type: 'network_error',
          message: `Fetch error: ${response.status} ${response.statusText}`,
          url: url,
          status: response.status
        });
      }
      
      return response;
    } catch (error) {
      // Track network errors
      const url = typeof input === 'string' ? input : input.url;
      trackError({
        type: 'network_error',
        message: `Fetch error: ${error.message}`,
        url: url,
        stack: error.stack
      });
      
      throw error;
    }
  };
  
  // Patch XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._errorTracking = {
      method: method,
      url: url
    };
    return originalXhrOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function() {
    if (this._errorTracking) {
      const xhr = this;
      const originalOnreadystatechange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 400) {
            trackError({
              type: 'network_error',
              message: `XHR error: ${xhr.status} ${xhr.statusText}`,
              url: xhr._errorTracking.url,
              method: xhr._errorTracking.method,
              status: xhr.status
            });
          }
        }
        
        if (originalOnreadystatechange) {
          originalOnreadystatechange.apply(this, arguments);
        }
      };
    }
    
    return originalXhrSend.apply(this, arguments);
  };
}

/**
 * Track an error
 * @param {Object} errorData - Error data
 */
function trackError(errorData) {
  // Check if error tracking is enabled
  if (!errorTrackingConfig.enabled) {
    return;
  }
  
  // Check if we should sample this error
  if (Math.random() > errorTrackingConfig.sampleRate) {
    return;
  }
  
  // Check if we should ignore this error
  const errorMessage = errorData.message || '';
  if (errorTrackingConfig.ignorePatterns.some(pattern => pattern.test(errorMessage))) {
    return;
  }
  
  // Check if we've exceeded the rate limit
  const now = Date.now();
  if (now - errorTrackingState.lastErrorTime < 60000) {
    // Within the same minute
    if (errorTrackingState.errorsThisMinute >= errorTrackingConfig.maxErrorsPerMinute) {
      return;
    }
    errorTrackingState.errorsThisMinute++;
  } else {
    // New minute
    errorTrackingState.errorsThisMinute = 1;
    errorTrackingState.lastErrorTime = now;
  }
  
  // Prepare error data for reporting
  const reportData = {
    errorType: errorData.type || 'unknown',
    errorMessage: errorData.message || 'Unknown error',
    stackTrace: errorData.stack || null,
    url: errorData.url || window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // Report error
  reportError(reportData);
}

/**
 * Report error to the server
 * @param {Object} errorData - Error data
 */
function reportError(errorData) {
  // Use sendBeacon if available for non-blocking reporting
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon(errorTrackingConfig.apiEndpoint, JSON.stringify(errorData));
      return;
    } catch (e) {
      // Fall back to fetch
    }
  }
  
  // Use fetch with keepalive
  fetch(errorTrackingConfig.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(errorData),
    keepalive: true
  }).catch(e => {
    // Silently fail - we don't want to cause more errors
  });
}

// Initialize error tracking when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initErrorTracking);
} else {
  initErrorTracking();
}

// Export the error tracking API
window.errorTracking = {
  config: errorTrackingConfig,
  trackError: trackError,
  reportError: reportError
};
