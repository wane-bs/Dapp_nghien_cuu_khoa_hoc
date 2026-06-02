const hre = require("hardhat");

async function main() {
    const [deployer, customer, bookOwner] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy SuChin Token
    const SuChinToken = await hre.ethers.getContractFactory("SuChinToken");
    const suchin = await SuChinToken.deploy();
    await suchin.waitForDeployment();
    console.log("SuChin Token deployed to:", suchin.target);

    // 2. Deploy Book Asset
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const bookAsset = await BookAsset.deploy();
    await bookAsset.waitForDeployment();
    console.log("BookAsset NFT deployed to:", bookAsset.target);

    // 3. Deploy Rental SBT
    const RentalAgreementSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");
    const rentalSBT = await RentalAgreementSBT.deploy();
    await rentalSBT.waitForDeployment();
    console.log("RentalAgreement SBT deployed to:", rentalSBT.target);

    // 4. Deploy VinaLib Vault (Evidence Pack)
    const VinaLibVault = await hre.ethers.getContractFactory("VinaLibVault");
    // Pass dummy router address for local testing
    const vault = await VinaLibVault.deploy(deployer.address);
    await vault.waitForDeployment();
    console.log("VinaLibVault deployed to:", vault.target);

    // 5. Link Contracts
    await vault.setContracts(bookAsset.target, rentalSBT.target);
    console.log("VinaLibVault linked to BookAsset and RentalSBT");

    // 6. Set Rental Contract Permissions
    await bookAsset.setRentalContract(vault.target);
    await rentalSBT.setRentalContract(vault.target);
    console.log("Permissions granted to VinaLibVault");

    // --- NEW: Mint Initial Books for Testing ---
    console.log("Minting initial books...");

    // 1. Mint Dummy Book (ID 0) to align with Backend 1-based indexing
    try {
        const tx = await bookAsset.safeMint(deployer.address, "QmDummy0");
        await tx.wait();
        console.log(`Minted Dummy Book ID 0 to ${deployer.address}`);
    } catch (e) {
        console.error("Failed to mint dummy book", e);
    }

    // 2. Mint Real Books (IDs 1-5)
    // Import mock data directly to avoid module issues
    const initialBooks = [
        { id: 1, cid: "QmMockCID1" },
        { id: 2, cid: "QmMockCID2" },
        { id: 3, cid: "QmHash1" },
        { id: 4, cid: "QmHash2" },
        { id: 5, cid: "QmHash3" }
    ];

    for (const book of initialBooks) {
        // Mint to deployer (Admin) for now. In real app, Lender would mint.
        // But for "Rent" flow, Book Owner needs to give permission.
        // If we mint to Deployer, Deployer is Owner.
        // The Backend "Lender" is just a logical user. 
        // For simple testing, we'll assume bookOwner owns them.
        try {
            const tx = await bookAsset.connect(deployer).safeMint(bookOwner.address, book.cid);
            await tx.wait();
            console.log(`Minted Book ID ${book.id} (CID: ${book.cid}) to ${bookOwner.address}`);

            // Verify for listing so it can be rented
            // Note: Since we minted ID 0 first, this new book should have ID = book.id
            const txVerify = await bookAsset.verifyForListing(book.id);
            await txVerify.wait();
            console.log(`Verified Book ID ${book.id}`);

        } catch (e) {
            console.error(`Failed to mint/verify book ${book.id}`, e);
        }
    }

    // 4. Update Backend/Frontend Mocks & Config
    const fs = require("fs");
    const path = require("path");

    const contractsDirBackend = path.join(__dirname, "../../backend/src/Shared");
    const contractsDirFrontend = path.join(__dirname, "../../frontend/src/contracts"); // Optional if needed later

    if (!fs.existsSync(contractsDirBackend)) {
        fs.mkdirSync(contractsDirBackend, { recursive: true });
    }

    const addresses = {
        suchinToken: suchin.target,
        bookAsset: bookAsset.target,
        rentalSBT: rentalSBT.target,
        vinaLibVault: vault.target
    };

    // Save Addresses
    fs.writeFileSync(
        path.join(contractsDirBackend, "contracts-data.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log("Saved addresses to backend/src/Shared/contracts-data.json");

    // Save ABIs (Minimal needed for Phase 1)
    const artifactData = {
        BookAsset: hre.artifacts.readArtifactSync("BookAsset"),
        SuChinToken: hre.artifacts.readArtifactSync("SuChinToken"),
        RentalAgreementSBT: hre.artifacts.readArtifactSync("RentalAgreementSBT"),
        VinaLibVault: hre.artifacts.readArtifactSync("VinaLibVault")
    };

    fs.writeFileSync(
        path.join(contractsDirBackend, "abis.json"),
        JSON.stringify(artifactData, null, 2)
    );
    console.log("Saved ABIs to backend/src/Shared/abis.json");

    console.log("----------------------------------------------------");
    console.log("Deployment Complete. RESTART BACKEND to pick up new addresses!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
