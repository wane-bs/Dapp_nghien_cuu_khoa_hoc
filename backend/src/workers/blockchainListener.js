const { ethers } = require('ethers');
const { booksMap } = require('../modules/Book/book.store');
const { bookings } = require('../Shared/store');

// Contract Address - Cần lấy từ config hoặc env (Hardcode cho development phase)
const CONTRACT_ADDRESSES = {
    BookAsset: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    VinaLibVault: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
};

// Minimal ABIs required for events
const BookAssetABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event BookVerified(uint256 indexed tokenId, address indexed verifier, uint8 newStatus, uint256 timestamp)",
    "event BookStatusChanged(uint256 indexed tokenId, uint8 oldStatus, uint8 newStatus)",
    "event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires)"
];

const VinaLibVaultABI = [
    "event RentalCreated(address indexed user, uint256 indexed bookId, uint64 expires, bytes32 termsHash, uint16 version, string pspRef, uint256 sbtId)",
    "event ReturnRequested(uint256 indexed bookId, address indexed renter, bytes32 deliveryHash)",
    "event RentalConcluded(uint256 indexed bookId, address indexed renter, uint256 timestamp, bool isDamaged, string notes)",
    "event RentalCancelled(uint256 indexed bookId, address indexed renter, uint256 timestamp)",
    "event CollateralClaimed(uint256 indexed bookId, address indexed renter, uint256 timestamp, string reason)"
];

class BlockchainListener {
    constructor() {
        // Sử dụng WebSocket cho local network (Hardhat ngầm định hỗ trợ rpc)
        // Nếu WS không ổn định, config fallback qua JsonRpcProvider polling
        this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

        this.bookAssetContract = new ethers.Contract(CONTRACT_ADDRESSES.BookAsset, BookAssetABI, this.provider);
        this.vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.VinaLibVault, VinaLibVaultABI, this.provider);

        console.log(`[Worker] Khởi tạo Blockchain Listener. Rpc: ${this.rpcUrl}`);
    }

    start() {
        console.log("[Worker] Bắt đầu lắng nghe Events từ Smart Contracts...");

        // ==========================================
        // 1. Lắng nghe BookAsset Events
        // ==========================================

        this.bookAssetContract.on("BookVerified", (tokenId, verifier, newStatus, timestamp, event) => {
            const id = Number(tokenId);
            console.log(`[Event] BookVerified - ID: ${id}, Status: ${newStatus}`);
            const book = booksMap.get(id);
            if (book) {
                // Mapping trạng thái: 0: Pending, 1: Verified, 2: Rented
                const statusStrMap = { 0: 'PENDING_VERIFICATION', 1: 'VERIFIED', 2: 'RENTED' };
                book.status = statusStrMap[newStatus] || 'UNKNOWN';
                book.verifiedAt = Number(timestamp) * 1000;
                book.verifyTxHash = event.log ? event.log.transactionHash : null;
            }
        });

        this.bookAssetContract.on("BookStatusChanged", (tokenId, oldStatus, newStatus, event) => {
            const id = Number(tokenId);
            console.log(`[Event] BookStatusChanged - ID: ${id}, ${oldStatus} -> ${newStatus}`);
            const book = booksMap.get(id);
            if (book) {
                const statusStrMap = { 0: 'PENDING_VERIFICATION', 1: 'VERIFIED', 2: 'RENTED' };
                book.status = statusStrMap[newStatus] || book.status;
            }
        });

        // ==========================================
        // 2. Lắng nghe VinaLibVault Events
        // ==========================================

        this.vaultContract.on("RentalCreated", (user, bookId, expires, termsHash, version, pspRef, sbtId, event) => {
            const id = Number(bookId);
            console.log(`[Event] RentalCreated - BookID: ${id}, User: ${user}`);

            // Xây dựng Code để query Offchain
            const bookingCode = "BOOK-CHAIN-" + id + "-" + Date.now();

            bookings.set(bookingCode, {
                code: bookingCode,
                assetId: id.toString(),
                status: "ACTIVE", // Đạt trạng thái đã thanh toán/hoạt động
                renterAddress: user,
                expiresAt: Number(expires) * 1000,
                contract: {
                    termsHash: termsHash,
                    version: Number(version)
                },
                pspRef: pspRef,
                rentalSBTId: Number(sbtId),
                txHash: event.log ? event.log.transactionHash : null,
                createdAt: Date.now()
            });

            // Đồng bộ trạng thái sách sang RENTED
            const book = booksMap.get(id);
            if (book) {
                book.status = 'RENTED';
                book.available = false;
            }
        });

        this.vaultContract.on("ReturnRequested", (bookId, renter, deliveryHash, event) => {
            const id = Number(bookId);
            console.log(`[Event] ReturnRequested - BookID: ${id}`);

            // Tìm booking đang active cho bookId này
            for (let [code, b] of bookings.entries()) {
                if (b.assetId === id.toString() && b.status === "ACTIVE") {
                    b.status = "RETURN_REQUESTED";
                    b.deliveryHash = deliveryHash;
                    break;
                }
            }
        });

        this.vaultContract.on("RentalConcluded", (bookId, renter, timestamp, isDamaged, notes, event) => {
            const id = Number(bookId);
            console.log(`[Event] RentalConcluded - BookID: ${id}. Damaged: ${isDamaged}`);

            for (let [code, b] of bookings.entries()) {
                // Có thể match thêm renter if necessary
                if (b.assetId === id.toString() && ["RETURN_REQUESTED", "ACTIVE"].includes(b.status)) {
                    b.status = "COMPLETED";
                    b.isDamaged = isDamaged;
                    b.returnNotes = notes;
                    b.concludedAt = Number(timestamp) * 1000;
                    b.settledAt = Date.now(); // Kích hoạt quyết toán offchain nếu cần
                    break; // Cập nhật bản ghi đầu tiên khớp
                }
            }
        });

        this.vaultContract.on("RentalCancelled", (bookId, renter, timestamp, event) => {
            const id = Number(bookId);
            console.log(`[Event] RentalCancelled - BookID: ${id}`);
            for (let [code, b] of bookings.entries()) {
                if (b.assetId === id.toString() && b.status === "ACTIVE") {
                    b.status = "CANCELLED";
                    b.cancelledAt = Number(timestamp) * 1000;
                    break;
                }
            }

            const book = booksMap.get(id);
            if (book) {
                book.status = 'VERIFIED';
                book.available = true;
            }
        });

        this.vaultContract.on("CollateralClaimed", (bookId, renter, timestamp, reason, event) => {
            const id = Number(bookId);
            console.log(`[Event] CollateralClaimed - BookID: ${id}`);
            for (let [code, b] of bookings.entries()) {
                if (b.assetId === id.toString() && ["RETURN_REQUESTED", "ACTIVE"].includes(b.status)) {
                    b.status = "CLAIMED";
                    b.claimReason = reason;
                    b.claimedAt = Number(timestamp) * 1000;
                    break;
                }
            }
        });
    }

    stop() {
        this.provider.removeAllListeners();
        console.log("[Worker] Đã ngừng lắng nghe Events.");
    }
}

module.exports = new BlockchainListener();
