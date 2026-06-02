/**
 * ============================================================
 *  SIMULATE_DSR_INTERACTIVE.JS — Kịch bản Thực nghiệm DSR (Có Tạm Dừng)
 * ============================================================
 * Chạy 4 kịch bản KT-01 → KT-04 theo KẾ_HOẠCH_KIỂM_THỬ_DSR.md
 * Có thêm chức năng Tạm dừng chờ bạn bấm ENTER để chụp ảnh màn hình Terminal!
 * 
 * Chạy: npx hardhat run scripts/simulate_dsr_interactive.js --network localhost
 * ============================================================
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Require các simulator
const ipfsSimulator = require("../../IPFS/ipfs_simulator.js");
const mqttSimulator = require("../../IPFS/mqtt_simulator.js");

// ─── Hàm chờ bấm ENTER để ngắt nhịp chụp màn hình ───
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// ─── Cấu hình số lượng chạy ───
// Giảm quy mô xuống để đỡ trôi màn hình, tiện việc chụp ảnh hơn
const KT01_RUNS = 20;   // Truy vấn IPFS
const KT02_RUNS = 5;    // Vòng đời mượn trả (giảm từ 20 xuống 5 để chụp log ngắn gọn)
const KT03_RUNS = 5;    // MQTT
const KT04_RUNS = 10;   // Bơm lỗi CID

// ─── Đường dẫn output ───
const dataDir = path.join(__dirname, "..", "..", "mô tả tổng hợp", "báo cáo evaluation", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const txLogPath = path.join(dataDir, "transaction_logs.csv");
const disputeLogPath = path.join(dataDir, "dispute_simulation.csv");
const lifecycleLogPath = path.join(dataDir, "lifecycle_query.csv");
const eventLogPath = path.join(dataDir, "event_logs.json");

const allEventLogs = [];
function logEvent(scenario, action, data) {
    allEventLogs.push({ timestamp: new Date().toISOString(), scenario, action, ...data });
}
function initCSV(filePath, header) { fs.writeFileSync(filePath, header + "\n"); }
function appendCSV(filePath, line) { fs.appendFileSync(filePath, line + "\n"); }

function extractEvents(receipt) {
    const events = [];
    if (receipt.logs) {
        receipt.logs.forEach((log, idx) => {
            events.push({
                logIndex: idx, address: log.address,
                topics: log.topics ? log.topics.map(t => t.toString()) : [],
                blockNumber: Number(receipt.blockNumber)
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
    const router = await (await hre.ethers.getContractFactory("FunctionsRouterMock")).deploy();
    await router.waitForDeployment();
    const bookAsset = await (await hre.ethers.getContractFactory("BookAsset")).deploy();
    await bookAsset.waitForDeployment();
    const rentalSBT = await (await hre.ethers.getContractFactory("RentalAgreementSBT")).deploy();
    await rentalSBT.waitForDeployment();
    const vault = await (await hre.ethers.getContractFactory("VinaLibVault")).deploy(await router.getAddress());
    await vault.waitForDeployment();

    await vault.setContracts(await bookAsset.getAddress(), await rentalSBT.getAddress());
    await bookAsset.setRentalContract(await vault.getAddress());
    await rentalSBT.setRentalContract(await vault.getAddress());
    console.log("  ✓ Contracts deployed & configured successfully!");

    return { vault, bookAsset, rentalSBT, deployer, user1, user2 };
}

// ══════════════════════════════════════════════════════════════
//  KT-01: TRUY XUẤT & TOÀN VẸN IPFS (E2)
// ══════════════════════════════════════════════════════════════
async function runKT01() {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-01: Data Integrity (${KT01_RUNS} queries)     ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    let successCount = 0; const latencies = [];
    const sampleCIDs = [];
    for (let i = 0; i < 5; i++) {
        sampleCIDs.push(ipfsSimulator.add(`{"bookId":${i}}`, "metadata"));
    }
    for (let i = 1; i <= KT01_RUNS; i++) {
        const targetCid = sampleCIDs[Math.floor(Math.random() * sampleCIDs.length)];
        const startTime = Date.now();
        const data = ipfsSimulator.get(targetCid);
        const latency = Date.now() - startTime;
        if (data !== null) successCount++;
        latencies.push(latency);
        appendCSV(lifecycleLogPath, `KT-01,IPFS,${i},${targetCid},${latency},${data !== null}`);
    }
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    console.log(`  ✓ Avg IPFS Latency: ${avgLatency.toFixed(2)}ms | Tỷ lệ thành công: ${successCount}/${KT01_RUNS}`);
}

// ══════════════════════════════════════════════════════════════
//  KT-02: TỰ ĐỘNG HÓA LUỒNG MƯỢN/TRẢ
// ══════════════════════════════════════════════════════════════
async function runKT02(contracts) {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-02: Automation Flow (${KT02_RUNS} cycles)      ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    const { vault, bookAsset, rentalSBT, deployer, user1 } = contracts;
    const finalityList = []; const gasUsedList = [];
    const termsHashes = [];

    await bookAsset.transferOwnership(await vault.getAddress());
    await rentalSBT.transferOwnership(await vault.getAddress());

    for (let i = 1; i <= KT02_RUNS; i++) {
        const bookId = 100 + i;
        const cid = ipfsSimulator.generateCIDv1(Buffer.from(`B_${i}`));
        await (await bookAsset.connect(deployer).safeMint(deployer.address, cid)).wait();

        const termsHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`T_${i}`));
        termsHashes.push(termsHash);
        await (await rentalSBT.connect(user1).safeMint(user1.address, termsHash)).wait();

        const pspRef = `REF_${i}`;
        const startTime = Date.now();
        // Renter user1 creates rental
        const txRent = await vault.connect(user1).createRental(user1.address, bookId, 3600, termsHash, 1, pspRef, i - 1);
        const receiptRent = await txRent.wait();
        const finalityTime = Date.now() - startTime;
        const gasUsed = Number(receiptRent.gasUsed);

        finalityList.push(finalityTime); gasUsedList.push(gasUsed);
        appendCSV(txLogPath, `KT-02,CreateRental,${i},${gasUsed},${finalityTime},_`);
        console.log(`  → Vòng ${i}: Gas = ${gasUsed}, Finality = ${finalityTime}ms`);
    }
    const avgGas = gasUsedList.reduce((a, b) => a + b, 0) / gasUsedList.length;
    console.log(`  ✓ KT-02 Hoàn thành! Avg Gas: ${avgGas.toFixed(0)}`);
}

// ══════════════════════════════════════════════════════════════
//  KT-03: MQTT SYNC (IOT)
// ══════════════════════════════════════════════════════════════
async function runKT03() {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-03: IoT Lifecycle Sync (${KT03_RUNS} txns)     ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    mqttSimulator.reset();
    let delivered = 0;
    mqttSimulator.subscribe("smartlock/vinalib/command", () => delivered++);
    for (let i = 1; i <= KT03_RUNS; i++) {
        mqttSimulator.publish("smartlock/vinalib/command", "LOCK_OPEN", { bookId: i });
        mqttSimulator.publish("smartlock/vinalib/command", "LOCK_CLOSE", { bookId: i });
    }
    const stats = mqttSimulator.getLatencyStats();
    console.log(`  ✓ Delivered: ${delivered} messages. Avg Latency: ${stats.avgMs}ms`);
}

// ══════════════════════════════════════════════════════════════
//  KT-04: FAULT INJECTION
// ══════════════════════════════════════════════════════════════
async function runKT04() {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   KT-04: Fault Injection (${KT04_RUNS} tests)      ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    let catchCount = 0;
    for (let i = 1; i <= KT04_RUNS; i++) {
        const fakeCID = `bafake_corrupted_hash_${Date.now()}_${i}`;
        const data = ipfsSimulator.get(fakeCID);
        if (data === null) catchCount++;
    }
    console.log(`  ✓ Tỷ lệ phát hiện giả mạo CID: ${(catchCount / KT04_RUNS * 100).toFixed(0)}%`);
}

// MAIN
async function main() {
    console.clear();
    console.log("=================================================");
    console.log("   SẼ CÓ ĐIỂM DỪNG ĐỂ BẠN CHỤP ẢNH MÀN HÌNH!     ");
    console.log("=================================================");

    initCSV(txLogPath, "Scenario,Action,RunID,GasUsed,FinalityLatencyMs,HardwareSyncLatencyMs");
    initCSV(disputeLogPath, "Scenario,RunID,TargetCID,IsDetected,LatencyMs,Note");
    initCSV(lifecycleLogPath, "Scenario,Action,RunID,QueryTarget,LatencyMs,IsSuccess");

    const contracts = await deployContracts();
    await prompt("\n[📸 CHỤP MÀN HÌNH #1] Hợp đồng khởi tạo thành công! Bấm ENTER để chạy KT-01: ");

    await runKT01();
    await prompt("\n[📸 CHỤP MÀN HÌNH #2] KT-01 xử lý IPFS xong! Bấm ENTER để chạy KT-02: ");

    await runKT02(contracts);
    await prompt("\n[📸 CHỤP MÀN HÌNH #3] KT-02 test logic Vault xong! Bấm ENTER để chạy KT-03: ");

    await runKT03();
    await prompt("\n[📸 CHỤP MÀN HÌNH #4] KT-03 test MQTT xong! Bấm ENTER để chạy KT-04: ");

    await runKT04();

    console.log("\nKỊCH BẢN ĐÃ CHẠY XONG 100%! Data logs lưu tại 'báo cáo evaluation/data/'.");
    rl.close();
}

main().catch(err => { console.error(err); process.exit(1); });
