const express = require('express');
const multer = require('multer');
const path = require('path');
const { booksMap } = require('./book.store'); // Use VSA Store

// Adjust import to use Adapter (VSA Compliance)
const IpfsAdapter = require('./adapters/ipfs.adapter');
// P2-2: BlockchainAdapter for on-chain status query
const BlockchainAdapter = require('../Rental/adapters/blockchain.adapter');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Get All Books - Chỉ hiển thị VERIFIED books
router.get('/', (req, res) => {
    const allBooks = Array.from(booksMap.values());
    // Lọc chỉ sách đã VERIFIED và available
    const verifiedBooks = allBooks.filter(b => b.status === 'VERIFIED' && b.available);
    res.json(verifiedBooks);
});

// 1.1 Get All Books (Admin) - Bao gồm cả PENDING_VERIFICATION
router.get('/all', (req, res) => {
    // Route này sẽ được protect bởi verifyAdmin ở server.js nếu cần
    res.json(Array.from(booksMap.values()));
});

// 1.2 Get My Books - Lọc sách của Lender theo owner username
router.get('/my-books', (req, res) => {
    const ownerUsername = req.query.owner;
    if (!ownerUsername) {
        return res.status(400).json({ error: "Missing owner parameter" });
    }
    const allBooks = Array.from(booksMap.values());
    const myBooks = allBooks.filter(b => b.owner === ownerUsername);
    res.json(myBooks);
});

// P2-2 FIX: On-chain status polling endpoint
// Frontend có thể poll route này để sync trạng thái NFT từ blockchain
router.get('/:id/chain-status', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const book = booksMap.get(bookId);
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        // Resolve tokenId từ bookId (CF-3: dùng resolveTokenId)
        const tokenId = BlockchainAdapter.resolveTokenId(bookId);

        // Query on-chain status
        const onChainStatus = await BlockchainAdapter.getBookStatus(tokenId);

        res.json({
            bookId,
            tokenId,
            offChainStatus: book.status,
            onChainStatus: onChainStatus ? onChainStatus.statusName : 'UNAVAILABLE',
            onChainStatusCode: onChainStatus ? onChainStatus.status : null,
            synced: onChainStatus ? book.status === onChainStatus.statusName.toUpperCase() : false,
            lastChecked: new Date().toISOString()
        });
    } catch (error) {
        console.error("[BOOK] chain-status error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 1.3 Get Single Book by ID
router.get('/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = booksMap.get(bookId);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
});

// 2. Create Book (Rent Out) - Sách mới có status PENDING_VERIFICATION
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, price, author, ownerAddress } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        // 1. Upload to IPFS via Adapter
        console.log(`[BOOK] Uploading to IPFS... ${req.file.originalname}`);
        const cid = await IpfsAdapter.uploadFile(req.file.buffer);
        console.log(`[BOOK] IPFS CID: ${cid}`);

        // 2. Create Metadata
        const newId = booksMap.size + 1;

        // AUTO ASSIGN OWNER if missing
        const finalOwner = ownerAddress || "0x456...DEF";

        const newBook = {
            id: newId,
            title,
            author: author || "Unknown",
            price: parseInt(price),
            cid: cid,
            owner: finalOwner,
            available: true,
            status: "PENDING_VERIFICATION", // Chờ Admin xác nhận
            imageUrl: `https://ipfs.io/ipfs/${cid}`,
            createdAt: Date.now(),
            // Phase 2: Policy Engine fields - Admin sẽ gán khi verify-listing
            riskTier: null,           // 'A' (cao), 'B' (trung bình), 'C' (thấp) - Bắt buộc khi duyệt
            valueReference: null      // Giá trị tham chiếu để tính deposit ratio
        };

        // 3. Save to Store
        booksMap.set(newId, newBook);
        console.log(`[BOOK] Created book ${newId} - status: PENDING_VERIFICATION`);

        // 4. Trigger Blockchain Minting (Async)
        BlockchainAdapter.mintBook(finalOwner, cid).then(hash => {
            if (hash) {
                newBook.txHash = hash;
                console.log(`[CHAIN] Book ${newId} minted on-chain. Hash: ${hash}`);
            }
        });

        // 5. Return Success
        res.json({
            success: true,
            data: newBook,
            message: "Sách đã được tạo, chờ Admin xác nhận trước khi niêm yết"
        });

    } catch (error) {
        console.error("[BOOK] Error creating book:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
