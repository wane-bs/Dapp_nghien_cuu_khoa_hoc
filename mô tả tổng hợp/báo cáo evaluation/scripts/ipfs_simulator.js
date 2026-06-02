const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cấu hình môi trường / Environment Configuration
const STORAGE_ROOT = process.env.IPFS_STORAGE_PATH || path.join(__dirname, 'storage');

// Bảng ký tự Base32 (RFC 4648) chữ thường / Base32 Alphabet (RFC 4648) lower case
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * Hàm mã hóa Base32 / Base32 encoding function
 * @param {Buffer} buffer - Dữ liệu cần mã hóa / Data to encode
 * @returns {string} Chuỗi Base32 / Base32 string
 */
function toBase32(buffer) {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}

/**
 * Tạo CIDv1 từ nội dung / Generate CIDv1 from content
 * @param {Buffer} content - Nội dung file / File content
 * @returns {string} CIDv1 string
 */
function generateCIDv1(content) {
    // 1. Tạo Hash SHA-256 / Create SHA-256 Hash
    const hash = crypto.createHash('sha256').update(content).digest();

    // 2. Xây dựng CID Bytes / Construct CID Bytes
    // Prefix: 0x01 (CIDv1)
    // Codec: 0x55 (Raw)
    // Multihash: 0x12 (SHA-256) + 0x20 (Length 32) + Hash

    // Buffer dài: 1 (ver) + 1 (codec) + 1 (hash fn) + 1 (hash len) + 32 (hash) = 36 bytes
    const cidBuffer = Buffer.alloc(4 + hash.length);
    cidBuffer[0] = 0x01; // Version 1
    cidBuffer[1] = 0x55; // Raw Codec
    cidBuffer[2] = 0x12; // SHA-256
    cidBuffer[3] = 0x20; // Length 32 (0x20)
    hash.copy(cidBuffer, 4);

    // 3. Encode Base32 và thêm prefix 'b' / Encode Base32 and add 'b' prefix
    return 'b' + toBase32(cidBuffer);
}

/**
 * Đảm bảo các thư mục tồn tại / Ensure directories exist
 */
function ensureStorage() {
    const folders = ['storage', 'images', 'metadata'];
    folders.forEach(folder => {
        const dirPath = path.join(__dirname, folder); // Relative to this file
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`[IPFS] Đã tạo thư mục lưu trữ: ${dirPath}`);
        }
    });
}

/**
 * Lưu file vào IPFS giả lập / Add file to simulated IPFS
 * @param {string|Buffer} content - Nội dung cần lưu / Content to save
 * @param {string} [folderName='storage'] - Tên thư mục con (images, metadata, storage)
 * @returns {string} CID của file
 */
function add(content, folderName = 'storage') {
    ensureStorage();

    const allowedFolders = ['storage', 'images', 'metadata'];
    const targetFolder = allowedFolders.includes(folderName) ? folderName : 'storage';

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const cid = generateCIDv1(buffer);
    const filePath = path.join(__dirname, targetFolder, cid);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, buffer);
        console.log(`[IPFS] Đã lưu file vào ${targetFolder}. CID: ${cid}`);
    } else {
        console.log(`[IPFS] File đã tồn tại tại ${targetFolder}. CID: ${cid}`);
    }

    return cid;
}

/**
 * Lấy file từ IPFS giả lập / Get file from simulated IPFS
 * @param {string} cid - CID của file
 * @returns {Buffer|null} Nội dung file hoặc null nếu không tìm thấy
 */
function get(cid) {
    ensureStorage();

    // Tìm trong tất cả các folder
    const folders = ['storage', 'images', 'metadata'];

    for (const folder of folders) {
        const filePath = path.join(__dirname, folder, cid);
        if (fs.existsSync(filePath)) {
            console.log(`[IPFS] Đã tìm thấy file trong ${folder}: ${cid}`);
            return fs.readFileSync(filePath);
        }
    }

    console.error(`[IPFS] Không tìm thấy file: ${cid}`);
    return null;
}

// Chạy thử nếu là file chính / Run test if main file
if (require.main === module) {
    console.log("--- BẮT ĐẦU GIẢ LẬP IPFS / STARTING IPFS SIMULATOR ---");

    const testContent = "Hello VinaLibVault IPFS!";
    console.log(`[TEST] Dữ liệu đầu vào / Input: "${testContent}"`);

    const cid = add(testContent);
    console.log(`[TEST] CID đã tạo / Generated CID: ${cid}`);

    const retrieved = get(cid);
    if (retrieved) {
        console.log(`[TEST] Dữ liệu lấy về / Retrieved: "${retrieved.toString()}"`);
        if (retrieved.toString() === testContent) {
            console.log("[TEST] THÀNH CÔNG / SUCCESS: Dữ liệu khớp.");
        } else {
            console.error("[TEST] THẤT BẠI / FAILURE: Dữ liệu không khớp.");
        }
    }
}

module.exports = {
    add,
    get,
    generateCIDv1
};
