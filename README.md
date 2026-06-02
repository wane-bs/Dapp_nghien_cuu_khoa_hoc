# VinaLib-Vault DApp - Quản Lý & Xác Thực Sách Trên Blockchain

Chào mừng bạn đến với **VinaLib-Vault**, một ứng dụng phi tập trung (DApp) hỗ trợ quản lý tài sản số (sách), hợp đồng thuê sách phi tập trung dưới dạng SBT (Soulbound Token) và tích hợp các cơ chế bảo đảm an toàn dữ liệu, chống rò rỉ và tokenomics minh bạch.

Dự án này phục vụ nghiên cứu khoa học và phát triển các hệ thống DApp thế hệ mới tích hợp Layer 2.

---

## 🚀 Tính năng cốt lõi

- **Smart Contracts (Core)**: 
  - `BookAsset.sol`: Quản lý tài sản sách dưới dạng NFT/tài sản số.
  - `VinaLibVault.sol`: Hợp đồng thông minh lõi để quản lý kho sách và tương tác thuê/trả.
  - `RentalAgreementSBT.sol`: Quản lý hợp đồng thuê dưới dạng Soulbound Token (SBT) không thể chuyển nhượng.
- **Tích hợp IPFS**: Tự động sinh mã CIDv1 động thông qua IPFS Simulator, đồng bộ dữ liệu On-chain và Off-chain.
- **Cơ chế Tokenomics**: Quản lý phí thuê sách, hoàn trả cọc (Refunds), tính toán phí trễ hạn (Late Fee) tự động.
- **Bảo mật**: Tích hợp các cơ chế chống Reentrancy, Pausable Kill Switch và kiểm soát phân quyền nghiêm ngặt.

---

## 📁 Cấu trúc Dự án

```text
book_app_v3/
├── contracts/          # Mã nguồn Smart Contracts (Hardhat Project)
│   ├── contracts/      # Các file Solidity (.sol)
│   ├── test/           # Bộ unit test của Smart Contracts (38/38 Test Cases Pass)
│   └── hardhat.config.js
├── backend/            # API Server (Node.js/Express)
│   ├── src/            # Logic nghiệp vụ backend
│   ├── .env.example    # Mẫu cấu hình môi trường bảo mật
│   └── package.json
├── frontend/           # Giao diện người dùng Web3 (React/Vite/Next)
│   ├── src/            # Giao diện và các kết nối Web3
│   └── package.json
├── mock-server/        # Máy chủ giả lập phục vụ cho quy trình test độc lập
├── scripts/            # Các tập lệnh bổ trợ & kiểm thử luồng DSR
└── LICENSE             # Giấy phép Apache License 2.0
```

---

## 🛠️ Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js** v18+ hoặc cao hơn.
- **npm** hoặc **yarn**.
- **Git** đã được cài đặt và cấu hình.

### 2. Cài đặt Smart Contracts & Khởi chạy Local Node
Di chuyển vào thư mục `contracts` để cấu hình và chạy node Hardhat cục bộ:
```bash
cd contracts
npm install
npx hardhat node
```
Để biên dịch và triển khai Smart Contract lên mạng cục bộ:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Cấu hình & Khởi chạy Backend
Di chuyển vào thư mục `backend`:
```bash
cd ../backend
npm install
```
Tạo file cấu hình môi trường `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` vừa tạo và cập nhật các thông số bảo mật phù hợp (ví dụ: `ADMIN_PRIVATE_KEY` và `BLOCKCHAIN_RPC_URL`). **Lưu ý: Không bao giờ commit file `.env` lên Git.**

Khởi động server backend:
```bash
npm start
```

### 4. Cấu hình & Khởi chạy Frontend
Di chuyển vào thư mục `frontend`:
```bash
cd ../frontend
npm install
npm start
```
Ứng dụng sẽ được khởi chạy tại địa chỉ mặc định `http://localhost:3000`.

---

## 🔒 Quy chuẩn An toàn Thông tin (Khóa cứng dự án)
Dự án được cấu hình bằng hệ thống Git bảo mật nghiêm ngặt:
- Toàn bộ private keys, API keys và cấu hình cá nhân nằm trong `.env` **đã được bỏ qua hoàn toàn** qua `.gitignore` ở thư mục gốc.
- Các tệp tin log (`*.log`), tệp tin dự phòng (`*.bak`, `*.old`) và báo cáo trung gian không bị đẩy lên Github.
- Mẫu cấu hình an toàn được cung cấp công khai tại [backend/.env.example](file:///f:/book_app_v3/backend/.env.example).

---

## 📄 Giấy phép
Dự án được phát hành dưới giấy phép [Apache License 2.0](file:///f:/book_app_v3/LICENSE).
