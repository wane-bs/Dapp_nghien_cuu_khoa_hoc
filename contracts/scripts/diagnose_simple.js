
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Starting Diagnosis...");

    const contractsDataPath = path.join(__dirname, '../../backend/src/Shared/contracts-data.json');
    if (!fs.existsSync(contractsDataPath)) { console.log("No data"); return; }
    const addresses = JSON.parse(fs.readFileSync(contractsDataPath));

    // Connect Contracts
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const RentalSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");

    const bookAsset = BookAsset.attach(addresses.bookAsset);
    const rentalSBT = RentalSBT.attach(addresses.rentalSBT);

    const tokenId = 2;
    const owner = await bookAsset.ownerOf(tokenId);
    const status = await bookAsset.getBookStatus(tokenId);
    const isVerified = await bookAsset.isVerified(tokenId);
    const rentalContractBook = await bookAsset.rentalContract();

    let rentalContractSBT = "Unknown";
    try {
        rentalContractSBT = await rentalSBT.rentalContract();
    } catch (e) {
        console.log("Error reading SBT permission");
    }

    console.log("--- RESULTS ---");
    console.log(`ID:${tokenId}`);
    console.log(`Status:${status}`); // 1=Verified
    console.log(`Verified:${isVerified}`);
    console.log(`Vault:${addresses.vinaLibVault}`);
    console.log(`BookPerm:${rentalContractBook}`);
    console.log(`SBTPerm:${rentalContractSBT}`);
    console.log(`BookMatch:${rentalContractBook === addresses.vinaLibVault}`);
    console.log(`SBTMatch:${rentalContractSBT === addresses.vinaLibVault}`);
    console.log("--- END ---");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
