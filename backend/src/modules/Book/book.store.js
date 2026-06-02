// Book Store - In-Memory Data Store
// VSA Pattern: Mỗi module quản lý data riêng
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Mock Data
const defaultBooks = [
    [1, {
        id: 1,
        tokenId: 1,
        title: "Dế Mèn Phiêu Lưu Ký",
        author: "Tô Hoài",
        price: 50000,
        cid: "QmMockCID1",
        owner: "lender1",
        available: true,
        status: "VERIFIED",
        imageUrl: "/images/books/de-men-phieu-luu-ky.jpg",
        riskTier: 'C',
        valueReference: 50000
    }],
    [2, {
        id: 2,
        tokenId: 2,
        title: "Số Đỏ",
        author: "Vũ Trọng Phụng",
        price: 45000,
        cid: "QmMockCID2",
        owner: "lender1",
        available: true,
        status: "VERIFIED",
        imageUrl: "/images/books/số_đỏ.jpg",
        riskTier: 'C',
        valueReference: 45000
    }],
    [3, {
        id: 3,
        tokenId: 3,
        title: "Sách Blockchain Cơ Bản",
        author: "Satoshi Nakamoto",
        price: 60000,
        cid: "QmHash1",
        owner: "lender1",
        available: true,
        status: "VERIFIED",
        imageUrl: "/images/books/blockchain_cơ_bản.jpg",
        riskTier: 'B',
        valueReference: 60000
    }],
    [4, {
        id: 4,
        tokenId: 4,
        title: "Mastering Ethereum",
        author: "Gavin Wood",
        price: 75000,
        cid: "QmHash2",
        owner: "lender1",
        available: true,
        status: "VERIFIED",
        imageUrl: "/images/books/mastering_ethereum.jpg",
        riskTier: 'B',
        valueReference: 75000
    }],
    [5, {
        id: 5,
        tokenId: 5,
        title: "Smart Contract Security",
        author: "ConsenSys",
        price: 55000,
        cid: "QmHash3",
        owner: "lender1",
        available: true,
        status: "VERIFIED",
        imageUrl: "/images/books/smart_contract_security.jpg",
        riskTier: 'A',
        valueReference: 150000
    }]
];

let booksMap = new Map(defaultBooks);

// Persistence Logic
const replacer = (key, value) => {
    if (value instanceof Map) return { dataType: 'Map', value: Array.from(value.entries()) };
    return value;
};
const reviver = (key, value) => {
    if (typeof value === 'object' && value !== null && value.dataType === 'Map') return new Map(value.value);
    return value;
};

function loadBooks() {
    try {
        const filePath = path.join(DATA_DIR, 'books_store.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw, reviver);
            if (data.booksMap) booksMap = data.booksMap;
            console.log('[BookStore] Loaded from disk.');
        }
    } catch (e) {
        console.error('[BookStore] Load failed:', e.message);
    }
}

function saveBooks() {
    try {
        const filePath = path.join(DATA_DIR, 'books_store.json');
        fs.writeFileSync(filePath, JSON.stringify({ booksMap }, replacer, 2));
    } catch (e) {
        console.error('[BookStore] Save failed:', e.message);
    }
}

loadBooks();
setInterval(saveBooks, 5000);

module.exports = { booksMap };

