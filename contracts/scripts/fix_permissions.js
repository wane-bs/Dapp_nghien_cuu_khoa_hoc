
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Fixing Permissions...");
    const contractsDataPath = path.join(__dirname, '../../backend/src/Shared/contracts-data.json');
    const addresses = JSON.parse(fs.readFileSync(contractsDataPath));
    const vaultAddr = addresses.vinaLibVault;

    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const RentalSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");

    // Admin/Deployer
    const [deployer] = await hre.ethers.getSigners();

    const bookAsset = BookAsset.attach(addresses.bookAsset);
    const rentalSBT = RentalSBT.attach(addresses.rentalSBT);

    console.log(`Setting permissions for Vault: ${vaultAddr}`);

    // 1. Fix BookAsset
    const currentBookPerm = await bookAsset.rentalContract();
    if (currentBookPerm !== vaultAddr) {
        console.log("Updating BookAsset permission...");
        const tx1 = await bookAsset.setRentalContract(vaultAddr);
        await tx1.wait();
        console.log("BookAsset Updated");
    } else {
        console.log("BookAsset OK");
    }

    // 2. Fix RentalSBT
    let currentSBTPerm = "0x0000000000000000000000000000000000000000";
    try {
        currentSBTPerm = await rentalSBT.rentalContract();
    } catch (e) { console.log("Error reading SBT perm"); }

    if (currentSBTPerm !== vaultAddr) {
        console.log("Updating RentalSBT permission...");
        const tx2 = await rentalSBT.setRentalContract(vaultAddr);
        await tx2.wait();
        console.log("RentalSBT Updated");
    } else {
        console.log("RentalSBT OK");
    }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
