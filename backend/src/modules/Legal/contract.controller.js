/**
 * Contract Controller - API Routes for contract preview and accept/reject flow
 * 
 * Routes:
 * - GET  /api/contracts/:previewId       - Get preview content
 * - POST /api/contracts/:previewId/accept - Accept contract (save + trigger on-chain)
 * - POST /api/contracts/:previewId/reject - Reject contract (delete, no save)
 * - GET  /api/contracts                   - List all active previews (admin/debug)
 */

const express = require('express');
const contractGenerator = require('./contract.generator');
const tempStore = require('./tempStore');
// Import bookings store to update booking status when contract is accepted
const { bookings, renterStats } = require('../../Shared/store');
// Import Policy Engine for decision making
const { decideApproval, computeTrustScore, getTrustBand } = require('../PolicyEngine/policy.controller');
// Import book store to get book info
const { booksMap } = require('../Book/book.store');

const router = express.Router();

/**
 * GET /api/contracts/:previewId
 * Get contract preview content
 */
router.get('/:previewId', (req, res) => {
    const { previewId } = req.params;

    const preview = contractGenerator.getPreview(previewId);

    if (!preview) {
        return res.status(404).json({
            error: 'Preview not found or expired',
            previewId
        });
    }

    res.json({
        previewId,
        content: preview.content,
        termsHash: preview.termsHash,
        status: preview.status,
        expiresAt: preview.expiresAt,
        metadata: preview.metadata
    });
});

/**
 * POST /api/contracts/:previewId/accept
 * Accept contract - NOW uses Policy Engine to decide approval flow
 * 
 * Based on Policy Matrix:
 * - Tier A + LOW trust → REJECT
 * - Tier A + MED/HIGH trust → MANUAL (need Admin approval)
 * - Tier B + HIGH trust → AUTO
 * - Tier B + MED trust + deposit ≥50% → AUTO
 * - Tier B + MED trust + deposit <50% → REVIEW
 * - Tier B + LOW trust + deposit ≥70% → REVIEW
 * - Tier B + LOW trust + deposit <70% → MANUAL
 * - Tier C + LOW trust + deposit <50% → REVIEW
 * - Tier C (others) → AUTO
 */
// 64. POST /api/contracts/:previewId/accept - DEPRECATED
router.post('/:previewId/accept', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Renter chấp nhận hợp đồng bằng cách ký Transaction trên MetaMask (createRental)." });
});

// Helper function for reject messages
function getRejectMessage(reasonCode) {
    const messages = {
        'TIER_A_LOW_TRUST_REJECT': 'Sách Tier A yêu cầu điểm tín dụng cao hơn. Vui lòng thuê sách khác hoặc nâng cao điểm tín dụng.',
        'BOOK_NOT_AVAILABLE': 'Sách không còn sẵn để thuê.'
    };
    return messages[reasonCode] || 'Không đủ điều kiện thuê sách này.';
}

/**
 * POST /api/contracts/:previewId/reject - DEPRECATED
 */
router.post('/:previewId/reject', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Không cần gọi API Reject, chỉ cần từ chối ký Transaction." });
});

/**
 * GET /api/contracts
 * List all active previews (for admin/debugging)
 */
router.get('/', (req, res) => {
    const previews = tempStore.getAll();

    // Don't return full content for list view
    const summary = previews.map(p => ({
        previewId: p.previewId,
        status: p.status,
        metadata: p.metadata,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt
    }));

    res.json({
        count: summary.length,
        previews: summary
    });
});

module.exports = router;
