# VinaLib-Vault 📚

**Hệ thống Cho thuê Sách P2P với Hợp đồng Thông minh**

---

## 🎯 Giới thiệu

VinaLib-Vault là một **hệ thống Blockchain** cho thuê sách ngang hàng (P2P) với mục tiêu chính là **triển khai và hoàn thiện các Smart Contracts, IPFS Simulator và Mock Services** để mô phỏng hệ sinh thái phi tập trung hoàn chỉnh.

### 🎪 **Định Vị Dự Án (Project Positioning)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 MỤC TIÊU CHÍNH (CORE FOCUS)                │
│                                                                  │
│  1️⃣ SMART CONTRACTS (contracts/)                                │
│     └─ Triển khai đầy đủ logic blockchain theo định hướng       │
│        từ "kiến trúc/ban đầu"                                   │
│                                                                  │
│  2️⃣ IPFS SIMULATOR (IPFS/)                                      │
│     └─ Mô phỏng lưu trữ phi tập trung với CIDv1                 │
│                                                                  │
│  3️⃣ MOCK SERVICES (mock-server/)                                │
│     └─ Giả lập các dịch vụ bên thứ 3 (FPT, IoT, Bank)           │
│                                                                  │
│  4️⃣ PAYMENT SYSTEM (Phase 1.5)                                  │
│     └─ Revenue Management, Escrow, Transaction History          │
├─────────────────────────────────────────────────────────────────┤
│              🧪 GIAO DIỆN KIỂM THỬ (TESTING UI)                  │
│                                                                  │
│  • Frontend (frontend/) - True Web3 DApp (Direct to Blockchain) │
│  • Backend (backend/)   - Legacy (Ngủ đông / Không còn sử dụng)   │
│                                                                  │
│  ⚠️ Lưu ý: Trong Phase hiện tại, Frontend giao tiếp 100% bằng   │
│           ethers.js thay vì REST API.                           │
└─────────────────────────────────────────────────────────────────┘
```

### Tính năng Blockchain Core (Trọng tâm phát triển)
- ✅ **ERC-4907 Rentable NFT** - Tách biệt quyền sở hữu và quyền sử dụng
- ✅ **Soulbound Token (SBT)** - Chứng nhận hợp đồng không thể chuyển nhượng  
- ✅ **Evidence Ledger** - Lưu trữ bằng chứng pháp lý on-chain
- ✅ **Automation Cleanup** - Tích hợp Chainlink Automation dọn dẹp HĐ hết hạn
- ✅ **IPFS Integration** - Lưu trữ metadata và hình ảnh phi tập trung
- ✅ **Mock External Services** - Giả lập FPT eContract, Tuya IoT, Banking
- ✅ **Financial Core** - Escrow, Platform Fee, Payout Settlement

### Tính năng Giao diện Kiểm thử (Supporting layer)
- 🧪 **Testing UI (DApp)** - React frontend kết nối trực tiếp Smart Contracts qua MetaMask.
- 🧪 **Backend (Legacy)** - Express API đang được lưu trữ cho các tính năng Off-chain Oracle trong tương lai.
- 🧪 **User Flows Demo** - Mô phỏng kịch bản người dùng thực tế 100% On-chain.

---

## 📊 Development Status

Dự án tuân thủ **Chiến lược Lai (Hybrid Strategy)**:
- ✅ **Cấu trúc thư mục**: 100% hoàn chỉnh theo QUY_LUAT_TOI_CAO.md
- ⚡ **Code implementation**: Minimalist (Phase 1 focus)

### Phase 1: Blockchain Core (Completed)

**Must Have** (theo `QUY_LUAT_TOI_CAO.md` Section 0):
- [x] Folder structure đầy đủ theo Sections 1-3
- [x] Backend: Architecture ready
- [x] Frontend: Functional ready
- [x] Smart Contracts (100% implementation) - **✅ DONE**
  - [x] BookAsset.sol (ERC-4907 Rentable NFT)
  - [x] RentalAgreementSBT.sol (Soulbound Token)
  - [x] VinaLibVault.sol (Evidence Ledger)
  - [x] Unit tests coverage ≥ 80%
- [x] IPFS Simulator (Full CIDv1 support) - **✅ DONE**
- [x] Mock Services (FPT Legal, Tuya IoT, Bank) - **✅ DONE**
- [x] Payment System (Phase 1.5) - **✅ DONE**
- [x] Policy Engine (Phase 2 Auto-Accept) - **✅ DONE**

### Phase 2: User Experience (Completed)

- [x] **Visual Overhaul** - **✅ DONE**
    - [x] Mobile-First Responsive Grid
    - [x] Typography & Design System (Google Fonts)
    - [x] Micro-animations & Skeleton Loading
    - [x] Responsive MainLayout (Sidebar/Hamburger)
- [x] **Contract Generator (Legal Flow)** - **✅ DONE**
    - [x] Dynamic Contract Template Filling (Variables replacement)
    - [x] TermsHash Calculation (SHA-256)
    - [x] Preview & Accept/Reject Workflow
    - [x] TTL Storage for Contract Previews (7 days)
- [x] **Blockchain Explorer** - **✅ DONE**
    - [x] Block Explorer (Block list, block details)
    - [x] Transaction Explorer (Tx list, tx details)
    - [x] Address Explorer (Balance, tx count, contract detection)
    - [x] Event Logs Viewer (Decoded events from contracts)
    - [x] Real-time Updates (5-second polling)
    - [x] Direct ethers.js integration (no backend dependency)

### Phase 3: Commercialization (Ready)

**Triggers để chuyển sang Phase 3**:
- [x] External Security Audit (Smart Contracts & Infra) - **✅ DONE (RC1 Audit PASS, Zero Vulnerabilities)**
- [x] Đóng gói phiên bản V&V - **✅ DONE (Release RC1)**
- [ ] Mainnet Deployment Plan (Arbitrum / Polygon)
- [ ] Marketing & Go-to-market Strategy

**Tham khảo chi tiết**: [QUY_LUAT_TOI_CAO.md](file:///c:/book_app_v2/kiến%20trúc/cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md) Section 0

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                   🧪 TESTING INTERFACE LAYER                     │
│                    (Giao diện Kiểm thử - Supporting)             │
├─────────────────────────────────────────────────────────────────┤
│                     FRONTEND (React/Vite)                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │             Web3 DApp Portal (:3000)                    │   │
│   │   (Chạy trực tiếp Ethers.js giao tiếp Smart Contract)   │   │
│   └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Web3 Provider (MetaMask RPC)
════════════════════════════╪════════════════════════════════════════
                            │
════════════════════════════╪════════════════════════════════════════
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🎯 CORE BLOCKCHAIN LAYER                       │
│              (Mục tiêu chính - Primary Focus)                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│ │ MOCK SERVICES │  │   BLOCKCHAIN   │  │   IPFS SIMULATOR   │  │
│ │    :4000      │  │ Hardhat :8545  │  │   (Local Storage)  │  │
│ │               │  │                │  │                    │  │
│ │ • FPT Legal   │  │ Smart Contracts│  │  /images/          │  │
│ │ • Tuya IoT    │  │ ┌────────────┐ │  │  /metadata/        │  │
│ │ • Mock Bank   │  │ │ BookAsset  │ │  │                    │  │
│ │               │  │ │ (ERC-4907) │ │  │  CIDv1 Generator   │  │
│ │ Giả lập       │  │ └────────────┘ │  │  Storage Manager   │  │
│ │ External APIs │  │ ┌────────────┐ │  │                    │  │
│ │               │  │ │ RentalSBT  │ │  └────────────────────┘  │
│ │               │  │ │ (Soulbound)│ │                          │
│ │               │  │ └────────────┘ │                          │
│ │               │  │ ┌────────────┐ │                          │
│ │               │  │ │VinaLibVault│ │                          │
│ │               │  │ │  (Ledger)  │ │                          │
│ │               │  │ └────────────┘ │                          │
│ └───────────────┘  └────────────────┘                          │
│                                                                  │
│  📐 Định hướng từ: kiến trúc/ban đầu/định hướng hợp đồng.md     │
└─────────────────────────────────────────────────────────────────┘
```


