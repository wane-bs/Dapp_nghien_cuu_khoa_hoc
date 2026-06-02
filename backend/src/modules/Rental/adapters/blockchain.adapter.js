const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACTS_DATA_PATH = path.join(__dirname, '../../../Shared/contracts-data.json');
const ABIS_PATH = path.join(__dirname, '../../../Shared/abis.json');
const RENTAL_SBT_ABI_PATH = path.join(__dirname, '../../../../../contracts/artifacts/contracts/RentalAgreementSBT.sol/RentalAgreementSBT.json');

let provider;
let wallet; // Sentinel wallet (Backend Admin)
let contracts = {};
let bookIdToTokenId = {}; // CF-3: Book ID → Token ID map

const isLocal = true; // Phase 1 is always local

// CF-2 FIX: Private key từ environment variable, không hardcode
function getAdminPrivateKey() {
    const pk = process.env.ADMIN_PRIVATE_KEY;
    if (!pk) {
        throw new Error(
            '[Blockchain] ADMIN_PRIVATE_KEY is not set in environment variables. ' +
            'Please create backend/.env file. See .env.example for reference.'
        );
    }
    return pk;
}

async function init() {
    try {
        if (!fs.existsSync(CONTRACTS_DATA_PATH)) {
            console.warn("[Blockchain] Contracts data not found. Run deploy script first!");
            return;
        }

        const addresses = JSON.parse(fs.readFileSync(CONTRACTS_DATA_PATH));
        const abis = JSON.parse(fs.readFileSync(ABIS_PATH));

        // CF-3 FIX: Load Book ID → Token ID mapping từ contracts-data.json
        if (addresses.bookIdToTokenId) {
            bookIdToTokenId = addresses.bookIdToTokenId;
            console.log("[Blockchain] Book ID → Token ID mapping loaded:", bookIdToTokenId);
        } else {
            console.warn("[Blockchain] bookIdToTokenId not found in contracts-data.json. Using fallback (string split).");
        }

        // Connect to Local Hardhat Node
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
        provider = new ethers.JsonRpcProvider(rpcUrl);

        // CF-2 FIX: Dùng env thay vì hardcode
        const ADMIN_PK = getAdminPrivateKey();
        wallet = new ethers.Wallet(ADMIN_PK, provider);

        // Load Contracts
        contracts.bookAsset = new ethers.Contract(addresses.bookAsset, abis.BookAsset.abi, wallet);
        contracts.suchinToken = new ethers.Contract(addresses.suchinToken, abis.SuChinToken.abi, wallet);

        // Load RentalSBT Contract
        if (fs.existsSync(RENTAL_SBT_ABI_PATH) && addresses.rentalSBT) {
            const rentalSBTArtifact = JSON.parse(fs.readFileSync(RENTAL_SBT_ABI_PATH));
            contracts.rentalSBT = new ethers.Contract(addresses.rentalSBT, rentalSBTArtifact.abi, wallet);
            console.log("[Blockchain] RentalSBT contract loaded at " + addresses.rentalSBT);
        }

        // Load VinaLibVault Contract
        if (addresses.vinaLibVault) {
            const vaultPath = path.join(__dirname, '../../../../../contracts/artifacts/contracts/VinaLibVault.sol/VinaLibVault.json');
            if (fs.existsSync(vaultPath)) {
                const vaultArtifact = JSON.parse(fs.readFileSync(vaultPath));
                contracts.vinaLibVault = new ethers.Contract(addresses.vinaLibVault, vaultArtifact.abi, wallet);
                console.log("[Blockchain] VinaLibVault contract loaded at " + addresses.vinaLibVault);
            }
        } else {
            console.warn("[Blockchain] VinaLibVault address not found.");
        }

        console.log("[Blockchain] Adapter initialized. Connected to " + addresses.bookAsset);
    } catch (e) {
        console.error("[Blockchain] Init failed:", e.message);
    }
}

/**
 * CF-3 FIX: Resolve Token ID từ assetId string hoặc book ID number
 * Dùng mapping chính thức từ contracts-data.json thay vì string split
 * @param {string|number} assetId - "book-1" hoặc số 1
 * @returns {number} tokenId
 */
function resolveTokenId(assetId) {
    let bookId;

    if (typeof assetId === 'number') {
        bookId = assetId;
    } else if (typeof assetId === 'string') {
        if (assetId.includes('-')) {
            bookId = parseInt(assetId.split('-')[1]);
        } else {
            bookId = parseInt(assetId);
        }
    } else {
        bookId = 1;
    }

    // Ưu tiên dùng mapping chính thức
    if (bookIdToTokenId && bookIdToTokenId[String(bookId)] !== undefined) {
        const tokenId = bookIdToTokenId[String(bookId)];
        console.log(`[TokenID] ${assetId} → token ${tokenId} (from mapping)`);
        return tokenId;
    }

    // Fallback: assume tokenId = bookId (Phase 1 assumption)
    console.warn(`[TokenID] ${assetId} → token ${bookId} (fallback, no mapping found)`);
    return bookId;
}

