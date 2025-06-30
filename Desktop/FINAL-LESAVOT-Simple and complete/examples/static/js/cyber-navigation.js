/**
 * LESAVOT - Cybersecurity-themed Steganography Application
 * Navigation and UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize page transitions
    initPageTransitions();
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize tabs if they exist
    initTabs();
    
    // Initialize stepper if it exists
    initStepper();
    
    // Add entrance animation for the page
    document.querySelector('main')?.classList.add('page-enter');
});

/**
 * Initialize smooth page transitions
 */
function initPageTransitions() {
    // Track all internal navigation links with data-nav attribute
    document.querySelectorAll('a[data-nav]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            // Add exit animation to current content
            document.querySelector('main')?.classList.add('page-exit');
            
            // After animation completes, navigate to the new page
            setTimeout(() => {
                window.location.href = target;
            }, 300);
        });
    });
}

/**
 * Initialize tooltips for cybersecurity terms
 */
function initTooltips() {
    document.querySelectorAll('.cyber-term').forEach(term => {
        if (!term.dataset.tooltip) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'cyber-tooltip';
        tooltip.textContent = term.dataset.tooltip;
        term.appendChild(tooltip);
        
        term.addEventListener('mouseenter', () => {
            tooltip.classList.add('visible');
        });
        
        term.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
}

/**
 * Initialize tab switching functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            
            // Activate clicked tab
            btn.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding content
            const targetId = btn.dataset.tab;
            if (targetId) {
                const targetContent = document.getElementById(`${targetId}-content`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    });
}

/**
 * Initialize stepper functionality for multi-step processes
 */
function initStepper() {
    const stepper = document.querySelector('.cyber-stepper');
    if (!stepper) return;
    
    const steps = stepper.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    
    // Set up step navigation
    steps.forEach(step => {
        step.addEventListener('click', () => {
            const stepNumber = parseInt(step.dataset.step);
            if (isNaN(stepNumber)) return;
            
            // Only allow clicking on completed steps or the next available step
            if (!step.classList.contains('completed') && 
                !step.classList.contains('active')) {
                return;
            }
            
            goToStep(stepNumber);
        });
    });
    
    // Set up next/prev buttons
    document.querySelectorAll('.step-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = stepper.querySelector('.step.active');
            if (!currentStep) return;
            
            const currentStepNumber = parseInt(currentStep.dataset.step);
            if (isNaN(currentStepNumber)) return;
            
            goToStep(currentStepNumber + 1);
        });
    });
    
    document.querySelectorAll('.step-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = stepper.querySelector('.step.active');
            if (!currentStep) return;
            
            const currentStepNumber = parseInt(currentStep.dataset.step);
            if (isNaN(currentStepNumber)) return;
            
            goToStep(currentStepNumber - 1);
        });
    });
    
    /**
     * Navigate to a specific step
     * @param {number} stepNumber - The step number to navigate to
     */
    function goToStep(stepNumber) {
        // Update step indicators
        steps.forEach(s => {
            const sNumber = parseInt(s.dataset.step);
            
            // Remove active class from all steps
            s.classList.remove('active');
            
            // Mark previous steps as completed
            if (sNumber < stepNumber) {
                s.classList.add('completed');
            }
            
            // Mark current step as active
            if (sNumber === stepNumber) {
                s.classList.add('active');
            }
        });
        
        // Show corresponding step content
        stepContents.forEach(content => {
            content.classList.remove('active');
            
            const contentStep = parseInt(content.dataset.stepContent);
            if (contentStep === stepNumber) {
                content.classList.add('active');
            }
        });
    }
}

/**
 * File upload preview functionality
 * @param {string} inputId - The ID of the file input element
 * @param {string} previewId - The ID of the preview container
 * @param {Function} callback - Optional callback after file is loaded
 */
function handleFileUpload(inputId, previewId, callback) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Clear previous preview
            preview.innerHTML = '';
            
            // Create file info display
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            // Show different preview based on file type
            if (file.type.startsWith('image/')) {
                // Image preview
                const img = document.createElement('img');
                img.className = 'file-preview-image';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    preview.appendChild(img);
                    
                    fileInfo.innerHTML = `
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                    `;
                    preview.appendChild(fileInfo);
                    
                    if (callback) callback(file);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'text/plain') {
                // Text file preview
                const textPreview = document.createElement('div');
                textPreview.className = 'file-preview-text';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    textPreview.textContent = content.substring(0, 200) + (content.length > 200 ? '...' : '');
                    preview.appendChild(textPreview);
                    
                    fileInfo.innerHTML = `
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                    `;
                    preview.appendChild(fileInfo);
                    
                    if (callback) callback(file);
                };
                reader.readAsText(file);
            } else if (file.type === 'audio/wav' || file.type === 'audio/x-wav') {
                // Audio file preview
                const audioPreview = document.createElement('audio');
                audioPreview.controls = true;
                audioPreview.className = 'file-preview-audio';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    audioPreview.src = e.target.result;
                    preview.appendChild(audioPreview);
                    
                    fileInfo.innerHTML = `
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                    `;
                    preview.appendChild(fileInfo);
                    
                    if (callback) callback(file);
                };
                reader.readAsDataURL(file);
            } else {
                // Generic file preview
                fileInfo.innerHTML = `
                    <div class="file-icon">📄</div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                `;
                preview.appendChild(fileInfo);
                
                if (callback) callback(file);
            }
        }
    });
}
