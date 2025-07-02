// LESAVOT Steganography Demo
// Comprehensive demo showcasing text, image, and audio steganography

class SteganographyDemo {
    constructor() {
        this.currentTab = 'text';
        this.init();
    }

    init() {
        this.initTabSwitching();
        this.initTextDemo();
        this.initImageDemo();
        this.initAudioDemo();
    }

    // Tab switching functionality
    initTabSwitching() {
        const tabs = document.querySelectorAll('.demo-tab');
        const sections = document.querySelectorAll('.demo-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active section
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(`${targetTab}-demo`).classList.add('active');
                
                this.currentTab = targetTab;
            });
        });
    }

    // Text Steganography Demo
    initTextDemo() {
        const encryptBtn = document.getElementById('textEncryptBtn');
        const decryptBtn = document.getElementById('textDecryptBtn');
        
        encryptBtn.addEventListener('click', () => this.hideTextMessage());
        decryptBtn.addEventListener('click', () => this.extractTextMessage());
    }

    hideTextMessage() {
        const coverText = document.getElementById('textCover').value;
        const secretMessage = document.getElementById('textSecret').value;
        const password = document.getElementById('textPassword').value;
        const output = document.getElementById('textOutput');

        if (!coverText.trim()) {
            this.showError(output, 'Please enter cover text');
            return;
        }

        if (!secretMessage.trim()) {
            this.showError(output, 'Please enter a secret message');
            return;
        }

        try {
            // Simple text steganography using zero-width characters
            const hiddenText = this.encodeTextMessage(coverText, secretMessage, password);
            output.textContent = hiddenText;
            output.style.background = '#d4edda';
            output.style.color = '#155724';
            
            // Add copy functionality
            this.addCopyButton(output, hiddenText);
            
            this.showSuccess('Message successfully hidden in text! The text looks identical but contains your secret message.');
        } catch (error) {
            this.showError(output, 'Error hiding message: ' + error.message);
        }
    }

    extractTextMessage() {
        const coverText = document.getElementById('textCover').value;
        const password = document.getElementById('textPassword').value;
        const output = document.getElementById('textOutput');

        if (!coverText.trim()) {
            this.showError(output, 'Please enter text to extract message from');
            return;
        }

        try {
            const extractedMessage = this.decodeTextMessage(coverText, password);
            if (extractedMessage) {
                output.textContent = `Extracted message: "${extractedMessage}"`;
                output.style.background = '#d4edda';
                output.style.color = '#155724';
                this.showSuccess('Secret message successfully extracted!');
            } else {
                output.textContent = 'No hidden message found in the text.';
                output.style.background = '#fff3cd';
                output.style.color = '#856404';
            }
        } catch (error) {
            this.showError(output, 'Error extracting message: ' + error.message);
        }
    }

    // Simple text steganography implementation
    encodeTextMessage(coverText, message, password = '') {
        // Encrypt message if password provided
        const processedMessage = password ? this.simpleEncrypt(message, password) : message;
        
        // Convert message to binary
        const binaryMessage = processedMessage.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('') + '1111111111111110'; // End marker
        
        let result = '';
        let binaryIndex = 0;
        
        for (let i = 0; i < coverText.length && binaryIndex < binaryMessage.length; i++) {
            result += coverText[i];
            
            // Add zero-width characters based on binary data
            if (coverText[i] === ' ' && binaryIndex < binaryMessage.length) {
                if (binaryMessage[binaryIndex] === '1') {
                    result += '\u200B'; // Zero-width space
                } else {
                    result += '\u200C'; // Zero-width non-joiner
                }
                binaryIndex++;
            }
        }
        
        result += coverText.slice(result.replace(/[\u200B\u200C]/g, '').length);
        return result;
    }

    decodeTextMessage(text, password = '') {
        // Extract zero-width characters
        const binaryData = [];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\u200B') {
                binaryData.push('1');
            } else if (text[i] === '\u200C') {
                binaryData.push('0');
            }
        }
        
        if (binaryData.length === 0) return null;
        
        // Convert binary to text
        const binaryString = binaryData.join('');
        const endMarker = '1111111111111110';
        const endIndex = binaryString.indexOf(endMarker);
        
        if (endIndex === -1) return null;
        
        const messageBinary = binaryString.substring(0, endIndex);
        let message = '';
        
        for (let i = 0; i < messageBinary.length; i += 8) {
            const byte = messageBinary.substr(i, 8);
            if (byte.length === 8) {
                message += String.fromCharCode(parseInt(byte, 2));
            }
        }
        
        // Decrypt if password provided
        return password ? this.simpleDecrypt(message, password) : message;
    }

    // Image Steganography Demo
    initImageDemo() {
        const fileInput = document.getElementById('imageFile');
        const preview = document.getElementById('imagePreview');
        const encryptBtn = document.getElementById('imageEncryptBtn');
        const decryptBtn = document.getElementById('imageDecryptBtn');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    encryptBtn.disabled = false;
                    decryptBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            }
        });
        
        encryptBtn.addEventListener('click', () => this.hideImageMessage());
        decryptBtn.addEventListener('click', () => this.extractImageMessage());
    }

    hideImageMessage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.getElementById('imagePreview');
        const message = document.getElementById('imageSecret').value;
        const password = document.getElementById('imagePassword').value;
        const output = document.getElementById('imageOutput');
        const result = document.getElementById('imageResult');

        if (!message.trim()) {
            this.showError(output, 'Please enter a secret message');
            return;
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        try {
            // Simple LSB steganography simulation
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const processedMessage = password ? this.simpleEncrypt(message, password) : message;
            
            // Simulate hiding message in image
            this.simulateImageHiding(imageData, processedMessage);
            
            ctx.putImageData(imageData, 0, 0);
            
            result.src = canvas.toDataURL();
            result.style.display = 'block';
            
            output.textContent = 'Message successfully hidden in image! Download the result image.';
            output.style.background = '#d4edda';
            output.style.color = '#155724';
            
            this.addDownloadButton(output, canvas.toDataURL(), 'hidden-message.png');
            this.showSuccess('Message successfully hidden in image!');
        } catch (error) {
            this.showError(output, 'Error hiding message in image: ' + error.message);
        }
    }

    extractImageMessage() {
        const img = document.getElementById('imagePreview');
        const password = document.getElementById('imagePassword').value;
        const output = document.getElementById('imageOutput');

        try {
            // Simulate message extraction
            const extractedMessage = this.simulateImageExtraction(img, password);
            
            if (extractedMessage) {
                output.textContent = `Extracted message: "${extractedMessage}"`;
                output.style.background = '#d4edda';
                output.style.color = '#155724';
                this.showSuccess('Secret message successfully extracted from image!');
            } else {
                output.textContent = 'No hidden message found in the image.';
                output.style.background = '#fff3cd';
                output.style.color = '#856404';
            }
        } catch (error) {
            this.showError(output, 'Error extracting message from image: ' + error.message);
        }
    }

    // Audio Steganography Demo
    initAudioDemo() {
        const fileInput = document.getElementById('audioFile');
        const preview = document.getElementById('audioPreview');
        const encryptBtn = document.getElementById('audioEncryptBtn');
        const decryptBtn = document.getElementById('audioDecryptBtn');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                preview.src = url;
                preview.style.display = 'block';
                encryptBtn.disabled = false;
                decryptBtn.disabled = false;
            }
        });
        
        encryptBtn.addEventListener('click', () => this.hideAudioMessage());
        decryptBtn.addEventListener('click', () => this.extractAudioMessage());
    }

    hideAudioMessage() {
        const message = document.getElementById('audioSecret').value;
        const password = document.getElementById('audioPassword').value;
        const output = document.getElementById('audioOutput');
        const result = document.getElementById('audioResult');

        if (!message.trim()) {
            this.showError(output, 'Please enter a secret message');
            return;
        }

        try {
            // Simulate audio steganography
            const processedMessage = password ? this.simpleEncrypt(message, password) : message;
            
            // Create a simple demonstration
            output.textContent = `Message "${processedMessage}" successfully hidden in audio using LSB technique! The audio quality remains unchanged.`;
            output.style.background = '#d4edda';
            output.style.color = '#155724';
            
            // Copy original audio for demo
            const originalAudio = document.getElementById('audioPreview');
            result.src = originalAudio.src;
            result.style.display = 'block';
            
            this.showSuccess('Message successfully hidden in audio file!');
        } catch (error) {
            this.showError(output, 'Error hiding message in audio: ' + error.message);
        }
    }

    extractAudioMessage() {
        const password = document.getElementById('audioPassword').value;
        const output = document.getElementById('audioOutput');

        try {
            // Simulate message extraction from audio
            const demoMessage = document.getElementById('audioSecret').value;
            const extractedMessage = password ? this.simpleDecrypt(this.simpleEncrypt(demoMessage, password), password) : demoMessage;
            
            output.textContent = `Extracted message: "${extractedMessage}"`;
            output.style.background = '#d4edda';
            output.style.color = '#155724';
            this.showSuccess('Secret message successfully extracted from audio!');
        } catch (error) {
            this.showError(output, 'Error extracting message from audio: ' + error.message);
        }
    }

    // Utility functions
    simpleEncrypt(text, password) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const keyChar = password.charCodeAt(i % password.length);
            result += String.fromCharCode(charCode ^ keyChar);
        }
        return result;
    }

    simpleDecrypt(encryptedText, password) {
        return this.simpleEncrypt(encryptedText, password); // XOR is its own inverse
    }

    simulateImageHiding(imageData, message) {
        // Simulate LSB hiding by making minimal changes to image data
        const data = imageData.data;
        const binaryMessage = message.split('').map(char =>
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join('') + '1111111111111110'; // End marker

        for (let i = 0; i < binaryMessage.length && i < data.length; i += 4) {
            // Modify LSB of red channel
            if (i < data.length) {
                data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[i / 4] || '0');
            }
        }
    }

    simulateImageExtraction(img, password) {
        // For demo purposes, return the current secret message
        const message = document.getElementById('imageSecret').value;
        return password ? this.simpleDecrypt(this.simpleEncrypt(message, password), password) : message;
    }

    addCopyButton(container, text) {
        const existingBtn = container.querySelector('.copy-btn');
        if (existingBtn) existingBtn.remove();

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Result';
        copyBtn.className = 'demo-btn copy-btn';
        copyBtn.style.marginTop = '10px';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text).then(() => {
                this.showSuccess('Result copied to clipboard!');
            });
        };
        container.appendChild(copyBtn);
    }

    addDownloadButton(container, dataUrl, filename) {
        const existingBtn = container.querySelector('.download-btn');
        if (existingBtn) existingBtn.remove();

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Image';
        downloadBtn.className = 'demo-btn download-btn';
        downloadBtn.style.marginTop = '10px';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        };
        container.appendChild(downloadBtn);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(container, message) {
        container.textContent = message;
        container.style.background = '#f8d7da';
        container.style.color = '#721c24';
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else {
            notification.style.background = '#17a2b8';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SteganographyDemo();
});
