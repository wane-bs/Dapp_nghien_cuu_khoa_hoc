const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

async function main() {
    console.log("🛠️  Populating Rental Data for Debugging...");

    // 1. Get Contract Address
    const configPath = path.join(__dirname, '../../backend/config/contracts.json');
    let contracts = {};
    if (fs.existsSync(configPath)) {
        contracts = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
        // Fallback
        contracts = {
            vinaLibVault: '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc',
            bookAsset: '0xc351628EB244ec633d5f21fBD6621e1a683B1181',
            rentalSBT: '0xFD471836031dc5108809D173A067e8486B9047A3'
        };
    }

    const [owner, renter] = await ethers.getSigners();
    console.log(`🔑 Owner: ${owner.address}`);
    console.log(`👤 Renter: ${renter.address}`);

    // 2. Attach Contracts
    const VinaLibVault = await hre.ethers.getContractFactory("VinaLibVault");
    const vault = VinaLibVault.attach(contracts.vinaLibVault);

    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const book = BookAsset.attach(contracts.bookAsset);

    const RentalSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");
    const sbt = RentalSBT.attach(contracts.rentalSBT);

    const bookId = 1;

    // 3. Ensure Book Minted
    try {
        const bookOwner = await book.ownerOf(bookId);
        console.log(`✅ Book #${bookId} exists. Owner: ${bookOwner}`);
    } catch (e) {
        console.log(`⚠️ Book #${bookId} does not exist. Minting...`);
        const tx = await book.safeMint(owner.address, "ipfs://Qmdmockcid123", { value: ethers.parseEther("0.1") }); // Mint logic depends on contract, assuming safeMint exists or similar
        // Actually BookAsset usually has safeMint defined by Owner
        // Let's assume standard minting for now or specific function
        // Reading BookAsset source might be safer but let's try standard safeMint or similar if visible
        // Wait, let's just try to proceed. If it fails, I'll need to check mint function.
        // BookAsset.sol usually: function safeMint(address to, string memory cid) public onlyOwner
        await tx.wait();
        console.log(`✅ Minted Book #${bookId}`);
    }

    // 4. Ensure Book Verified (Required for Rental)
    const isVerified = await book.isVerified(bookId);
    if (!isVerified) {
        console.log(`⚠️ Book #${bookId} not verified. Verifying...`);
        const tx = await book.verifyBook(bookId, true); // Assuming verifyBook(tokenId, status)
        await tx.wait();
        console.log(`✅ Book #${bookId} Verified`);
    }

    // 5. Create Rental
    console.log(`🚀 Creating Rental for Book #${bookId}...`);

    // Params
    const duration = 7 * 24 * 3600; // 7 days
    const termsHash = ethers.keccak256(ethers.toUtf8Bytes("Simple Rental Agreement v1"));
    const version = 1;
    const pspRef = "PSP-MOCK-TRANSACTION-999";

    try {
        const tx = await vault.createRental(
            renter.address,
            bookId,
            duration,
            termsHash,
            version,
            pspRef
        );
        console.log(`⏳ Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ Rental Created Successfully!`);
    } catch (e) {
        console.error(`❌ Failed to create rental: ${e.message}`);
        // Check if it's already rented
        const rental = await vault.activeRentals(bookId);
        if (rental.termsHash !== ethers.ZeroHash) {
            console.log("ℹ️ Book is already rented, that explains the failure.");
        }
    }

    // 6. Verify Result
    const newRental = await vault.activeRentals(bookId);
    console.log("\n📊 New Rental State:");
    console.log(`- Terms Hash: ${newRental.termsHash}`);
    console.log(`- Renter: ${newRental.renter}`);
    console.log(`- Status: ${newRental.status}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
