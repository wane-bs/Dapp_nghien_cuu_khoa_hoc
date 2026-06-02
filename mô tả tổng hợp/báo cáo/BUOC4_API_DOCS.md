# Bước 4 — Đóng Gói Tài Liệu (Standardization)

> **Agent:** `TechnicalWriter`
> **Workflow:** `QuyTrinhPhanTichDApp.md` — Mode: CREATION
> **Ngày tạo:** 2026-02-24
> **Input:** Output Bước 1, 2, 3

---

## Tóm Tắt Hệ Thống VinaLib DApp

**VinaLib** là một nền tảng thư viện phi tập trung (True DApp) được xây dựng trên blockchain Scroll (EVM-compatible). Hệ thống cho phép quản lý vòng đời thuê/trả sách vật lý thông qua Smart Contracts, với bằng chứng pháp lý on-chain dưới dạng SBT.

---

## API Reference — Smart Contracts

### Contract: `RentalAgreementSBT`
**Địa chỉ triển khai:** Xem file `deploy_full.js` / deployment artifacts
**Chuẩn:** ERC721 Soulbound (không thể chuyển nhượng)

#### `setRentalContract(address _addr)`
- **Access:** `onlyOwner`
- **Params:** `_addr` — địa chỉ của `VinaLibVault`
- **Mô tả:** Ủy quyền cho Vault được phép mint SBT. **Phải gọi sau deploy.**

#### `safeMint(address to, bytes32 termsHash) → void`
- **Access:** Owner hoặc `rentalContract`
- **Params:**
  - `to` — địa chỉ ví nhận SBT (người thuê)
  - `termsHash` — `keccak256` của nội dung điều khoản hợp đồng
- **Effect:** Mint 1 SBT mới, lưu `rentalTerms[tokenId] = termsHash`
- **Lưu ý:** SBT KHÔNG thể transfer sau khi mint — Soulbound theo EIP-5192 tinh thần

#### `rentalTerms(uint256 tokenId) → bytes32`
- **Access:** Public view
- **Returns:** Hash điều khoản của hợp đồng tương ứng với tokenId

---

### Contract: `VinaLibVault`
**Chuẩn:** Custom + Chainlink Functions v1.0.0 + Chainlink Automation

#### `setContracts(address _bookAsset, address _rentalSBT)`
- **Access:** `onlyOwner`
- **Mô tả:** Thiết lập địa chỉ 2 contract phụ thuộc. **Phải gọi sau deploy.**

#### `createRental(address user, uint256 bookTokenId, uint64 duration, bytes32 termsHash, uint16 version, string pspRef, uint256 existingSbtId)`
- **Access:** `msg.sender == user` (Người thuê tự gọi)
- **Pre-conditions:**
  - `BookAsset.isVerified(bookTokenId) == true`
  - SBT với `existingSbtId` đã tồn tại
- **Effect:**
  - Lưu `rentalToSBT[bookTokenId] = existingSbtId`
  - Đổi book status → `Rented`
  - Gán ERC4907 user rights với `expires = block.timestamp + duration`
  - Lưu `EvidencePack` vào `activeRentals[bookTokenId]`
- **Emits:** `RentalCreated(user, bookId, expires, termsHash, version, pspRef, sbtId)`

#### `requestReturn(uint256 bookTokenId, bytes32 deliveryHash)`
- **Access:** Người thuê (renter) hoặc Owner
- **Pre-conditions:** `activeRentals[bookTokenId].status == Active`
- **Effect:** Đổi status → `ReturnRequested`, lưu `deliveryHash`
- **Emits:** `ReturnRequested(bookId, renter, deliveryHash)`

#### `confirmReturn(uint256 bookTokenId, bool isDamaged, string notes)`
- **Access:** `onlyOwner`
- **Effect:**
  - Thu hồi quyền ERC4907 (`setUser → address(0)`)
  - Cập nhật tình trạng sách (`verifyReturn`)
  - Đổi status → `Concluded`
- **Emits:** `RentalConcluded(bookId, renter, timestamp, isDamaged, notes)`