/**
 * CF-1 FIX: createRentalOnChain nhận existingSbtId thay vì để contract tự mint
 * @param {string} bookingCode
 * @param {string|number} assetId
 * @param {string} renterAddress
 * @param {number} durationSeconds
 * @param {string} termsHash
 * @param {number} version
 * @param {number} existingSbtId - SBT đã mint tại lúc ký hợp đồng
 */
async function createRentalOnChain(bookingCode, assetId, renterAddress, durationSeconds, termsHash, version = 1, existingSbtId = 0) {
    if (!contracts.vinaLibVault) await init();
    if (!contracts.vinaLibVault) {
        console.warn("[Blockchain] VinaLibVault not loaded, skipping on-chain rental.");
        return null;
    }

    try {
        console.log(`[Blockchain] Creating rental for ${assetId} to ${renterAddress} via Vault`);

        // CF-3 FIX: Dùng resolveTokenId thay vì string split trực tiếp
        const tokenId = resolveTokenId(assetId);

        // Default Terms Hash if missing
        if (!termsHash) termsHash = ethers.keccak256(ethers.toUtf8Bytes("DEFAULT_TERMS"));
        if (!termsHash.startsWith('0x')) termsHash = ethers.keccak256(ethers.toUtf8Bytes(termsHash));

        const pspRef = bookingCode;

        console.log(`[Blockchain] DEBUG createRental Args:`, {
            renterAddress, tokenId, durationSeconds, termsHash, version, pspRef,
            existingSbtId  // CF-1: log SBT ID
        });

        // CF-1 FIX: Truyền existingSbtId vào contract (không mint mới)
        const tx = await contracts.vinaLibVault.createRental(
            renterAddress,
            BigInt(tokenId || 0),
            BigInt(durationSeconds || 0),
            termsHash,
            BigInt(version || 1),
            String(pspRef || ""),
            BigInt(existingSbtId || 0)  // CF-1: existingSbtId param mới
        );
        console.log(`[Blockchain] createRental Tx: ${tx.hash}`);

        const receipt = await tx.wait();
        // CF-1: Không cần tìm SBT Transfer event vì không mint mới
        console.log(`[Blockchain] createRental confirmed. SBT ID ${existingSbtId} recorded on-chain.`);

        return { hash: tx.hash, sbtId: existingSbtId };
    } catch (e) {
        console.error("[Blockchain] createRentalOnChain failed:", e.message);
        return null;
    }
}

async function mintBook(toAddress, cid) {
    if (!contracts.bookAsset) await init();
    if (!contracts.bookAsset) return null;

    try {
        console.log(`[Blockchain] Minting book (CID: ${cid}) to ${toAddress}`);
        const tx = await contracts.bookAsset.safeMint(toAddress, cid);
        console.log(`[Blockchain] Mint Tx: ${tx.hash}`);
        return tx.hash;
    } catch (e) {
        console.error("[Blockchain] mintBook failed:", e.message);
        return null;
    }
}

// CF-3 FIX: Dùng resolveTokenId
async function verifyListing(tokenIdOrBookId) {
    if (!contracts.bookAsset) await init();
    if (!contracts.bookAsset) return null;

    try {
        // CF-3: resolveTokenId nếu truyền vào là assetId string
        const tokenId = typeof tokenIdOrBookId === 'number'
            ? tokenIdOrBookId
            : resolveTokenId(tokenIdOrBookId);

        console.log(`[Blockchain] Verifying listing for Token ID: ${tokenId}`);
        const tx = await contracts.bookAsset.verifyForListing(tokenId);
        console.log(`[Blockchain] Verify Listing Tx: ${tx.hash}`);
        return tx.hash;
    } catch (e) {
        console.error("[Blockchain] verifyListing failed:", e.message);
        return null;
    }
}

// CF-3 FIX: Dùng resolveTokenId
async function verifyReturn(tokenIdOrBookId, isDamaged) {
    if (!contracts.bookAsset) await init();
    if (!contracts.bookAsset) return null;

    try {
        const tokenId = typeof tokenIdOrBookId === 'number'
            ? tokenIdOrBookId
            : resolveTokenId(tokenIdOrBookId);

        console.log(`[Blockchain] Verifying return for Token ID: ${tokenId} (Damaged: ${isDamaged})`);
        const tx = await contracts.bookAsset.verifyReturn(tokenId, isDamaged);
        console.log(`[Blockchain] Verify Return Tx: ${tx.hash}`);
        return tx.hash;
    } catch (e) {
        console.error("[Blockchain] verifyReturn failed:", e.message);
        return null;
    }
}

/**
 * P2-2 FIX: Lấy on-chain BookStatus để frontend có thể poll
 * @param {number} tokenId
 * @returns {Promise<{status: number, statusName: string}|null>}
 */
async function getBookStatus(tokenId) {
    if (!contracts.bookAsset) await init();
    if (!contracts.bookAsset) return null;

    try {
        const statusNum = await contracts.bookAsset.getBookStatus(tokenId);
        const statusNames = ['PendingVerification', 'Verified', 'Rented', 'Returned'];
        const statusName = statusNames[Number(statusNum)] || 'Unknown';
        console.log(`[Blockchain] Book Token ${tokenId} status: ${statusName} (${statusNum})`);
        return { status: Number(statusNum), statusName };
    } catch (e) {
        console.error("[Blockchain] getBookStatus failed:", e.message);
        return null;
    }
}

