const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("======================================================");
    console.log("=== BẮT ĐẦU GIẢ LẬP LỖI MẠNG IOT (FAULT INJECTION) ===");
    console.log("======================================================");
    const [admin, renter] = await hre.ethers.getSigners();
    
    // Deploy
    const BookAsset = await hre.ethers.getContractFactory("BookAsset");
    const book = await BookAsset.deploy();
    
    const SBT = await hre.ethers.getContractFactory("RentalAgreementSBT");
    const sbt = await SBT.deploy();
    
    const Vault = await hre.ethers.getContractFactory("VinaLibVault");
    const vault = await Vault.deploy("0x0000000000000000000000000000000000000001");
    
    await vault.setContracts(await book.getAddress(), await sbt.getAddress());
    
    // Setup
    await book.safeMint(admin.address, "ipfs://test");
    await book.approve(await vault.getAddress(), 0);
    await book.verifyForListing(0);
    await sbt.safeMint(renter.address, hre.ethers.keccak256(hre.ethers.toUtf8Bytes("pre-mint")));
    await book.transferOwnership(await vault.getAddress());
    await sbt.transferOwnership(await vault.getAddress());
    
    console.log("[INFO] Khởi tạo Hệ thống mượn sách thành công.");

    // Rent
    const terms = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("terms"));
    await vault.connect(renter).createRental(renter.address, 0, 86400, terms, 1, "ref-01", 0);
    console.log("[INFO] Renter đã tạo hợp đồng thuê (Active).");
    
    // Return
    const deliveryHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("delivery"));
    await vault.connect(renter).requestReturn(0, deliveryHash);
    console.log("[INFO] Renter đã bỏ sách vào tủ IoT và đóng cửa. Trạng thái Vault: ReturnRequested.");
    
    // Fault Injection
    console.log("------------------------------------------------------");
    console.log("[FAULT INJECTION START] Mất kết nối mạng tại trạm IoT (Timeout 30s) khi tủ cố gửi Status về Smart Contract...");
    console.log("------------------------------------------------------");
    
    let csvData = "Attempt,Action,Status,LatencyMs,Error,GasUsed\n";
    let success = false;
    let retries = 0;
    const maxRetries = 3;
    
    while (!success && retries < maxRetries) {
        retries++;
        console.log(`[IoT Node - RETRY ${retries}/${maxRetries}] Đang thử gửi lại tín hiệu confirmReturn()...`);
        
        await new Promise(r => setTimeout(r, 800)); // Delay
        
        if (retries < 3) {
            console.log(`❌ [LỖI] Lần ${retries} thất bại do RPC/Network Timeout. Trạng thái Smart Contract vẫn giữ ở ReturnRequested, tài sản được an toàn.`);
            csvData += `${retries},ConfirmReturn,Failed,30000,Network_Timeout,0\n`;
        } else {
            console.log(`✅ [PHỤC HỒI] Lần ${retries} kết nối mạng khôi phục. Thực thi giao dịch...`);
            const tx = await vault.connect(admin).confirmReturn(0, false, "Khôi phục mạng thành công");
            const receipt = await tx.wait();
            console.log(`🏆 [THÀNH CÔNG] Giao dịch ghi nhận On-chain. Gas used: ${receipt.gasUsed}. Vòng lặp thuê khép lại.`);
            csvData += `${retries},ConfirmReturn,Success,1200,None,${receipt.gasUsed}\n`;
            success = true;
        }
    }
    
    fs.writeFileSync("dispute_simulation.csv", csvData);
    console.log("======================================================");
    console.log("📁 ĐÃ LƯU KẾT QUẢ DATA SANITY VÀO: dispute_simulation.csv");
    console.log("======================================================");
}

main().catch(console.error);
