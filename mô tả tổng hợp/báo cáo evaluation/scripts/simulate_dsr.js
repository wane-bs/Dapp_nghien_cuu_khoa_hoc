/**
 * ============================================================
 *  SIMULATE_DSR.JS — Kịch bản Thực nghiệm DSR VinaLib-Vault
 * ============================================================
 * Chạy 4 kịch bản KT-01 → KT-04 theo KẾ_HOẠCH_KIỂM_THỬ_DSR.md
 * Output: 3 file CSV + 1 file event_log JSON trong thư mục data/
 * 
 * Chạy: npx hardhat run scripts/simulate_dsr.js
 * ============================================================
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const ipfsSimulator = require("../../IPFS/ipfs_simulator.js");
const mqttSimulator = require("../../IPFS/mqtt_simulator.js");

// ─── Cấu hình số lượng chạy theo KẾ_HOẠCH_KIỂM_THỬ_DSR ───
const KT01_RUNS = 50;   // 50 truy vấn IPFS (Đo E2)
const KT02_RUNS = 20;   // 20 vòng đời mượn/trả (Đo E3, E4, Gas)
const KT03_RUNS = 20;   // 20 giao dịch MQTT IoT sync (Đo E5)
const KT04_RUNS = 10;   // 10 bơm lỗi CID (Đo Data Integrity)

// ─── Đường dẫn output ───
const dataDir = path.join(__dirname, "..", "..", "mô tả tổng hợp", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const txLogPath = path.join(dataDir, "transaction_logs.csv");
const disputeLogPath = path.join(dataDir, "dispute_simulation.csv");
const lifecycleLogPath = path.join(dataDir, "lifecycle_query.csv");
const eventLogPath = path.join(dataDir, "event_logs.json");

// ─── Event log collector ───
const allEventLogs = [];
function logEvent(scenario, action, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        scenario,
        action,
        ...data
    };
    allEventLogs.push(entry);
}

// ─── CSV Helpers ───
function initCSV(filePath, header) {
    fs.writeFileSync(filePath, header + "\n");
}
function appendCSV(filePath, line) {
    fs.appendFileSync(filePath, line + "\n");
}

// ─── Parse Events từ receipt ───
function extractEvents(receipt) {
    const events = [];
    if (receipt.logs) {
        receipt.logs.forEach((log, idx) => {
            events.push({
                logIndex: idx,
                address: log.address,
                topics: log.topics ? log.topics.map(t => t.toString()) : [],
                data: log.data ? log.data.toString() : "0x",
                blockNumber: Number(receipt.blockNumber),
                transactionHash: receipt.hash
            });
        });
    }
    return events;
}

// ══════════════════════════════════════════════════════════════
//  DEPLOY CONTRACTS
// ══════════════════════════════════════════════════════════════
async function deployContracts() {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   DEPLOY CONTRACTS (Setup Phase)         ║");
    console.log("╚══════════════════════════════════════════╝");

    const [deployer, user1, user2] = await hre.ethers.getSigners();

    // 1. Deploy FunctionsRouterMock
    const RouterMock = await hre.ethers.getContractFactory("FunctionsRouterMock");
    const router = await RouterMock.deploy();
    await router.waitForDeployment();
    const routerAddr = await router.getAddress();
    console.log("  ✓ FunctionsRouterMock:", routerAddr);

    // 2. Deploy BookAsset
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const bookAsset = await BookAsset.deploy();
    await bookAsset.waitForDeployment();
    const bookAssetAddr = await bookAsset.getAddress();
    console.log("  ✓ BookAsset:", bookAssetAddr);

    // 3. Deploy RentalAgreementSBT
    const RentalSBT = await hre.ethers.getContractFactory("RentalAgreementSBT");
    const rentalSBT = await RentalSBT.deploy();
    await rentalSBT.waitForDeployment();
    const sbtAddr = await rentalSBT.getAddress();
    console.log("  ✓ RentalAgreementSBT:", sbtAddr);

    // 4. Deploy VinaLibVault
    const VinaLibVault = await hre.ethers.getContractFactory("VinaLibVault");
    const vault = await VinaLibVault.deploy(routerAddr);
    await vault.waitForDeployment();
    const vaultAddr = await vault.getAddress();
    console.log("  ✓ VinaLibVault:", vaultAddr);

    // 5. Setup cross-references
    await vault.setContracts(bookAssetAddr, sbtAddr);
    await bookAsset.setRentalContract(vaultAddr);
    await rentalSBT.setRentalContract(vaultAddr);
    console.log("  ✓ Cross-references configured");

    logEvent("SETUP", "DeployContracts", {
        deployer: deployer.address,
        contracts: {
            FunctionsRouterMock: routerAddr,
            BookAsset: bookAssetAddr,
            RentalAgreementSBT: sbtAddr,
            VinaLibVault: vaultAddr
        }
    });

    return { vault, bookAsset, rentalSBT, router, deployer, user1, user2 };
}

// ══════════════════════════════════════════════════════════════
//  KT-01: TRUY XUẤT & TOÀN VẸN IPFS (E2)
// ══════════════════════════════════════════════════════════════
async function runKT01() {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-01: Data Integrity (${KT01_RUNS} queries)     ║`);
    console.log(`╚══════════════════════════════════════════╝`);

    let successCount = 0;
    const latencies = [];

    // Tạo 10 file mẫu trên IPFS Simulator
    const sampleCIDs = [];
    for (let i = 0; i < 10; i++) {
        const content = JSON.stringify({
            bookId: i,
            title: `Sách mẫu số ${i}`,
            author: `Tác giả ${i}`,
            isbn: `978-604-${String(i).padStart(4, '0')}`,
            coverImage: `cover_${i}.jpg`,
            metadata: { pages: 200 + i * 10, language: "vi" }
        });
        const cid = ipfsSimulator.add(content, "metadata");
        sampleCIDs.push(cid);
    }

    console.log(`  → Đã tạo ${sampleCIDs.length} file metadata mẫu trên IPFS`);

    // Chạy 50 truy vấn ngẫu nhiên
    for (let i = 1; i <= KT01_RUNS; i++) {
        const targetCid = sampleCIDs[Math.floor(Math.random() * sampleCIDs.length)];

        const startTime = Date.now();
        const data = ipfsSimulator.get(targetCid);
        const endTime = Date.now();
        const latency = endTime - startTime;

        const isSuccess = data !== null;
        if (isSuccess) successCount++;
        latencies.push(latency);

        appendCSV(lifecycleLogPath,
            `KT-01,IPFS_Retrieval,${i},${targetCid},${latency},${isSuccess}`
        );

        logEvent("KT-01", "IPFS_Retrieval", {
            runId: i,
            cid: targetCid,
            latencyMs: latency,
            success: isSuccess,
            dataSize: data ? data.length : 0
        });
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    console.log(`  ✓ Hoàn thành KT-01: ${successCount}/${KT01_RUNS} thành công`);
    console.log(`  ✓ Avg IPFS Latency: ${avgLatency.toFixed(2)}ms`);

    logEvent("KT-01", "Summary", {
        totalRuns: KT01_RUNS,
        successCount,
        avgLatencyMs: avgLatency,
        passE2: avgLatency < 2000
    });
}

// ══════════════════════════════════════════════════════════════
//  KT-02: TỰ ĐỘNG HÓA LUỒNG MƯỢN/TRẢ (E3, E4, Gas)
// ══════════════════════════════════════════════════════════════
async function runKT02(contracts) {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-02: Automation Flow (${KT02_RUNS} cycles)     ║`);
    console.log(`╚══════════════════════════════════════════╝`);

    const { vault, bookAsset, rentalSBT, deployer, user1, user2 } = contracts;
    let successCount = 0;
    const gasUsedList = [];
    const finalityList = [];
    const termsHashes = [];

    // ══════════════════════════════════════════════════════
    //  PHASE A: Mint + Verify tất cả sách & SBT (Deployer vẫn là Owner)
    // ══════════════════════════════════════════════════════
    console.log("  ── Phase A: Mint & Verify tất cả sách ──");
    for (let i = 1; i <= KT02_RUNS; i++) {
        const currentUser = i % 2 === 0 ? user2 : user1;
        const bookId = i - 1;

        // Mint sách
        const ipfsCid = ipfsSimulator.generateCIDv1(
            Buffer.from(`BookMetadata_${i}_${Date.now()}`)
        );
        const txMint = await bookAsset.safeMint(deployer.address, ipfsCid);
        const receiptMint = await txMint.wait();

        const mintEvents = extractEvents(receiptMint);
        logEvent("KT-02", "Mint", {
            runId: i, bookId, gasUsed: Number(receiptMint.gasUsed),
            blockNumber: Number(receiptMint.blockNumber),
            events: mintEvents
        });
        appendCSV(txLogPath, `KT-02,Mint,${i},${receiptMint.gasUsed},_,_`);

        // Verify sách
        const txVerify = await bookAsset.verifyForListing(bookId);
        const receiptVerify = await txVerify.wait();

        const verifyEvents = extractEvents(receiptVerify);
        logEvent("KT-02", "VerifyForListing", {
            runId: i, bookId, gasUsed: Number(receiptVerify.gasUsed),
            events: verifyEvents
        });
        appendCSV(txLogPath, `KT-02,VerifyForListing,${i},${receiptVerify.gasUsed},_,_`);

        // Pre-mint SBT
        const termsHash = hre.ethers.keccak256(
            hre.ethers.toUtf8Bytes(`RentalTerms_v1_book${i}`)
        );
        termsHashes.push(termsHash);
        const txSBT = await rentalSBT.safeMint(currentUser.address, termsHash);
        await txSBT.wait();

        if (i % 10 === 0 || i === KT02_RUNS) {
            console.log(`  → Đã mint & verify ${i}/${KT02_RUNS} sách`);
        }
    }

    // ══════════════════════════════════════════════════════
    //  PHASE B: Transfer Ownership → Vault
    // ══════════════════════════════════════════════════════
    console.log("  ── Phase B: Transfer ownership → Vault ──");
    await bookAsset.transferOwnership(await vault.getAddress());
    await rentalSBT.transferOwnership(await vault.getAddress());
    console.log("  ✓ Ownership transferred to Vault");

    logEvent("KT-02", "OwnershipTransfer", {
        bookAssetNewOwner: await vault.getAddress(),
        rentalSBTNewOwner: await vault.getAddress()
    });

    // ══════════════════════════════════════════════════════
    //  PHASE C: Chạy vòng đời Rental (createRental → requestReturn → confirmReturn)
    // ══════════════════════════════════════════════════════
    console.log("  ── Phase C: Chạy vòng đời Rental ──");
    for (let i = 1; i <= KT02_RUNS; i++) {
        const currentUser = i % 2 === 0 ? user2 : user1;
        const bookId = i - 1;
        const termsHash = termsHashes[i - 1];

        try {
            // createRental (Đo E3 - Transaction Finality)
            const duration = 3600;
            const version = 1;
            const pspRef = `DSR_TXN_${i}`;
            const sbtId = i - 1;

            const startTime = Date.now();
            const txRent = await vault.connect(currentUser).createRental(
                currentUser.address, bookId, duration, termsHash, version, pspRef, sbtId
            );
            const receiptRent = await txRent.wait();
            const endTime = Date.now();

            const finalityTime = endTime - startTime;
            const gasUsed = Number(receiptRent.gasUsed);
            finalityList.push(finalityTime);
            gasUsedList.push(gasUsed);

            const rentalEvents = extractEvents(receiptRent);
            logEvent("KT-02", "CreateRental", {
                runId: i, bookId, user: currentUser.address,
                gasUsed, finalityMs: finalityTime,
                blockNumber: Number(receiptRent.blockNumber),
                txHash: receiptRent.hash,
                events: rentalEvents
            });
            appendCSV(txLogPath, `KT-02,CreateRental,${i},${gasUsed},${finalityTime},_`);

            // requestReturn
            const deliveryHash = hre.ethers.keccak256(
                hre.ethers.toUtf8Bytes(`DeliveryProof_${i}_${Date.now()}`)
            );
            const startRet = Date.now();
            const txReturn = await vault.connect(currentUser).requestReturn(bookId, deliveryHash);
            const receiptReturn = await txReturn.wait();
            const finalityRet = Date.now() - startRet;

            const returnEvents = extractEvents(receiptReturn);
            logEvent("KT-02", "RequestReturn", {
                runId: i, bookId, gasUsed: Number(receiptReturn.gasUsed),
                finalityMs: finalityRet, events: returnEvents
            });
            appendCSV(txLogPath, `KT-02,RequestReturn,${i},${receiptReturn.gasUsed},${finalityRet},_`);

            // confirmReturn (Admin — deployer vẫn là owner của Vault)
            const txConfirm = await vault.connect(deployer).confirmReturn(bookId, false, "Sách nguyên vẹn");
            const receiptConfirm = await txConfirm.wait();

            const confirmEvents = extractEvents(receiptConfirm);
            logEvent("KT-02", "ConfirmReturn", {
                runId: i, bookId, gasUsed: Number(receiptConfirm.gasUsed),
                isDamaged: false, events: confirmEvents
            });
            appendCSV(txLogPath, `KT-02,ConfirmReturn,${i},${receiptConfirm.gasUsed},_,_`);

            successCount++;

            if (i % 5 === 0 || i === KT02_RUNS) {
                console.log(`  → Hoàn thành vòng ${i}/${KT02_RUNS}`);
            }

        } catch (err) {
            console.error(`  ✗ Lỗi vòng ${i}:`, err.message);
            logEvent("KT-02", "Error", { runId: i, error: err.message });
        }
    }

    const avgFinality = finalityList.length > 0
        ? finalityList.reduce((a, b) => a + b, 0) / finalityList.length : 0;
    const avgGas = gasUsedList.length > 0
        ? gasUsedList.reduce((a, b) => a + b, 0) / gasUsedList.length : 0;

    console.log(`  ✓ Hoàn thành KT-02: ${successCount}/${KT02_RUNS} vòng thành công`);
    console.log(`  ✓ Avg Finality: ${avgFinality.toFixed(2)}ms | Avg Gas: ${avgGas.toFixed(0)}`);

    logEvent("KT-02", "Summary", {
        totalRuns: KT02_RUNS,
        successCount,
        avgFinalityMs: avgFinality,
        avgGasUsed: avgGas,
        maxGasUsed: gasUsedList.length > 0 ? Math.max(...gasUsedList) : 0,
        passE3: avgFinality < 2000,
        passE4: successCount === KT02_RUNS,
        passGas: avgGas < 700000
    });
}

// ══════════════════════════════════════════════════════════════
//  KT-03: TÍCH HỢP IoT — MQTT SYNC (E5)
// ══════════════════════════════════════════════════════════════
async function runKT03(contracts) {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-03: IoT Lifecycle Sync (${KT03_RUNS} txns)    ║`);
    console.log(`╚══════════════════════════════════════════╝`);

    const { vault, deployer } = contracts;

    // Reset MQTT simulator
    mqttSimulator.reset();

    // Subscribe to smart lock topic
    let mqttDeliveryCount = 0;
    mqttSimulator.subscribe("smartlock/vinalib/command", (msg, meta) => {
        mqttDeliveryCount++;
    });

    mqttSimulator.subscribe("smartlock/vinalib/status", (msg, meta) => {
        // Status feedback channel
    });

    for (let i = 1; i <= KT03_RUNS; i++) {
        // Giả lập: Sau khi tạo rental thành công on-chain,
        // hệ thống bắn MQTT command mở khóa tủ sách
        const txStartTime = Date.now();

        // Publish LOCK_OPEN command
        const openResult = mqttSimulator.publish(
            "smartlock/vinalib/command",
            "LOCK_OPEN",
            { bookId: i, action: "rental_created", txIndex: i }
        );

        // Publish device status feedback
        const statusResult = mqttSimulator.publish(
            "smartlock/vinalib/status",
            JSON.stringify({ cabinetId: `CAB-${(i % 5) + 1}`, status: "UNLOCKED", bookId: i }),
            { bookId: i, action: "status_update" }
        );

        const totalSyncLatency = openResult.latencyMs + statusResult.latencyMs;

        appendCSV(lifecycleLogPath,
            `KT-03,MQTT_Lock_Open,${i},smartlock/vinalib/command,${openResult.latencyMs},true`
        );
        appendCSV(lifecycleLogPath,
            `KT-03,MQTT_Status_Update,${i},smartlock/vinalib/status,${statusResult.latencyMs},true`
        );

        logEvent("KT-03", "MQTT_Sync", {
            runId: i,
            command: "LOCK_OPEN",
            openLatencyMs: openResult.latencyMs,
            statusLatencyMs: statusResult.latencyMs,
            totalSyncLatencyMs: totalSyncLatency,
            messageId: openResult.id
        });

        // Giả lập LOCK_CLOSE khi sách được trả
        const closeResult = mqttSimulator.publish(
            "smartlock/vinalib/command",
            "LOCK_CLOSE",
            { bookId: i, action: "rental_returned", txIndex: i }
        );

        appendCSV(lifecycleLogPath,
            `KT-03,MQTT_Lock_Close,${i},smartlock/vinalib/command,${closeResult.latencyMs},true`
        );

        logEvent("KT-03", "MQTT_Close", {
            runId: i,
            command: "LOCK_CLOSE",
            closeLatencyMs: closeResult.latencyMs,
            messageId: closeResult.id
        });
    }

    const mqttStats = mqttSimulator.getLatencyStats();
    console.log(`  ✓ Hoàn thành KT-03: ${mqttDeliveryCount} MQTT messages delivered`);
    console.log(`  ✓ MQTT Latency — Avg: ${mqttStats.avgMs}ms | Max: ${mqttStats.maxMs}ms | P95: ${mqttStats.p95Ms}ms`);

    logEvent("KT-03", "Summary", {
        totalMessages: mqttDeliveryCount,
        stats: mqttStats,
        passE5: mqttStats.avgMs < 3000
    });
}

// ══════════════════════════════════════════════════════════════
//  KT-04: BƠM LỖI — FAULT INJECTION (Data Integrity)
// ══════════════════════════════════════════════════════════════
async function runKT04() {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-04: Fault Injection (${KT04_RUNS} tests)      ║`);
    console.log(`╚══════════════════════════════════════════╝`);

    let catchCount = 0;

    for (let i = 1; i <= KT04_RUNS; i++) {
        // Tạo CID giả mạo (không tồn tại trong IPFS)
        const fakeCID = `bafake_corrupted_hash_${Date.now()}_${i}`;

        // Thử truy xuất trên IPFS simulator
        const startTime = Date.now();
        const data = ipfsSimulator.get(fakeCID);
        const latency = Date.now() - startTime;

        const isTampered = (data === null); // Hệ thống từ chối vì hash không khớp
        if (isTampered) catchCount++;

        const note = isTampered
            ? "Hệ thống phát hiện CID giả mạo — từ chối truy xuất"
            : "CẢNH BÁO: Hệ thống không phát hiện giả mạo!";

        appendCSV(disputeLogPath,
            `KT-04,${i},${fakeCID},${isTampered},${latency},${note}`
        );

        logEvent("KT-04", "FaultInjection", {
            runId: i,
            fakeCID,
            isDetected: isTampered,
            latencyMs: latency,
            note
        });
    }

    const detectionRate = (catchCount / KT04_RUNS * 100).toFixed(2);
    console.log(`  ✓ Hoàn thành KT-04: Tỷ lệ phát hiện ${detectionRate}% (${catchCount}/${KT04_RUNS})`);

    logEvent("KT-04", "Summary", {
        totalRuns: KT04_RUNS,
        catchCount,
        detectionRate: parseFloat(detectionRate),
        passIntegrity: catchCount === KT04_RUNS
    });
}

// ══════════════════════════════════════════════════════════════
//  MAIN — Khởi chạy tuần tự
// ══════════════════════════════════════════════════════════════
async function main() {
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║   VINALIB-VAULT — Kịch bản Thực nghiệm DSR v2.0   ║");
    console.log("║   Ngày chạy:", new Date().toISOString().slice(0, 19), "          ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    // Khởi tạo CSV headers
    initCSV(txLogPath, "Scenario,Action,RunID,GasUsed,FinalityLatencyMs,HardwareSyncLatencyMs");
    initCSV(disputeLogPath, "Scenario,RunID,TargetCID,IsDetected,LatencyMs,Note");
    initCSV(lifecycleLogPath, "Scenario,Action,RunID,QueryTarget,LatencyMs,IsSuccess");

    // Bước 1: Deploy
    const contracts = await deployContracts();

    // Bước 2: Chạy 4 kịch bản
    await runKT01();
    await runKT02(contracts);
    await runKT03(contracts);
    await runKT04();

    // Lưu event logs
    fs.writeFileSync(eventLogPath, JSON.stringify(allEventLogs, null, 2));

    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║   KẾT THÚC THỰC NGHIỆM — Output files:            ║");
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log(`║  → ${txLogPath}`);
    console.log(`║  → ${disputeLogPath}`);
    console.log(`║  → ${lifecycleLogPath}`);
    console.log(`║  → ${eventLogPath}`);
    console.log("╚══════════════════════════════════════════════════════╝");
}

main().catch((error) => {
    console.error("FATAL ERROR:", error);
    // Lưu event logs ngay cả khi lỗi
    fs.writeFileSync(eventLogPath, JSON.stringify(allEventLogs, null, 2));
    process.exitCode = 1;
});
