Dưới đây là Guideline Xây Dựng Chương Trình Chi Tiết cho dự án VinaLib-Vault (Phiên bản Localhost Zero-Cost). Tài liệu này được chuyển đổi từ báo cáo nghiên cứu thành các bước thực thi kỹ thuật (Actionable Steps) dành cho lập trình viên.

# GUIDELINE KỸ THUẬT: TRIỂN KHAI VINALIB-VAULT TRÊN LOCALHOST (MÔ HÌNH TRUST-SIMULATED)

Mục tiêu: Xây dựng môi trường phát triển toàn diện trên máy cá nhân, giả lập hoàn toàn các dịch vụ bên thứ 3 (Tuya, Chainlink, FPT, Casso) để phát triển và kiểm thử mà không tốn chi phí.

## GIAI ĐOẠN 0: KIẾN TRÚC & CHUẨN BỊ MÔI TRƯỜNG

### 0.1. Nguyên Lý Cốt Lõi

Áp dụng Dependency Injection (DI) và Strategy Pattern. Backend sẽ không gọi trực tiếp API bên thứ 3 mà gọi qua một Interface chung.

Môi trường Production: Inject RealServiceAdapter (gọi API thật).

Môi trường Local: Inject MockServiceAdapter (gọi Local Mock Server).

### 0.2. Cấu Trúc Thư Mục Đề Xuất

Bash

/vinalib-vault  ├── /contracts       # Smart Contracts (Hardhat)  ├── /backend         # Node.js/NestJS Server  │    ├── /src  │    │    ├── /modules  │    │    │    ├── /iot (Tuya logic)  │    │    │    ├── /legal (FPT logic)  │    │    │    └── /payment (Casso logic)  │    └── /adapters   # Nơi chứa Real/Mock Adapters  ├── /mock-server     # Express Server giả lập các bên thứ 3 (QUAN TRỌNG)  └── /frontend        # React/Next.js

## GIAI ĐOẠN 1: GIẢ LẬP BLOCKCHAIN & ORACLE (LỚP 3 & 4)

Công cụ: Hardhat, @chainlink/local.

### Bước 1.1: Cài đặt Chainlink Local Simulator

Trong thư mục /contracts:

Bash

npm install @chainlink/local --save-dev

### Bước 1.2: Viết Script Deploy Local

Thay vì deploy Router thật, deploy FunctionsRouterMock trên mạng Hardhat.

File: deploy/01_deploy_mocks.js

JavaScript