#### `cancelListing(uint256 bookTokenId)`
- **Access:** `onlyOwner`
- **Pre-conditions:** Status phải là `Active`
- **Effect:** Thu hồi quyền + khôi phục book Verified + Concluded

#### `claimCollateral(uint256 bookTokenId, string reason)`
- **Access:** `onlyOwner`
- **Pre-conditions:** Status phải là `Active` hoặc `ReturnRequested`
- **Effect:** Thu hồi quyền + mark book bị hư hại (PendingVerification) + Concluded

#### `calculateRemainingTime(uint256 bookTokenId) → uint256`
- **Returns:** Giây còn lại của thời hạn thuê (0 nếu hết hạn hoặc không active)

#### `isAvailable(uint256 bookTokenId) → bool`
- **Returns:** `true` nếu sách không có rental active

#### `getRentalInfo(uint256 bookTokenId) → (termsHash, deliveryHash, renter, version, status, timestamp, pspRef)`
- **Returns:** Toàn bộ thông tin EvidencePack

---

### Contract: `BookAsset`
**Chuẩn:** ERC4907 + ERC721 + Ownable + Pausable

#### `safeMint(address to, string cid)`
- **Access:** `onlyOwner`
- **Effect:** Mint NFT sách mới với CID (IPFS), status: `PendingVerification`

#### `verifyForListing(uint256 tokenId)`
- **Access:** `onlyOwner`
- **Pre-conditions:** Status phải là `PendingVerification`
- **Effect:** Đổi status → `Verified`, ghi timestamp + verifier

#### `isVerified(uint256 tokenId) → bool`
- **Returns:** `true` nếu book status là `Verified`

#### `tokenURI(uint256 tokenId) → string`
- **Returns:** `"https://ipfs.io/ipfs/" + tokenCIDs[tokenId]`

---

### Contract: `SuChinToken`
**Chuẩn:** ERC20 | Symbol: `SUC`

> ⚠️ Token này là **Utility Token** — chỉ dùng cho traceability và rewards. KHÔNG dùng thay VND.

---

## Hướng Dẫn Tích Hợp Frontend

### Thứ tự khởi tạo sau Deploy:
```javascript
// 1. Deploy contracts
const vault = await VinaLibVault.deploy(chainlinkRouter);
const bookAsset = await BookAsset.deploy();
const sbt = await RentalAgreementSBT.deploy();

// 2. Thiết lập liên kết
await vault.setContracts(bookAsset.address, sbt.address);
await bookAsset.setRentalContract(vault.address);
await sbt.setRentalContract(vault.address);
```

### Quy trình thuê sách từ Frontend:
```javascript
// Bước 1: Mint SBT
const termsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(termsText));
const tx1 = await sbt.safeMint(userAddress, termsHash);
const receipt1 = await tx1.wait();
const sbtId = receipt1.events[0].args.tokenId;

// Bước 2: Tạo rental
const duration = 30 * 24 * 3600; // 30 ngày
const tx2 = await vault.connect(userSigner).createRental(
  userAddress, bookTokenId, duration, termsHash, 1, "PSP-REF-XXX", sbtId
);
await tx2.wait();
```

---

## Bảo Mật & Kiểm Toán

| Hạng mục | Trạng thái |
|---------|-----------|
| Reentrancy Guard | ✅ Triển khai trên tất cả write functions |
| Access Control | ✅ onlyOwner + self-authorization |
| Soulbound mechanism | ✅ Hook `_update()` chặn transfer |
| Cross-contract call safety | ✅ `require(success, ...)` mọi external call |
| Storage optimization | ✅ Slot-packing EvidencePack |
| Pause mechanism | ✅ BookAsset có Pausable |
| Integer overflow | ✅ Solidity 0.8.20 built-in |
| Front-running | ⚠️ Chưa có commit-reveal scheme |
| Multi-sig Admin | ⚠️ Chưa triển khai (Sẽ tích hợp Gnosis Safe ở Phase này) |
| Upgrade mechanism | ❌ Không có (Đã chuyển hạng mục sang **Pending Phase 2**) |
