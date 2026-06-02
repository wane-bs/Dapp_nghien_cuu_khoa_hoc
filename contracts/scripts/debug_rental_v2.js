const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 Debugging Rental Data on Localhost...");

    // 1. Get Contract Address
    // Path from contracts/scripts/debug_rental.js to backend/config/contracts.json
    // ../../backend/config/contracts.json
    const configPath = path.join(__dirname, '../../backend/config/contracts.json');
    let contracts = {};
    if (fs.existsSync(configPath)) {
        contracts = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log("📂 Loaded contracts from backend config:", contracts);
    } else {
        console.log("⚠️ Could not load backend config. Looking at: " + configPath);
        console.log("Using default addresses from code.");
        contracts = {
            vinaLibVault: '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc',
            bookAsset: '0xc351628EB244ec633d5f21fBD6621e1a683B1181'
        };
    }

    const vaultAddress = contracts.vinaLibVault;
    const bookAssetAddress = contracts.bookAsset;

    console.log(`\n🏢 VinaLibVault Address: ${vaultAddress}`);
    console.log(`📚 BookAsset Address: ${bookAssetAddress}`);

    // 2. Attach to Contracts
    const VinaLibVault = await hre.ethers.getContractFactory("VinaLibVault");
    const vault = VinaLibVault.attach(vaultAddress);

    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const book = BookAsset.attach(bookAssetAddress);

    // 3. Query Book Status (BookID 1)
    const bookId = 1;
    console.log(`\n--- Checking Book ID ${bookId} ---`);

    try {
        const owner = await book.ownerOf(bookId);
        console.log(`✅ Owner: ${owner}`);

        // Check raw activeRentals mapping
        console.log(`\n--- Checking activeRentals[${bookId}] ---`);
        const rental = await vault.activeRentals(bookId);
        // Print explicit values
        console.log(`- Terms Hash: ${rental.termsHash || rental[0]}`);
        console.log(`- Version: ${rental.version || rental[1]}`);
        console.log(`- PSP Ref: ${rental.pspRef || rental[2]}`);
        console.log(`- Renter: ${rental.renter || rental[5]}`);
        console.log(`- Status: ${rental.status || rental[6]}`);

        const termsHash = rental.termsHash || rental[0];

        if (termsHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.log("\n❌ Evidence Pack is EMPTY (Zero Hash).");
        } else {
            console.log("\n✅ Evidence Pack FOUND on-chain.");
        }

    } catch (error) {
        console.error("❌ Error querying:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
