/**
 * TempStore - In-memory storage with TTL for contract previews
 * 
 * Contracts are stored temporarily during the preview/accept/reject flow.
 * They are automatically cleaned up after TTL expires.
 * 
 * Note: Data is lost on server restart (by design for testing phase).
 */

const config = require('./templates/config.json');

// In-memory store: Map<previewId, { content, hash, metadata, createdAt }>
const contractPreviews = new Map();

// TTL Configuration (default: 7 days)
const TTL_MS = config.ttl?.contractPreviewMs || 7 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = config.ttl?.cleanupIntervalMs || 60 * 60 * 1000; // 1 hour

/**
 * Store a contract preview
 * @param {string} previewId - Unique ID for the preview
 * @param {object} data - { content, termsHash, metadata }
 */
function set(previewId, data) {
    contractPreviews.set(previewId, {
        ...data,
        createdAt: Date.now(),
        expiresAt: Date.now() + TTL_MS
    });
    console.log(`[TempStore] Saved preview ${previewId} (expires in ${TTL_MS / 1000}s)`);
}

/**
 * Get a contract preview by ID
 * @param {string} previewId 
 * @returns {object|null}
 */
function get(previewId) {
    const item = contractPreviews.get(previewId);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
        contractPreviews.delete(previewId);
        console.log(`[TempStore] Preview ${previewId} expired and removed`);
        return null;
    }

    return item;
}

/**
 * Delete a contract preview (used when user rejects)
 * @param {string} previewId 
 * @returns {boolean} - true if deleted, false if not found
 */
function remove(previewId) {
    const existed = contractPreviews.has(previewId);
    contractPreviews.delete(previewId);
    if (existed) {
        console.log(`[TempStore] Preview ${previewId} removed (user action)`);
    }
    return existed;
}

/**
 * Check if a preview exists and is not expired
 * @param {string} previewId 
 * @returns {boolean}
 */
function has(previewId) {
    return get(previewId) !== null;
}

/**
 * Get all active previews (for debugging/admin)
 * @returns {Array}
 */
function getAll() {
    const result = [];
    contractPreviews.forEach((value, key) => {
        if (Date.now() <= value.expiresAt) {
            result.push({ previewId: key, ...value });
        }
    });
    return result;
}

/**
 * Cleanup expired entries
 */
function cleanup() {
    const now = Date.now();
    let removed = 0;
    contractPreviews.forEach((value, key) => {
        if (now > value.expiresAt) {
            contractPreviews.delete(key);
            removed++;
        }
    });
    if (removed > 0) {
        console.log(`[TempStore] Cleanup: removed ${removed} expired previews`);
    }
}

// Start cleanup scheduler
let cleanupInterval = null;

function startCleanupScheduler() {
    if (cleanupInterval) return;
    cleanupInterval = setInterval(cleanup, CLEANUP_INTERVAL_MS);
    console.log(`[TempStore] Cleanup scheduler started (interval: ${CLEANUP_INTERVAL_MS / 1000}s)`);
}

function stopCleanupScheduler() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log(`[TempStore] Cleanup scheduler stopped`);
    }
}

// Auto-start on module load
startCleanupScheduler();

module.exports = {
    set,
    get,
    remove,
    has,
    getAll,
    cleanup,
    startCleanupScheduler,
    stopCleanupScheduler,
    // Expose for testing
    _store: contractPreviews,
    TTL_MS
};
