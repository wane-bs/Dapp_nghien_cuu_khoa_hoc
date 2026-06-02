const express = require('express');
const { ethers } = require('ethers');
const { users, bookings } = require('../../Shared/store');

const router = express.Router();

// === AUTO-GENERATION HELPERS ===

// Vietnamese names for random generation
const FIRST_NAMES = ['Minh', 'Hùng', 'Anh', 'Tuấn', 'Đức', 'Phương', 'Linh', 'Hà', 'Thảo', 'Ngọc'];
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Đức', 'Minh', 'Hoàng', 'Thanh', 'Quốc', 'Hữu'];
const STREETS = ['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Điện Biên Phủ', 'Võ Văn Tần', 'Nam Kỳ Khởi Nghĩa'];
const DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Phú Nhuận', 'Tân Bình', 'Gò Vấp'];
const ORG_PREFIXES = ['Công ty TNHH', 'Công ty CP', 'DNTN', 'Hộ kinh doanh'];
const ORG_NAMES = ['Sách Việt', 'Tri Thức', 'Văn Lang', 'Đông A', 'Tân Việt', 'Nhã Nam', 'Alpha Books'];

function generateRandom12Digits() {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateRandomName() {
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const middle = MIDDLE_NAMES[Math.floor(Math.random() * MIDDLE_NAMES.length)];
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    return `${last} ${middle} ${first}`;
}

function generateRandomAddress() {
    const num = Math.floor(Math.random() * 200) + 1;
    const street = STREETS[Math.floor(Math.random() * STREETS.length)];
    const district = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    return `${num} ${street}, ${district}, TP.HCM`;
}

function generateOrgName() {
    const prefix = ORG_PREFIXES[Math.floor(Math.random() * ORG_PREFIXES.length)];
    const name = ORG_NAMES[Math.floor(Math.random() * ORG_NAMES.length)];
    return `${prefix} ${name}`;
}

function generateUserProfile(role) {
    const isOrg = role === 'ADMIN' || (role === 'LENDER' && Math.random() > 0.5);

    if (isOrg) {
        // Tổ chức: MST 10-13 số
        return {
            fullName: generateOrgName(),
            idNumber: generateRandom12Digits().slice(0, 10), // MST 10 số
            physicalAddress: generateRandomAddress(),
            entityType: 'ORGANIZATION'
        };
    } else {
        // Cá nhân: CCCD 12 số
        return {
            fullName: generateRandomName(),
            idNumber: generateRandom12Digits(), // CCCD 12 số
            physicalAddress: generateRandomAddress(),
            entityType: 'INDIVIDUAL'
        };
    }
}


// Register
router.post('/register', (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) return res.status(400).json({ error: "Missing fields" });
        if (users.has(username)) return res.status(400).json({ error: "User exists" });

        const wallet = ethers.Wallet.createRandom();

        // Simple Role Assignment for Prototype
        let role = 'USER';
        if (username.toLowerCase().includes('admin')) role = 'ADMIN';
        if (username.toLowerCase().includes('lender') || username.toLowerCase().includes('owner')) role = 'LENDER';

        // Auto-generate profile based on role
        const profile = generateUserProfile(role);

        const newUser = {
            username,
            email,
            address: wallet.address,
            privateKey: wallet.privateKey,
            balance: 5000000,
            role,
            // NEW: Legal identity fields
            fullName: profile.fullName,
            idNumber: profile.idNumber,
            physicalAddress: profile.physicalAddress,
            entityType: profile.entityType,
            createdAt: Date.now()
        };

        users.set(username, newUser);
        console.log(`[AUTH] Registered ${username} (${role}/${profile.entityType}) with wallet ${wallet.address}`);
        console.log(`       -> Name: ${profile.fullName}, ID: ${profile.idNumber}`);

        res.json({
            success: true,
            user: {
                username,
                email,
                address: wallet.address,
                role,
                fullName: profile.fullName,
                idNumber: profile.idNumber,
                physicalAddress: profile.physicalAddress,
                entityType: profile.entityType
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Login
router.post('/login', (req, res) => {
    const { username } = req.body;
    const user = users.get(username);
    if (user) {
        res.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                address: user.address,
                role: user.role || 'USER' // Default to USER
            }
        });
    } else {
        res.status(401).json({ error: "User not found" });
    }
});

// Get Balance (+ Pending Income for Phase 1)
router.get('/user/:username/balance', (req, res) => {
    const { username } = req.params;
    const user = users.get(username);
    const bal = user && user.balance !== undefined ? user.balance : 5000000;
    const pending = user?.pendingIncome || 0;
    res.json({
        balance: bal,
        pendingIncome: pending
    });
});

// Promote to Lender
router.post('/user/promote', (req, res) => {
    const { username } = req.body;
    const user = users.get(username);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = 'LENDER';
    // Persist this change in a real DB, here we assume in-memory
    console.log(`[AUTH] User ${username} promoted to LENDER`);

    res.json({ success: true, user: { ...user, role: 'LENDER' } });
});

// Approve Contract (Mock)
router.post('/user/approve-contract', (req, res) => {
    console.log("[CHAIN] Approved VinaLibVault to spend tokens/assets");
    setTimeout(() => {
        res.json({ success: true, txHash: "0xMockTxHook" });
    }, 800);
});

// Get User Bookings (as Renter)
router.get('/user/:username/bookings', (req, res) => {
    const { username } = req.params;
    const userBookings = [];
    bookings.forEach((val) => {
        if (val.username === username) userBookings.push(val);
    });
    res.json(userBookings.sort((a, b) => b.createdAt - a.createdAt));
});

// Get Lender Rentals (as Book Owner) - NEW: For LenderDashboard
const { booksMap } = require('../Book/book.store');
router.get('/user/:username/lender-rentals', (req, res) => {
    const { username } = req.params;
    const lenderRentals = [];

    bookings.forEach((val) => {
        // Check if lenderUsername matches
        if (val.lenderUsername === username) {
            // Enrich with book info
            const bookIdRaw = val.assetId ? (val.assetId.includes('-') ? val.assetId.split('-')[1] : val.assetId) : null;
            const bookId = bookIdRaw ? parseInt(bookIdRaw) : null;
            const book = bookId ? booksMap.get(bookId) : null;

            lenderRentals.push({
                ...val,
                bookInfo: book ? {
                    title: book.title,
                    author: book.author,
                    imageUrl: book.imageUrl,
                    status: book.status,
                    tokenId: book.tokenId  // Include tokenId for on-chain query
                } : null
            });
        }
    });

    res.json(lenderRentals.sort((a, b) => b.createdAt - a.createdAt));
});

// PHASE 1.5: Get User Transaction History
const { transactionLog } = require('../../Shared/store');
router.get('/user/:username/transactions', (req, res) => {
    const { username } = req.params;
    const userTx = transactionLog.filter(tx =>
        tx.lender === username || tx.user === username || tx.from === username
    );
    res.json(userTx.sort((a, b) => b.timestamp - a.timestamp));
});

module.exports = router;
