const express = require('express');
const { bookings, users, systemWallets, systemConfig, transactionLog, createCommitmentHash } = require('../../Shared/store');
const { booksMap } = require('../Book/book.store');

const router = express.Router();

// Tất cả routes trong Admin đã được protect bởi verifyAdmin ở server.js

// 1. GET /api/admin/rentals - Xem tất cả đơn hàng
router.get('/rentals', (req, res) => {
    const allBookings = [];
    bookings.forEach((val) => {
        // Enrich with book info
        const bookIdRaw = val.assetId ? (val.assetId.includes('-') ? val.assetId.split('-')[1] : val.assetId) : null;
        const bookId = bookIdRaw ? parseInt(bookIdRaw) : null;
        const book = bookId ? booksMap.get(bookId) : null;

        allBookings.push({
            ...val,
            bookInfo: book ? {
                title: book.title,
                author: book.author,
                imageUrl: book.imageUrl,
                status: book.status,
                tokenId: book.tokenId  // Include tokenId for on-chain query
            } : null
        });
    });
    res.json(allBookings.sort((a, b) => b.createdAt - a.createdAt));
});

// 2. GET /api/admin/books - Xem tất cả sách (bao gồm PENDING)
router.get('/books', (req, res) => {
    res.json(Array.from(booksMap.values()));
});

// 3. GET /api/admin/books/pending - Chỉ sách chờ xác nhận
router.get('/books/pending', (req, res) => {
    const pending = Array.from(booksMap.values()).filter(b => b.status === 'PENDING_VERIFICATION');
    res.json(pending);
});

// 4. POST /api/admin/books/:id/verify-listing - DEPRECATED
router.post('/books/:id/verify-listing', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Admin gọi verifyForListing trực tiếp qua Smart Contract." });
});

// 4.5. POST /api/admin/books/:id/reject-listing - REFACTORED (Only Offchain Draft removal)
router.post('/books/:id/reject-listing', (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = booksMap.get(bookId);
    if (book && book.status === 'PENDING_VERIFICATION') {
        book.status = 'REJECTED';
        book.available = false;
        res.json({ success: true, message: "Draft deleted." });
    } else {
        res.status(400).json({ error: "Cannot reject." });
    }
});

// 5. POST /api/admin/books/:id/verify-pre-rent - DEPRECATED
router.post('/books/:id/verify-pre-rent', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Sử dụng verifyPreRent On-chain." });
});

// 6. POST /api/admin/booking/:code/approve - DEPRECATED
router.post('/booking/:code/approve', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Sử dụng createRental On-chain." });
});

// 7. POST /api/admin/booking/:code/confirm-return - DEPRECATED
router.post('/booking/:code/confirm-return', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Sử dụng confirmReturn On-chain." });
});

// 8. POST /api/admin/payout - DEPRECATED
router.post('/payout', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Hệ thống thanh toán tập trung Payout đã bị loại bỏ." });
});

// 9. GET /api/admin/stats - Thống kê tài chính hệ thống
router.get('/stats', (req, res) => {
    res.json({
        systemWallets: {
            escrow: systemWallets.escrow.balance,
            revenue: systemWallets.revenue.balance,
            pendingPayout: systemWallets.pendingPayout.balance
        },
        config: {
            minCollateralRatio: systemConfig.minCollateralRatio,
            platformFeePercent: systemConfig.platformFeePercent
        },
        transactionCount: transactionLog.length,
        recentTransactions: transactionLog.slice(-10).reverse()
    });
});

module.exports = router;

