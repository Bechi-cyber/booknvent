/**
 * LESAVOT Internationalization (i18n) Module
 * 
 * This module provides internationalization support for the LESAVOT application.
 * It includes language selection, translation, and RTL support.
 */

// Available languages
const availableLanguages = {
  'en': {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr'
  },
  'fr': {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr'
  },
  'es': {
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr'
  },
  'de': {
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr'
  },
  'ar': {
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl'
  }
};

// Current language
let currentLanguage = 'en';

// Translations cache
const translations = {};

// Default fallback language
const fallbackLanguage = 'en';

/**
 * Initialize internationalization
 */
async function initI18n() {
  try {
    // Determine initial language
    const savedLanguage = localStorage.getItem('language');
    const browserLanguage = navigator.language.split('-')[0];
    
    // Use saved language, browser language, or fallback
    let initialLanguage = savedLanguage || browserLanguage || fallbackLanguage;
    
    // Ensure the language is supported
    if (!availableLanguages[initialLanguage]) {
      initialLanguage = fallbackLanguage;
    }
    
    // Set current language
    await setLanguage(initialLanguage);
    
    // Create language selector
    createLanguageSelector();
    
    console.log(`Internationalization initialized with language: ${currentLanguage}`);
  } catch (error) {
    console.error('Error initializing internationalization:', error);
  }
}

/**
 * Set the current language
 * @param {string} languageCode - Language code (e.g., 'en', 'fr')
 */
async function setLanguage(languageCode) {
  try {
    // Ensure the language is supported
    if (!availableLanguages[languageCode]) {
      console.warn(`Language ${languageCode} is not supported. Using fallback language ${fallbackLanguage}.`);
      languageCode = fallbackLanguage;
    }
    
    // Load translations if not already loaded
    if (!translations[languageCode]) {
      await loadTranslations(languageCode);
    }
    
    // Set current language
    currentLanguage = languageCode;
    
    // Save to localStorage
    localStorage.setItem('language', languageCode);
    
    // Update HTML lang attribute
    document.documentElement.lang = languageCode;
    
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = availableLanguages[languageCode].direction;
    
    // Apply translations to the page
    translatePage();
    
    // Update language selector if it exists
    updateLanguageSelector();
    
    // Dispatch language change event
    const event = new CustomEvent('languagechange', { detail: { language: languageCode } });
    document.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error(`Error setting language to ${languageCode}:`, error);
    return false;
  }
}

/**
 * Load translations for a language
 * @param {string} languageCode - Language code
 */
async function loadTranslations(languageCode) {
  try {
    // Fetch translations file
    const response = await fetch(`translations/${languageCode}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${languageCode}`);
    }
    
    // Parse JSON
    const data = await response.json();
    
    // Store translations
    translations[languageCode] = data;
    
    return true;
  } catch (error) {
    console.error(`Error loading translations for ${languageCode}:`, error);
    
    // Use empty translations as fallback
    translations[languageCode] = {};
    
    return false;
  }
}

/**
 * Translate the page
 */
function translatePage() {
  // Get all elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);
    
    // Apply translation
    if (translation) {
      // Check if element has HTML content
      if (element.hasAttribute('data-i18n-html')) {
        element.innerHTML = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
  
  // Translate placeholders
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  
  placeholders.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = getTranslation(key);
    
    if (translation) {
      element.placeholder = translation;
    }
  });
  
  // Translate titles
  const titles = document.querySelectorAll('[data-i18n-title]');
  
  titles.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = getTranslation(key);
    
    if (translation) {
      element.title = translation;
    }
  });
  
  // Translate aria-labels
  const ariaLabels = document.querySelectorAll('[data-i18n-aria-label]');
  
  ariaLabels.forEach(element => {
    const key = element.getAttribute('data-i18n-aria-label');
    const translation = getTranslation(key);
    
    if (translation) {
      element.setAttribute('aria-label', translation);
    }
  });
}

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} - Translated text
 */
function getTranslation(key, params = {}) {
  // Get current language translations
  const currentTranslations = translations[currentLanguage] || {};
  
  // Get translation
  let translation = currentTranslations[key];
  
  // Fallback to default language if translation not found
  if (!translation && currentLanguage !== fallbackLanguage) {
    const fallbackTranslations = translations[fallbackLanguage] || {};
    translation = fallbackTranslations[key];
  }
  
  // Fallback to key if translation not found
  if (!translation) {
    translation = key;
  }
  
  // Interpolate parameters
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach(param => {
      const regex = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
      translation = translation.replace(regex, params[param]);
    });
  }
  
  return translation;
}

/**
 * Create language selector
 */
function createLanguageSelector() {
  // Check if selector already exists
  if (document.getElementById('language-selector')) {
    return;
  }
  
  // Create selector container
  const container = document.createElement('div');
  container.className = 'language-selector';
  
  // Create select element
  const select = document.createElement('select');
  select.id = 'language-selector';
  select.setAttribute('aria-label', 'Select language');
  
  // Add options for each language
  Object.keys(availableLanguages).forEach(code => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = availableLanguages[code].nativeName;
    option.selected = code === currentLanguage;
    select.appendChild(option);
  });
  
  // Add change event listener
  select.addEventListener('change', () => {
    setLanguage(select.value);
  });
  
  // Add select to container
  container.appendChild(select);
  
  // Add container to document
  const footer = document.querySelector('footer');
  if (footer) {
    footer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
}

/**
 * Update language selector
 */
function updateLanguageSelector() {
  const selector = document.getElementById('language-selector');
  if (selector) {
    selector.value = currentLanguage;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

// Export the i18n API
window.i18n = {
  setLanguage,
  getTranslation,
  getCurrentLanguage: () => currentLanguage,
  getAvailableLanguages: () => ({ ...availableLanguages }),
  translateElement: (element) => {
    if (element.hasAttribute('data-i18n')) {
      const key = element.getAttribute('data-i18n');
      const translation = getTranslation(key);
      
      if (translation) {
        if (element.hasAttribute('data-i18n-html')) {
          element.innerHTML = translation;
        } else {
          element.textContent = translation;
        }
      }
    }
  }
};
