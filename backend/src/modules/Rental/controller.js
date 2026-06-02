const express = require('express');
// Use Shared store for cross-module data
const { bookings, users, transactionLog, createCommitmentHash, systemWallets } = require('../../Shared/store');
const { booksMap } = require('../Book/book.store'); // Use VSA Store (Seeded)

const axios = require('axios');

// Adapters - di chuyển vào đúng vị trí theo VSA
const isLocal = process.env.NODE_ENV === 'local' || true;
const LegalService = isLocal
    ? require('./adapters/mock-legal.adapter')
    : { createContract: () => { throw "Not loaded" } };

// NEW: Import ContractGenerator
const { contractGenerator } = require('../Legal');
const BlockchainAdapter = require('./adapters/blockchain.adapter');

// Initialize Blockchain Adapter on startup
BlockchainAdapter.init();

const IoTService = isLocal
    ? require('../IoT/adapters/mock-iot.adapter')
    : { generatePasscode: () => { throw "Not loaded" } };

const router = express.Router();

// 1. Create Booking - Now returns previewId for accept/reject flow
router.post('/', async (req, res) => {
    try {
        console.log("Received booking request:", req.body);
        const { userId, assetId, price, username } = req.body;

        const bookingCode = "BOOK-" + Date.now();

        // --- ENRICH METADATA FOR CONTRACT ---
        // 1. Renter Info (with new fields)
        const renter = users.get(userId) || users.get(username);
        const renterInfo = {
            username: renter?.username || username,
            fullName: renter?.fullName || renter?.fullname || username || "Unknown Renter",
            idNumber: renter?.idNumber || "________________",
            physicalAddress: renter?.physicalAddress || renter?.address || "N/A",
            email: renter?.email || "N/A",
            entityType: renter?.entityType || "INDIVIDUAL"
        };
        console.log(`[Rental] Identified Renter: ${renterInfo.fullName} (ID: ${renterInfo.idNumber})`);

        // 2. Book Info (Resolve from assetId "book-1" -> ID 1)
        const bookIdRaw = assetId.includes('-') ? assetId.split('-')[1] : assetId;
        const bookId = parseInt(bookIdRaw);

        const book = booksMap.get(bookId);
        if (!book) console.warn(`[Rental] Book not found for ID: ${bookId} (Raw: ${assetId})`);

        const bookInfo = book ? {
            id: book.id,
            title: book.title,
            author: book.author,
            pricePerDay: book.price,
            deposit: book.deposit || Math.floor(book.price * 0.5)
        } : { id: assetId, title: `Unknown Book (${assetId})`, author: "Unknown", pricePerDay: price };
        console.log(`[Rental] Identified Book: ${bookInfo.title}`);

        // 3. Lender Info (with new fields)
        let lenderInfo = { fullName: "System/Unknown", idNumber: "N/A", physicalAddress: "N/A", email: "N/A" };
        let lenderUsername = null;
        if (book && book.owner) {
            for (let [uName, uData] of users) {
                if (uData.address === book.owner || uData.username === book.owner) {
                    lenderInfo = {
                        username: uData.username,
                        fullName: uData.fullName || uData.fullname || uData.username,
                        idNumber: uData.idNumber || "________________",
                        physicalAddress: uData.physicalAddress || uData.address || "N/A",
                        email: uData.email || "N/A",
                        entityType: uData.entityType || "INDIVIDUAL"
                    };
                    lenderUsername = uName;
                    break;
                }
            }
            if (lenderInfo.physicalAddress === "N/A" && book.owner) {
                lenderInfo.physicalAddress = book.owner;
                lenderInfo.fullName = "External Owner";
                if (users.has(book.owner)) {
                    lenderUsername = book.owner;
                }
            }
        }
        console.log(`[Rental] Identified Lender: ${lenderInfo.fullName} (ID: ${lenderInfo.idNumber})`);

        // 4. Generate Contract Preview (NEW: Using ContractGenerator)
        const contractMetadata = {
            renter: renterInfo,
            lender: lenderInfo,
            book: bookInfo,
            bookingCode: bookingCode,
            rentalPrice: price,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
        };

        const previewResult = contractGenerator.generatePreview(contractMetadata);
        console.log(`[Rental] Generated contract preview: ${previewResult.previewId}`);

        // 5. Also call old LegalService for backward compatibility (mock server)
        let legacyContractResult = null;
        try {
            legacyContractResult = await LegalService.createContract({
                template_code: "RENTAL_V1",
                metadata: {
                    renter: { name: renterInfo.fullName, address: renterInfo.physicalAddress, email: renterInfo.email },
                    lender: { name: lenderInfo.fullName, address: lenderInfo.physicalAddress, email: lenderInfo.email },
                    book: { title: bookInfo.title, author: bookInfo.author, price: bookInfo.pricePerDay },
                    bookingCode: bookingCode,
                    rentalPrice: price
                }
            });
        } catch (e) {
            console.warn('[Rental] Legacy LegalService failed (non-critical):', e.message);
        }

        // 6. Store booking with PENDING_ACCEPTANCE status
        bookings.set(bookingCode, {
            code: bookingCode,
            username: username,
            lenderUsername: lenderUsername,
            status: "PENDING_ACCEPTANCE", // NEW: Wait for user to accept/reject
            previewId: previewResult.previewId, // NEW: Link to contract preview
            contract: {
                ...(legacyContractResult || {}),
                termsHash: previewResult.termsHash,
                version: previewResult.version,
                previewId: previewResult.previewId
            },
            price: price,
            paid: false,
            assetId: assetId,
            createdAt: Date.now()
        });

        res.json({
            success: true,
            code: bookingCode,
            bookingCode: bookingCode,
            // NEW: Return preview info for accept/reject flow
            previewId: previewResult.previewId,
            termsHash: previewResult.termsHash,
            expiresAt: previewResult.expiresAt,
            // Keep legacy fields for backward compatibility
            contract: legacyContractResult || {
                termsHash: previewResult.termsHash,
                version: previewResult.version,
                status: "PENDING_ACCEPTANCE"
            },
            // NEW: Next step instructions
            nextSteps: {
                previewUrl: `/api/contracts/${previewResult.previewId}`,
                acceptUrl: `/api/contracts/${previewResult.previewId}/accept`,
                rejectUrl: `/api/contracts/${previewResult.previewId}/reject`
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// 2. Poll Status - Integrated with Phase 2 Policy Engine
router.get('/:code', async (req, res) => {
    const code = req.params.code;
    const booking = bookings.get(code);

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Import Policy Engine
    const { decideApproval } = require('../PolicyEngine/policy.controller');
    const { renterStats } = require('../../Shared/store');

    // Mock Verify Sign + Policy Engine Integration
    if (booking.status === "PENDING_SIGN") {
        try {
            const verifyRes = await axios.post('http://localhost:4000/fpt/electronic-sign/verify', {
                document_id: booking.contract.documentId
            });
            if (verifyRes.data.data.status === "COMPLETED") {
                // === PHASE 2: Policy Engine Decision ===
                const bookIdRaw = booking.assetId?.includes('-') ? booking.assetId.split('-')[1] : booking.assetId;
                const bookId = bookIdRaw ? parseInt(bookIdRaw) : null;
                const book = bookId ? booksMap.get(bookId) : null;

                if (book) {
                    const stats = renterStats.get(booking.username) || { completedRentals: 0, lateReturns: 0, disputes: 0 };
                    const depositAmount = booking.price * 0.5; // MVP: assume 50% deposit
                    const decision = decideApproval(book, stats, depositAmount);

                    // Apply decision to booking
                    booking.approvalMode = decision.outcome;
                    booking.reasonCode = decision.reasonCode;
                    booking.trustScore = decision.trustScore;
                    booking.trustBand = decision.trustBand;
                    booking.depositRatio = decision.depositRatio;
                    booking.termsSignedAt = Date.now();

                    if (decision.outcome === 'AUTO') {
                        booking.status = 'SIGNED_UNPAID'; // Skip PENDING_APPROVAL
                        booking.pickupDeadlineAt = decision.pickupDeadlineAt;
                        console.log(`[POLICY] Booking ${code} AUTO-APPROVED: ${decision.reasonCode}`);
                    } else if (decision.outcome === 'REJECT') {
                        booking.status = 'REJECTED';
                        console.log(`[POLICY] Booking ${code} REJECTED: ${decision.reasonCode}`);
                    } else {
                        // REVIEW or MANUAL
                        booking.status = 'SIGNED_PENDING_APPROVAL';
                        booking.deadlineAt = decision.deadlineAt;
                        console.log(`[POLICY] Booking ${code} requires ${decision.outcome}: ${decision.reasonCode}`);
                    }
                } else {
                    // Fallback nếu không tìm được book
                    booking.status = "SIGNED_PENDING_APPROVAL";
                    booking.approvalMode = 'MANUAL';
                    booking.reasonCode = 'BOOK_NOT_FOUND_FALLBACK';
                }
            }
        } catch (e) { /* ignore FPT API errors */ }
    }

    if (booking.status === "SIGNED_UNPAID" && booking.paid) {
        booking.status = "PAID";
    }

    res.json(booking);
});

// 2.5 Approve Contract - DEPRECATED
router.post('/:code/approve', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Phê duyệt thông qua MetaMask ký giao dịch On-chain." });
});

// 3. Pay via Wallet - DEPRECATED
router.post('/:code/pay-wallet', async (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Thanh toán bằng Native Token thông qua hàm createRental trên Smart Contract." });
});

// 4. Return Request - DEPRECATED
router.post('/:code/return-request', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "User gọi trực tiếp requestReturn trên Smart Contract." });
});

// 5. Return Confirm - DEPRECATED
router.post('/:code/return-confirm', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Admin gọi confirmReturn trên Smart Contract." });
});

// 6. Old Return (Redirect) - DEPRECATED
router.post('/:code/return', (req, res) => {
    res.status(410).json({ error: "DEPRECATED", message: "Sử dụng requestReturn On-chain." });
});

module.exports = router;
