/**
 * LESAVOT Accessibility Module
 * 
 * This module provides accessibility features for the LESAVOT application.
 * It includes controls for text size, contrast, motion reduction, and more.
 */

// Accessibility settings object
const accessibilitySettings = {
  textSize: 'normal', // normal, large, larger, largest
  contrast: 'default', // default, high-contrast-dark, high-contrast-light
  motion: 'default', // default, reduced
  spacing: 'normal', // normal, increased
  dyslexicFont: false
};

// Load saved settings from localStorage
function loadAccessibilitySettings() {
  const savedSettings = localStorage.getItem('accessibility_settings');
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings);
      Object.assign(accessibilitySettings, parsedSettings);
      applyAccessibilitySettings();
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  }
}

// Save settings to localStorage
function saveAccessibilitySettings() {
  try {
    localStorage.setItem('accessibility_settings', JSON.stringify(accessibilitySettings));
  } catch (error) {
    console.error('Error saving accessibility settings:', error);
  }
}

// Apply accessibility settings to the document
function applyAccessibilitySettings() {
  // Remove existing classes
  document.body.classList.remove(
    'large-text', 'larger-text', 'largest-text',
    'high-contrast-dark', 'high-contrast-light',
    'reduced-motion', 'increased-spacing', 'dyslexic-font'
  );
  
  // Apply text size
  if (accessibilitySettings.textSize !== 'normal') {
    document.body.classList.add(accessibilitySettings.textSize);
  }
  
  // Apply contrast
  if (accessibilitySettings.contrast !== 'default') {
    document.body.classList.add(accessibilitySettings.contrast);
  }
  
  // Apply motion preference
  if (accessibilitySettings.motion === 'reduced') {
    document.body.classList.add('reduced-motion');
  }
  
  // Apply text spacing
  if (accessibilitySettings.spacing === 'increased') {
    document.body.classList.add('increased-spacing');
  }
  
  // Apply dyslexic font
  if (accessibilitySettings.dyslexicFont) {
    document.body.classList.add('dyslexic-font');
  }
  
  // Update controls to match current settings
  updateAccessibilityControls();
}

// Update accessibility controls to match current settings
function updateAccessibilityControls() {
  // Text size
  const textSizeSelect = document.getElementById('text-size-select');
  if (textSizeSelect) {
    textSizeSelect.value = accessibilitySettings.textSize;
  }
  
  // Contrast
  const contrastSelect = document.getElementById('contrast-select');
  if (contrastSelect) {
    contrastSelect.value = accessibilitySettings.contrast;
  }
  
  // Motion
  const motionToggle = document.getElementById('motion-toggle');
  if (motionToggle) {
    motionToggle.checked = accessibilitySettings.motion === 'reduced';
  }
  
  // Spacing
  const spacingToggle = document.getElementById('spacing-toggle');
  if (spacingToggle) {
    spacingToggle.checked = accessibilitySettings.spacing === 'increased';
  }
  
  // Dyslexic font
  const dyslexicFontToggle = document.getElementById('dyslexic-font-toggle');
  if (dyslexicFontToggle) {
    dyslexicFontToggle.checked = accessibilitySettings.dyslexicFont;
  }
}

