const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// IR-4 FIX: Import tất cả auth middlewares (không chỉ verifyAdmin)
const { verifyAdmin, verifyUser, verifyLenderOrAdmin } = require('../Shared/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- Load Modules ---
const identityController = require('../modules/Identity/controller');
const bookController = require('../modules/Book/controller');
const rentalController = require('../modules/Rental/controller');
const adminController = require('../modules/Admin/controller');
const iotController = require('../modules/IoT/controller');
const paymentController = require('../modules/Payment/controller');
const ipfsController = require('../modules/IPFS/controller');
const configController = require('../modules/Config/controller');
const policyController = require('../modules/PolicyEngine/policy.module');
const { contractController } = require('../modules/Legal');


// --- Mount Routes ---

// 1. Identity & User (Auth, Balance, History) - Public (login/register không cần auth)
app.use('/api', identityController);

// 2. Books - GET public, POST/PUT cần Lender hoặc Admin
//    IR-4 FIX: verifyLenderOrAdmin bảo vệ write routes (defined in bookController)
app.use('/api/books', bookController);

// 3. Rental (Booking, Return) - IR-4 FIX: Cần đăng nhập mới book được
app.use('/api/booking', verifyUser, rentalController);

// 4. Admin (Dashboard) - PROTECTED: Chỉ Admin mới truy cập được
app.use('/api/admin', verifyAdmin, adminController);

// 5. IoT (Unlock) - User routes with booking verification
app.use('/api/devices', iotController);

// 6. Payment Webhook - Public (từ external payment services)
app.use('/api/webhook', paymentController);

// 7. IPFS Gateway - Public read
app.use('/ipfs', ipfsController);

// 8. Config - Public read, Admin write
app.use('/api/config', configController);

// 9. PolicyEngine - Phase 2: Internal query (verifyUser)
app.use('/api/policy', verifyUser, policyController);

// 10. Legal/Contracts - Contract Preview & Accept/Reject
//     IR-4 FIX: Cần đăng nhập để xem/ký hợp đồng
app.use('/api/contracts', verifyUser, contractController);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`[VinaLibVault] VSA Backend running on http://localhost:${PORT}`);
    console.log(`[Mode] ${process.env.NODE_ENV || 'Development/Local'}`);
    console.log(`[Auth] Admin routes protected by verifyAdmin middleware`);
    console.log(`[Phase 2] PolicyEngine Auto-Accept enabled`);

    // Khởi chạy Blockchain Event Listener Worker
    const blockchainListener = require('../workers/blockchainListener');
    blockchainListener.start();
});

// === PHASE 1: Cron Job - Auto Payout ===
const cron = require('node-cron');
const { users, systemWallets, transactionLog, createCommitmentHash, bookings } = require('../Shared/store');

// Chạy lúc 00:00 ngày 5 hàng tháng
cron.schedule('0 0 5 * *', () => {
    console.log('[CRON] ===== Monthly Payout Started =====');
    let totalPayout = 0;
    let payoutCount = 0;

    users.forEach((user, username) => {
        if (user.pendingIncome > 0) {
            const amount = user.pendingIncome;
            user.balance = (user.balance || 0) + amount;
            user.pendingIncome = 0;
            totalPayout += amount;
            payoutCount++;

            const txData = {
                type: 'MONTHLY_PAYOUT',
                user: username,
                amount: amount,
                payoutAt: Date.now()
            };
            transactionLog.push({
                ...txData,
                timestamp: Date.now(),
                commitmentHash: createCommitmentHash(txData)
            });
        }
    });

    systemWallets.pendingPayout.balance -= totalPayout;
    console.log(`[CRON] Payout Complete. ${payoutCount} users received total ${totalPayout}`);
    console.log('[CRON] ===== Monthly Payout Ended =====');
});

console.log('[CRON] Monthly payout scheduled for day 5 of each month at 00:00');

// === PHASE 2: Cron Job - Deadline Monitor ===
// Chạy mỗi 5 phút - xử lý bookings quá hạn
cron.schedule('*/5 * * * *', () => {
    const now = Date.now();
    let expiredCount = 0;

    bookings.forEach((booking, code) => {
        // Check approval deadline (REVIEW/MANUAL)
        if (booking.status === 'SIGNED_PENDING_APPROVAL' && booking.deadlineAt && now > booking.deadlineAt) {
            booking.status = 'EXPIRED';
            booking.isExpired = true;
            booking.reasonCode = (booking.reasonCode || '') + '|APPROVAL_TIMEOUT';
            expiredCount++;
            console.log(`[DEADLINE] Booking ${code} EXPIRED - approval timeout`);
        }

        // Check pickup deadline (AUTO approved but not paid)
        if (booking.status === 'SIGNED_UNPAID' && booking.pickupDeadlineAt && now > booking.pickupDeadlineAt) {
            // Release hold nhưng không expire hoàn toàn - chỉ log warning
            console.log(`[DEADLINE] Booking ${code} pickup deadline passed - hold released`);
        }
    });

    if (expiredCount > 0) {
        console.log(`[CRON] Deadline monitor: ${expiredCount} bookings expired`);
    }
});

console.log('[CRON] Phase 2 deadline monitor scheduled every 5 minutes');

