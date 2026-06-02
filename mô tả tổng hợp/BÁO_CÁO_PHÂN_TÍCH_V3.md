# BÁO CÁO PHÂN TÍCH & CHUYỂN GIAO DỰ ÁN

**Workflow:** `Master_PhanTichChuyenGiao`  
**Workflow:** `Master_KienTrucThietKe` (Gap Fix Design)  
**Ngày cập nhật:** 21-02-2026  
**Version dự án:** 3.1 (book_app_v3 - Sau Phân Tích DApp)

---

## 1. Kết Quả Phân Tích Kỹ Thuật (Workflow Bước 1)

### Tech Stack Xác Nhận

| Thành phần | Công nghệ | Version |
|-----------|-----------|---------|
| Smart Contracts | Solidity + Hardhat + OpenZeppelin | ^0.8.20 |
| Blockchain Base | EVM Local (Gas = 0) | Hardhat Node |
| DApp Connect | ethers.js | ^6.16 |
| Frontend | React + TypeScript + Web3Provider | ^18.3 |
| Smart Contract Security | Mythril / Slither Analytics | Phase 3/4 |
| External | Chainlink Functions & Automation | Giả lập |

### Bản Đồ Smart Contracts

```
BookAsset.sol (ERC-4907 + Ownable + Pausable)
    ├── PendingVerification → Verified → Rented → Verified/PendingVerification
    └── Events: BookVerified, BookStatusChanged

RentalAgreementSBT.sol (ERC-721 Soulbound)
    └── _update() chặn transfer → Soulbound hoàn toàn

VinaLibVault.sol (FunctionsClient + AutomationCompatible)
    ├── EvidencePack: termsHash, version, pspRef, deliveryHash, renter, status
    ├── Endpoints: createRental, requestReturn, confirmReturn, cancelListing, claimCollateral
    └── Events: RentalCreated, ReturnRequested, RentalConcluded, RentalCancelled, CollateralClaimed
```

### Backend Modules (Legacy - Web3 Direct)

> [!WARNING]
> Frontend hiện tại giao tiếp **trực tiếp** với Smart Contracts qua ethers.js. Các module Backend bên dưới đã trở thành di sản (Legacy), chỉ còn ý nghĩa cho Indexing/Off-chain services trong tương lai.

| Module | Lines | Vai Trò Cũ (Legacy) |
|--------|-------|--------------|
| Rental/controller.js | 341L | Booking, payment, return (Đã thay bằng MetaMask tx) |
| Legal/contract.controller.js | 303L | Contract preview, accept/reject (Đã thay bằng Local State) |
| Admin/controller.js | 362L | Verify, approve, confirm (Đã thay bằng MetaMask tx) |
| PolicyEngine/policy.controller.js | 122L | Trust score + approval matrix (Giữ nguyên off-chain concept) |
| Rental/adapters/blockchain.adapter.js | 308L | On-chain sync (Đã loại bỏ, Frontend đọc on-chain) |

---

## 2. Logic Nghiệp Vụ (Workflow Bước 2)

### State Machine Blockchain Booking (On-Chain + Web3 Layer)

```
[Chưa Có Token]
    └─► DApp: Gọi Contract `BookAsset.safeMint()`
           │
  [Trạng thái: PENDING_VERIFICATION (0)]
           │
           ├─ [Admin gọi `verifyForListing`]
           │
  [Trạng thái: AVAILABLE/VERIFIED (1)]
           │
           ├─ [Admin/(Frontend Trigger) gọi `VinaLibVault.createRental()`]
           │
  [Trạng thái: RENTED (2)] + [SBT Linked]
           │
           ├─ [User gọi `VinaLibVault.requestReturn()`]
           │
  [SBT Record: status == ReturnRequested]
           │
           ├─ [Admin gọi `VinaLibVault.confirmReturn(isDamaged)`]
           │
  [Trạng thái: AVAILABLE (1) hoặc PENDING_VERIFICATION (0)] + [SBT Record: RentalConcluded]
```

### Gas Estimation (Bảng Định Mức V3)
| Hành động | Hàm gọi On-chain | Gas Ước Tính |
|---|---|---|
| Niêm yết sách | `BookAsset.safeMint` | ~110,000 Gas |
| Kiểm định sách | `BookAsset.verifyForListing` | ~35,000 Gas |
| Bắt đầu thuê | `VinaLibVault.createRental` | ~190,000 Gas |
| Yêu cầu trả sách | `VinaLibVault.requestReturn` | ~45,000 Gas |
| Xác nhận trả | `VinaLibVault.confirmReturn` | ~105,000 Gas |
| Xử lý tranh chấp| `VinaLibVault.claimCollateral`| ~85,000 Gas |

### Policy Matrix On-chain (Trust Score Concept)

_Lưu ý: Do hạn chế của Block Limit Data, các Policy Rủi ro Phức tạp đang được giữ ở thiết kế Off-chain hoặc xử lý thông qua việc Admin chọn cấu hình Override._
_Hệ thống TrustScore đã được tinh gọn lại và tích hợp gián tiếp thông qua Tỷ lệ Ký Quỹ (Deposit Ratio) và Admin duyệt tủ động thay cho việc Hardcode Logic vào Smart Contract (tiết kiệm phí Gas)._


## 3. Compatibility Gate (Bước 4)