const { ethers } = require("hardhat");async function main() {  // 1. Deploy Functions Router Mock  const RouterMock = await ethers.getContractFactory("FunctionsRouterMock");  const router = await RouterMock.deploy();  await router.waitForDeployment();  console.log("Local Functions Router deployed at:", router.target);  // 2. Deploy Smart Contract chính của dự án, trỏ vào Router Mock  const VinaLib = await ethers.getContractFactory("VinaLibVault");  const vinalib = await VinaLib.deploy(router.target);   console.log("VinaLibVault deployed at:", vinalib.target);}

### Bước 1.3: Giả Lập Chainlink Automation (The "Heartbeat")

Tạo một script chạy song song để đóng vai trò là "Keeper Node".

File: scripts/mock-keeper.js

JavaScript

// Chạy loop mỗi 30 giâysetInterval(async () => {    const checkData = await vinalib.checkUpkeep("0x");    if (checkData.upkeepNeeded) {        console.log("Detected upkeep needed. Performing...");        await vinalib.performUpkeep(checkData.performData);        console.log("Upkeep performed!");    }}, 30000);

## GIAI ĐOẠN 2: XÂY DỰNG MOCK SERVER (LỚP 1, 2, 5)

Tạo một ứng dụng Express.js nhẹ tại thư mục /mock-server. Server này sẽ đóng vai cả Tuya Cloud, FPT eContract và Ngân hàng.

Port: Chạy trên port riêng (ví dụ: 4000) để tránh xung đột với Backend chính (3000).

### Bước 2.1: Giả Lập IoT & Tuya (Virtual Device Manager)

Tạo cơ sở dữ liệu giả (file db.json) để lưu trạng thái thiết bị.

Endpoint Mock: POST /tuya/v1.0/devices/:id/door-lock/password-free/door-operate

JavaScript

app.post('/tuya/v1.0/devices/:id/door-lock/*', (req, res) => {    // Giả lập tạo password mở cửa thành công    res.json({        success: true,        result: { ticket_id: "mock-ticket-" + Date.now(), expire_time: 3600 }    });});

Endpoint Mock: GET /tuya/v1.0/devices/:id/logs

JavaScript

app.get('/tuya/v1.0/devices/:id/logs', (req, res) => {    // Trả về dữ liệu log giả định để test tính năng Yield Farming    res.json({        success: true,        result: {            logs:        }    });});

### Bước 2.2: Giả Lập FPT.eContract (Deterministic Hashing)

Thay vì tạo PDF thật, trả về mã hash cố định dựa trên input để Smart Contract có thể verify.

Endpoint Mock: POST /fpt/electronic-sign/create

JavaScript

const crypto = require('crypto');app.post('/fpt/electronic-sign/create', (req, res) => {    const { metadata } = req.body;    // Tạo hash dựa trên dữ liệu đầu vào (Deterministic)    const mockHash = crypto.createHash('sha256')                          .update(JSON.stringify(metadata))                          .digest('hex');        res.json({        code: 0,        data: {            document_id: "doc-" + Date.now(),            signing_url: `http://localhost:4000/mock-ui/sign?hash=${mockHash}` // Trang ký giả        }    });});

### Bước 2.3: Giả Lập Webhook Ngân Hàng (Bank Simulator)

Tạo giao diện HTML đơn giản (/mock-ui/bank) có form nhập: "Số tiền", "Nội dung chuyển khoản".

Nút "Gửi Tiền":

Khi bấm, Javascript frontend sẽ gọi:

JavaScript

fetch('http://localhost:3000/api/webhook/casso', {    method: 'POST',    headers: { 'secure-token': 'YOUR_LOCAL_SECRET' },    body: JSON.stringify({        error: 0,        data:    })});

## GIAI ĐOẠN 3: TÍCH HỢP BACKEND (ADAPTER PATTERN)

Tại source code Backend chính (/backend), cấu hình việc chọn Adapter.

### Bước 3.1: Định nghĩa Interface

TypeScript

// interfaces/ILegalService.tsexport interface ILegalService {    createContract(data: any): Promise<string>; // Trả về Hash}

### Bước 3.2: Viết Mock Adapter

TypeScript

// adapters/MockLegalAdapter.tsexport class MockLegalAdapter implements ILegalService {    async createContract(data: any) {        // Gọi sang Mock Server (Port 4000) thay vì FPT thật        const response = await axios.post('http://localhost:4000/fpt/electronic-sign/create', data);        return response.data.data.signed_hash;    }}

### Bước 3.3: Config Switcher

Trong file khởi tạo app (ví dụ AppModule):

TypeScript

const legalServiceProvider = {    provide: 'ILegalService',    useClass: process.env.NODE_ENV === 'production'              ? FptRealAdapter               : MockLegalAdapter};

## GIAI ĐOẠN 4: CHAINLINK FUNCTIONS SCRIPT (LOCAL SIMULATION)

Để test đoạn code Javascript chạy trong Oracle (ví dụ: gọi API Tuya để kiểm tra logs), sử dụng simulateScript.

File: scripts/simulate-functions.js

JavaScript

const { simulateScript } = require("@chainlink/functions-toolkit");const fs = require("fs");async function run() {    const source = fs.readFileSync("./functions-source.js").toString();        // TRICK: Trỏ URL về Mock Server của máy local    const secrets = { tuyaApiUrl: "http://host.docker.internal:4000/tuya" };     const { responseBytesHexstring, errorString } = await simulateScript({        source: source,        secrets: secrets,        args: ["device-id-123"]    });    if (responseBytesHexstring) {        console.log("Oracle Response (Hex):", responseBytesHexstring);    }}run();

Lưu ý: Nếu chạy trong Docker, dùng host.docker.internal để gọi về máy chủ mock server.

## GIAI ĐOẠN 5: QUY TRÌNH KIỂM THỬ TOÀN TRÌNH (E2E WORKFLOW)

Để đảm bảo hệ thống hoạt động, hãy thực hiện kịch bản test sau trên máy cá nhân:

Khởi động:

Terminal 1: npx hardhat node (Blockchain)

Terminal 2: node mock-server/index.js (Các dịch vụ giả lập)

Terminal 3: npm run start:dev (Backend chính)

Terminal 4: npm run dev (Frontend)

Thực hiện User Journey:

B1 (Booking): Trên Frontend, user bấm "Thuê sách". Backend gọi Mock FPT -> Trả về URL ký giả -> User bấm "Ký" -> Backend nhận hash hợp đồng.

B2 (Payment): User mở Bank Simulator (Mock UI), nhập số tiền và nội dung -> Bấm "Gửi". Backend nhận Webhook -> Gọi Smart Contract mint Token.

B3 (Access): User bấm "Mở tủ" trên Frontend -> Backend gọi Mock Tuya -> Mock Server trả về success.

B4 (Return & Yield): Chạy script simulate-functions.js để giả lập việc Oracle quét log mở cửa từ Mock Tuya và cập nhật trạng thái lên Blockchain Local.
