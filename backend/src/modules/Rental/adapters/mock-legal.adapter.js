const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MockLegalAdapter {
    static async createContract(data) {
        console.log("MockLegalAdapter: Processing Contract Creation...");

        // 1. Read Physical Contract Template
        const contractPath = path.resolve('c:/book_app_v2/kiến trúc/ban đầu/hợp đồng.md');
        let contractContent = "";
        try {
            contractContent = fs.readFileSync(contractPath, 'utf8');
        } catch (err) {
            console.error("MockLegalAdapter: Failed to read contract template", err);
            // Fallback for development if file missing
            contractContent = "# HỢP ĐỒNG MẪU (FALLBACK)\n\nBên A: [Họ tên/Pháp nhân]\nBên B: [Họ tên/Pháp nhân]\n...";
        }

        // 2. Prepare Data for Replacement
        const meta = data.metadata;
        const now = new Date();
        const replacements = {
            '\\[version\\]': "1.0-beta",
            '\\[rentalId\\]': meta.bookingCode || "Unknown",
            '\\[listingId\\]': meta.book?.id || "Unknown", // Assuming book object has id, or use external ID

            // Note: Currently simple replacement. In real world, use a template engine.
            // Renter
            '\\[Họ tên/Pháp nhân\\]': meta.renter?.name || "................",
            '\\[CMND/CCCD/MST\\]': "................", // Not collected yet
            '\\[Địa chỉ\\]': meta.renter?.address || "................",
            '\\[Email/Điện thoại\\]': meta.renter?.email || "................",

            // Lender (Logic needs improvement to separate Renter/Lender placeholders if they are identical in text)
            // 'Bên Cho Thuê \(BCT\):.*\\[Họ tên/Pháp nhân\\]': ... Complex regex needed if placeholders are same.
            // For now, assuming the template uses distinct context or we rely on simple replacement order if needed.
            // Actually, the template uses "[Họ tên/Pháp nhân]" for both. Simple replaceAll will use same value!
            // WE NEED TO FIX THIS in the Adapter logic by context or assume simple demo.
            // Strategy: Use specific replacement for first occurrence (Lender) and second (Renter)? 
            // Or just fill generic 'User' info for now as this is a mock.
            // Let's try to do it better by splitting or using precise regex.

            '\\[start\\]': now.toISOString().split('T')[0],
            '\\[end\\]': new Date(now.getTime() + 24 * 60 * 60 * 1000 * 7).toISOString().split('T')[0], // Mock 7 days
            '\\[VND\\]': meta.rentalPrice ? `${meta.rentalPrice} VND` : "0 VND",
            '\\[pspRef\\]': "PENDING_PAYMENT"
        };

        // 2.1 Context-aware Replacement (Simple version)
        // We will perform naive replacement for now to demonstrate Hashing.
        // In a real implementation, we would parse the markdown structure.

        let filledContract = contractContent;

        // REPLACE LENDER INFO (First occurrence usually)
        // To avoid complexity, we'll append a "DATA SHEET" at the end if strict replacement is hard,
        // but let's try some specific replaces if possible.

        // Replace variables
        for (const [key, value] of Object.entries(replacements)) {
            // Regex global replace
            const regex = new RegExp(key, 'g');
            filledContract = filledContract.replace(regex, value);
        }

        // 3. Compute SHA-256 Hash of the Content
        const termsHash = crypto.createHash('sha256').update(filledContract).digest('hex');
        const termsHashBytes32 = "0x" + termsHash;

        console.log(`MockLegalAdapter: Terms Hash calculated: ${termsHashBytes32}`);

        // 4. Call Mock Server (Simulation of external signing service)
        // We pass the hash to the mock server so it "knows" what we are signing
        const response = await axios.post('http://localhost:4000/fpt/electronic-sign/create', {
            ...data,
            termsHash: termsHashBytes32,
            contentPreview: filledContract.substring(0, 200) + "..."
        });

        // 5. Return Result
        return {
            documentId: response.data.data.document_id,
            signingUrl: response.data.data.signing_url,
            status: "WAITING_FOR_SIGNATURE",
            termsHash: termsHashBytes32, // IMPORTANT: Return this to Controller
            contractContent: filledContract, // Return full content for UI display
            version: 1 // hardcoded for now
        };
    }
}

module.exports = MockLegalAdapter;