---

## 📂 Cấu trúc Thư mục (Cập nhật 2026-01-26)

```
book_app_v2/
│
├── 🎯 CORE COMPONENTS (Trọng tâm phát triển)
│   ├── contracts/         # 🔴 PRIORITY 1: Smart Contracts (Hardhat)
│   │   ├── contracts/         # Solidity source files
│   │   │   ├── BookAsset.sol       (ERC-721 + ERC-4907 Rentable NFT)
│   │   │   ├── RentalAgreementSBT.sol (Soulbound Token)
│   │   │   ├── VinaLibVault.sol    (Core Ledger & Evidence Pack)
│   │   │   ├── SuChinToken.sol     (ERC-20 Utility Token)
│   │   │   └── Mocks.sol           (Chainlink Mock cho testing)
│   │   ├── scripts/           # Deploy & automation scripts
│   │   └── test/              # Contract unit tests
│   │
│   ├── IPFS/              # 🔴 PRIORITY 2: IPFS Simulator (Storage Layer)
│   │   ├── images/            # Book cover images (CID-based naming)
│   │   ├── metadata/          # ERC-721 metadata JSON (CID-based)
│   │   └── ipfs_simulator.js  # CID generator & storage manager
│   │
│   └── mock-server/       # 🔴 PRIORITY 3: External Service Simulators
│       ├── index.js           # Main mock server (Port 4000)
│       └── public/            # Mock UI pages
│
├── 🧪 TESTING INTERFACE (Giao diện kiểm thử - Supporting)
│   └── backend/           # Lớp kết nối API cũ (Legacy)
│   │
│   └── frontend/          # React/Vite DApp
│       └── src/
│           ├── app/               # App.tsx, styles/
│           ├── shared/web3/       # 🔴 Web3 Provider & Smart Contract Services
│           ├── pages/             # Pages (FSD Layer)
│           └── shared/            # ui/, lib/ (FSD Layer)
│
└── 📚 DOCUMENTATION & ARCHITECTURE
    ├── mô tả tổng hợp/    # Tài liệu tổng hợp (file này)
    └── kiến trúc/         # Định hướng kiến trúc
        ├── ban đầu/           # Specs từ yêu cầu gốc
        └── cấu trúc quy luật tối cao/  # QUY_LUAT_TOI_CAO.md
```

