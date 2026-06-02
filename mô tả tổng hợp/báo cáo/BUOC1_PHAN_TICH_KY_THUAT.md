# Bước 1 — Phân Tích Kỹ Thuật (Source Code Deconstruction)

> **Agent:** `SmartContractAnalyst`
> **Workflow:** `QuyTrinhPhanTichDApp.md` — Mode: CREATION
> **Ngày tạo:** 2026-02-24
> **Input:** Toàn bộ file `.sol` trong `contracts/contracts/`

---

## 1. Danh Sách Smart Contracts

| # | Contract | File | Chuẩn | Chức năng chính |
|---|----------|------|-------|-----------------|
| 1 | `RentalAgreementSBT` | `RentalAgreementSBT.sol` | ERC721 (Soulbound) | Hợp đồng thuê dạng NFT gắn danh tính |
| 2 | `VinaLibVault` | `VinaLibVault.sol` | Custom + Chainlink | Quản lý vòng đời hợp đồng thuê |
| 3 | `BookAsset` | `BookAsset.sol` | ERC4907 + ERC721 | Tài sản sách NFT có thể cho thuê |
| 4 | `SuChinToken` | `SuChinToken.sol` | ERC20 | Utility token theo dõi & phần thưởng |

---

## 2. Bảng Endpoints (Public/External Functions)

### 2.1 `RentalAgreementSBT.sol`

| Hàm | Visibility | Modifier | Mô tả |
|-----|-----------|----------|-------|
| `setRentalContract(address)` | external | `onlyOwner` | Thiết lập địa chỉ contract được phép mint SBT |
| `safeMint(address, bytes32)` | public | Custom auth | Mint SBT mới gắn với `termsHash` điều khoản |
| `_update(address, uint256, address)` | internal override | — | Hook chặn chuyển nhượng (Soulbound logic) |

**Biến trạng thái:**
- `uint256 private _nextTokenId` — Bộ đếm token tự động tăng
- `mapping(uint256 => bytes32) public rentalTerms` — tokenId → hash điều khoản
- `address public rentalContract` — địa chỉ contract được ủy quyền mint

---

### 2.2 `VinaLibVault.sol`

| Hàm | Visibility | Modifier | Mô tả |
|-----|-----------|----------|-------|
| `setConfig(uint64, bytes32, uint32)` | external | `onlyOwner` | Cấu hình Chainlink Functions |
| `sendRequest(string, string[], bytes[])` | external | `onlyOwner` | Gửi request đến Chainlink Functions |
| `fulfillRequest(bytes32, bytes, bytes)` | internal override | — | Callback nhận kết quả từ Chainlink |
| `checkUpkeep(bytes)` | external view | — | Kiểm tra điều kiện tự động hóa |
| `performUpkeep(bytes)` | external | — | Thực thi tự động hóa khi có upkeep |
| `setContracts(address, address)` | external | `onlyOwner` | Gán địa chỉ BookAsset + RentalSBT |
| `createRental(address, uint256, uint64, bytes32, uint16, string, uint256)` | external | `nonReentrant` | Khởi tạo hợp đồng thuê |
| `requestReturn(uint256, bytes32)` | external | `nonReentrant` | Người thuê yêu cầu trả sách |
| `confirmReturn(uint256, bool, string)` | external | `onlyOwner`, `nonReentrant` | Admin xác nhận nhận sách trả |
| `cancelListing(uint256)` | external | `onlyOwner`, `nonReentrant` | Hủy niêm yết đang Active |
| `claimCollateral(uint256, string)` | external | `onlyOwner`, `nonReentrant` | Xử lý tranh chấp/vi phạm |
| `calculateRemainingTime(uint256)` | external view | — | Tính thời gian thuê còn lại |
| `isAvailable(uint256)` | external view | — | Kiểm tra sách có sẵn để thuê |
| `getRentalInfo(uint256)` | external view | — | Lấy toàn bộ thông tin rental |

