const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const CONTRACTS_DATA_PATH = path.join(__dirname, '../../backend/src/Shared/contracts-data.json');

    if (!fs.existsSync(CONTRACTS_DATA_PATH)) {
        console.log("No contracts-data.json found at", CONTRACTS_DATA_PATH);
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(CONTRACTS_DATA_PATH));

    console.log("Checking VinaLibVault at:", addresses.vinaLibVault);
    const code = await hre.ethers.provider.getCode(addresses.vinaLibVault);

    if (code === '0x') {
        console.error("CRITICAL: No code at VinaLibVault address! Contracts are NOT deployed on this node.");
        return;
    }
    console.log("VinaLibVault code exists.");

    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const bookAsset = BookAsset.attach(addresses.bookAsset);

    try {
        // Book #1
        try {
            const owner = await bookAsset.ownerOf(1);
            console.log("Book #1 Owner:", owner);

            const isVerified = await bookAsset.isVerified(1);
            console.log("Book #1 Verified:", isVerified);

            const status = await bookAsset.getBookStatus(1);
            console.log("Book #1 Status:", status.toString()); // 0=Pending, 1=Verified, 2=Rented
        } catch (e) {
            console.log("Book #1 does not exist or error:", e.message);
        }

    } catch (e) {
        console.error("Error checking Book #1:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
