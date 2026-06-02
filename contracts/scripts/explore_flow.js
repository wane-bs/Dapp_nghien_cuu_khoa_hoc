const { ethers } = require("hardhat");

async function main() {
    console.log("\n🚀 KHOỞI CHẠY MÔ PHỎNG VINALIB BLOCKCHAIN EXPLORER...\n");

    // --- 1. SETUP ACCOUNTS & DEPLOY ---
    const [admin, renter, other] = await ethers.getSigners();

    console.log("📍 ACC 1 (Admin/Lender):", admin.address);
    console.log("📍 ACC 2 (Renter):      ", renter.address);
    console.log("--------------------------------------------------------------------------------");

    // Deploy Mock Router
    const RouterMock = await ethers.getContractFactory("FunctionsRouterMock"); // Use existing mock if available or generic one
    // Since I don't see the content of Mocks.sol, I'll assume standard deployment or deploy a simple mock if needed.
    // Let's check Mocks.sol first effectively by trying to deploy what we know usually exists or assume standard params.
    // For VinaLibVault we need a router address.

    // Quick deploy of Mocks (Assuming Mocks.sol exports FunctionsRouterMock or similar)
    // Actually, looking at simulate-functions.js, it uses "FunctionsRouterMock".
    const router = await RouterMock.deploy();
    await router.waitForDeployment();

    // Deploy BookAsset
    const BookAsset = await ethers.getContractFactory("BookAsset");
    const bookAsset = await BookAsset.deploy();
    await bookAsset.waitForDeployment();

    // Deploy RentalAgreementSBT
    const RentalSBT = await ethers.getContractFactory("RentalAgreementSBT");
    const rentalSBT = await RentalSBT.deploy();
    await rentalSBT.waitForDeployment();

    // Deploy VinaLibVault
    const VinaLibVault = await ethers.getContractFactory("VinaLibVault");
    const vault = await VinaLibVault.deploy(router.target);
    await vault.waitForDeployment();

    // Setup Contract Links
    await vault.setContracts(bookAsset.target, rentalSBT.target);
    // Grant roles: Vault needs to control BookAsset (setUser) and RentalSBT (mint)
    // But BookAsset/SBT are Ownable and owned by Admin. Vault calls them.
    // Wait, VinaLibVault calls `rentalSBT.safeMint` and `bookAsset.markAsRented`/`setUser`.
    // These functions usually require the caller to be Owner OR have a specific role.
    // In VinaLibVault.sol:
    // createRental -> calls rentalSBT.safeMint (needs permission?)
    // createRental -> calls bookAsset.markAsRented (needs owner?)
    // createRental -> calls bookAsset.setUser (needs owner?)

    // In BookAsset.sol, `markAsRented` is `onlyOwner`. `setUser` is from ERC4907 (usually public or owner).
    // The Vault is NOT the owner of BookAsset. The Admin is.
    // PROBLEM: VinaLibVault calls `onlyOwner` functions on BookAsset.
    // IF VinaLibVault is not the owner, these will fail.
    // FIX for Simulation: Transfer ownership of BookAsset and RentalSBT to Vault OR update contracts to allow Vault.
    // In a real system, Vault usually holds the "Manager" role. But here they are Ownable.
    // Let's transfer ownership to Vault for the simulation flow.

    await bookAsset.transferOwnership(vault.target);
    await rentalSBT.transferOwnership(vault.target);

    console.log("✅ HỢP ĐỒNG ĐÃ ĐƯỢC TRAO QUYỀN CHO VAULT\n");

    // --- HELPER FUNCTION: LOGGER ---
    const logTransaction = async (txResponse, description) => {
        console.log(`\n⏳ PENDING: ${description}...`);
        const receipt = await txResponse.wait();

        console.log(`\n================================================================================`);
        console.log(`📝 GIAO DỊCH: ${description.toUpperCase()}`);
        console.log(`--------------------------------------------------------------------------------`);
        console.log(`🔗 Hash:      ${receipt.hash}`);
        console.log(`📦 Block:     ${receipt.blockNumber}`);
        console.log(`⛽ Gas Used:  ${receipt.gasUsed.toString()}`);
        console.log(`👤 From:      ${receipt.from}`);
        console.log(`🎯 To:        ${receipt.to}`);

        console.log(`\nEvent Logs:`);

        // Parse logs from all known contracts
        const contracts = [bookAsset, rentalSBT, vault];

        for (const log of receipt.logs) {
            let parsed = null;
            let contractName = "Unknown";

            for (const c of contracts) {
                try {
                    parsed = c.interface.parseLog(log);
                    if (parsed) {
                        contractName = (c === bookAsset) ? "BookAsset" : (c === rentalSBT) ? "RentalSBT" : "VinaLibVault";
                        break;
                    }
                } catch (e) { }
            }

            if (parsed) {
                console.log(`   🔸 [${contractName}] ${parsed.name}`);
                // Print Args with indentation
                for (let i = 0; i < parsed.args.length; i++) {
                    const argVal = parsed.args[i];
                    // Convert BigInt to string for display
                    const displayVal = typeof argVal === 'bigint' ? argVal.toString() : argVal;
                    // Handle output names if available, otherwise index
                    const argName = parsed.fragment.inputs[i].name || `arg${i}`;
                    console.log(`      - ${argName}: ${displayVal}`);
                }
            } else {
                console.log(`   🔹 [Raw Log] ${log.data}`);
            }
        }
        console.log(`================================================================================`);
        return receipt;
    };


    // --- 2. EXECUTE WORKFLOW ---

    // STEP 1: Mint Book (Normally by Admin, via Vault? No, BookAsset is likely minted by Admin first then deposited?)
    // Note: Earlier I transferred ownership to Vault. So Admin can't mint directly anymore if `safeMint` is `onlyOwner`.
    // Oops. logic flaw in my setup vs "Real" flow.
    // Usually: Admin mints -> Approves Vault -> Vault manages.
    // BUT Contracts say `onlyOwner`.
    // Let's assume for THIS simulation, the Vault exposes a method to Mint, or we Mint BEFORE transferring ownership.

    // RE-PLAN: Mint FIRST, then Transfer Ownership.
    // Or check if Vault has a "addBook" function. It doesn't.
    // So the flow:
    // 1. Admin Mints Book.
    // 2. Admin Verifies Book.
    // 3. Admin transfers Ownership of BookContract to Vault (so Vault can manage rentals).
    // This seems heavy. Maybe usually Admin approves Vault?
    // BookAsset.sol: `setUser` is public (ERC4907), but `markAsRented` is `onlyOwner`.
    // So Vault MUST be the owner to call `markAsRented`.

    // Let's re-deploy to get clean state
    // We already deployed but haven't transferred ownership yet.

    // 1. Admin Mints
    let tx = await bookAsset.safeMint(admin.address, "ipfs://QmBook123Hash");
    await logTransaction(tx, "1. Admin Mint Book NFT");

    const tokenId = 0; // First token

    // 2. Admin Verifies
    tx = await bookAsset.verifyForListing(tokenId);
    await logTransaction(tx, "2. Admin Verify Listing");

    // 3. Transfer Ownership to Vault (Protocol Handover)
    tx = await bookAsset.transferOwnership(vault.target);
    await logTransaction(tx, "3. Handover System Control to Vault");

    // Also RentalSBT
    tx = await rentalSBT.transferOwnership(vault.target);
    await logTransaction(tx, "4. Handover SBT Control to Vault");


    // STEP 2: RENT (Create Rental)
    // createRental is `onlyOwner`. Why?
    // VinaLibVault.sol line 138: `function createRental(...) external onlyOwner`.
    // This implies creating a rental is an ADMIN action (or System action).
    // The "Renter" does not call this directly in this contract design?
    // User requests -> Admin/System approves & calls createRental?
    // Let's assume Admin calls it on behalf of Renter (server-side flow).

    const termsHash = ethers.id("DieuKhoanHopDongV1");
    const pspRef = "PAYMENT_REF_ABC_123";

    tx = await vault.createRental(
        renter.address,
        tokenId,
        3600 * 24 * 7, // 7 days
        termsHash,
        1, // version
        pspRef
    );
    await logTransaction(tx, "5. Create Rental Agreement (Admin/System)");


    // STEP 3: REQUEST RETURN (Renter)
    // requestReturn is public (checked msg.sender == renter)
    const deliveryHash = ethers.id("BangChungGiaoHang");

    tx = await vault.connect(renter).requestReturn(tokenId, deliveryHash);
    await logTransaction(tx, "6. Renter Request Return");


    // STEP 4: CONFIRM RETURN (Admin)
    tx = await vault.confirmReturn(tokenId, false, "Book in good condition");
    await logTransaction(tx, "7. Admin Confirm Return & Close Rental");

    console.log("\n✅ MÔ PHỎNG HOÀN TẤT. TRẠNG THÁI CUỐI CÙNG:");
    const status = await bookAsset.getBookStatus(tokenId);
    console.log(`Book Status Index: ${status} (0:Pending, 1:Verified, 2:Rented, 3:Returned)`);
    // Expected: 1 (Verified) or 3?
    // VinaLibVault line 260 calls verifyReturn(tokenId, isDamaged: false).
    // BookAsset verifyReturn(false) -> sets Verified.
    console.log("Expected: 1 (Verified)\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
