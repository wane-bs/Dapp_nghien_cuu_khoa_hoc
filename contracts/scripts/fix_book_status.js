
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const contractsDataPath = path.join(__dirname, '../../backend/src/Shared/contracts-data.json');
    const addresses = JSON.parse(fs.readFileSync(contractsDataPath));
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const bookAsset = BookAsset.attach(addresses.bookAsset);

    // Use Deployer/Admin account
    const [deployer] = await hre.ethers.getSigners();

    const tokenId = 2;
    console.log(`Verifying Book ID ${tokenId}...`);

    const status = await bookAsset.getBookStatus(tokenId);
    console.log(`Current Status: ${status}`);

    if (status == 0) { // Created
        const tx = await bookAsset.verifyForListing(tokenId);
        await tx.wait();
        console.log("Book Verified!");
    } else {
        console.log("Book already verified or rented.");
    }

    const newStatus = await bookAsset.getBookStatus(tokenId);
    console.log(`New Status: ${newStatus}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
