// In-Memory Data Store (Singleton)
// Used to share state across VSA Modules
const fs = require('fs');
const path = require('path');

// DATA PERSISTENCE SETUP
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: Map serialization
const replacer = (key, value) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    }
    return value;
};

const reviver = (key, value) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
};

// Default users with FIXED Hardhat addresses (accounts 0-2)
const defaultUsers = [
    ['user1', {
        username: 'user1',
        email: 'user1@vinalib.vn',
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',  // Hardhat Account #0
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        balance: 5000000,
        role: 'USER',
        fullName: 'Nguyễn Văn User',
        idNumber: '012345678901',
        physicalAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        entityType: 'INDIVIDUAL',
        createdAt: Date.now()
    }],
    ['lender1', {
        username: 'lender1',
        email: 'lender1@vinalib.vn',
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',  // Hardhat Account #1
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        balance: 10000000,
        role: 'LENDER',
        fullName: 'Công ty TNHH Sách Việt',
        idNumber: '0123456789',
        physicalAddress: '456 Lê Lợi, Quận 3, TP.HCM',
        entityType: 'ORGANIZATION',
        createdAt: Date.now()
    }],
    ['admin1', {
        username: 'admin1',
        email: 'admin1@vinalib.vn',
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',  // Hardhat Account #2
        privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
        balance: 50000000,
        role: 'ADMIN',
        fullName: 'VinaLib Admin',
        idNumber: '0987654321',
        physicalAddress: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
        entityType: 'ORGANIZATION',
        createdAt: Date.now()
    }]
];

// Initial Mock Data for Books (Keeping this here for backward compatibility if used, but mainly in Book/store)
const defaultBooks = [
    { id: 1, title: "Sách Blockchain Cơ Bản", author: "Satoshi Nakamoto", price: 50000, cid: "QmHash1", available: true },
    { id: 2, title: "Mastering Ethereum", author: "Gavin Wood", price: 60000, cid: "QmHash2", available: true },
    { id: 3, title: "Smart Contract Security", author: "ConsenSys", price: 55000, cid: "QmHash3", available: true }
];

// Default Renter Stats
const defaultRenterStats = [
    ['testuser', { completedRentals: 5, lateReturns: 0, disputes: 0 }],
    ['newuser', { completedRentals: 0, lateReturns: 0, disputes: 0 }],
    ['riskuser', { completedRentals: 1, lateReturns: 2, disputes: 1 }]
];

// Load or Initialize Data
let users = new Map(defaultUsers);
let bookings = new Map();
let books = [...defaultBooks];
let transactionLog = [];
let systemWallets = {
    escrow: { balance: 0 },
    revenue: { balance: 0 },
    pendingPayout: { balance: 0 }
};
let systemConfig = {
    minCollateralRatio: 80,
    platformFeePercent: 10
};
let renterStats = new Map(defaultRenterStats);

function loadData() {
    try {
        if (fs.existsSync(path.join(DATA_DIR, 'shared_store.json'))) {
            const raw = fs.readFileSync(path.join(DATA_DIR, 'shared_store.json'), 'utf8');
            const data = JSON.parse(raw, reviver);

            if (data.users) users = data.users;
            if (data.bookings) bookings = data.bookings;
            if (data.books) books = data.books; // Legacy array
            if (data.transactionLog) transactionLog = data.transactionLog;
            if (data.systemWallets) systemWallets = data.systemWallets;
            if (data.systemConfig) systemConfig = data.systemConfig;
            if (data.renterStats) renterStats = data.renterStats;

            console.log('[Store] Data loaded from disk.');
        } else {
            console.log('[Store] No data file found. Using defaults.');
        }
    } catch (e) {
        console.error('[Store] Failed to load data:', e.message);
    }
}

function saveData() {
    try {
        const data = {
            users,
            bookings,
            books,
            transactionLog,
            systemWallets,
            systemConfig,
            renterStats
        };
        fs.writeFileSync(path.join(DATA_DIR, 'shared_store.json'), JSON.stringify(data, replacer, 2));
    } catch (e) {
        console.error('[Store] Failed to save data:', e.message);
    }
}

// Initial Load
loadData();

// Auto-save every 5 seconds
setInterval(saveData, 5000);

// Helper: Tạo commitment hash
function createCommitmentHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'CMT-' + Math.abs(hash).toString(16).toUpperCase();
}

module.exports = {
    users,
    bookings,
    books,
    systemWallets,
    systemConfig,
    transactionLog,
    createCommitmentHash,
    renterStats
};

