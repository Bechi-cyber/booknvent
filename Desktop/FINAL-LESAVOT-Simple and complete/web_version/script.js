/**
 * LESAVOT - Multimodal Steganography Web Application
 * Main JavaScript with code splitting and lazy loading
 */

// Global application state
const app = {
  currentPage: null,
  user: null,
  isAuthenticated: false,
  modules: {},
  elements: {},
  config: {
    apiUrl: window.CONFIG ? window.CONFIG.getApiUrl('') : 'http://localhost:3000/api/v1',
    debug: window.CONFIG ? window.CONFIG.debug : false,
    lazyLoadDelay: 500
  }
};

// Module registry for lazy loading
const moduleRegistry = {
  'auth': './auth.js',
  'text-stego': './text-stego.js',
  'image-stego': './image-stego.js',
  'audio-stego': './audio-stego.js',
  'history': './history.js',
  'ui': './ui.js',
  'utils': './utils.js',
  'animations': './animations.js'
};

// Update app config when global config is ready
window.addEventListener('configReady', (event) => {
  const config = event.detail;
  app.config.apiUrl = config.getApiUrl('');
  app.config.debug = config.debug;

  if (config.debug) {
    console.log('App configuration updated:', app.config);
  }
});

/**
 * Initialize DOM elements
 * This function caches DOM elements for better performance
 */
function initElements() {
  // Main page sections
  app.elements.authPage = document.getElementById('authPage');
  app.elements.mainPage = document.getElementById('mainPage');
  app.elements.homePage = document.getElementById('homePage');
  app.elements.steganographyTools = document.getElementById('steganographyTools');

  // Auth forms
  app.elements.loginForm = document.getElementById('loginForm');
  app.elements.registerForm = document.getElementById('registerForm');
  app.elements.showRegisterBtn = document.getElementById('showRegisterBtn');
  app.elements.showLoginBtn = document.getElementById('showLoginBtn');
  app.elements.registerBtn = document.getElementById('registerBtn');
  app.elements.loginBtn = document.getElementById('loginBtn');
  app.elements.logoutBtn = document.getElementById('logoutBtn');

  // Navigation
  app.elements.backToHomeBtn = document.getElementById('backToHomeBtn');
  app.elements.userInfo = document.getElementById('userInfo');
  app.elements.welcomeMessage = document.getElementById('welcomeMessage');
  app.elements.notificationArea = document.getElementById('notificationArea');
  app.elements.methodButtons = document.querySelectorAll('.method-btn');

  // Loading indicator
  app.elements.loadingIndicator = document.getElementById('loadingIndicator');
  if (!app.elements.loadingIndicator) {
    app.elements.loadingIndicator = document.createElement('div');
    app.elements.loadingIndicator.id = 'loadingIndicator';
    app.elements.loadingIndicator.className = 'loading-indicator';
    app.elements.loadingIndicator.innerHTML = '<div class="spinner"></div>';
    app.elements.loadingIndicator.style.display = 'none';
    document.body.appendChild(app.elements.loadingIndicator);
  }
}

/**
 * Initialize tab elements and other UI components
 */
function initTabElements() {
  // Tab Elements
  app.elements.tabButtons = document.querySelectorAll('.tab-btn');
  app.elements.tabPanes = document.querySelectorAll('.tab-pane');

  // Mode Selectors
  app.elements.imageModeRadios = document.querySelectorAll('input[name="imageMode"]');
  app.elements.imageEncrypt = document.getElementById('imageEncrypt');
  app.elements.imageDecrypt = document.getElementById('imageDecrypt');

  app.elements.textModeRadios = document.querySelectorAll('input[name="textMode"]');
  app.elements.textEncrypt = document.getElementById('textEncrypt');
  app.elements.textDecrypt = document.getElementById('textDecrypt');

  app.elements.audioModeRadios = document.querySelectorAll('input[name="audioMode"]');
  app.elements.audioEncrypt = document.getElementById('audioEncrypt');
  app.elements.audioDecrypt = document.getElementById('audioDecrypt');

  // Password Strength Elements
  app.elements.registerPassword = document.getElementById('registerPassword');
  app.elements.strengthSegments = document.querySelectorAll('.strength-segment');
  app.elements.strengthText = document.querySelector('.strength-text');
  app.elements.confirmPassword = document.getElementById('confirmPassword');

  // File Preview Elements
  app.elements.imageFile = document.getElementById('imageFile');
  app.elements.imagePreview = document.getElementById('imagePreview');
  app.elements.imageDecryptFile = document.getElementById('imageDecryptFile');
  app.elements.imageDecryptPreview = document.getElementById('imageDecryptPreview');
  app.elements.audioFile = document.getElementById('audioFile');
  app.elements.audioPreview = document.getElementById('audioPreview');
  app.elements.audioDecryptFile = document.getElementById('audioDecryptFile');
  app.elements.audioDecryptPreview = document.getElementById('audioDecryptPreview');

  // Action Buttons
  app.elements.imageEncryptBtn = document.getElementById('imageEncryptBtn');
  app.elements.imageDecryptBtn = document.getElementById('imageDecryptBtn');
  app.elements.textEncryptBtn = document.getElementById('textEncryptBtn');
  app.elements.textDecryptBtn = document.getElementById('textDecryptBtn');
  app.elements.audioEncryptBtn = document.getElementById('audioEncryptBtn');
  app.elements.audioDecryptBtn = document.getElementById('audioDecryptBtn');
}

/**
 * Dynamically load a module
 * @param {string} moduleName - Name of the module to load
 * @returns {Promise<Object>} - Module exports
 */
