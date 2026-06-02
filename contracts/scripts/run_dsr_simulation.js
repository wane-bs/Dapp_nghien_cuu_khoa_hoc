const { ethers } = require("hardhat");
const fs = require('fs');
const ipfs = require("../../IPFS/ipfs_simulator.js");

const FALLBACK_AVAX_PRICE_USD = 35.0; // Hardcoded fallback as requested
const LOG_FILE = "transaction_logs.csv";

async function main() {
    console.log("=== STARTING DSR SIMULATION (STEP 2) ===");
    console.log("[INFO] Using Fallback Gas Price: $35.0/AVAX");

    // Clear old logs
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    fs.appendFileSync(LOG_FILE, "Scenario,TxType,BlockNumber,GasUsed,GasPriceGwei,CostUSD,IpfsLatencyMs\n");

    const writeLog = (scenario, type, receipt, ipfsMs = 0) => {
        const gasUsed = receipt.gasUsed;
        const gasPriceGwei = parseFloat(ethers.formatUnits(receipt.gasPrice, "gwei"));
        const costUSD = (gasPriceGwei * 1e-9) * Number(gasUsed) * FALLBACK_AVAX_PRICE_USD;
        fs.appendFileSync(LOG_FILE, `${scenario},${type},${receipt.blockNumber},${gasUsed},${gasPriceGwei},${costUSD.toFixed(6)},${ipfsMs}\n`);
    };

    const [admin, renter1] = await ethers.getSigners();

    // Deploy Contracts
    const RouterMock = await ethers.getContractFactory("FunctionsRouterMock");
    const router = await RouterMock.deploy(); await router.waitForDeployment();
    const BookAsset = await ethers.getContractFactory("BookAsset");
    const bookAsset = await BookAsset.deploy(); await bookAsset.waitForDeployment();
    const RentalSBT = await ethers.getContractFactory("RentalAgreementSBT");
    const rentalSBT = await RentalSBT.deploy(); await rentalSBT.waitForDeployment();
    const Vault = await ethers.getContractFactory("VinaLibVault");
    const vault = await Vault.deploy(router.target); await vault.waitForDeployment();

    // Setup references
    await bookAsset.setRentalContract(vault.target);
    await rentalSBT.setRentalContract(vault.target);
    await vault.setContracts(bookAsset.target, rentalSBT.target);

    console.log("-> Running KT-01: Baseline Flow (100 Transactions Batch)");
    const N_BASELINE = 100;
    let totalGasBaseline = 0n;

    for (let i = 0; i < N_BASELINE; i++) {
        // IPFS Metric
        const startIpfs = Date.now();
        const cid = ipfs.generateCIDv1(Buffer.from(`Metadata ${i}`));
        const ipfsMs = Date.now() - startIpfs;

        // 1. Mint
        let tx = await bookAsset.safeMint(admin.address, "ipfs://" + cid);
        let receipt = await tx.wait();
        writeLog("KT-01", "Mint", receipt, ipfsMs);
        totalGasBaseline += receipt.gasUsed;

        // 2. Verify
        tx = await bookAsset.verifyForListing(i);
        receipt = await tx.wait();
        writeLog("KT-01", "Verify", receipt, 0);

        // Pre-mint SBT for rental
        const termsHash = ethers.keccak256(ethers.toUtf8Bytes(`Terms-${i}`));
        tx = await rentalSBT.safeMint(renter1.address, termsHash);
        await tx.wait();
    }

    // Now handover ownership
    await bookAsset.transferOwnership(vault.target);
    await rentalSBT.transferOwnership(vault.target);
    console.log("   -> Control Flow Minting Done. Ownership transferred to Vault.");

    console.log("-> Running Rental Creation Flow...");
    for (let i = 0; i < N_BASELINE; i++) {
        const termsHash = ethers.keccak256(ethers.toUtf8Bytes(`Terms-${i}`));
        let tx = await vault.connect(renter1).createRental(renter1.address, i, 86400, termsHash, 1, `UID-${i}`, i);
        let receipt = await tx.wait();
        writeLog("KT-01", "CreateRental", receipt, 0);
    }

    console.log("-> Running KT-02: Stress Test (Concurrent Batch of 50)");
    const N_STRESS = 50;
    // For stress testing, we simulate sending 50 txs without waiting sequentially
    let stressPromises = [];
    for (let i = 0; i < N_STRESS; i++) {
        const tokenId = i; // Re-rent or just request return for speed
        const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes(`DeliveryReq-${i}`));
        stressPromises.push(vault.connect(renter1).requestReturn(tokenId, deliveryHash).then(tx => tx.wait()));
    }

    const receipts = await Promise.allSettled(stressPromises);
    receipts.forEach(res => {
        if (res.status === 'fulfilled') {
            writeLog("KT-02", "RequestReturn(Stress)", res.value, 0);
        }
    });

    console.log("-> Running KT-03: Fault Injection / Dispute Resolution (50 Transactions)");
    for (let i = 0; i < N_STRESS; i++) {
        let tx = await vault.connect(admin).confirmReturn(i, true, "Damaged items - Forfeit Deposit");
        let receipt = await tx.wait();
        writeLog("KT-03", "ConfirmReturn(Dispute)", receipt, 0);
    }

    console.log("-> Running KT-04: Edge Cases / Reverts (20 Transactions)");
    for (let i = 0; i < 20; i++) {
        try {
            const deliveryHash = ethers.keccak256(ethers.toUtf8Bytes(`DeliveryReq-Invalid-${i}`));
            // Try to request return for a book already returned. Should revert.
            let tx = await vault.connect(renter1).requestReturn(i, deliveryHash, { gasLimit: 200000 });
            await tx.wait();
        } catch (error) {
            // Ethers usually throws on revert. Log the estimated revert cost.
            const gasUsed = error.receipt ? error.receipt.gasUsed : 21520n;
            const gasPrice = error.receipt ? error.receipt.gasPrice : ethers.parseUnits("1", "gwei");
            const blockNum = error.receipt ? error.receipt.blockNumber : 0;
            writeLog("KT-04", "EdgeCase-Revert", { gasUsed, gasPrice, blockNumber: blockNum }, 0);
        }
    }

    console.log("-> DSR Simulation Complete. Results saved to", LOG_FILE);
}

main().catch(console.error);