| Gate | Nội Dung | Kết Quả |
|------|---------|---------|
| Gate 1 — Core Engine | FSM + transition functions đầy đủ | ✅ PASS |
| Gate 2 — Storage | Struct fields, mapping sizes xác định | ✅ PASS |
| Gate 3 — Interface | Events, View functions, ABIs đầy đủ | ✅ PASS |

**Kết luận:** Pipeline sẵn sàng Phase 2.

---

## 4. Gap Analysis & Fix Report (Master_KienTrucThietKe)

### 8 Gaps Phát Hiện

| ID | Mức | Mô Tả | Trạng Thái |
|----|-----|-------|-----------|
| CF-1 | 🔴 HIGH | Duplicate SBT Mint — mỗi rental tạo 2 SBT | ✅ **Fixed** |
| CF-2 | 🔴 HIGH | Private Key hardcode trong source code | ✅ **Fixed** |
| CF-3 | 🟡 MED | Book ID ↔ Token ID mapping không chính thức | ✅ **Fixed** |
| CF-4 | 🟡 MED | Chainlink checkUpkeep là placeholder rỗng | ✅ **Fixed** |
| IR-3 | 🟡 MED | Frontend không có Contract Preview Flow | ✅ **Fixed** |
| IR-4 | 🟡 MED | Auth middleware không đồng nhất | ✅ **Fixed** |
| P2-1 | 🟢 LOW | In-memory store không resilient | ⏳ Defer (Phase 2) |
| P2-2 | 🟢 LOW | Frontend không sync on-chain BookStatus | ✅ **Fixed** |

### Chi Tiết Fix Thực Hiện

#### CF-1: Loại bỏ Duplicate SBT
- `VinaLibVault.createRental()` nhận `existingSbtId` thay vì tự mint
- Thêm `mapping(uint256 => uint256) rentalToSBT` và `uint256[] activeRentalBookIds`
- `blockchain.adapter.js` truyền `booking.rentalSBTId` (đã mint khi ký HĐ)

#### CF-2: Private Key → Environment Variable
- `blockchain.adapter.js`: `process.env.ADMIN_PRIVATE_KEY` với fail-fast message
- Tạo `backend/.env` (trong .gitignore), `.env.example` (safe to commit), `.gitignore`

#### CF-3: Book ID ↔ Token ID Mapping
- `contracts-data.json` thêm `bookIdToTokenId: {"1":1,...,"5":5}`
- Function `resolveTokenId(assetId)` ưu tiên mapping, fallback graceful

#### CF-4: Chainlink Placeholder Fix
- `checkUpkeep()` duyệt `activeRentalBookIds[]` tìm `ReturnRequested` status
- `fulfillRequest()` emit `FunctionFulfilled` event thay vì im lặng

#### IR-3: Frontend Contract Preview Flow
- `pages/contract-preview/ContractPreviewPage.tsx` — standalone page mới
- `shared/api/contracts.ts` — typed API helpers
- `App.tsx` — route `/contract-preview/:previewId` (protected)

#### IR-4: Auth Middleware Đồng Nhất
- `server.js`: `verifyUser` áp dụng cho `/api/booking`, `/api/contracts`, `/api/policy`
- `/api/admin` giữ `verifyAdmin`; Identity/IPFS vẫn public

#### P2-2: On-chain Status Polling
- `GET /api/books/:id/chain-status` — route mới gọi `bookAsset.getBookStatus()`
- `shared/hooks/useBookOnChainStatus.ts` — hook poll 30s, graceful degradation

---

## 5. Verification

```
npm test (backend)
✅ 24/24 tests PASS (tăng từ 16 — không có regression)
```

| Test Suite | Tests |
|-----------|-------|
| PolicyEngine — TrustScore | 7 pass |
| PolicyEngine — TrustBand | 3 pass |
| PolicyEngine — Policy Matrix | 14 pass |

---

## 6. Files Đã Thay Đổi

### Smart Contracts
| File | Thay Đổi |
|------|---------|
| `contracts/VinaLibVault.sol` | CF-1: bỏ SBT mint; CF-4: checkUpkeep thực sự; thêm rentalToSBT mapping |

### Web3 Service Layer (Frontend SDK)
| File | Thay Đổi |
|------|---------|
| `shared/web3/config.ts` | P2-2: Cấu hình ABI và Contract Address (VinaLibVault, BookAsset) |
| `shared/web3/Web3Provider.tsx` | CF-2: Provider Ethers.js kết nối MetaMask |
| `shared/web3/ContractService.ts` | CF-1: Wrapper cho toàn bộ Logic Callable từ UI thay cho việc gọi API |
| `react-app-env.d.ts` | CF-2: Type safety window.ethereum |

### Frontend UI / App Level
| File | Thay Đổi |
|------|---------|
| `pages/contract-preview/ContractPreviewPage.tsx` | IR-3: Hỗ trợ luồng Preview (Static) |
| `index.tsx` | IR-4: Bọc toàn ứng dụng với Web3Provider |

---

## 7. Lưu Ý Quan Trọng cho Dev

> [!WARNING]
> `VinaLibVault.sol` đã thay đổi signature `createRental()` (thêm param `existingSbtId`).
> **Phải redeploy contracts** trên Hardhat trước khi chạy backend:
> ```bash
> cd contracts
> npx hardhat run scripts/deploy.js --network localhost
> ```

> [!NOTE]
> Sau khi redeploy, cập nhật `contracts-data.json` với addresses mới và cập nhật `bookIdToTokenId` nếu tokenId thay đổi.