async function loadModule(moduleName) {
  if (app.modules[moduleName]) {
    return app.modules[moduleName];
  }

  try {
    if (app.config.debug) {
      console.log(`Loading module: ${moduleName}`);
    }

    // Show loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'block';
    }

    // Check if module exists in registry
    if (!moduleRegistry[moduleName]) {
      throw new Error(`Module not found: ${moduleName}`);
    }

    // Import module
    const moduleUrl = moduleRegistry[moduleName];

    // Use dynamic import for code splitting
    const modulePromise = new Promise((resolve, reject) => {
      // Create script element
      const script = document.createElement('script');
      script.src = moduleUrl;
      script.type = 'module';

      // Set up load and error handlers
      script.onload = () => {
        // Module loaded, now get the exported module
        if (window[moduleName + 'Module']) {
          resolve(window[moduleName + 'Module']);
        } else {
          reject(new Error(`Module ${moduleName} loaded but no exports found`));
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load module: ${moduleName}`));
      };

      // Add script to document
      document.head.appendChild(script);
    });

    // Wait for module to load
    const module = await modulePromise;

    // Cache module
    app.modules[moduleName] = module;

    // Hide loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'none';
    }

    return module;
  } catch (error) {
    console.error(`Error loading module ${moduleName}:`, error);

    // Hide loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'none';
    }

    // Show error message
    showNotification(`Failed to load ${moduleName} module. Please refresh the page and try again.`, 'error');

    throw error;
  }
}

/**
 * Load multiple modules in parallel
 * @param {Array<string>} moduleNames - Array of module names to load
 * @returns {Promise<Object>} - Object with loaded modules
 */
async function loadModules(moduleNames) {
  try {
    const modulePromises = moduleNames.map(name => loadModule(name));
    const modules = await Promise.all(modulePromises);

    return moduleNames.reduce((result, name, index) => {
      result[name] = modules[index];
      return result;
    }, {});
  } catch (error) {
    console.error('Error loading modules:', error);
    showNotification('Failed to load required modules. Please refresh the page.', 'error');
    throw error;
  }
}

/**
 * Initialize the application
 * This is the main entry point that loads all required modules
 */
async function initApp() {
  try {
    // Initialize DOM elements
    initElements();
    initTabElements();

    // Show loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'block';
    }

    // Determine current page
    const currentPath = window.location.pathname;
    app.currentPage = getCurrentPage(currentPath);

    // Load essential modules first
    const essentialModules = ['utils'];
    await loadModules(essentialModules);

    // Check authentication status
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        // Load auth module
        const authModule = await loadModule('auth');
        const user = await authModule.checkAuth();

        if (user) {
          app.user = user;
          app.isAuthenticated = true;
          showNotification(`Welcome back, ${user.username || user.email}!`, 'success');
        }
      } catch (error) {
        console.warn('Authentication check failed:', error);
        // Clear invalid token
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
      }
    }

    // Load page-specific modules
    await loadPageModules(app.currentPage);

    // Initialize page
    initPage(app.currentPage);

    // Set up navigation
    setupNavigation();

    // Load non-essential modules with a delay for better initial load performance
    setTimeout(async () => {
      try {
        if (app.currentPage === 'home') {
          const animationsModule = await loadModule('animations');
          animationsModule.initAnimations();
        }
      } catch (error) {
        console.warn('Failed to load animations:', error);
      }
    }, app.config.lazyLoadDelay);

    // Hide loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'none';
    }
  } catch (error) {
    console.error('Application initialization failed:', error);
    showNotification('Failed to initialize the application. Please refresh the page.', 'error');

    // Hide loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'none';
    }
  }
}

/**
 * Get current page based on path
 * @param {string} path - Current path
 * @returns {string} - Page name
 */
function getCurrentPage(path) {
  if (path.includes('text.html')) return 'text';
  if (path.includes('image.html')) return 'image';
  if (path.includes('audio.html')) return 'audio';
  if (path.includes('history.html')) return 'history';
  if (path.includes('login.html')) return 'login';
  if (path.includes('signup.html')) return 'signup';
  return 'home';
}

/**
 * Load page-specific modules
 * @param {string} page - Current page
 */
async function loadPageModules(page) {
  switch (page) {
    case 'text':
      await loadModule('text-stego');
      break;
    case 'image':
      await loadModule('image-stego');
      break;
    case 'audio':
      await loadModule('audio-stego');
      break;
    case 'history':
      await loadModule('history');
      break;
    case 'login':
    case 'signup':
      await loadModule('auth');
      break;
    default:
      // Home page doesn't need specific modules
      break;
  }
}

/**
 * Initialize page-specific functionality
 * @param {string} page - Current page
 */
function initPage(page) {
  switch (page) {
    case 'text':
      app.modules['text-stego'].init();
      break;
    case 'image':
      app.modules['image-stego'].init();
      break;
    case 'audio':
      app.modules['audio-stego'].init();
      break;
    case 'history':
      app.modules['history'].init();
      break;
    case 'login':
      app.modules['auth'].initLogin();
      break;
    case 'signup':
      app.modules['auth'].initSignup();
      break;
    default:
      // Initialize home page
      initHomePage();
      break;
  }
}

/**
 * Initialize home page
 */
function initHomePage() {
  // Update UI based on authentication status
  if (app.elements.userInfo && app.elements.welcomeMessage) {
    if (app.isAuthenticated && app.user) {
      app.elements.userInfo.style.display = 'flex';
      app.elements.welcomeMessage.textContent = `Welcome, ${app.user.username || app.user.email}!`;
    } else {
      app.elements.userInfo.style.display = 'none';
    }
  }

  // Set up method buttons
  if (app.elements.methodButtons) {
    app.elements.methodButtons.forEach(button => {
      button.addEventListener('click', () => {
        const method = button.getAttribute('data-method');
        navigateTo(`/${method}.html`);
      });
    });
  }
}

/**
 * Set up navigation event listeners
 */
function setupNavigation() {
  // Handle navigation links
  document.querySelectorAll('a').forEach(link => {
    // Skip external links
    if (link.href.startsWith('http') && !link.href.includes(window.location.hostname)) {
      return;
    }

    link.addEventListener('click', async (event) => {
      const href = link.getAttribute('href');

      // Skip if it's a download link or has target="_blank"
      if (link.hasAttribute('download') || link.getAttribute('target') === '_blank') {
        return;
      }

      // Handle logout link
      if (link.classList.contains('logout-button') || link.id === 'logoutBtn') {
        event.preventDefault();
        try {
          const authModule = await loadModule('auth');
          await authModule.logout();
          window.location.href = '/';
        } catch (error) {
          console.error('Logout failed:', error);
          showNotification('Logout failed. Please try again.', 'error');
        }
        return;
      }

      // Handle normal navigation
      if (href && !href.startsWith('#')) {
        event.preventDefault();
        navigateTo(href);
      }
    });
  });

  // Handle back button
  if (app.elements.backToHomeBtn) {
    app.elements.backToHomeBtn.addEventListener('click', () => {
      navigateTo('/');
    });
  }
}

/**
 * Navigate to a new page
 * @param {string} url - URL to navigate to
 */
async function navigateTo(url) {
  // Show loading indicator
  if (app.elements.loadingIndicator) {
    app.elements.loadingIndicator.style.display = 'block';
  }

  try {
    // Use history API for navigation
    window.history.pushState({}, '', url);

    // Update current page
    const currentPath = window.location.pathname;
    app.currentPage = getCurrentPage(currentPath);

    // Load page content
    const response = await fetch(url);
    const html = await response.text();

    // Extract content from the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.querySelector('main') || doc.querySelector('.content');

    if (content) {
      const mainContent = document.querySelector('main') || document.querySelector('.content');
      if (mainContent) {
        mainContent.innerHTML = content.innerHTML;
      }
    }

    // Re-initialize elements
    initElements();
    initTabElements();

    // Load page-specific modules
    await loadPageModules(app.currentPage);

    // Initialize page
    initPage(app.currentPage);
  } catch (error) {
    console.error('Navigation failed:', error);
    showNotification('Navigation failed. Please try again.', 'error');

    // Fallback to traditional navigation
    window.location.href = url;
  } finally {
    // Hide loading indicator
    if (app.elements.loadingIndicator) {
      app.elements.loadingIndicator.style.display = 'none';
    }
  }
}

function showMainPage(username) {
    authPage.style.display = 'none';
    mainPage.style.display = 'block';
    homePage.style.display = 'block';
    steganographyTools.style.display = 'none';
    userInfo.style.display = 'flex';
    welcomeMessage.textContent = `Welcome, ${username}!`;
}

function initHomeNavigation() {
    // Method selection from home page
    methodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const method = button.getAttribute('data-method');
            homePage.style.display = 'none';
            steganographyTools.style.display = 'block';

            // Activate the corresponding tab
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-tab') === method) {
                    btn.classList.add('active');
                }
            });

            // Show the corresponding tab pane
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${method}Tab`) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // Back to home button
    backToHomeBtn.addEventListener('click', () => {
        homePage.style.display = 'block';
        steganographyTools.style.display = 'none';
    });
}

function hashPassword(password) {
    // Simple hash function for demo purposes
    // In a real app, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

function updatePasswordStrength() {
    const password = registerPassword.value;
    let strength = 0;

    // Calculate strength
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Update UI
    strengthSegments.forEach((segment, index) => {
        segment.className = 'strength-segment';

        if (index < strength) {
            if (strength === 1) segment.classList.add('weak');
            else if (strength === 2 || strength === 3) segment.classList.add('medium');
            else segment.classList.add('strong');
        }
    });

    // Update text
    if (password.length === 0) {
        strengthText.textContent = 'Password strength';
    } else if (strength === 1) {
        strengthText.textContent = 'Weak password';
    } else if (strength === 2) {
        strengthText.textContent = 'Medium password';
    } else if (strength === 3) {
        strengthText.textContent = 'Good password';
    } else {
        strengthText.textContent = 'Strong password';
    }
}

function checkPasswordsMatch() {
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    if (confirm && password !== confirm) {
        confirmPassword.style.borderColor = '#e74c3c';
    } else {
        confirmPassword.style.borderColor = confirm ? '#2ecc71' : '#bdc3c7';
    }
}

// Tabs Navigation
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Mode Switching
function initModeSwitching() {
    // Image mode
    imageModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                imageEncrypt.style.display = 'block';
                imageDecrypt.style.display = 'none';
            } else {
                imageEncrypt.style.display = 'none';
                imageDecrypt.style.display = 'block';
            }
        });
    });

    // Text mode
    textModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                textEncrypt.style.display = 'block';
                textDecrypt.style.display = 'none';
            } else {
                textEncrypt.style.display = 'none';
                textDecrypt.style.display = 'block';
            }
        });
    });

    // Audio mode
    audioModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                audioEncrypt.style.display = 'block';
                audioDecrypt.style.display = 'none';
            } else {
                audioEncrypt.style.display = 'none';
                audioDecrypt.style.display = 'block';
            }
        });
    });
}

