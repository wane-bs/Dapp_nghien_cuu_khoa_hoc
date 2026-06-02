const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- TUYA MOCK ---
// Mock Control: Create Temporary Password
app.post('/tuya/v1.0/devices/:id/door-lock/password-free/door-operate', (req, res) => {
    console.log(`[Tuya] Request to unlock device ${req.params.id}`);
    res.json({
        success: true,
        t: Date.now(),
        result: {
            ticket_id: "mock-ticket-" + Date.now(),
            expire_time: 3600
        }
    });
});

// Mock Data: Get Logs
app.get('/tuya/v1.0/devices/:id/logs', (req, res) => {
    console.log(`[Tuya] Request logs for device ${req.params.id}`);
    // Mock logs for Yield Farming logic
    res.json({
        success: true,
        t: Date.now(),
        result: {
            total: 5,
            logs: [
                {
                    status: {
                        code: "unlock_fingerprint",
                        value: "1"
                    },
                    nick_name: "Guest User",
                    update_time: Date.now() - 3600000, // 1 hour ago
                    user_id: "mock-user-001"
                }
            ]
        }
    });
});

// In-memory store for document status
const docStore = new Map();

// --- FPT.eContract MOCK ---
// Mock Create Contract
app.post('/fpt/electronic-sign/create', (req, res) => {
    const { metadata } = req.body;
    console.log(`[FPT] Create contract with metadata:`, JSON.stringify(metadata, null, 2));

    // Deterministic hash based on input
    const mockHash = crypto.createHash('sha256')
        .update(JSON.stringify(metadata || {}))
        .digest('hex');

    const docId = "doc-" + Date.now();
    docStore.set(docId, {
        signed: false,
        hash: mockHash,
        metadata: metadata // STORE FULL METADATA
    });

    res.json({
        code: 0,
        message: "Success",
        data: {
            document_id: docId,
            access_code: "ac-9999",
            status: "DRAFT",
            signing_url: `http://localhost:${PORT}/mock-ui/sign.html?docId=${docId}`,
            created_at: new Date().toISOString()
        }
    });
});

// Mock: Get Document Info (for UI)
app.get('/fpt/electronic-sign/doc/:docId', (req, res) => {
    const { docId } = req.params;
    const doc = docStore.get(docId);
    if (!doc) return res.status(404).json({ error: "Doc not found" });
    res.json({
        docId: docId,
        hash: doc.hash,
        signed: doc.signed,
        metadata: doc.metadata
    });
});

// Mock Verify Contract
app.post('/fpt/electronic-sign/verify', (req, res) => {
    // Expecting some identifier (not specified in guide detailed payload, but usually document_id)
    // For sim, we might extract it from body if available, or just return success for demo.
    // However, guide says "Khi Backend gọi endpoint này với document_id".
    // Let's assume request body has document_id.
    const docId = req.body.document_id;
    console.log(`[FPT] Verify contract ${docId}`);

    const doc = docStore.get(docId);

    if (doc && doc.signed) {
        res.json({
            code: 0,
            data: {
                status: "COMPLETED",
                signed_hash: "0x" + doc.hash, // Return the hash we generated
                verify_result: {
                    is_valid: true,
                    ca_provider: "Mock-CA-Local",
                    timestamp: new Date().toISOString()
                }
            }
        });
    } else {
        res.json({
            code: 0,
            data: {
                status: "PROCESSING", // Not yet signed
                verify_result: {}
            }
        });
    }
});

// Internal endpoint for Mock UI to approve
app.post('/internal/approve-doc', (req, res) => {
    const { docId } = req.body;
    if (docStore.has(docId)) {
        docStore.get(docId).signed = true;
        console.log(`[FPT] Document ${docId} APPROVED by user.`);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Doc not found" });
    }
});

// --- BANK SIMULATOR UI ---
// Served via express.static in 'public' folder
// Endpoint to inspect logs (optional)
app.get('/logs', (req, res) => {
    res.json({ message: "See console for logs" });
});

app.listen(PORT, () => {
    console.log(`Mock Server running on http://localhost:${PORT}`);
    console.log(`Tuya Mock: http://localhost:${PORT}/tuya`);
    console.log(`FPT Mock: http://localhost:${PORT}/fpt`);
    console.log(`Bank Simulator: http://localhost:${PORT}/mock-ui/bank.html`);
});