// Create accessibility controls
function createAccessibilityControls() {
  // Check if controls already exist
  if (document.querySelector('.accessibility-controls')) {
    return;
  }
  
  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'accessibility-controls';
  controls.setAttribute('aria-label', 'Accessibility controls');
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'accessibility-toggle';
  toggleButton.innerHTML = '<i class="fas fa-universal-access"></i> Accessibility';
  toggleButton.setAttribute('aria-expanded', 'true');
  toggleButton.setAttribute('aria-controls', 'accessibility-options');
  
  // Create options container
  const options = document.createElement('div');
  options.id = 'accessibility-options';
  
  // Create heading
  const heading = document.createElement('h3');
  heading.textContent = 'Accessibility Options';
  options.appendChild(heading);
  
  // Text size option
  const textSizeOption = document.createElement('div');
  textSizeOption.className = 'accessibility-option';
  
  const textSizeLabel = document.createElement('label');
  textSizeLabel.setAttribute('for', 'text-size-select');
  textSizeLabel.textContent = 'Text Size:';
  
  const textSizeSelect = document.createElement('select');
  textSizeSelect.id = 'text-size-select';
  textSizeSelect.innerHTML = `
    <option value="normal">Normal</option>
    <option value="large-text">Large</option>
    <option value="larger-text">Larger</option>
    <option value="largest-text">Largest</option>
  `;
  textSizeSelect.value = accessibilitySettings.textSize;
  textSizeSelect.addEventListener('change', () => {
    accessibilitySettings.textSize = textSizeSelect.value;
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange(`Text size changed to ${textSizeSelect.options[textSizeSelect.selectedIndex].text}`);
  });
  
  textSizeOption.appendChild(textSizeLabel);
  textSizeOption.appendChild(textSizeSelect);
  options.appendChild(textSizeOption);
  
  // Contrast option
  const contrastOption = document.createElement('div');
  contrastOption.className = 'accessibility-option';
  
  const contrastLabel = document.createElement('label');
  contrastLabel.setAttribute('for', 'contrast-select');
  contrastLabel.textContent = 'Contrast:';
  
  const contrastSelect = document.createElement('select');
  contrastSelect.id = 'contrast-select';
  contrastSelect.innerHTML = `
    <option value="default">Default</option>
    <option value="high-contrast-dark">High Contrast (Dark)</option>
    <option value="high-contrast-light">High Contrast (Light)</option>
  `;
  contrastSelect.value = accessibilitySettings.contrast;
  contrastSelect.addEventListener('change', () => {
    accessibilitySettings.contrast = contrastSelect.value;
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange(`Contrast changed to ${contrastSelect.options[contrastSelect.selectedIndex].text}`);
  });
  
  contrastOption.appendChild(contrastLabel);
  contrastOption.appendChild(contrastSelect);
  options.appendChild(contrastOption);
  
  // Motion option
  const motionOption = document.createElement('div');
  motionOption.className = 'accessibility-option';
  
  const motionLabel = document.createElement('label');
  motionLabel.setAttribute('for', 'motion-toggle');
  
  const motionToggle = document.createElement('input');
  motionToggle.type = 'checkbox';
  motionToggle.id = 'motion-toggle';
  motionToggle.checked = accessibilitySettings.motion === 'reduced';
  motionToggle.addEventListener('change', () => {
    accessibilitySettings.motion = motionToggle.checked ? 'reduced' : 'default';
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange(`Reduced motion ${motionToggle.checked ? 'enabled' : 'disabled'}`);
  });
  
  motionLabel.appendChild(motionToggle);
  motionLabel.appendChild(document.createTextNode(' Reduce Motion'));
  
  motionOption.appendChild(motionLabel);
  options.appendChild(motionOption);
  
  // Spacing option
  const spacingOption = document.createElement('div');
  spacingOption.className = 'accessibility-option';
  
  const spacingLabel = document.createElement('label');
  spacingLabel.setAttribute('for', 'spacing-toggle');
  
  const spacingToggle = document.createElement('input');
  spacingToggle.type = 'checkbox';
  spacingToggle.id = 'spacing-toggle';
  spacingToggle.checked = accessibilitySettings.spacing === 'increased';
  spacingToggle.addEventListener('change', () => {
    accessibilitySettings.spacing = spacingToggle.checked ? 'increased' : 'normal';
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange(`Increased text spacing ${spacingToggle.checked ? 'enabled' : 'disabled'}`);
  });
  
  spacingLabel.appendChild(spacingToggle);
  spacingLabel.appendChild(document.createTextNode(' Increase Text Spacing'));
  
  spacingOption.appendChild(spacingLabel);
  options.appendChild(spacingOption);
  
  // Dyslexic font option
  const dyslexicFontOption = document.createElement('div');
  dyslexicFontOption.className = 'accessibility-option';
  
  const dyslexicFontLabel = document.createElement('label');
  dyslexicFontLabel.setAttribute('for', 'dyslexic-font-toggle');
  
  const dyslexicFontToggle = document.createElement('input');
  dyslexicFontToggle.type = 'checkbox';
  dyslexicFontToggle.id = 'dyslexic-font-toggle';
  dyslexicFontToggle.checked = accessibilitySettings.dyslexicFont;
  dyslexicFontToggle.addEventListener('change', () => {
    accessibilitySettings.dyslexicFont = dyslexicFontToggle.checked;
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange(`Dyslexia-friendly font ${dyslexicFontToggle.checked ? 'enabled' : 'disabled'}`);
  });
  
  dyslexicFontLabel.appendChild(dyslexicFontToggle);
  dyslexicFontLabel.appendChild(document.createTextNode(' Dyslexia-friendly Font'));
  
  dyslexicFontOption.appendChild(dyslexicFontLabel);
  options.appendChild(dyslexicFontOption);
  
  // Reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset to Defaults';
  resetButton.className = 'reset-button';
  resetButton.addEventListener('click', () => {
    // Reset settings to defaults
    accessibilitySettings.textSize = 'normal';
    accessibilitySettings.contrast = 'default';
    accessibilitySettings.motion = 'default';
    accessibilitySettings.spacing = 'normal';
    accessibilitySettings.dyslexicFont = false;
    
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announceChange('Accessibility settings reset to defaults');
  });
  
  options.appendChild(resetButton);
  
  // Add toggle functionality
  toggleButton.addEventListener('click', () => {
    controls.classList.toggle('collapsed');
    const isExpanded = !controls.classList.contains('collapsed');
    toggleButton.setAttribute('aria-expanded', isExpanded.toString());
  });
  
  // Add components to controls
  controls.appendChild(toggleButton);
  controls.appendChild(options);
  
  // Add controls to document
  document.body.appendChild(controls);
  
  // Initially collapsed on mobile
  if (window.innerWidth < 768) {
    controls.classList.add('collapsed');
    toggleButton.setAttribute('aria-expanded', 'false');
  }
}