/**
 * Mint Rental SBT on-chain
 * @param {string} renterAddress
 * @param {string} termsHash
 * @returns {Promise<{sbtId: number, txHash: string}|null>}
 */
async function mintRentalSBT(renterAddress, termsHash) {
    if (!contracts.rentalSBT) await init();

    try {
        let termsHashBytes32;
        if (termsHash && termsHash.startsWith('0x') && termsHash.length === 66) {
            termsHashBytes32 = termsHash;
        } else {
            termsHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(termsHash || 'NO_TERMS'));
        }

        if (!contracts.rentalSBT) {
            const mockId = Math.floor(Date.now() / 1000) % 100000 + 1;
            console.log(`[Blockchain] Mock SBT mint - ID: ${mockId}`);
            return { sbtId: mockId, txHash: '0xmock_' + Date.now().toString(16) };
        }

        console.log(`[Blockchain] Minting Rental SBT to ${renterAddress} with termsHash: ${termsHashBytes32}`);
        const tx = await contracts.rentalSBT.safeMint(renterAddress, termsHashBytes32);
        console.log(`[Blockchain] SBT Mint Tx: ${tx.hash}`);

        const receipt = await tx.wait(1);
        const transferEvent = receipt.logs.find(log => {
            try {
                const parsed = contracts.rentalSBT.interface.parseLog(log);
                return parsed && parsed.name === 'Transfer';
            } catch { return false; }
        });

        let sbtId = null;
        if (transferEvent) {
            const parsed = contracts.rentalSBT.interface.parseLog(transferEvent);
            sbtId = Number(parsed.args.tokenId);
        }

        return { sbtId, txHash: tx.hash };
    } catch (e) {
        console.error("[Blockchain] mintRentalSBT failed:", e.message);
        const mockId = Math.floor(Date.now() / 1000) % 100000 + 1;
        return { sbtId: mockId, txHash: '0xmock_error_' + Date.now().toString(16) };
    }
}

/**
 * Generate Evidence Pack Hash (on-chain compatible format)
 */
function generateEvidencePackHash(termsHash, bookingCode, timestamp) {
    try {
        const packedData = ethers.solidityPacked(
            ['string', 'string', 'uint256'],
            [termsHash || 'NO_TERMS', bookingCode || 'NO_CODE', timestamp || Date.now()]
        );
        const hash = ethers.keccak256(packedData);
        console.log(`[Blockchain] Evidence Pack Hash: ${hash}`);
        return hash;
    } catch (e) {
        console.error("[Blockchain] generateEvidencePackHash failed:", e.message);
        return '0x' + require('crypto').createHash('sha256')
            .update(`${termsHash}_${bookingCode}_${timestamp}`)
            .digest('hex');
    }
}

/**
 * CF-1 FIX: syncRentalToBlockchain truyền existingSbtId vào createRentalOnChain
 * SBT đã mint tại contract signing — chỉ record on-chain, không mint mới
 */
async function syncRentalToBlockchain(booking, renterAddress) {
    const termsHash = booking.contract?.termsHash || 'NO_TERMS';
    const version = booking.contract?.version || 1;
    const duration = 7 * 24 * 60 * 60; // 7 days default
    const code = booking.code;

    // CF-1 FIX: Lấy SBT ID từ booking (đã mint tại lúc ký HĐ)
    const primarySBTId = booking.rentalSBTId || 0;
    console.log(`[Blockchain] Syncing rental ${code} to chain. Primary SBT ID: ${primarySBTId}`);

    // CF-1 FIX: Truyền primarySBTId vào createRentalOnChain (không mint mới trên chain)
    const result = await createRentalOnChain(code, booking.assetId, renterAddress, duration, termsHash, version, primarySBTId);

    const hash = result?.hash || (typeof result === 'string' ? result : null);

    if (hash) {
        const timestamp = Date.now();
        const evidencePackHash = generateEvidencePackHash(termsHash, code, timestamp);
        const finalSBTId = primarySBTId || (result && result.sbtId ? result.sbtId : null);

        console.log(`[Blockchain] Payment sync complete. Evidence on-chain. Hash: ${hash}, SBT: ${finalSBTId}`);
        return { success: true, txHash: hash, rentalSBTId: finalSBTId, evidencePackHash };
    }

    // STRICT COMPLIANCE: No fallback
    console.error(`[Blockchain] CRITICAL: VinaLibVault call failed. Cannot create Evidence on-chain.`);
    throw new Error("BLOCKCHAIN_SYNC_FAILED: Evidence could not be stored on-chain. Transaction aborted for safety.");
}

module.exports = {
    init,
    createRentalOnChain,
    mintBook,
    verifyListing,
    verifyReturn,
    getBookStatus,       // P2-2 NEW
    resolveTokenId,      // CF-3 NEW (exported for testing)
    generateEvidencePackHash,
    syncRentalToBlockchain,
    mintRentalSBT
};
