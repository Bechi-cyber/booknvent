// historyController.js - Segmented operation history (in-memory, database-ready)
const fs = require('fs');
const path = require('path');

// In-memory store (replace with DB logic later)
let operationHistory = [];
const HISTORY_FILE = path.join(__dirname, '../../operation_history.json');

// Load from file if exists (for persistence during development)
if (fs.existsSync(HISTORY_FILE)) {
    try {
        operationHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        operationHistory = [];
    }
}

function saveToFile() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(operationHistory, null, 2));
}

// GET /api/v1/history?user=username&type=text
exports.getHistory = (req, res) => {
    const { user, type } = req.query;
    if (!user || !type) {
        return res.status(400).json({ status: 'error', message: 'Missing user or type parameter' });
    }
    const filtered = operationHistory.filter(op => op.user === user && op.type === type);
    res.json({ status: 'success', history: filtered });
};

// POST /api/v1/history
exports.saveOperation = (req, res) => {
    const { user, type, mode, hasPassword, fileName, messageLength, contentLength, summary } = req.body;
    if (!user || !type || !mode) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }
    const entry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        user,
        type,
        mode,
        hasPassword: !!hasPassword,
        fileName: fileName || '',
        messageLength: messageLength || 0,
        contentLength: contentLength || 0,
        summary: summary || '',
        timestamp: new Date().toISOString()
    };
    operationHistory.unshift(entry);
    saveToFile();
    res.json({ status: 'success', entry });
};

// DELETE /api/v1/history?user=username&type=text
exports.clearHistory = (req, res) => {
    const { user, type } = req.query;
    if (!user || !type) {
        return res.status(400).json({ status: 'error', message: 'Missing user or type parameter' });
    }
    operationHistory = operationHistory.filter(op => !(op.user === user && op.type === type));
    saveToFile();
    res.json({ status: 'success' });
};
