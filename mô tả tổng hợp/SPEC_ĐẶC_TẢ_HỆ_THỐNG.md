# 📖 ĐẶC TẢ HỆ THỐNG VINALIB-VAULT
## Bản Đặc Tả Kỹ Thuật Chi Tiết (System Specification Document)

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-02-24  
**Dự án:** VinaLib-Vault - Hệ thống Cho thuê Sách P2P với Hợp đồng Thông minh

---

## 📑 MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Smart Contracts (Blockchain Core)](#3-smart-contracts-blockchain-core)
4. [IPFS Simulator (Storage Layer)](#4-ipfs-simulator-storage-layer)
5. [Mock Services (External API Simulation)](#5-mock-services-external-api-simulation)
6. [Backend API (Testing Gateway)](#6-backend-api-testing-gateway)
7. [Frontend UI (Testing Interface)](#7-frontend-ui-testing-interface)
8. [Mô Hình Dữ Liệu](#8-mô-hình-dữ-liệu)
9. [Luồng Nghiệp Vụ (Business Flows)](#9-luồng-nghiệp-vụ-business-flows)
10. [Vai Trò & Phân Quyền](#10-vai-trò--phân-quyền)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Công Nghệ Sử Dụng](#12-công-nghệ-sử-dụng)
23. [Trạng Thái Phát Triển](#13-trạng-thái-phát-triển)
24. [Hướng Dẫn Triển Khai (Port Mapping)](#14-hướng-dẫn-triển-khai-port-mapping)
25. [Nhật Ký Sửa Lỗi & Tối Ưu (Changelog)](#15-nhật-ký-sửa-lỗi--tối-ưu-changelog)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục Đích
VinaLib-Vault là một **hệ thống Blockchain** cho thuê sách ngang hàng (P2P) với mục tiêu chính:
- **Triển khai Smart Contracts** để quản lý tài sản số (NFT) và hợp đồng thuê (SBT)
- **Mô phỏng IPFS** để lưu trữ phi tập trung
- **Giả lập Mock Services** để mô phỏng hệ sinh thái phi tập trung hoàn chỉnh

### 1.2 Định Vị Dự Án

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 MỤC TIÊU CHÍNH (CORE FOCUS)                │
│                                                                  │
│  1️⃣ SMART CONTRACTS (contracts/)                                │
│     └─ Triển khai đầy đủ logic blockchain                       │
│                                                                  │
│  2️⃣ IPFS SIMULATOR (IPFS/)                                      │
│     └─ Mô phỏng lưu trữ phi tập trung với CIDv1                 │
│                                                                  │
│  3️⃣ MOCK SERVICES (mock-server/)                                │
│     └─ Giả lập các dịch vụ bên thứ 3 (FPT, IoT, Bank)           │
│                                                                  │
│  4️⃣ PAYMENT SYSTEM (Phase 1.5)                                  │
│     └─ Revenue Management, Off-chain Escrow, Transaction History│
├─────────────────────────────────────────────────────────────────┤
│              🧪 GIAO DIỆN KIỂM THỬ (TESTING UI)                  │
│                                                                  │
│  • Frontend (frontend/) - Giao diện web để tương tác kiểm thử   │
│  • Backend (backend/)   - API gateway để kiểm thử contracts     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Chiến Lược Phát Triển (Hybrid Strategy)
- **Cấu trúc thư mục**: 100% hoàn chỉnh theo QUY_LUAT_TOI_CAO.md
- **Code implementation**: Minimalist, theo giai đoạn (Phase-based)

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Sơ Đồ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────┐
│                   🧪 TESTING INTERFACE LAYER                     │
│                    (Giao diện Kiểm thử - Supporting)             │
├─────────────────────────────────────────────────────────────────┤
│                     FRONTEND (React/Vite)                        │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │  User View  │  │ Lender View │  │    Admin View           │ │
│   │    :3001    │  │    :3001    │  │       :3001             │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (Testing Gateway)
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Express/Node.js)                     │
│         🧪 API Gateway cho Kiểm thử Blockchain :3000             │
│   ┌──────────┐ ┌──────────┐ ┌───────┐ ┌─────┐ ┌───────────────┐ │
│   │ Identity │ │  Rental  │ │Payment│ │ IoT │ │ Book + Admin  │ │
│   └──────────┘ └──────────┘ └───────┘ └─────┘ └───────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
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
│ │               │  │ └────────────┘ │  │  Storage Manager   │  │
│ │               │  │ ┌────────────┐ │  │                    │  │
│ │               │  │ │ RentalSBT  │ │  └────────────────────┘  │
│ │               │  │ │ (Soulbound)│ │                          │
│ │               │  │ └────────────┘ │                          │
│ │               │  │ ┌────────────┐ │                          │
│ │               │  │ │VinaLibVault│ │                          │
│ │               │  │ │  (Ledger)  │ │                          │
│ │               │  │ └────────────┘ │                          │
│ └───────────────┘  └────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Cấu Trúc Thư Mục Dự Án

```
book_app_v2/
│
├── 🎯 CORE COMPONENTS (Trọng tâm phát triển)
│   ├── contracts/                 # 🔴 PRIORITY 1: Smart Contracts (Hardhat)
│   │   ├── contracts/                 # Solidity source files
│   │   │   ├── BookAsset.sol             (ERC-721 + ERC-4907 Rentable NFT)
│   │   │   ├── RentalAgreementSBT.sol    (Soulbound Token)
│   │   │   ├── VinaLibVault.sol          (Core Ledger & Evidence Pack)
│   │   │   ├── SuChinToken.sol           (ERC-20 Utility Token)
│   │   │   ├── ERC4907.sol               (Rentable NFT Implementation)
│   │   │   ├── IERC4907.sol              (Rentable NFT Interface)
│   │   │   └── Mocks.sol                 (Chainlink Mock cho testing)
│   │   ├── scripts/                   # Deploy & automation scripts
│   │   └── test/                      # Contract unit tests
│   │
│   ├── IPFS/                      # 🔴 PRIORITY 2: IPFS Simulator (Storage)
│   │   ├── images/                    # Book cover images (CID-based naming)
│   │   ├── metadata/                  # ERC-721 metadata JSON (CID-based)
│   │   ├── storage/                   # Uploaded files storage
│   │   ├── ipfs_simulator.js          # CID generator & storage manager
│   │   └── test_simulator.js          # Test scripts
│   │
│   └── mock-server/               # 🔴 PRIORITY 3: External Service Simulators
│       ├── index.js                   # Main mock server (Port 4000)
│       ├── public/                    # Mock UI pages
│       └── package.json               # Dependencies
│
├── 🧪 TESTING INTERFACE (Giao diện kiểm thử - Supporting)
│   ├── backend/                   # REST API Gateway cho kiểm thử
│   │   └── src/
│   │       ├── Bootstrapper/          # server.js (Entry point)
│   │       │   └── server.js
│   │       ├── BuildingBlocks/        # 📦 Phase 2 (Logging, Utils)
│   │       ├── Shared/                # Cross-module store
│   │       │   ├── store.js               # In-memory data store
│   │       │   └── auth.js                # Auth middleware
│   │       └── modules/               # VSA Modules (PascalCase)
│   │           ├── Identity/              # User registration, login
│   │           ├── Rental/                # Booking workflow
│   │           ├── Book/                  # Book management
│   │           ├── Payment/               # Payment webhooks
│   │           ├── IoT/                   # Device unlock
│   │           ├── Admin/                 # Admin dashboard
│   │           ├── IPFS/                  # IPFS gateway
│   │           ├── Config/                # System config
│   │           ├── PolicyEngine/          # Auto-approval logic
│   │           └── Legal/                 # Contract generator
│   │
│   └── frontend/                  # React/Vite UI cho demo flows
│       └── src/
│           ├── app/                   # App.tsx, styles/
│           ├── pages/                 # 10 pages (FSD Layer)
│           │   ├── home/                  # HomePage
│           │   ├── login/                 # LoginPage
│           │   ├── register/              # RegisterPage
│           │   ├── book-detail/           # BookDetailPage
│           │   ├── account/               # AccountPage
│           │   ├── wallet/                # WalletPage
│           │   ├── lender-manage/         # LenderManagePage
│           │   ├── rent-out/              # RentOutPage
│           │   ├── admin/                 # AdminPage
│           │   └── settings/              # SettingsPage
│           ├── shared/                # ui/, lib/ (FSD Layer)
│           │   ├── ui/                    # UI Components
│           │   │   ├── Button.tsx
│           │   │   ├── Card.tsx
│           │   │   ├── Input.tsx
│           │   │   ├── Badge.tsx
│           │   │   ├── Skeleton.tsx
│           │   │   ├── MainLayout.tsx
│           │   │   ├── SplitLayout.tsx
│           │   │   └── ContractPreview.tsx
│           │   └── lib/                   # Utilities
│           ├── widgets/               # 📦 Phase 2 (.gitkeep)
│           ├── features/              # 📦 Phase 2 (.gitkeep)
│           └── entities/              # 📦 Phase 2 (.gitkeep)
│
├── 📚 DOCUMENTATION & ARCHITECTURE
│   ├── mô tả tổng hợp/            # Tài liệu tổng hợp
│   │   ├── README.md                  # Overview
│   │   ├── MÔ_TẢ_PHÂN_CẤP.md          # Architecture details
│   │   ├── MÔ_TẢ_GIAO_DIỆN_CHI_TIẾT.md  # User flows
│   │   ├── RUN_INSTRUCTIONS.md        # Setup guide
│   │   ├── TÓM_TẮT_CẤU_TRÚC.md        # Structure summary
│   │   └── SPEC_ĐẶC_TẢ_HỆ_THỐNG.md   # This file
│   └── kiến trúc/                 # Định hướng kiến trúc
│       ├── ban đầu/                   # Specs từ yêu cầu gốc
│       ├── cấu trúc quy luật tối cao/ # QUY_LUAT_TOI_CAO.md
│       └── đề án của huy/             # Project proposals
│
├── 1. UX_UI/                      # UI/UX Design files
├── ảnh sách/                      # Book images
└── start-public-demo.ps1          # Demo startup script
```

---

## 3. SMART CONTRACTS (BLOCKCHAIN CORE)

### 3.1 BookAsset.sol (Rentable NFT)

**Chuẩn:** ERC-721 + ERC-4907
**Vai trò:** Đại diện kỹ thuật số cho cuốn sách thực tế

#### Book Status Lifecycle
```
PendingVerification → Verified → Rented → (Returned) → Verified
        ↓
     Rejected
```

#### Các Hàm Chính

| Hàm | Mô Tả | Access |
|-----|-------|--------|
| `safeMint(to, cid)` | Tạo mới BookAsset NFT với IPFS CID | onlyOwner |
| `verifyForListing(tokenId)` | Admin xác nhận sách mới đủ điều kiện | onlyOwner |
| `verifyPreRent(tokenId)` | Xác nhận sách trước khi cho thuê | onlyOwner |
| `markAsRented(tokenId)` | Đánh dấu sách đang được thuê | onlyOwner |
| `verifyReturn(tokenId, isDamaged)` | Xác nhận sách đã trả | onlyOwner |
| `setUser(tokenId, user, expires)` | Gán quyền sử dụng tạm thời | public |
| `userOf(tokenId)` | Query người đang có quyền sử dụng | view |
| `isVerified(tokenId)` | Kiểm tra sách đã verified chưa | view |

#### Cấu Trúc Dữ Liệu

```solidity
enum BookStatus {
    PendingVerification,  // Chờ Admin xác nhận
    Verified,             // Đã xác nhận, sẵn sàng cho thuê
    Rented,               // Đang được thuê
    Returned              // Đã trả, chờ verify lại
}

mapping(uint256 => BookStatus) public bookStatuses;
mapping(uint256 => string) public tokenCIDs;
mapping(uint256 => uint256) public lastVerifiedAt;
mapping(uint256 => address) public lastVerifiedBy;
```

### 3.2 RentalAgreementSBT.sol (Soulbound Token)

**Chuẩn:** ERC-721 (Soulbound Variant)
**Vai trò:** Chứng nhận hợp đồng thuê đã ký kết (Digital Receipt)

#### Tính Năng Soulbound
- **Không thể chuyển nhượng:** Override `_update()` để chặn transfer
- Token gắn chặt với ví người thuê
- Lưu `termsHash` (SHA-256 của điều khoản hợp đồng)

```solidity
function safeMint(address to, bytes32 termsHash) public onlyOwner;
mapping(uint256 => bytes32) public rentalTerms;

function _update(address to, uint256 tokenId, address auth) internal override {
    // Block transfer if not mint/burn
    if (from != address(0) && to != address(0)) {
        revert("SBT: Token is Soulbound and cannot be transferred");
    }
    return super._update(to, tokenId, auth);
}
```

### 3.3 VinaLibVault.sol (Core Ledger)

**Vai trò:** Sổ cái xác thực trung tâm & Lưu trữ Evidence Pack
**Mô hình:** Trusted Backend (Admin role điều phối)
**Bảo mật & Tự động hoá:** Tích hợp `ReentrancyGuard`, kiểm tra và xử lý hợp đồng tự động với `Chainlink Functions` và `Chainlink Automation`.

#### EvidencePack Structure

```solidity
struct EvidencePack {
    bytes32 termsHash;      // Hash điều khoản hợp đồng
    bytes32 deliveryHash;   // Hash biên bản giao nhận
    address renter;         // Địa chỉ người thuê
    uint16 version;         // Phiên bản hợp đồng
    RentalStatus status;    // Active/ReturnRequested/Concluded
    uint256 timestamp;      // Thời điểm tạo
    string pspRef;          // Payment Service Provider Reference
}

enum RentalStatus { Active, ReturnRequested, Concluded }
```

#### Rental Workflow Functions

| Hàm | Mô Tả | Events |
|-----|-------|--------|
| `createRental(user, bookTokenId, duration, termsHash, version, pspRef, existingSbtId)` | Tự User gọi để tạo hợp đồng thuê mới, gắn kết SBT có sẵn. | RentalCreated |
| `requestReturn(bookTokenId, deliveryHash)` | Yêu cầu trả sách (từ renter) | ReturnRequested |
| `confirmReturn(bookTokenId, isDamaged, notes)` | Admin xác nhận trả | RentalConcluded |

#### Chainlink Automation (Automated Cleanup)

| Hàm | Mô Tả |
|-----|-------|
| `checkUpkeep(checkData)` | Tự động lặp qua `activeRentalBookIds` để tìm đơn quá hạn hoặc có yêu cầu trả. |
| `performUpkeep(performData)` | Tự động thu hồi quyền (`setUser(..., address(0), 0)`), cập nhật BookAsset và trừ cọc. |

#### Dispute & Admin Actions (New Functions)

| Hàm | Mô Tả | Events |
|-----|-------|--------|
| `cancelListing(bookTokenId)` | Quản trị/Chủ sách hủy niêm yết (khi đang ở trạng thái Active) | RentalCancelled |
| `claimCollateral(bookTokenId, reason)` | Xử lý claim tiền cọc khi người thuê vi phạm (mất/hỏng nặng) | CollateralClaimed |

#### View Functions (Frontend Helpers)

| Hàm | Mô Tả |
|-----|-------|
| `calculateRemainingTime(bookTokenId)` | Tính thời gian thuê còn lại (tính bằng giây) |
| `isAvailable(bookTokenId)` | Kiểm tra sách có thể thuê không (không có active rental) |
| `getRentalInfo(bookTokenId)` | Lấy toàn bộ thông tin `EvidencePack` của một hợp đồng thuê |

### 3.4 SuChinToken.sol (Utility Token)

**Chuẩn:** ERC-20
**Vai trò:** Token tiện ích cho loyalty/rewards (optional)
**Đặc điểm:** `Ownable`, Mintable

```solidity
// Basic ERC-20 with owner mint capability
function mint(address to, uint256 amount) public onlyOwner;
```

### 3.5 Legal Constraints Compliance

| Ràng Buộc | Implementation |
|-----------|----------------|
| **Thanh toán Off-chain** | Chỉ lưu `pspRef`, không giữ tiền on-chain |
| **Xác nhận 2 chiều** | `createRental()` cần Admin verify, `confirmReturn()` cần Admin confirm |
| **Data Privacy** | Chỉ lưu Hash (`termsHash`, `deliveryHash`), không plain text |
| **Versioning** | `EvidencePack` có field `version` |
| **Soulbound Logic** | `RentalAgreementSBT` block transfer |

---

## 4. IPFS SIMULATOR (STORAGE LAYER)

### 4.1 Mục Đích
Giả lập IPFS Gateway tự quản lý (Self-hosted Mock) để lưu trữ:
- **Book cover images** (Binary files)
- **ERC-721 Metadata** (JSON files)

### 4.2 Cấu Trúc Thư Mục

```
IPFS/
├── images/                # Binary image files (.jpg, .png)
│   └── {CID}.{ext}       # Tên file = CID
├── metadata/              # ERC-721 Metadata JSON
│   └── {CID}.json        # Tên file = CID
├── storage/               # Uploaded files
├── ipfs_simulator.js      # Core simulator logic
└── test_simulator.js      # Test scripts
```

### 4.3 CID Generation (CIDv1)

```javascript
// ipfs_simulator.js
function generateCID(content) {
    // CIDv1 format: base32 encoded
    const hash = crypto.createHash('sha256').update(content).digest();
    const cid = 'bafkrei' + base32encode(hash).toLowerCase();
    return cid;
}
```

### 4.4 ERC-721 Metadata Schema

```json
{
    "name": "Tên sách",
    "description": "Mô tả chi tiết",
    "image": "https://ipfs.io/ipfs/<Image_CID>",
    "attributes": [
        { "trait_type": "Author", "value": "Tác giả" },
        { "trait_type": "Price", "value": "Giá thuê" },
        { "trait_type": "ISBN", "value": "..." }
    ]
}
```

### 4.5 API Routes

| Route | Method | Mô Tả |
|-------|--------|-------|
| `/ipfs/:cid` | GET | Lấy nội dung file theo CID |
| `/ipfs/upload` | POST | Upload file mới, trả về CID |

---

## 5. MOCK SERVICES (EXTERNAL API SIMULATION)

### 5.1 Mock Server Configuration
- **Port:** 4000
- **Entry:** `mock-server/index.js`

### 5.2 Mock Legal Service (FPT eContract)

**Mục đích:** Giả lập digital signature service

| Endpoint | Method | Mô Tả |
|----------|--------|-------|
| `/fpt/electronic-sign/create` | POST | Tạo chữ ký số giả lập |
| `/fpt/electronic-sign/verify` | POST | Xác thực chữ ký |

**Request:**
```json
{
    "documentContent": "Nội dung hợp đồng",
    "signerInfo": { "name": "...", "email": "..." }
}
```

**Response:**
```json
{
    "document_id": "DOC-xxx",
    "signing_url": "http://localhost:4000/mock-ui/sign.html?docId=...",
    "terms_hash": "0x..."
}
```

### 5.3 Mock IoT Service (Tuya Smart Lock)

**Mục đích:** Giả lập smart lock control

| Endpoint | Method | Mô Tả |
|----------|--------|-------|
| `/tuya/v1.0/devices/:id/unlock` | POST | Mở khóa thiết bị |
| `/tuya/v1.0/devices/:id/status` | GET | Lấy trạng thái |

**Response:**
```json
{
    "ticket_id": "TKT-xxx",
    "valid_until": "2026-01-27T22:00:00Z",
    "success": true
}
```

### 5.4 Mock Banking Service (Casso Webhook)

**Mục đích:** Giả lập payment notification

| Endpoint | Method | Mô Tả |
|----------|--------|-------|
| `/mock-ui/bank` | GET | Mock Bank UI |
| POST to Backend `/api/webhook/casso` | POST | Trigger payment webhook |

---

## 6. BACKEND API (TESTING GATEWAY)

### 6.1 Kiến Trúc: Vertical Slice Architecture (VSA)

```
backend/src/
├── Bootstrapper/          # Entry Point
│   └── server.js
├── Shared/                # Cross-module resources
│   ├── store.js           # In-memory data store
│   └── auth.js            # Authentication middleware
└── modules/               # Feature Slices
    ├── Admin/
    ├── Book/
    ├── Config/
    ├── Identity/
    ├── IoT/
    ├── IPFS/
    ├── Legal/
    ├── Payment/
    ├── PolicyEngine/
    └── Rental/
```

### 6.2 Module Breakdown

#### Module Identity (Định Danh)
- **Routes:** `/api/register`, `/api/login`, `/api/user/:username/*`
- **Chức năng:** Quản lý user accounts, ví Ethereum giả lập, số dư

#### Module Book (Quản lý Sách)
- **Routes:** `/api/books`, `/api/books/:id`
- **Chức năng:** CRUD sách, upload ảnh, listing

#### Module Rental (Thuê Mượn)
- **Routes:** `/api/booking/*`
- **Chức năng:** Booking workflow, payment, return request

#### Module Admin (Quản Trị)
- **Routes:** `/api/admin/*`
- **Chức năng:** Verify listing, approve booking, confirm return, stats
- **Protected:** Requires `verifyAdmin` middleware

#### Module Payment (Thanh Toán)
- **Routes:** `/api/webhook/casso`
- **Chức năng:** Payment webhooks, wallet transactions

#### Module IoT (Thiết bị)
- **Routes:** `/api/devices/:id/unlock`
- **Chức năng:** Device unlock via Mock IoT

#### Module Config (Cấu hình)
- **Routes:** `/api/config`
- **Chức năng:** System settings (collateral ratio, platform fee)

#### Module PolicyEngine (Quyết định Thông minh)
- **Routes:** `/api/policy/*`
- **Chức năng:** TrustScore calculation, auto-approval logic

#### Module Legal (Hợp đồng Pháp lý)
- **Routes:** `/api/contracts/*`
- **Chức năng:** Contract generation, preview, accept/reject

#### Module IPFS (Lưu trữ)
- **Routes:** `/ipfs/:cid`
- **Chức năng:** IPFS gateway

### 6.3 Shared Store (In-Memory)

```javascript
// Shared/store.js
const users = new Map();           // User accounts
const books = [];                  // Book listings
const bookings = new Map();        // Rental bookings
const transactionLog = [];         // Transaction history
const systemWallets = {
    escrow: { balance: 0 },
    revenue: { balance: 0 },
    pendingPayout: { balance: 0 }
};
const systemConfig = {
    minCollateralRatio: 80,
    platformFeePercent: 10
};
```

### 6.4 Background Jobs (Cron)

| Job | Schedule | Mô Tả |
|-----|----------|-------|
| Monthly Payout | `0 0 5 * *` | Chuyển pendingIncome cho Lender |
| Deadline Monitor | `*/5 * * * *` | Expire bookings quá hạn |

---

## 7. FRONTEND UI (TESTING INTERFACE)

### 7.1 Kiến Trúc: Feature-Sliced Design (FSD)

```
frontend/src/
├── app/                   # App initialization
│   ├── App.tsx
│   └── styles/
├── pages/                 # Page components
│   ├── home/
│   ├── login/
│   ├── register/
│   ├── book-detail/
│   ├── account/
│   ├── wallet/
│   ├── lender-manage/
│   ├── rent-out/
│   ├── admin/
│   └── settings/
├── shared/                # Shared components
│   ├── ui/                # UI Kit (Button, Card, Input, etc.)
│   └── lib/               # Utilities
├── widgets/               # 📦 Phase 2
├── features/              # 📦 Phase 2
└── entities/              # 📦 Phase 2
```

### 7.2 Shared UI Components

| Component | Mô Tả |
|-----------|-------|
| `Button.tsx` | Styled button với variants |
| `Card.tsx` | Card container |
| `Input.tsx` | Form input |
| `Badge.tsx` | Status badges |
| `Skeleton.tsx` | Loading placeholders |
| `MainLayout.tsx` | Responsive layout với sidebar |
| `SplitLayout.tsx` | Two-column layout |
| `ContractPreview.tsx` | Contract preview modal |

### 7.3 Pages Overview

| Page | Route | Mô Tả |
|------|-------|-------|
| HomePage | `/` | Book listing, search |
| LoginPage | `/login` | User authentication |
| RegisterPage | `/register` | User registration |
| BookDetailPage | `/book/:id` | Book details, booking |
| AccountPage | `/account` | User dashboard |
| WalletPage | `/wallet` | Balance, transactions |
| LenderManagePage | `/lender` | Lender's book management |
| RentOutPage | `/rent-out` | New book listing |
| AdminPage | `/admin` | Admin dashboard |
| SettingsPage | `/settings` | User settings |

### 7.4 Blockchain Explorer (On-Chain Data)

**Mục đích:** Cung cấp giao diện minh bạch để kiểm tra trạng thái dữ liệu trực tiếp trên Blockchain (Hardhat Network), không thông qua Backend API.

**URL:** `http://localhost:3004` (Command: `npm run explorer`)

**Tính Năng Chính:**
- **Dashboard:** Thống kê Network (Block Height, Gas Price, Peer Count).
- **Block Explorer:** Danh sách blocks mới nhất, chi tiết block, số lượng transactions.
- **Transaction Explorer:** Tra cứu txHash, xem trạng thái (Success/Revert), Gas Used, Logs.
- **On-Chain Data Explorer (VinaLib Special):**
    - **Contract Viewer:** Đọc trạng thái trực tiếp từ Smart Contracts:
        - `BookAsset`: Kiểm tra `ownerOf`, `userOf`, `bookStatuses`.
        - `RentalSBT`: Kiểm tra `rentalTerms` (Terms Hash).
        - `VinaLibVault`: Kiểm tra `activeRentals` (Evidence Pack) theo BookTokenId.
        - `SuChinToken`: Kiểm tra số dư token ERC-20.
    - **Tools:**
        - Decode Event Logs từ Hex data.
        - Converter (Wei <-> Eth, Hex <-> Number).
- **Architecture:** Client-side only (`ethers.js` v6 kết nối trực tiếp RPC JSON-RPC Provider), đảm bảo tính trung thực (Trustless).

---

## 8. MÔ HÌNH DỮ LIỆU

### 8.1 User Model

```typescript
interface User {
    username: string;
    email: string;
    password: string;           // Plain text (testing only)
    fullname: string;
    address: string;            // Ethereum wallet address
    privateKey: string;         // ⚠️ Testing only
    balance: number;            // VND balance
    role: 'USER' | 'LENDER' | 'ADMIN';
    pendingIncome: number;      // For lenders
    cccd?: string;              // ID number (auto-generated)
    transactions: Transaction[];
    stats: {
        completedRentals: number;
        lateReturns: number;
        disputes: number;
    };
}
```

### 8.2 Book Model

```typescript
interface Book {
    id: number;
    title: string;
    author: string;
    price: number;              // Rent price per day (VND)
    owner: string;              // Owner wallet address
    ownerUsername: string;      // Owner username
    cid: string;                // IPFS CID
    imageUrl: string;           // Image URL
    status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'RENTED';
    riskTier?: 'A' | 'B' | 'C'; // Risk classification
    valueReference?: number;    // Reference value
    depositRatio?: number;      // 50-150%
    lateFeePercent?: number;    // 5-25%
    minDays?: number;           // 1-7 days
    maxDays?: number;           // 7-30 days
    verifiedAt?: number;
    verifiedBy?: string;
    rejectedAt?: number;
    rejectedBy?: string;
    rejectionReason?: string;
}
```

### 8.3 Booking Model

```typescript
interface Booking {
    code: string;               // "BOOK-{timestamp}"
    username: string;
    assetId: string;            // Book ID
    price: number;              // Total price
    depositAmount: number;      // Collateral amount
    status: BookingStatus;
    contract?: ContractInfo;
    policyDecision?: PolicyDecision;
    approvalMode?: 'AUTO' | 'MANUAL' | 'REVIEW';
    deadlineAt?: number;        // Approval deadline
    pickupDeadlineAt?: number;  // Pickup deadline
    createdAt: number;
    paidAt?: number;
    returnRequestedAt?: number;
    completedAt?: number;
    lenderUsername?: string;
}

type BookingStatus = 
    | 'PENDING_SIGN'
    | 'SIGNED_PENDING_APPROVAL'
    | 'SIGNED_UNPAID'
    | 'PAID'
    | 'RETURN_REQUESTED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'EXPIRED';
```

### 8.4 Transaction Model

```typescript
interface Transaction {
    type: TransactionType;
    amount: number;
    timestamp: number;
    commitmentHash?: string;
    relatedBookingCode?: string;
    note?: string;
}

type TransactionType = 
    | 'DEPOSIT'
    | 'WITHDRAW'
    | 'PAYMENT_TO_ESCROW'
    | 'PLATFORM_FEE'
    | 'LENDER_INCOME'
    | 'MONTHLY_PAYOUT'
    | 'REFUND';
```

---

## 9. LUỒNG NGHIỆP VỤ (BUSINESS FLOWS)

### 9.1 Luồng Thuê Sách (Rent a Book Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: KHÁM PHÁ & CHỌN SÁCH                                     │
│ • User truy cập HomePage                                         │
│ • Xem danh sách sách VERIFIED                                    │
│ • Chọn sách và thời hạn thuê                                     │
│ → Nhấn "Tạo Hợp Đồng Thuê"                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: XEM XÉT HỢP ĐỒNG                                         │
│ • Backend tạo Booking (PENDING_SIGN)                             │
│ • Contract Generator điền template                               │
│ • Tính termsHash (SHA-256)                                       │
│ • Hiển thị modal XEM TRƯỚC HỢP ĐỒNG                              │
│ → User nhấn "✍️ Đồng ý & Ký tên"                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: ĐÁNH GIÁ TỰ ĐỘNG (Policy Engine)                         │
│ • Tính TrustScore dựa trên lịch sử                               │
│ • Đánh giá RiskTier (A/B/C)                                      │
│ • Quyết định:                                                    │
│   ├─ AUTO → SIGNED_UNPAID (Skip Admin)                           │
│   ├─ REVIEW/MANUAL → SIGNED_PENDING_APPROVAL (Chờ Admin)         │
│   └─ REJECT → Hủy đơn                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 4: THANH TOÁN & ĐẶT CỌC                                     │
│ • User nhấn "💳 Thanh toán Ví"                                   │
│ • Backend trừ tiền → System Escrow                               │
│ • On-chain: User trực tiếp gọi VinaLibVault.createRental()       │
│   ├─ Nhận existingSbtId (liên kết với SBT đã ký)                 │
│   ├─ Ghi EvidencePack                                            │
│   └─ BookAsset.setUser()                                         │
│ → Status: PAID                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 5: MỞ KHÓA                                                  │
│ • Hiển thị nút "🔓 Mở Khóa Thiết Bị"                             │
│ • Gọi Tuya IoT Mock API → Trả về Passcode                        │
└─────────────────────────────────────────────────────────────────┘

### 9.2 Luồng Tự Động Dọn Dẹp (Automated Cleanup - Chainlink)

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: HẾT HẠN HỢP ĐỒNG HOẶC YÊU CẦU TRẢ SÁCH                   │
│ • Chainlink Automation node liên tục gọi `checkUpkeep()`         │
│ • Lặp qua mảng `activeRentalBookIds`                             │
│ • Phát hiện EvidencePack có block.timestamp > expires            │
│ → Trả về `upkeepNeeded = true` kèm `bookId`                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ACTION: THỰC THI DỌN DẸP                                         │
│ • Chainlink node gọi `performUpkeep(bookId)`                     │
│ • Thu hồi quyền sử dụng: BookAsset.setUser(address(0))           │
│ • Cập nhật trạng thái: BookAsset.verifyReturn(false)             │
│ • Chuyển trạng thái rental thành `Concluded`                     │
│ • Dỡ bỏ khỏi `activeRentalBookIds`                               │
│ → Emit `RentalConcluded` event                                   │
└─────────────────────────────────────────────────────────────────┘
```
│ • Gọi Mock IoT Service                                           │
│ → Nhận Ticket mở tủ lấy sách                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Luồng Trả Sách (Return Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: YÊU CẦU TRẢ SÁCH (Renter)                                │
│ • Upload ảnh bằng chứng (optional)                               │
│ • Nhấn "🔄 Trả Sách"                                             │
│ • On-chain: VinaLibVault.requestReturn()                         │
│ → Status: RETURN_REQUESTED                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: XÁC NHẬN (Admin)                                         │
│ • Admin xem Admin Dashboard                                      │
│ • Kiểm tra tình trạng sách thực tế                               │
│ • Nhấn "✅ Xác nhận Trả"                                         │
│ • Financial Settlement:                                          │
│   ├─ Trừ Platform Fee từ Escrow                                  │
│   └─ Chuyển vào Lender Pending Income                            │
│ • On-chain: VinaLibVault.confirmReturn()                         │
│   ├─ Thu hồi quyền sử dụng                                       │
│   └─ Status: Concluded                                           │
│ • If OK: BookAsset → VERIFIED                                    │
│ → Booking Status: COMPLETED                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Luồng Niêm Yết Sách (Custodial Minting Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: LENDER CUNG CẤP THÔNG TIN (Off-chain)                    │
│ • Lender truy cập "Quản lý sách"                                 │
│ • Sao chép Mã chủ sách (Public Key) của mình                     │
│ • Liên hệ và gửi thông tin sách (Tên, Giá) cho Admin             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: ADMIN GHI NHẬN LÊN CHUỖI (On-chain)                      │
│ • Admin truy cập Admin Dashboard (Tab Cấp phát)                  │
│ • Nhập: Tên sách, Giá thuê, Mã chủ sách (của Lender)             │
│ • Gọi hàm `safeMint` trên Smart Contract (Quyền Owner)           │
│ • Token mới được phát hành GẮN LIỀN VỚI VÍ LENDER                │
│ → Status: PENDING_VERIFICATION                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: ADMIN DUYỆT (Risk & Value)                               │
│ • Cập nhật RiskTier (A/B/C) + Value tham chiếu                   │
│ • Quyết định APPROVE (VERIFIED) hoặc REJECT (REJECTED)               │
│ → Sách hiển thị trên Marketplace (nếu VERIFIED)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. VAI TRÒ & PHÂN QUYỀN

### 10.1 Ma Trận Phân Quyền

| Hành Động | USER | LENDER | ADMIN |
|-----------|------|--------|-------|
| Xem danh sách sách | ✅ | ✅ | ✅ |
| Thuê sách | ✅ | ✅ | ✅ |
| Yêu cầu trả sách | ✅ | ✅ | ✅ |
| Sao chép Public key niêm yết | ❌ | ✅ | ✅ |
| Tạo sách on-chain (Mint) | ❌ | ❌ | ✅ |
| Xem "Sách của tôi" | ❌ | ✅ | ✅ |
| Duyệt sách mới | ❌ | ❌ | ✅ |
| Phê duyệt đơn thuê | ❌ | ❌ | ✅ |
| Xác nhận trả sách | ❌ | ❌ | ✅ |
| Xem thống kê tài chính | ❌ | ❌ | ✅ |
| Kích hoạt Payout | ❌ | ❌ | ✅ |
| Cấu hình hệ thống | ❌ | ❌ | ✅ |

### 10.2 Quick Login Accounts (Demo)

| Role | Username | Password | Đặc điểm |
|------|----------|----------|----------|
| Admin | `admin` | `admin` | Full system access |
| Lender | `lender1` | `123456` | Owns 5 default books |
| User | `testuser` | `123` | Regular user |

---

## 11. API ENDPOINTS REFERENCE

### 11.1 Identity Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/api/register` | Đăng ký tài khoản mới |
| POST | `/api/login` | Đăng nhập |
| GET | `/api/user/:username/balance` | Lấy số dư ví |
| GET | `/api/user/:username/transactions` | Lịch sử giao dịch |
| POST | `/api/user/:username/deposit` | Nạp tiền |

### 11.2 Book Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/books` | Danh sách sách |
| GET | `/api/books/:id` | Chi tiết sách |
| POST | `/api/books` | Tạo sách mới (Lender) |

### 11.3 Rental (Booking) Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/api/booking` | Tạo booking mới |
| GET | `/api/booking/:code` | Thông tin booking |
| GET | `/api/booking/user/:username` | Bookings của user |
| POST | `/api/booking/:code/pay-wallet` | Thanh toán bằng ví |
| POST | `/api/booking/:code/return-request` | Yêu cầu trả sách |

### 11.4 Admin Module (Protected)

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/admin/rentals` | Tất cả đơn thuê |
| GET | `/api/admin/books/pending` | Sách chờ duyệt |
| POST | `/api/admin/books/:id/verify-listing` | Duyệt sách |
| POST | `/api/admin/books/:id/reject-listing` | Từ chối sách |
| POST | `/api/admin/booking/:code/approve` | Phê duyệt đơn |
| POST | `/api/admin/booking/:code/return-confirm` | Xác nhận trả |
| GET | `/api/admin/stats` | Thống kê tài chính |
| POST | `/api/admin/payout` | Kích hoạt payout |

### 11.5 Legal Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/contracts/preview/:bookingCode` | Xem trước hợp đồng |
| POST | `/api/contracts/accept/:bookingCode` | Chấp nhận hợp đồng |
| POST | `/api/contracts/reject/:bookingCode` | Từ chối hợp đồng |

### 11.6 Policy Engine Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/policy/test-score/:username` | Test TrustScore |
| POST | `/api/policy/evaluate` | Đánh giá policy |

### 11.7 Config Module

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/config` | Lấy cấu hình |
| POST | `/api/config` | Cập nhật cấu hình |

---

## 12. CÔNG NGHỆ SỬ DỤNG

### 12.1 Stack Overview

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Axios |
| **Backend** | Node.js 18+, Express, Multer, node-cron |
| **Blockchain** | Solidity 0.8.20, Hardhat, OpenZeppelin |
| **Token Standards** | ERC-20 (Logic/Rewards), ERC-721, ERC-4907 (Rentable NFT) |
| **Storage** | IPFS Simulator (CIDv1) |
| **Mock Services** | Express-based simulators |

### 12.2 Backend Dependencies

```json
{
  "express": "^4.18.x",
  "cors": "^2.8.x",
  "body-parser": "^1.20.x",
  "multer": "^1.4.x",
  "node-cron": "^3.0.x"
}
```

### 12.3 Frontend Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "typescript": "^5.x",
  "vite": "^5.x"
}
```

### 12.4 Smart Contract Dependencies

```json
{
  "@openzeppelin/contracts": "^5.0.x",
  "@chainlink/contracts": "^0.8.x",
  "hardhat": "^2.19.x"
}
```

---

## 13. TRẠNG THÁI PHÁT TRIỂN

### 13.1 Phase Summary

| Phase | Trạng thái | Mô tả |
|-------|------------|-------|
| **Phase 1:** Blockchain Core | ✅ COMPLETED | Smart Contracts, IPFS, Mock Services |
| **Phase 1.5:** Payment System | ✅ COMPLETED | Escrow, Revenue, Transaction History |
| **Phase 2:** Policy Engine | ✅ COMPLETED | Auto-Accept, TrustScore, Risk Tiers |
| **Phase 2:** Contract Generator | ✅ COMPLETED | Dynamic Template, Preview, Accept/Reject |
| **Phase 2:** Visual Overhaul | ✅ COMPLETED | Responsive, Skeleton Loading, MainLayout |
| **Phase 3:** Commercialization | ⏳ FUTURE | Security Audit, Mainnet Deploy |

### 13.2 Completion Checklist

**Smart Contracts:**
- [x] BookAsset.sol (ERC-4907 Rentable NFT)
- [x] RentalAgreementSBT.sol (Soulbound Token)
- [x] VinaLibVault.sol (Core Ledger)
- [x] Unit tests coverage ≥ 80%

**IPFS Simulator:**
- [x] CIDv1 generation
- [x] Image storage
- [x] Metadata storage
- [x] Gateway routes

**Mock Services:**
- [x] FPT Legal Service
- [x] Tuya IoT Service
- [x] Mock Banking

**Backend Modules:**
- [x] Identity + Auth
- [x] Book + Listing
- [x] Rental + Booking
- [x] Admin + Dashboard
- [x] Payment + Escrow
- [x] PolicyEngine + Auto-accept
- [x] Legal + Contract Generator

**Frontend Pages:**
- [x] HomePage
- [x] LoginPage / RegisterPage
- [x] BookDetailPage
- [x] AccountPage / WalletPage
- [x] LenderManagePage / RentOutPage
- [x] AdminPage
- [x] Blockchain Explorer Page (Port 3004)

---

## 📚 TÀI LIỆU LIÊN QUAN

- [README.md](./README.md) - Tổng quan dự án
- [MÔ_TẢ_PHÂN_CẤP.md](./MÔ_TẢ_PHÂN_CẤP.md) - Kiến trúc chi tiết
- [MÔ_TẢ_GIAO_DIỆN_CHI_TIẾT.md](./M%C3%94_T%E1%BA%A2_GIAO_DI%E1%BB%86N_CHI_TI%E1%BA%BET.md) - User flows
- [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md) - Setup guide
- [QUY_LUAT_TOI_CAO.md](../kiến%20trúc/cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md) - Quy tắc kiến trúc

## 15. NHẬT KÝ SỬA LỖI & TỐI ƯU (CHANGELOG)

### Cập nhật ngày: 03-03-2026
**1. Khắc phục lỗi Webpack 5 (Polyfill `buffer`):**
- **Sự cố:** Thư viện `@safe-global/protocol-kit` yêu cầu module `buffer` không có sẵn trong Webpack 5 mặc định của Create React App.
- **Giải pháp:** Chuyển đổi công cụ build sang `react-app-rewired`. Tạo `config-overrides.js` thiết lập `ProvidePlugin` để cung cấp `Buffer` global cho toàn bộ Frontend ứng dụng. 

**2. Xác thực và Tối ưu hóa Quyền truy cập Hợp đồng (Access Control):**
- **Nhận định Kiến trúc:** Các lỗi `OwnableUnauthorizedAccount` xuất hiện khi người dùng thực hiện giao dịch tạo sách là **hoạt động thiết kế có chủ đích** của hệ thống Quản lý tập trung. Chức năng `safeMint` trên `BookAsset.sol` cũng như các hàm duyệt trả/hủy hợp đồng trên `VinaLibVault.sol` được tuân thủ nghiêm ngặt theo luồng Custodial (Chỉ Admin mới có quyền thao tác với tài sản vật lý).
- **Tối ưu UI (`RentOutPage.tsx`):** Cập nhật bộ bắt lỗi (catch) trên Frontend, chuyển lỗi Revert chuỗi khối thành thông báo thân thiện bằng tiếng Việt: *"Bị từ chối: Chỉ Admin/Quản trị viên hệ thống mới có quyền ghi nhận sách lên nền tảng"*. 

**3. Khắc phục lỗi hiển thị Xem trước Hợp đồng (Contract Preview):**
- **Sự cố:** Chức năng "Xem trước Hợp đồng" tại trang Niêm yết sách chỉ hiển thị Placeholder tĩnh *"đang cập nhật"*.
- **Giải pháp:** Viết lại logic render của `ContractPreview.tsx`. Bổ sung Render Static Demo Mode: Nếu không có mã Hợp đồng thật (`previewId`) nhưng có Dữ liệu cục bộ (`rentalData`), hệ thống sẽ trực tiếp in ra màn hình văn bản Markdown Hợp đồng mẫu kèm theo chi tiết thông số do Lender vừa điền (Tên sách, Tiền thuê, Tiền cọc).

**4. Đồng Bộ Hoá Cấu Trúc Khởi Chạy (Port Synchronization) - 03-03-2026**
- Bổ sung tài liệu Mapping Ports (Mục 14), điều chỉnh `RUN_INSTRUCTIONS.md` từ khởi chạy 2 Terminal (Zero-cost local testing cơ bản) sang chế độ hệ thống đầy đủ 5 Terminal (Microservices, IPFS Simulator, Blockchain Node và Frontend Split Ports) để giải quyết xung đột Port 3000 giữa Backend Node.js và React SPA.

**5. Cập nhật Luồng Niêm Yết Sách (Chuyển Giao Quyền Mint sang Admin) - 04-03-2026**
- **Nhận định:** Lender không thể Mint trực tiếp sách on-chain vì Smart Contract chặn qua hàm `onlyOwner`. Cố gắng gọi `safeMint` từ tài khoản Lender sẽ bị Revert.
- **Giải pháp:** Chuyển bộ tính năng "Niêm yết sách" từ `RentOutPage.tsx` của Lender sang `OwnerDashboard.tsx` của Admin. Lender chỉ sao chép Public Key gửi cho Admin. Admin sẽ thao tác sinh sách. Smart Contract sẽ lấy Public Key của Lender đưa vào biến `to` của hàm `safeMint`, đảm bảo sách thuộc sở hữu của đúng Lender.

---

## 14. HƯỚNG DẪN TRIỂN KHAI (PORT MAPPING)

Hệ thống VinaLib Web3 được phân mảnh thành nhiều Microservices Frontend và Backend (Gateway/Mock) để quá trình Review (Code Audit) tách bạch, không gây lẫn lộn. Do đó việc quản lý cổng (Port Mapping) cực kì quan trọng để khởi chạy toàn phần.

| Service Component | Công nghệ | Port | Package.json script | Ghi chú |
|:---|:---|:---:|:---|:---|
| **Local Blockchain** | Hardhat HTTP | `8545` | `npx hardhat node` | Root RPC Node cho MetaMask |
| **Mock Services** | Express/Node | `4000` | `npm start` (tại `mock-server`) | FPT eContract, Tuya SmartLock |
| **Backend/IPFS** | Express/Node | `3000` | `npm start` (tại `backend`) | REST Gateway (Lõi Web2) |
| **User/Public UI**| React.js 18 | `3001` | `npm start` (tại `frontend`) | Frontend cho User tìm sách |
| **Lender UI** | React.js 18 | `3002` | `npm run start:lender` | Frontend Quản trị Sách (Cá nhân) |
| **Admin UI** | React.js 18 | `3003` | `npm run start:admin` | Frontend Phê duyệt / Checkout |
| **Block Explorer**| React.js 18 | `3004` | `npm run explorer` | Tra cứu hợp đồng thuần tuý On-chain |

> **Quy trình Khởi Động Chuẩn (Cold Start 5 Terminals):** Xem chi tiết tại [RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md)

---

**Tài liệu này:** `SPEC_ĐẶC_TẢ_HỆ_THỐNG.md`  
**Cập nhật lần cuối:** 2026-03-03
