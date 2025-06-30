const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // File operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    
    // Menu events
    onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
    onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
    onNavigateTo: (callback) => ipcRenderer.on('navigate-to', callback),
    onClearSession: (callback) => ipcRenderer.on('clear-session', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // Platform information
    platform: process.platform,
    
    // Security features
    isElectron: true,
    isDesktopApp: true
});

// Expose a limited API for LESAVOT specific functionality
contextBridge.exposeInMainWorld('lesavotAPI', {
    // File system operations (secure)
    saveFile: async (filename, content, options = {}) => {
        const saveOptions = {
            defaultPath: filename,
            filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] },
                { name: 'Audio Files', extensions: ['wav', 'mp3'] }
            ],
            ...options
        };
        
        const result = await ipcRenderer.invoke('show-save-dialog', saveOptions);
        
        if (!result.canceled) {
            // In a real implementation, you would handle file writing here
            // For security, file operations should be handled in the main process
            return { success: true, filePath: result.filePath };
        }
        
        return { success: false, canceled: true };
    },
    
    // Load file operations
    loadFile: async (options = {}) => {
        const openOptions = {
            properties: ['openFile'],
            filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp'] },
                { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'flac'] }
            ],
            ...options
        };
        
        const result = await ipcRenderer.invoke('show-open-dialog', openOptions);
        
        if (!result.canceled && result.filePaths.length > 0) {
            return { success: true, filePath: result.filePaths[0] };
        }
        
        return { success: false, canceled: true };
    },
    
    // Application state
    getAppInfo: () => ({
        name: 'LESAVOT Security Platform',
        version: '1.0.0',
        description: 'Advanced Multimodal Steganographic Security Platform',
        isDesktop: true,
        platform: process.platform
    }),
    
    // Security utilities
    generateSecureId: () => {
        // Generate a secure random ID
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    // Local storage wrapper with encryption support
    secureStorage: {
        setItem: (key, value) => {
            try {
                // In a real implementation, you might want to encrypt the data
                localStorage.setItem(`lesavot_${key}`, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Secure storage set error:', error);
                return false;
            }
        },
        
        getItem: (key) => {
            try {
                const item = localStorage.getItem(`lesavot_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('Secure storage get error:', error);
                return null;
            }
        },
        
        removeItem: (key) => {
            try {
                localStorage.removeItem(`lesavot_${key}`);
                return true;
            } catch (error) {
                console.error('Secure storage remove error:', error);
                return false;
            }
        },
        
        clear: () => {
            try {
                // Only clear LESAVOT specific items
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('lesavot_')) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Secure storage clear error:', error);
                return false;
            }
        }
    }
});

// Security: Disable node integration in renderer
window.nodeRequire = undefined;
delete window.require;
delete window.exports;
delete window.module;

// Add desktop-specific styling
document.addEventListener('DOMContentLoaded', () => {
    // Add desktop app class to body
    document.body.classList.add('desktop-app');
    
    // Add platform-specific class
    document.body.classList.add(`platform-${process.platform}`);
    
    // Disable context menu (optional)
    document.addEventListener('contextmenu', (e) => {
        if (process.env.NODE_ENV !== 'development') {
            e.preventDefault();
        }
    });
    
    // Disable drag and drop of files (security)
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
});

// Console branding
console.log('%cLESAVOT Security Platform', 'color: #4472C4; font-size: 20px; font-weight: bold;');
console.log('%cDesktop Application v1.0.0', 'color: #666; font-size: 12px;');
console.log('%cUnauthorized access is prohibited.', 'color: #d62728; font-size: 10px;');
