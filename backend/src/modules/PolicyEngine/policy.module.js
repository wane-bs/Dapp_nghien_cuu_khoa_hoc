// PolicyEngine Module - Route Registration
// VSA Pattern: Module đăng ký routes với Express app

const express = require('express');
const router = express.Router();
const { decideApproval, computeTrustScore, getTrustBand } = require('./policy.controller');
const { renterStats } = require('../../Shared/store');
const { booksMap } = require('../Book/book.store');

// GET /api/policy/test-score/:username - Test TrustScore calculation
router.get('/test-score/:username', (req, res) => {
    const stats = renterStats.get(req.params.username) || { completedRentals: 0, lateReturns: 0, disputes: 0 };
    const score = computeTrustScore(stats);
    const band = getTrustBand(score);
    res.json({ username: req.params.username, stats, score, band });
});

// POST /api/policy/evaluate - Evaluate policy for a booking
router.post('/evaluate', (req, res) => {
    const { bookId, username, depositAmount } = req.body;

    const book = booksMap.get(parseInt(bookId));
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const stats = renterStats.get(username) || { completedRentals: 0, lateReturns: 0, disputes: 0 };
    const decision = decideApproval(book, stats, depositAmount);

    res.json({
        bookId,
        username,
        depositAmount,
        book: { title: book.title, riskTier: book.riskTier, valueReference: book.valueReference },
        decision
    });
});

module.exports = router;