**⚠️ Lưu ý Quan trọng:**  
Dự án tập trung vào **hoàn thiện 3 thành phần core** (contracts, IPFS, mock-server) theo định hướng từ `kiến trúc/ban đầu/`.  
Backend và Frontend chỉ là **công cụ hỗ trợ kiểm thử**, không phải mục tiêu chính.

---

## 🚀 Bắt đầu Nhanh

### Yêu cầu Hệ thống
- **Node.js**: v18+ (khuyến nghị v20 LTS)
- **npm**: v9+
- **OS**: Windows 10/11, macOS, Linux

### Cài đặt & Chạy

```powershell
# 1. Clone project
git clone <repository-url>
cd book_app_v2

# 2. Cài đặt dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd contracts && npm install && cd ..
cd mock-server && npm install && cd ..

# 3. Chạy theo hướng dẫn chi tiết
# Xem file RUN_INSTRUCTIONS.md
```

👉 **Xem chi tiết:** [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md)

---

## 📖 Tài liệu

### 🌐 Vision & Context

| Tài liệu | Mô tả |
|---|---|
| [NDAChain-Whitepaper-VIE.md](../kiến%20trúc/ban%20đầu/NDAChain-Whitepaper-VIE.md) | Hạ tầng DID quốc gia - Hybrid Decentralized Identity System |

> [!INFO]
> **NDAChain** là hạ tầng DID (Định danh Phi tập trung) quốc gia với tầm nhìn phục vụ 100M+ công dân Việt Nam, kết hợp Permissioned Blockchain và National Database.
> 
> **VinaLib** là **DApp (Decentralized Application) triển khai trên NDAChain platform**, chứng minh use case thực tế của hạ tầng DID trong lĩnh vực cho thuê P2P.
> 
> **📍 Deployment Roadmap**:
> - **Hiện tại**: Development (Hardhat local) + Testing (AVAX Fuji Testnet - temporary)
> - **Target**: **NDAChain Mainnet** (đang chờ platform mở public access, hiện sandbox mode)

### 📐 Implementation Guides