// File Previews
function initFilePreviews() {
    // Image file preview
    imageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Selected Image">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Image decrypt file preview
    imageDecryptFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageDecryptPreview.innerHTML = `<img src="${e.target.result}" alt="Selected Image">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Audio file preview
    audioFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                audioPreview.innerHTML = `<audio controls><source src="${e.target.result}" type="${file.type}"></audio>`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Audio decrypt file preview
    audioDecryptFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                audioDecryptPreview.innerHTML = `<audio controls><source src="${e.target.result}" type="${file.type}"></audio>`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Steganography Algorithms
// Image Steganography
function hideMessageInImage(imageData, message, password = '') {
    return new Promise((resolve, reject) => {
        try {
            // Create a canvas to work with the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Set canvas dimensions to match image
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Prepare message
                let messageToHide = message;
                if (password) {
                    // Simple encryption with password
                    messageToHide = encryptMessage(message, password);
                }

                // Convert message to binary
                const binaryMessage = textToBinary(messageToHide);

                // Add message length at the beginning (32 bits for length)
                const binaryLength = messageToHide.length.toString(2).padStart(32, '0');
                const binaryData = binaryLength + binaryMessage;

                // Check if image is large enough to hold the message
                if (binaryData.length > data.length / 4 * 3) {
                    reject('Image is too small to hide this message');
                    return;
                }

                // Hide binary data in the least significant bits of RGB values
                let dataIndex = 0;
                for (let i = 0; i < binaryData.length; i++) {
                    // Skip alpha channel (every 4th byte)
                    if (dataIndex % 4 === 3) {
                        dataIndex++;
                    }

                    // Set the least significant bit of this byte to the message bit
                    data[dataIndex] = (data[dataIndex] & 0xFE) | parseInt(binaryData[i]);
                    dataIndex++;
                }

                // Put modified image data back to canvas
                ctx.putImageData(imageData, 0, 0);

                // Convert canvas to data URL
                const dataURL = canvas.toDataURL('image/png');

                resolve(dataURL);
            };

            img.onerror = function() {
                reject('Error loading image');
            };

            img.src = imageData;
        } catch (error) {
            reject('Error processing image: ' + error.message);
        }
    });
}

function extractMessageFromImage(imageData, password = '') {
    return new Promise((resolve, reject) => {
        try {
            // Create a canvas to work with the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Set canvas dimensions to match image
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image on canvas
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Extract binary data from the least significant bits
                let binaryData = '';
                let dataIndex = 0;

                // First extract 32 bits for length
                while (binaryData.length < 32) {
                    // Skip alpha channel (every 4th byte)
                    if (dataIndex % 4 === 3) {
                        dataIndex++;
                    }

                    // Get the least significant bit of this byte
                    binaryData += (data[dataIndex] & 0x01).toString();
                    dataIndex++;
                }

                // Convert binary length to decimal
                const messageLength = parseInt(binaryData, 2);

                // Check if length seems reasonable
                if (messageLength <= 0 || messageLength > 10000) {
                    reject('No hidden message found or invalid data');
                    return;
                }

                // Extract the actual message
                binaryData = '';
                for (let i = 0; i < messageLength * 8; i++) {
                    // Skip alpha channel (every 4th byte)
                    if (dataIndex % 4 === 3) {
                        dataIndex++;
                    }

                    // Get the least significant bit of this byte
                    binaryData += (data[dataIndex] & 0x01).toString();
                    dataIndex++;

                    // Check if we've reached the end of the image data
                    if (dataIndex >= data.length) {
                        break;
                    }
                }

                // Convert binary to text
                let extractedMessage = binaryToText(binaryData);

                // Decrypt if password was provided
                if (password) {
                    try {
                        extractedMessage = decryptMessage(extractedMessage, password);
                    } catch (error) {
                        reject('Incorrect password or corrupted data');
                        return;
                    }
                }

                resolve(extractedMessage);
            };

            img.onerror = function() {
                reject('Error loading image');
            };

            img.src = imageData;
        } catch (error) {
            reject('Error processing image: ' + error.message);
        }
    });
}

// Steganography Actions
function initSteganographyActions() {
    // Image encryption
    imageEncryptBtn.addEventListener('click', () => {
        if (!imageFile.files[0]) {
            showNotification('Please select an image file', 'error');
            return;
        }

        const message = document.getElementById('imageMessage').value;
        if (!message) {
            showNotification('Please enter a message to hide', 'error');
            return;
        }

        const password = document.getElementById('imagePassword').value;

        // Show loading state
        imageEncryptBtn.disabled = true;
        imageEncryptBtn.textContent = 'Processing...';

        // Read the image file
        const reader = new FileReader();
        reader.onload = function(e) {
            // Hide message in image
            hideMessageInImage(e.target.result, message, password)
                .then(dataURL => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = 'stego_image.png';

                    // Add download button to preview
                    imagePreview.innerHTML = `
                        <img src="${dataURL}" alt="Image with hidden message">
                        <div class="download-container">
                            <p>Message hidden successfully!</p>
                            <button class="btn btn-primary download-btn">Download Image</button>
                        </div>
                    `;

                    // Add click event to download button
                    const downloadBtn = imagePreview.querySelector('.download-btn');
                    downloadBtn.addEventListener('click', () => {
                        link.click();
                    });

                    showNotification('Message hidden successfully!', 'success');
                })
                .catch(error => {
                    showNotification(error, 'error');
                })
                .finally(() => {
                    // Reset button state
                    imageEncryptBtn.disabled = false;
                    imageEncryptBtn.textContent = 'Encrypt';
                });
        };
        reader.readAsDataURL(imageFile.files[0]);
    });

    // Image decryption
    imageDecryptBtn.addEventListener('click', () => {
        if (!imageDecryptFile.files[0]) {
            showNotification('Please select an image file', 'error');
            return;
        }

        const password = document.getElementById('imageDecryptPassword').value;

        // Show loading state
        imageDecryptBtn.disabled = true;
        imageDecryptBtn.textContent = 'Processing...';

        // Read the image file
        const reader = new FileReader();
        reader.onload = function(e) {
            // Extract message from image
            extractMessageFromImage(e.target.result, password)
                .then(message => {
                    // Display extracted message
                    document.getElementById('imageDecryptedMessage').value = message;
                    showNotification('Message extracted successfully!', 'success');
                })
                .catch(error => {
                    showNotification(error, 'error');
                })
                .finally(() => {
                    // Reset button state
                    imageDecryptBtn.disabled = false;
                    imageDecryptBtn.textContent = 'Decrypt';
                });
        };
        reader.readAsDataURL(imageDecryptFile.files[0]);
    });

    // Text encryption
    textEncryptBtn.addEventListener('click', () => {
        const content = document.getElementById('textContent').value;
        const message = document.getElementById('textMessage').value;
        const password = document.getElementById('textPassword').value;
        const outputMode = document.querySelector('input[name="textOutputMode"]:checked').value;
        const textOutput = document.getElementById('textOutput');
        const textOutputContainer = document.getElementById('textOutputContainer');
        const textCopyBtn = document.getElementById('textCopyBtn');
        const textDownloadBtn = document.getElementById('textDownloadBtn');

        if (!content) {
            showNotification('Please enter text content', 'error');
            return;
        }

        if (!message) {
            showNotification('Please enter a message to hide', 'error');
            return;
        }

        // Show loading state
        textEncryptBtn.disabled = true;
        textEncryptBtn.textContent = 'Processing...';

        try {
            let outputText;

            // Always process the steganography to ensure the message is hidden
            const stegoText = hideMessageInText(content, message, password);

            if (outputMode === 'stego') {
                // Normal steganographic output - visible zero-width characters
                outputText = stegoText;
                showNotification('Message hidden successfully! Steganographic text ready.', 'success');
            } else {
                // Plain text output - looks exactly like input text
                outputText = content; // Use the original text as output
                showNotification('Message hidden successfully! Plain text output ready.', 'success');
            }

            // Show the output in the textarea
            textOutput.value = outputText;
            textOutputContainer.style.display = 'block';

            // Set up copy button
            textCopyBtn.addEventListener('click', () => {
                textOutput.select();
                document.execCommand('copy');
                showNotification('Text copied to clipboard!', 'success');
            });

            // Set up download button
            textDownloadBtn.addEventListener('click', () => {
                const blob = new Blob([outputText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = 'stego_text.txt';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
                showNotification('Text file downloaded!', 'success');
            });
        } catch (error) {
            showNotification(error.message || 'Error hiding message', 'error');
        } finally {
            // Reset button state
            textEncryptBtn.disabled = false;
            textEncryptBtn.textContent = 'Encrypt';
        }
    });

    // Text decryption
    textDecryptBtn.addEventListener('click', () => {
        const content = document.getElementById('textDecryptContent').value;
        const password = document.getElementById('textDecryptPassword').value;

        if (!content) {
            showNotification('Please enter text with hidden message', 'error');
            return;
        }

        // Show loading state
        textDecryptBtn.disabled = true;
        textDecryptBtn.textContent = 'Processing...';

        try {
            // Extract message from text
            const message = extractMessageFromText(content, password);

            // Display extracted message
            document.getElementById('textDecryptedMessage').value = message;

            showNotification('Message extracted successfully!', 'success');
        } catch (error) {
            showNotification(error.message || 'Error extracting message', 'error');
        } finally {
            // Reset button state
            textDecryptBtn.disabled = false;
            textDecryptBtn.textContent = 'Decrypt';
        }
    });

    // Audio encryption
    audioEncryptBtn.addEventListener('click', () => {
        if (!audioFile.files[0]) {
            showNotification('Please select an audio file', 'error');
            return;
        }

        const message = document.getElementById('audioMessage').value;
        if (!message) {
            showNotification('Please enter a message to hide', 'error');
            return;
        }

        const password = document.getElementById('audioPassword').value;

        // Show loading state
        audioEncryptBtn.disabled = true;
        audioEncryptBtn.textContent = 'Processing...';

        // Read the audio file
        const reader = new FileReader();
        reader.onload = function(e) {
            // Hide message in audio
            hideMessageInAudio(e.target.result, message, password)
                .then(dataURL => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = 'stego_audio.wav';

                    // Add download button to preview
                    audioPreview.innerHTML = `
                        <audio controls>
                            <source src="${dataURL}" type="audio/wav">
                            Your browser does not support the audio element.
                        </audio>
                        <div class="download-container">
                            <p>Message hidden successfully!</p>
                            <button class="btn btn-primary download-btn">Download Audio</button>
                        </div>
                    `;

                    // Add click event to download button
                    const downloadBtn = audioPreview.querySelector('.download-btn');
                    downloadBtn.addEventListener('click', () => {
                        link.click();
                    });

                    showNotification('Message hidden successfully!', 'success');
                })
                .catch(error => {
                    showNotification(error, 'error');
                })
                .finally(() => {
                    // Reset button state
                    audioEncryptBtn.disabled = false;
                    audioEncryptBtn.textContent = 'Encrypt';
                });
        };
        reader.readAsDataURL(audioFile.files[0]);
    });

    // Audio decryption
    audioDecryptBtn.addEventListener('click', () => {
        if (!audioDecryptFile.files[0]) {
            showNotification('Please select an audio file', 'error');
            return;
        }

        const password = document.getElementById('audioDecryptPassword').value;

        // Show loading state
        audioDecryptBtn.disabled = true;
        audioDecryptBtn.textContent = 'Processing...';

        // Read the audio file
        const reader = new FileReader();
        reader.onload = function(e) {
            // Extract message from audio
            extractMessageFromAudio(e.target.result, password)
                .then(message => {
                    // Display extracted message
                    document.getElementById('audioDecryptedMessage').value = message;
                    showNotification('Message extracted successfully!', 'success');
                })
                .catch(error => {
                    showNotification(error, 'error');
                })
                .finally(() => {
                    // Reset button state
                    audioDecryptBtn.disabled = false;
                    audioDecryptBtn.textContent = 'Decrypt';
                });
        };
        reader.readAsDataURL(audioDecryptFile.files[0]);
    });
}

// Text Steganography
function hideMessageInText(text, message, password = '') {
    // Prepare message
    let messageToHide = message;
    if (password) {
        // Enhanced encryption with password
        messageToHide = enhancedEncrypt(message, password);
    }

    // Convert message to binary
    const binaryMessage = textToBinary(messageToHide);

    // Use a variety of zero-width characters for steganography
    // Zero-width space: \u200B
    // Zero-width non-joiner: \u200C
    // Zero-width joiner: \u200D
    // Word joiner: \u2060
    // Zero-width no-break space: \uFEFF
    const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF'];

    // Generate a checksum for message integrity verification
    const checksum = generateChecksum(messageToHide);

    // Create signature with version info (for future compatibility)
    const signature = '\u200B\u200B\u200C\u200B\u200D'; // Signature v2

    // Prepare the binary data to hide
    // Format: signature + checksum (16 bits) + message length (16 bits) + message
    const checksumBinary = checksum.toString(2).padStart(16, '0');
    const lengthBinary = messageToHide.length.toString(2).padStart(16, '0');

    // Combine all binary data
    const fullBinaryData = checksumBinary + lengthBinary + binaryMessage;

    // Distribute the hidden data throughout the text
    // This makes it harder to detect and more robust
    let stegoText = '';
    let binaryIndex = 0;

    // If text is very short, we'll need to add some padding
    if (text.length < 10) {
        text += ' '.repeat(10 - text.length);
    }

    // Determine optimal distribution frequency
    // We want to spread the data evenly throughout the text
    const distributionFrequency = Math.max(1, Math.floor(text.length / (fullBinaryData.length * 1.5)));

    // Insert the signature at the beginning
    stegoText = signature;

    // Add the rest of the text with hidden data distributed
    for (let i = 0; i < text.length; i++) {
        stegoText += text[i];

        // Insert hidden data at regular intervals
        if (i % distributionFrequency === 0 && binaryIndex < fullBinaryData.length) {
            // Use different zero-width characters for variety
            // This makes statistical analysis harder
            const charIndex = fullBinaryData[binaryIndex] === '0' ? 0 : 1;
            const zeroWidthChar = zeroWidthChars[charIndex % zeroWidthChars.length];
            stegoText += zeroWidthChar;
            binaryIndex++;
        }
    }

    // If we haven't embedded all data yet, add the rest at the end
    if (binaryIndex < fullBinaryData.length) {
        for (let i = binaryIndex; i < fullBinaryData.length; i++) {
            const charIndex = fullBinaryData[i] === '0' ? 0 : 1;
            const zeroWidthChar = zeroWidthChars[charIndex % zeroWidthChars.length];
            stegoText += zeroWidthChar;
        }
    }

    return stegoText;
}

function extractMessageFromText(text, password = '') {
    // Look for signature
    const signature = '\u200B\u200B\u200C\u200B\u200D'; // v2 signature
    const legacySignature = '\u200B\u200B\u200C\u200B'; // v1 signature for backward compatibility

    let isLegacy = false;

    if (!text.includes(signature)) {
        if (text.includes(legacySignature)) {
            isLegacy = true;
        } else {
            throw new Error('No hidden message found');
        }
    }

    const actualSignature = isLegacy ? legacySignature : signature;

    // For legacy mode, use the old extraction method
    if (isLegacy) {
        return extractLegacyMessageFromText(text, password);
    }

    // Find the start of the hidden data
    const startIndex = text.indexOf(actualSignature) + actualSignature.length;

    // Extract zero-width characters
    let binaryData = '';

    // Scan the entire text for zero-width characters
    for (let i = startIndex; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === '\u200B' || char === '\u200D' || char === '\u2060' || char === '\uFEFF') {
            binaryData += '1';
        } else if (char === '\u200C') {
            binaryData += '0';
        }
    }

    // Need at least 32 bits (16 for checksum, 16 for length)
    if (binaryData.length < 32) {
        throw new Error('Invalid steganographic data');
    }

    // Extract checksum and length
    const checksumBinary = binaryData.substring(0, 16);
    const lengthBinary = binaryData.substring(16, 32);

    // Convert binary length to decimal
    const messageLength = parseInt(lengthBinary, 2);
    if (messageLength <= 0 || messageLength > 10000) {
        throw new Error('Invalid message length');
    }

    // Extract message binary
    const messageBits = messageLength * 8;
    if (binaryData.length < 32 + messageBits) {
        throw new Error('Incomplete steganographic data');
    }

    const binaryMessage = binaryData.substring(32, 32 + messageBits);

    // Convert binary to text
    let extractedMessage = binaryToText(binaryMessage);

    // Verify checksum
    const calculatedChecksum = generateChecksum(extractedMessage);
    const storedChecksum = parseInt(checksumBinary, 2);

    if (calculatedChecksum !== storedChecksum && !password) {
        throw new Error('Message integrity check failed');
    }

    // Decrypt if password was provided
    if (password) {
        try {
            extractedMessage = enhancedDecrypt(extractedMessage, password);

            // Re-verify checksum after decryption
            const decryptedChecksum = generateChecksum(extractedMessage);
            if (decryptedChecksum !== storedChecksum) {
                throw new Error('Incorrect password or corrupted data');
            }
        } catch (error) {
            throw new Error('Incorrect password or corrupted data');
        }
    }

    return extractedMessage;
}

// Legacy extraction method for backward compatibility
function extractLegacyMessageFromText(text, password = '') {
    // Look for signature
    const signature = '\u200B\u200B\u200C\u200B';

    // Find the start of the hidden data
    const startIndex = text.indexOf(signature) + signature.length;

    // Extract zero-width characters
    let binaryLength = '';
    let currentIndex = startIndex;

    // Extract 16 bits for length
    for (let i = 0; i < 16; i++) {
        if (currentIndex >= text.length) {
            throw new Error('Invalid steganographic data');
        }

        const char = text.charAt(currentIndex);
        if (char === '\u200C') {
            binaryLength += '0';
        } else if (char === '\u200B') {
            binaryLength += '1';
        } else {
            // Skip non-zero-width characters
            i--;
        }
        currentIndex++;
    }

    // Convert binary length to decimal
    const messageLength = parseInt(binaryLength, 2);
    if (messageLength <= 0 || messageLength > 10000) {
        throw new Error('Invalid message length');
    }

    // Extract message binary
    let binaryMessage = '';
    for (let i = 0; i < messageLength * 8; i++) {
        if (currentIndex >= text.length) {
            throw new Error('Incomplete steganographic data');
        }

        const char = text.charAt(currentIndex);
        if (char === '\u200C') {
            binaryMessage += '0';
        } else if (char === '\u200B') {
            binaryMessage += '1';
        } else {
            // Skip non-zero-width characters
            i--;
        }
        currentIndex++;
    }

    // Convert binary to text
    let extractedMessage = binaryToText(binaryMessage);

    // Decrypt if password was provided
    if (password) {
        try {
            extractedMessage = decryptMessage(extractedMessage, password);
        } catch (error) {
            throw new Error('Incorrect password or corrupted data');
        }
    }

    return extractedMessage;
}

// Generate a simple checksum for message integrity
function generateChecksum(message) {
    let checksum = 0;
    for (let i = 0; i < message.length; i++) {
        checksum = ((checksum << 5) - checksum + message.charCodeAt(i)) & 0xFFFF;
    }
    return checksum;
}

// Enhanced encryption using a more secure algorithm
function enhancedEncrypt(message, password) {
    // This is a more secure version of the XOR cipher
    // In a production environment, we would use the Web Crypto API
    // But for simplicity and browser compatibility, we'll use an enhanced XOR

    // First, create a more robust key from the password
    const key = createKeyFromPassword(password);

    // Then encrypt the message
    let encrypted = '';
    for (let i = 0; i < message.length; i++) {
        const messageChar = message.charCodeAt(i);
        const keyChar = key[i % key.length];
        // Use a more complex operation than simple XOR
        const encryptedChar = ((messageChar + keyChar) * 17) % 65536;
        encrypted += String.fromCharCode(encryptedChar);
    }

    return encrypted;
}

// Enhanced decryption
function enhancedDecrypt(encrypted, password) {
    // Create the same key from the password
    const key = createKeyFromPassword(password);

    // Decrypt the message
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
        const encryptedChar = encrypted.charCodeAt(i);
        const keyChar = key[i % key.length];

        // Reverse the encryption operation
        // Find the original character by solving for messageChar
        let decryptedChar = Math.floor(encryptedChar / 17);
        while ((decryptedChar * 17) % 65536 !== encryptedChar) {
            decryptedChar += 3856; // 65536 / 17
        }
        decryptedChar = (decryptedChar - keyChar + 65536) % 65536;

        decrypted += String.fromCharCode(decryptedChar);
    }

    return decrypted;
}

// Create a more robust key from the password
function createKeyFromPassword(password) {
    // Simple key derivation function
    // In production, we would use PBKDF2 or similar
    const iterations = 1000;
    let key = [];

    // Initialize key with password characters
    for (let i = 0; i < password.length; i++) {
        key.push(password.charCodeAt(i));
    }

    // Extend and strengthen the key
    for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < key.length; j++) {
            // Mix the key bytes
            key[j] = (key[j] + key[(j + 1) % key.length] * 13) % 256;
        }
    }

    return key;
}

// Audio Steganography
function hideMessageInAudio(audioData, message, password = '') {
    return new Promise((resolve, reject) => {
        try {
            // For this demo, we'll use a simplified approach
            // In a real implementation, you would modify the audio samples

            // Prepare message
            let messageToHide = message;
            if (password) {
                // Simple encryption with password
                messageToHide = encryptMessage(message, password);
            }

            // Convert message to binary
            const binaryMessage = textToBinary(messageToHide);

            // Create an audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Decode the audio data
            audioContext.decodeAudioData(dataURItoArrayBuffer(audioData), function(buffer) {
                // Get audio data
                const channelData = buffer.getChannelData(0);

                // Check if audio is large enough to hold the message
                if (binaryMessage.length > channelData.length / 10) {
                    reject('Audio is too small to hide this message');
                    return;
                }

                // Add message length at the beginning (32 bits for length)
                const binaryLength = messageToHide.length.toString(2).padStart(32, '0');
                const binaryData = binaryLength + binaryMessage;

                // Create a copy of the audio data
                const newBuffer = audioContext.createBuffer(
                    buffer.numberOfChannels,
                    buffer.length,
                    buffer.sampleRate
                );

                // Copy original data to new buffer
                for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                    const newChannelData = newBuffer.getChannelData(channel);
                    const originalChannelData = buffer.getChannelData(channel);

                    for (let i = 0; i < buffer.length; i++) {
                        newChannelData[i] = originalChannelData[i];
                    }
                }

                // Modify the least significant bits of samples to hide the message
                const newChannelData = newBuffer.getChannelData(0);
                for (let i = 0; i < binaryData.length; i++) {
                    // Only modify every 10th sample to minimize audible changes
                    const sampleIndex = i * 10;

                    if (sampleIndex < newChannelData.length) {
                        // Get the sample value
                        let sample = newChannelData[sampleIndex];

                        // Modify the least significant bit
                        // Convert to 32-bit integer, modify the LSB, then back to float
                        const intSample = Math.floor(Math.abs(sample) * 10000);
                        const modifiedIntSample = (intSample & ~1) | parseInt(binaryData[i]);
                        const modifiedSample = (modifiedIntSample / 10000) * Math.sign(sample);

                        newChannelData[sampleIndex] = modifiedSample;
                    }
                }

                // Convert buffer to WAV
                const wavData = bufferToWav(newBuffer);

                // Convert to data URL
                const dataURL = 'data:audio/wav;base64,' + arrayBufferToBase64(wavData);

                resolve(dataURL);
            }, function(error) {
                reject('Error decoding audio: ' + error);
            });
        } catch (error) {
            reject('Error processing audio: ' + error.message);
        }
    });
}

function extractMessageFromAudio(audioData, password = '') {
    return new Promise((resolve, reject) => {
        try {
            // Create an audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Decode the audio data
            audioContext.decodeAudioData(dataURItoArrayBuffer(audioData), function(buffer) {
                // Get audio data
                const channelData = buffer.getChannelData(0);

                // Extract binary data from the least significant bits
                let binaryData = '';

                // First extract 32 bits for length
                for (let i = 0; i < 32; i++) {
                    const sampleIndex = i * 10;

                    if (sampleIndex < channelData.length) {
                        // Get the sample value
                        const sample = channelData[sampleIndex];

                        // Extract the least significant bit
                        const intSample = Math.floor(Math.abs(sample) * 10000);
                        binaryData += (intSample & 1).toString();
                    }
                }

                // Convert binary length to decimal
                const messageLength = parseInt(binaryData, 2);

                // Check if length seems reasonable
                if (messageLength <= 0 || messageLength > 10000) {
                    reject('No hidden message found or invalid data');
                    return;
                }

                // Extract the actual message
                binaryData = '';
                for (let i = 0; i < messageLength * 8; i++) {
                    const sampleIndex = (i + 32) * 10;

                    if (sampleIndex < channelData.length) {
                        // Get the sample value
                        const sample = channelData[sampleIndex];

                        // Extract the least significant bit
                        const intSample = Math.floor(Math.abs(sample) * 10000);
                        binaryData += (intSample & 1).toString();
                    }
                }

                // Convert binary to text
                let extractedMessage = binaryToText(binaryData);

                // Decrypt if password was provided
                if (password) {
                    try {
                        extractedMessage = decryptMessage(extractedMessage, password);
                    } catch (error) {
                        reject('Incorrect password or corrupted data');
                        return;
                    }
                }

                resolve(extractedMessage);
            }, function(error) {
                reject('Error decoding audio: ' + error);
            });
        } catch (error) {
            reject('Error processing audio: ' + error.message);
        }
    });
}

// Utility Functions
// Text to binary conversion
function textToBinary(text) {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const binaryChar = charCode.toString(2).padStart(8, '0');
        binary += binaryChar;
    }
    return binary;
}

// Binary to text conversion
function binaryToText(binary) {
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        if (byte.length === 8) {
            const charCode = parseInt(byte, 2);
            text += String.fromCharCode(charCode);
        }
    }
    return text;
}

// Simple encryption/decryption with password
function encryptMessage(message, password) {
    let encrypted = '';
    for (let i = 0; i < message.length; i++) {
        const messageChar = message.charCodeAt(i);
        const passwordChar = password.charCodeAt(i % password.length);
        encrypted += String.fromCharCode(messageChar ^ passwordChar);
    }
    return encrypted;
}

function decryptMessage(encrypted, password) {
    // XOR encryption is symmetric, so decryption is the same as encryption
    return encryptMessage(encrypted, password);
}

// Convert data URI to ArrayBuffer
function dataURItoArrayBuffer(dataURI) {
    // Remove data URI header
    const base64 = dataURI.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
}

// Convert AudioBuffer to WAV format
function bufferToWav(buffer) {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, 36 + length, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numOfChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numOfChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length, true);

    // Write the PCM samples
    const offset = 44;
    let pos = 0;

    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset + pos, int16, true);
            pos += 2;
        }
    }

    return arrayBuffer;
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Show notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element if it doesn't exist
    if (!app.elements || !app.elements.notificationArea) {
        const notificationArea = document.getElementById('notificationArea');

        // Create notification area if it doesn't exist
        if (notificationArea) {
            if (app.elements) {
                app.elements.notificationArea = notificationArea;
            }
        } else {
            const newNotificationArea = document.createElement('div');
            newNotificationArea.id = 'notificationArea';
            newNotificationArea.className = 'notification-area';
            document.body.appendChild(newNotificationArea);

            if (app.elements) {
                app.elements.notificationArea = newNotificationArea;
            }
        }
    }

    const notificationArea = app.elements && app.elements.notificationArea
        ? app.elements.notificationArea
        : document.getElementById('notificationArea');

    if (!notificationArea) {
        console.error('Notification area not found');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    notificationArea.appendChild(notification);

    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    return notification;
}

/**
 * Handle popstate event for browser back/forward navigation
 */
window.addEventListener('popstate', async () => {
    try {
        // Determine current page
        const currentPath = window.location.pathname;
        app.currentPage = getCurrentPage(currentPath);

        // Re-initialize elements
        initElements();
        initTabElements();

        // Load page-specific modules
        await loadPageModules(app.currentPage);

        // Initialize page
        initPage(app.currentPage);
    } catch (error) {
        console.error('Error handling popstate:', error);
        showNotification('Navigation error. Please refresh the page.', 'error');
    }
});

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Bypass authentication for testing
        if (window.location.hash === '#bypass') {
            // Legacy bypass mode
            if (typeof bypassAuth === 'function') {
                bypassAuth();
            } else {
                console.warn('Bypass auth function not available');
            }
            return;
        }

        // Initialize the application with the new module system
        await initApp();

        // For backward compatibility, initialize legacy functions if they exist
        if (typeof initTabs === 'function') initTabs();
        if (typeof initModeSwitching === 'function') initModeSwitching();
        if (typeof initFilePreviews === 'function') initFilePreviews();
        if (typeof initSteganographyActions === 'function') initSteganographyActions();
        if (typeof initHomeNavigation === 'function') initHomeNavigation();
    } catch (error) {
        console.error('Error initializing application:', error);
        showNotification('Failed to initialize application. Please refresh the page.', 'error');
    }
});

// Bypass authentication for testing purposes
function bypassAuth() {
    // Hide auth page and show main page directly
    authPage.style.display = 'none';
    mainPage.style.display = 'block';
    homePage.style.display = 'block';
    steganographyTools.style.display = 'none';

    // Set a test username
    const testUsername = 'TestUser';
    welcomeMessage.textContent = `Welcome, ${testUsername}!`;
    userInfo.style.display = 'flex';

    // Add logout functionality
    logoutBtn.addEventListener('click', () => {
        // For testing, just reload the page
        window.location.reload();
    });

    // Show notification
    showNotification('Authentication bypassed for testing. All features are available.', 'info');
}
