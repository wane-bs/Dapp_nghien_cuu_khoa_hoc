const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blockchain Explorer Simulation", function () {
    let bookAsset, rentalSBT, vault, router;
    let admin, renter, other;

    before(async function () {
        [admin, renter, other] = await ethers.getSigners();

        // Deploy Mock Router
        const RouterMock = await ethers.getContractFactory("FunctionsRouterMock");
        router = await RouterMock.deploy();
        await router.waitForDeployment();

        // Deploy BookAsset
        const BookAsset = await ethers.getContractFactory("BookAsset");
        bookAsset = await BookAsset.deploy();
        await bookAsset.waitForDeployment();

        // Deploy RentalAgreementSBT
        const RentalSBT = await ethers.getContractFactory("RentalAgreementSBT");
        rentalSBT = await RentalSBT.deploy();
        await rentalSBT.waitForDeployment();

        // Deploy VinaLibVault
        const VinaLibVault = await ethers.getContractFactory("VinaLibVault");
        vault = await VinaLibVault.deploy(router.target);
        await vault.waitForDeployment();

        // Set Links
        await vault.setContracts(bookAsset.target, rentalSBT.target);
    });

    // Helper to log
    const logTransaction = async (txResponse, description) => {
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
                for (let i = 0; i < parsed.args.length; i++) {
                    const argVal = parsed.args[i];
                    const displayVal = typeof argVal === 'bigint' ? argVal.toString() : argVal;
                    const argName = parsed.fragment.inputs[i].name || `arg${i}`;
                    console.log(`      - ${argName}: ${displayVal}`);
                }
            }
        }
        console.log(`================================================================================`);
        return receipt;
    };

    it("Runs the Full Rental Lifecycle with Logs", async function () {
        // 1. Admin Mint
        const ipfs = require("../../IPFS/ipfs_simulator.js");
        const cid = ipfs.generateCIDv1(Buffer.from(JSON.stringify({ name: "Flow Explorer Book", author: "Admin" })));
        let tx = await bookAsset.safeMint(admin.address, "ipfs://" + cid);
        await logTransaction(tx, "1. Admin Mint Book NFT");
        const tokenId = 0;

        // 2. Verify
        tx = await bookAsset.verifyForListing(tokenId);
        await logTransaction(tx, "2. Admin Verify Listing");

        // 3. Set vault as rentalContract BEFORE transferring ownership
        await bookAsset.setRentalContract(vault.target);
        await rentalSBT.setRentalContract(vault.target);

        // 3b. Handover Ownable to Vault
        tx = await bookAsset.transferOwnership(vault.target);
        await logTransaction(tx, "3. Handover System Control to Vault");

        // 3.5 CF-1: Pre-mint SBT before createRental (SBT minted at contract signing)
        const termsHash = ethers.id("DieuKhoanHopDongV1");
        tx = await rentalSBT.safeMint(renter.address, termsHash);
        await logTransaction(tx, "4.5 Pre-mint Rental SBT (Contract Signing)");
        const sbtId = 0; // first mint

        tx = await rentalSBT.transferOwnership(vault.target);
        await logTransaction(tx, "4b. Handover SBT Control to Vault");

        // 4. Create Rental — CF-1: pass existingSbtId
        tx = await vault.connect(renter).createRental(renter.address, tokenId, 86400 * 7, termsHash, 1, "REF123", sbtId);
        await logTransaction(tx, "5. Create Rental Agreement (Renter)");

        // 5. Request Return
        tx = await vault.connect(renter).requestReturn(tokenId, ethers.id("Evidence"));
        await logTransaction(tx, "6. Renter Request Return");

        // 6. Confirm Return
        tx = await vault.confirmReturn(tokenId, false, "Good");
        await logTransaction(tx, "7. Admin Confirm Return");

        const status = await bookAsset.getBookStatus(tokenId);
        // Verified == 1
        expect(status).to.equal(1n);
    });
});
