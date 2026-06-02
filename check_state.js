const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACTS_DATA_PATH = path.join(__dirname, 'backend/src/Shared/contracts-data.json');
const ABIS_PATH = path.join(__dirname, 'backend/src/Shared/abis.json');

async function main() {
    if (!fs.existsSync(CONTRACTS_DATA_PATH)) {
        console.log("No contracts-data.json found.");
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(CONTRACTS_DATA_PATH));
    const abis = JSON.parse(fs.readFileSync(ABIS_PATH));

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    console.log("Checking VinaLibVault at:", addresses.vinaLibVault);
    const code = await provider.getCode(addresses.vinaLibVault);
    if (code === '0x') {
        console.error("CRITICAL: No code at VinaLibVault address! Contracts are NOT deployed on this node.");
        return;
    }
    console.log("VinaLibVault code exists.");

    const bookAsset = new ethers.Contract(addresses.bookAsset, abis.BookAsset.abi, provider);

    try {
        const owner = await bookAsset.ownerOf(1);
        console.log("Book #1 Owner:", owner);

        const isVerified = await bookAsset.isVerified(1);
        console.log("Book #1 Verified:", isVerified);

        const status = await bookAsset.getBookStatus(1);
        console.log("Book #1 Status:", status.toString()); // 0=Pending, 1=Verified, 2=Rented

    } catch (e) {
        console.error("Error checking Book #1:", e.message);
    }
}

main();