| Tài liệu | Mô tả |
|----------|-------|
| [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md) | Hướng dẫn khởi chạy từng thành phần |
| [MÔ_TẢ_PHÂN_CẤP.md](./MÔ_TẢ_PHÂN_CẤP.md) | Kiến trúc hệ thống chi tiết |
| [MÔ_TẢ_GIAO_DIỆN_CHI_TIẾT.md](./M%C3%94_T%E1%BA%A2_GIAO_DI%E1%BB%86N_CHI_TI%E1%BA%BET.md) | Các luồng tương tác người dùng |
| [BÁO_CÁO_TIỀN_KHẢ_THI_TÍCH_HỢP_L2.md](../ki%E1%BA%BFn_tr%C3%BAc/%C4%91%E1%BB%81_%C3%A1n_c%E1%BB%A7a_huy/B%C3%81O_C%C3%81O_TI%E1%BB%80N_KH%E1%BA%A2_THI_T%C3%8DCH_H%E1%BB%A2P_L2.md) | Báo cáo tích hợp L2 & Tokenomics |
| [kiến trúc/QUY_LUAT_TOI_CAO.md](./kiến%20trúc/cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md) | Quy tắc kiến trúc bắt buộc |

---

## 🔧 Công nghệ Sử dụng

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18.3, Vite, TypeScript, Ethers.js 6.16 |
| **Blockchain** | Solidity, Hardhat 2.19, OpenZeppelin 5.4 |
| **Token Standards** | ERC-20, ERC-721, ERC-4907 (Rentable NFT) |
| **Storage** | IPFS Simulator (CIDv1) |
| **Mock Services** | Express-based FPT/Tuya/Bank simulators |

---

## 📊 Phân Loại Dữ Liệu: On-Chain vs Off-Chain

### 🔗 Dữ liệu On-Chain (Blockchain Storage)

**Nguyên tắc lưu trữ:** Chỉ lưu dữ liệu **quan trọng về mặt pháp lý** và **cần tính bất biến** (immutability).

| Loại dữ liệu | Smart Contract | Mô tả | Hình thức thể hiện trên explorer |
|--------------|----------------|-------|-------------|
| **Book NFT Assets** | `BookAsset.sol` | TokenId, Owner, IPFS CID. Trạng thái: `PendingVerification`, `Verified`, `Rented` | Book NFT Info |
| **Rental Rights** | `BookAsset.sol` (ERC-4907) | Quyền sử dụng (User address, Expires timestamp) | User Info |
| **Rental Agreements** | `RentalAgreementSBT.sol` | Soulbound Token (SBT) đại diện cho hợp đồng thuê đã ký | Rental SBT Info |
| **Evidence Pack** | `VinaLibVault.sol` | Struct `EvidencePack` (TermsHash, PSP Ref, DeliveryHash, Status) | Evidence Info |
| **Transaction History** | Event Logs | `RentalCreated`, `ReturnRequested`, `RentalConcluded`, `BookVerified` | Event Logs |
| **IPFS CIDs** | Smart Contract Storage | Lưu trữ liên kết Hash đến metadata và hình ảnh trên IPFS | `tokenCIDs` Mapping |

> [!NOTE]
> **Security Deposits (Tiền cọc):** Trong **Phase 1**, tiền cọc được quản lý bởi **System Escrow Wallet** (Off-Chain) để đảm bảo tốc độ và trải nghiệm UX. Logic Smart Contract cho việc khóa tiền cọc (`SuChinToken.sol`) đã có nhưng chưa kích hoạt tự động để giảm phí Gas cho bản MVP.

**Lợi ích:**
- ✅ **Bất biến (Immutable):** Không thể chỉnh sửa sau khi ghi
- ✅ **Minh bạch (Transparent):** Công khai và có thể kiểm chứng
- ✅ **Phi tập trung (Decentralized):** Dữ liệu cốt lõi không phụ thuộc server
- ✅ **Giá trị pháp lý:** Hash của hợp đồng có thể dùng làm bằng chứng

**Hạn chế:**
- ❌ **Tốn phí Gas:** Mỗi thao tác ghi đều tốn phí (trừ View)
- ❌ **Độ trễ:** Cần chờ block confirmation

---

### 💾 Dữ liệu Off-Chain (Database Storage)

**Nguyên tắc lưu trữ:** Dữ liệu **phục vụ trải nghiệm người dùng**, **thay đổi thường xuyên**, hoặc **cần bảo mật riêng tư**.