**Biến trạng thái:**
- `struct EvidencePack` — Slot-packed: termsHash, deliveryHash, renter, version, status, timestamp, pspRef
- `enum RentalStatus` — `Active | ReturnRequested | Concluded`
- `mapping(uint256 => EvidencePack) public activeRentals` — bookTokenId → evidence
- `mapping(uint256 => uint256) public rentalToSBT` — bookTokenId → SBT ID
- `uint256[] public activeRentalBookIds` — mảng để Chainlink iterate

**Events:**
- `RentalCreated`, `ReturnRequested`, `RentalConcluded`, `RentalCancelled`, `CollateralClaimed`, `UpkeepPerformed`, `FunctionsRequestFulfilled`

---

### 2.3 `BookAsset.sol`

| Hàm | Visibility | Modifier | Mô tả |
|-----|-----------|----------|-------|
| `safeMint(address, string)` | public | `onlyOwner` | Tạo NFT sách mới (status: PendingVerification) |
| `verifyForListing(uint256)` | external | `onlyOwner` | Admin xác nhận sách đủ điều kiện niêm yết |
| `verifyPreRent(uint256)` | external | `onlyOwner` | Admin xác nhận trước khi cho thuê |
| `markAsRented(uint256)` | external | Owner/Vault | Đánh dấu sách đang được thuê |
| `verifyReturn(uint256, bool)` | external | Owner/Vault | Xác nhận sách đã trả + kiểm tra tình trạng |
| `isVerified(uint256)` | external view | — | Kiểm tra sách có status Verified |
| `getBookStatus(uint256)` | external view | — | Lấy trạng thái sách hiện tại |
| `setUser(uint256, address, uint64)` | public override | Owner/Approved/Vault | Gán quyền sử dụng ERC4907 |
| `pause()` / `unpause()` | public | `onlyOwner` | Tạm dừng/Kích hoạt contract |

**Enum:**
- `BookStatus`: `PendingVerification | Verified | Rented | Returned`

---

### 2.4 `SuChinToken.sol`

| Hàm | Visibility | Modifier | Mô tả |
|-----|-----------|----------|-------|
| `constructor()` | — | — | Mint 1,000,000 SUC cho deployer |
| `mint(address, uint256)` | public | `onlyOwner` | Mint thêm token (chỉ Dev/Test) |

---

## 3. Ma Trận Phân Quyền (Access Control Matrix)

| Hành động | Người Thuê (Renter) | Admin/Owner | Contract Vault | Contract SBT | Public |
|-----------|:-------------------:|:-----------:|:--------------:|:------------:|:------:|
| Mint BookAsset | ✗ | ✅ | ✗ | ✗ | ✗ |
| Verify sách cho niêm yết | ✗ | ✅ | ✗ | ✗ | ✗ |
| Verify sách trước thuê | ✗ | ✅ | ✗ | ✗ | ✗ |
| Mint SBT | ✗ | ✅ | ✅ | — | ✗ |
| Tạo Rental (`createRental`) | ✅ (self only) | ✅ | ✗ | ✗ | ✗ |
| Yêu cầu trả sách | ✅ (self) | ✅ | ✗ | ✗ | ✗ |
| Xác nhận trả sách | ✗ | ✅ | ✗ | ✗ | ✗ |
| Hủy niêm yết | ✗ | ✅ | ✗ | ✗ | ✗ |
| Xử lý tranh chấp | ✗ | ✅ | ✗ | ✗ | ✗ |
| Đọc thông tin thuê | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chainlink Automation | ✗ | ✗ | Auto | ✗ | ✅ |

---

## 4. Điểm Tương Tác Liên Contract (Cross-Contract Calls)

```
VinaLibVault → BookAsset.isVerified()        [staticcall, read]
VinaLibVault → BookAsset.markAsRented()      [call, write]
VinaLibVault → BookAsset.setUser()           [call, write]
VinaLibVault → BookAsset.verifyReturn()      [call, write]
```

> ⚠️ **Ghi chú:** `VinaLibVault` KHÔNG gọi trực tiếp `RentalAgreementSBT`. SBT phải được mint độc lập trước khi truyền `existingSbtId` vào `createRental()`.
