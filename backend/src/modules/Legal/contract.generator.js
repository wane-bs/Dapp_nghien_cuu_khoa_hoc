/**
 * Contract Generator - Core module for generating rental contracts
 * 
 * Responsibilities:
 * 1. Read template with {{variable}} placeholders
 * 2. Fill all placeholders from rental metadata
 * 3. Compute termsHash (SHA-256)
 * 4. Store preview in TempStore
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const tempStore = require('./tempStore');
const config = require('./templates/config.json');

// Template path
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'rental-agreement.template.md');

/**
 * Generate a contract preview from rental metadata
 * 
 * @param {object} metadata - Rental metadata containing:
 *   - renter: { username, fullName, idNumber, physicalAddress, email }
 *   - lender: { username, fullName, idNumber, physicalAddress, email }
 *   - book: { id, title, pricePerDay, deposit }
 *   - bookingCode: string
 *   - rentalPrice: number
 *   - startDate: Date
 *   - endDate: Date
 * 
 * @returns {object} { previewId, content, termsHash, expiresAt }
 */
function generatePreview(metadata) {
    // 1. Read template
    let template;
    try {
        template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    } catch (err) {
        console.error('[ContractGenerator] Failed to read template:', err.message);
        throw new Error('Template not found');
    }

    // 2. Build replacement map
    const now = new Date();
    const replacements = buildReplacements(metadata, now);

    // 3. Fill placeholders
    let filled = template;
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        filled = filled.replace(regex, value);
    }

    // 4. Check for unfilled placeholders (for debugging)
    const unfilled = filled.match(/\{\{[^}]+\}\}/g);
    if (unfilled && unfilled.length > 0) {
        console.warn('[ContractGenerator] Unfilled placeholders:', unfilled);
    }

    // 5. Compute termsHash
    const termsHash = '0x' + crypto.createHash('sha256').update(filled).digest('hex');

    // 6. Replace termsHash placeholder (it was empty until now)
    filled = filled.replace(/\{\{termsHash\}\}/g, termsHash);

    // 7. Generate previewId and store
    const previewId = 'PREVIEW-' + uuidv4();

    tempStore.set(previewId, {
        content: filled,
        termsHash: termsHash,
        metadata: {
            bookingCode: metadata.bookingCode,
            renterUsername: metadata.renter?.username,
            lenderUsername: metadata.lender?.username,
            bookId: metadata.book?.id
        },
        status: 'PENDING_ACCEPTANCE'
    });

    const stored = tempStore.get(previewId);

    return {
        previewId,
        content: filled,
        termsHash,
        expiresAt: stored?.expiresAt,
        version: config.version
    };
}

/**
 * Build replacement map from metadata
 */
function buildReplacements(metadata, now) {
    const m = metadata;
    const defaults = config.defaults || {};
    const operator = config.operator || {};

    // Calculate dates
    const startDate = m.startDate ? new Date(m.startDate) : now;
    const endDate = m.endDate ? new Date(m.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
        // Header
        'version': config.version || 1,
        'termsHash': '(pending)', // Will be replaced after hash computation
        'rentalId': m.bookingCode || 'N/A',
        'listingId': m.book?.id || 'N/A',

        // Lender info
        'lender.fullName': m.lender?.fullName || m.lender?.name || '________________',
        'lender.idNumber': m.lender?.idNumber || '________________',
        'lender.physicalAddress': m.lender?.physicalAddress || m.lender?.address || '________________',
        'lender.contact': m.lender?.email || m.lender?.contact || '________________',
        'lender.signatureStatus': '[Chờ ký]',

        // Renter info
        'renter.fullName': m.renter?.fullName || m.renter?.name || '________________',
        'renter.idNumber': m.renter?.idNumber || '________________',
        'renter.physicalAddress': m.renter?.physicalAddress || m.renter?.address || '________________',
        'renter.contact': m.renter?.email || m.renter?.contact || '________________',
        'renter.signatureStatus': '[Chờ ký]',

        // Operator info
        'operator.name': operator.name || 'VinaLib Platform',
        'operator.taxId': operator.taxId || 'N/A',
        'operator.address': operator.address || 'N/A',
        'operator.contact': operator.contact || 'N/A',
        'operator.signatureStatus': '[Tự động]',

        // Transaction details
        'pricePerDay': formatVND(m.book?.pricePerDay || m.rentalPrice || 0),
        'deposit': formatVND(m.book?.deposit || (m.rentalPrice * 0.5) || 0),
        'pspRef': m.pspRef || 'PENDING_PAYMENT',
        'startDate': formatDate(startDate),
        'endDate': formatDate(endDate),
        'timestamp': now.toISOString(),
        'signDate': formatDate(now),

        // Defaults from config
        'lateFeePerDay': formatVND(defaults.lateFeePerDay || 5000),
        'damageTier1Percent': defaults.damageTier1Percent || 10,
        'damageTier2Percent': defaults.damageTier2Percent || 30,
        'damageTier3Percent': defaults.damageTier3Percent || 50,
        'lostBookFee': formatVND(defaults.lostBookFee || 50000),
        'cancellationFeePercent': defaults.cancellationFeePercent || 10,
        'refundDays': defaults.refundDays || 5,
        'ticketDeadlineDays': defaults.ticketDeadlineDays || 7,
        'responseHours': defaults.responseHours || 24,
        'slaDays': defaults.slaDays || 14
    };
}

/**
 * Format number as VND
 */
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Accept a contract preview (move to confirmed state)
 * @param {string} previewId 
 * @returns {object|null} The accepted contract data or null if not found
 */
function acceptPreview(previewId) {
    const preview = tempStore.get(previewId);
    if (!preview) {
        return null;
    }

    // Update status
    preview.status = 'ACCEPTED';
    preview.acceptedAt = Date.now();
    tempStore.set(previewId, preview);

    console.log(`[ContractGenerator] Preview ${previewId} ACCEPTED`);

    return {
        previewId,
        termsHash: preview.termsHash,
        content: preview.content,
        metadata: preview.metadata,
        acceptedAt: preview.acceptedAt
    };
}

/**
 * Reject a contract preview (delete from store)
 * @param {string} previewId 
 * @returns {boolean} true if deleted, false if not found
 */
function rejectPreview(previewId) {
    const existed = tempStore.remove(previewId);
    if (existed) {
        console.log(`[ContractGenerator] Preview ${previewId} REJECTED and deleted`);
    }
    return existed;
}

/**
 * Get a preview by ID
 * @param {string} previewId 
 * @returns {object|null}
 */
function getPreview(previewId) {
    return tempStore.get(previewId);
}

module.exports = {
    generatePreview,
    acceptPreview,
    rejectPreview,
    getPreview,
    // Expose for testing
    buildReplacements,
    formatVND,
    formatDate
};