| Loại dữ liệu | Lưu trữ tại | Mô tả | Đồng bộ với Blockchain |
|--------------|-------------|-------|------------------------|
| **User Profiles** | Backend (In-Memory/DB) | Tên thật, CCCD/MST, địa chỉ vật lý, Role (Lender/Renter) | Wallet Address làm key |
| **Book Metadata** | Backend `booksMap` | Tác giả, mô tả, giá thuê, Risk Tier (Policy Engine) | Sync qua `tokenId` |
| **Images & Files** | Local Hosting / IPFS | Ảnh bìa sách, file PDF hợp đồng | CID được lưu On-Chain |
| **Rental Statistics** | Backend `renterStats` | TrustScore, lịch sử thuê, số lần trả muộn (Policy Engine) | Tính toán từ Events |
| **Bookings & Drafts** | Backend `bookings` | Trạng thái đơn hàng `PENDING_ACCEPTANCE`, `SIGNED_UNPAID` | Sync khi Finalize |
| **Escrow Wallets** | Backend `systemWallets` | Số dư tạm giữ, doanh thu sàn (Phase 1) | Chờ Audit on-chain |
| **IoT Telemetry** | IoT Adapter (Tuya) | Logs đóng/mở tủ thực tế | Tham chiếu RentalID |

**Lợi ích:**
- ✅ **Tốc độ cao:** Phản hồi tức thì cho UI
- ✅ **Rich Data:** Không giới hạn dung lượng (ảnh, PDF)
- ✅ **Riêng tư:** Thông tin cá nhân (PII) không public lên chain
- ✅ **Linh hoạt:** Dễ dàng xử lý logic phức tạp (Policy Engine)

**Hạn chế:**
- ❌ **Tập trung:** Phụ thuộc vào Backend Server
- ❌ **Niềm tin:** Cần tin tưởng vào Admin quản lý Server

---

### 🔄 Chiến lược Hybrid (Lai)

**Nguyên tắc vàng:**
> **"Blockchain xác thực (Validator) - Database phục vụ (Server)"**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│               (Frontend DApp - Port 3000)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ Provider/Signer (Window.Ethereum)
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
┌─────────┐      ┌──────────────┐      ┌─────────┐
│ Backend │◄────►│  Blockchain  │◄────►│  IPFS   │
│ (Legacy)│      │  (Contracts) │ Link │Simulator│
│         │      │  (On-Chain)  │      │(Storage)│
└─────────┘      └──────────────┘      └─────────┘
```

**Ví dụ Luồng Hybrid (Thực tế Phase 1):**

1. **Thuê sách (Booking Flow):**
   - ① **Off-Chain:** User tạo Booking → Backend kiểm tra **Policy Engine** (TrustScore).
   - ② **Off-Chain:** User ký hợp đồng điện tử (FPT) → Backend lưu `bookings`.
   - ③ **Off-Chain:** User thanh toán → Tiền vào **Escrow Wallet**.
   - ④ **On-Chain:** User gọi trực tiếp `VinaLibVault.createRental()` qua UI:
     - Liên kết **RentalSBT** (Pre-minted) cho User.
     - Cập nhật **BookAsset** status thành `Rented`.
     - Set quyền **ERC-4907** user cho User.
   - ⑤ **Off-Chain:** Cập nhật UI với TxHash.

2. **Trả sách / Mất sách (Return Flow / Cleanup):**
   - ① **Off-Chain:** User yêu cầu trả → Gửi ảnh bằng chứng.
   - ② **On-Chain:** User gọi `requestReturn()` (ghi nhận Timestamp).
   - ③ **Off-Chain:** Admin/Lender xác nhận tình trạng sách (Hư hại/Nguyên vẹn).
   - ④ **On-Chain:** Admin gọi `confirmReturn()`.
   - ⑤ **Off-Chain:** Backend giải phóng tiền cọc từ Escrow.
   - ⚡ **Auto-Cleanup**: Nếu quá hạn hợp đồng mà user không trả, **Chainlink Automation** gọi `VinaLibVault.performUpkeep()` tự động thu hồi quyền và trừ cọc.

---

## 👥 Vai trò Người dùng

| Vai trò | Mô tả | Portal |
|---------|-------|--------|
| **Renter (Người thuê)** | Thuê sách, thanh toán | :3000 |
| **Lender (Chủ sách)** | Niêm yết sách (Chờ duyệt) | :3000 |
| **Admin (Owner)** | System config & Approve | :3000 |

---

## 📝 License

Dự án phục vụ mục đích học tập và nghiên cứu.
