
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Starting Diagnosis...");

    // 1. Load Addresses
    const contractsDataPath = path.join(__dirname, '../../backend/src/Shared/contracts-data.json');
    if (!fs.existsSync(contractsDataPath)) {
        console.error("contracts-data.json not found!");
        return;
    }
    const addresses = JSON.parse(fs.readFileSync(contractsDataPath));
    console.log("Loaded Addresses:", addresses);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Diagnosing with account:", deployer.address);

    // 2. Connect Contracts
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const RentalSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");
    const VinaLibVault = await hre.ethers.getContractFactory("VinaLibVault");

    const bookAsset = BookAsset.attach(addresses.bookAsset);
    const rentalSBT = RentalSBT.attach(addresses.rentalSBT);
    const vault = VinaLibVault.attach(addresses.vinaLibVault);

    // 3. Check Book ID 2 State
    const tokenId = 2;
    try {
        const owner = await bookAsset.ownerOf(tokenId);
        console.log(`[BookAsset #2] Owner: ${owner}`);

        const status = await bookAsset.getBookStatus(tokenId);
        console.log(`[BookAsset #2] Status: ${status} (0=Created, 1=Verified, 2=Rented)`);

        const isVerified = await bookAsset.isVerified(tokenId);
        console.log(`[BookAsset #2] isVerified: ${isVerified}`);

        // Check Rental Contract Permission
        const rentalContract = await bookAsset.rentalContract();
        console.log(`[BookAsset] rentalContract: ${rentalContract}`);
        console.log(`[VinaLibVault] Actual Address: ${addresses.vinaLibVault}`);
        console.log(`[Match?] ${rentalContract === addresses.vinaLibVault}`);

    } catch (e) {
        console.error(`[BookAsset #2] Error: ${e.message}`);
    }

    // 4. Check RentalSBT Permissions
    try {
        const rentalContractSBT = await rentalSBT.rentalContract();
        console.log(`[RentalSBT] rentalContract: ${rentalContractSBT}`);
        console.log(`[Match?] ${rentalContractSBT === addresses.vinaLibVault}`);
    } catch (e) {
        console.error(`[RentalSBT] Error: ${e.message}`);
    }

    // 5. Check Vault Setup
    try {
        const vaultBookAsset = await vault.bookAssetAddress();
        const vaultRentalSBT = await vault.rentalSBTAddress();
        console.log(`[Vault] Linked BookAsset: ${vaultBookAsset}`);
        console.log(`[Vault] Linked RentalSBT: ${vaultRentalSBT}`);
    } catch (e) {
        console.error(`[Vault] Error: ${e.message}`);
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