// Create a live region for announcing changes
function createLiveRegion() {
  if (document.getElementById('accessibility-live-region')) {
    return;
  }
  
  const liveRegion = document.createElement('div');
  liveRegion.id = 'accessibility-live-region';
  liveRegion.className = 'live-region';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  
  document.body.appendChild(liveRegion);
}

// Announce a change to screen readers
function announceChange(message) {
  const liveRegion = document.getElementById('accessibility-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    liveRegion.className = 'live-region visible';
    
    // Hide after 5 seconds
    setTimeout(() => {
      liveRegion.className = 'live-region';
    }, 5000);
  }
}

// Add skip to content link
function addSkipToContentLink() {
  if (document.querySelector('.skip-to-content')) {
    return;
  }
  
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Skip to content';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add id to main content if it doesn't exist
  const mainContent = document.querySelector('main') || document.querySelector('.content');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
  }
}

// Initialize accessibility features
function initAccessibility() {
  // Add accessibility stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/accessibility.css';
  document.head.appendChild(link);
  
  // Create live region for announcements
  createLiveRegion();
  
  // Add skip to content link
  addSkipToContentLink();
  
  // Load saved settings
  loadAccessibilitySettings();
  
  // Create accessibility controls
  createAccessibilityControls();
  
  // Apply settings
  applyAccessibilitySettings();
  
  console.log('Accessibility features initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessibility);
} else {
  initAccessibility();
}

// Export the accessibility API
window.accessibilityModule = {
  settings: accessibilitySettings,
  applySettings: applyAccessibilitySettings,
  resetSettings: () => {
    accessibilitySettings.textSize = 'normal';
    accessibilitySettings.contrast = 'default';
    accessibilitySettings.motion = 'default';
    accessibilitySettings.spacing = 'normal';
    accessibilitySettings.dyslexicFont = false;
    
    applyAccessibilitySettings();
    saveAccessibilitySettings();
  }
};
