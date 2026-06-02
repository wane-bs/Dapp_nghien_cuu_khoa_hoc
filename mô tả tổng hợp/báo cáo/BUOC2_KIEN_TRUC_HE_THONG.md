# Bước 2 — Trừu Tượng Hóa Hệ Thống (System Abstraction)

> **Agent:** `DAppArchitect`
> **Workflow:** `QuyTrinhPhanTichDApp.md` — Mode: CREATION
> **Ngày tạo:** 2026-02-24
> **Input:** Output Bước 1 (Endpoints + Access Control Matrix)

---

## 1. Sơ Đồ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OFF-CHAIN LAYER                             │
│                                                                     │
│   ┌──────────────┐    IPFS/Metadata    ┌──────────────────────┐    │
│   │   Frontend   │◄───────────────────►│  IPFS (Book CIDs)    │    │
│   │  (Web3 DApp) │                     └──────────────────────┘    │
│   └──────┬───────┘                                                  │
│          │ ethers.js / wagmi                                        │
└──────────┼──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ON-CHAIN LAYER (Scroll/EVM)                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    VinaLibVault.sol                          │   │
│  │  (Controller: Quản lý vòng đời Rental + Chainlink Oracles)  │   │
│  └──────┬─────────────────────┬───────────────────────┬────────┘   │
│         │                     │                       │            │
│         ▼                     ▼                       ▼            │
│  ┌─────────────┐    ┌──────────────────────┐  ┌─────────────┐     │
│  │  BookAsset  │    │  RentalAgreementSBT   │  │ SuChinToken │     │
│  │  .sol       │    │  .sol                 │  │ .sol        │     │
│  │  (ERC4907)  │    │  (ERC721 Soulbound)   │  │ (ERC20 SUC) │     │
│  └─────────────┘    └──────────────────────┘  └─────────────┘     │
│                                                                     │
│  ┌──────────────────┐    ┌───────────────────────┐                 │
│  │ Chainlink        │    │ Chainlink Automation   │                 │
│  │ Functions        │    │ (AutomationCompatible) │                 │
│  └──────────────────┘    └───────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Diagram (DFD) — Luồng Thuê Sách

```
[Khách Hàng / Frontend]
        │
        │ B0: Mint SBT (termsHash)
        ▼
[RentalAgreementSBT.safeMint()]
        │ → Trả về existingSbtId
        │
        │ B1: createRental(user, bookTokenId, duration, termsHash, ...)
        ▼
[VinaLibVault.createRental()]
        │
        ├─► BookAsset.isVerified(bookTokenId)      → Check: sách đã được Admin xác nhận?
        ├─► rentalToSBT[bookTokenId] = existingSbtId  → Lưu liên kết SBT
        ├─► BookAsset.markAsRented(bookTokenId)    → Đổi status sách → Rented
        ├─► BookAsset.setUser(bookTokenId, user, expires) → Gán quyền ERC4907
        └─► activeRentals[bookTokenId] = EvidencePack → Lưu bằng chứng
        │
        │ Event: RentalCreated(user, bookId, expires, termsHash, version, pspRef, sbtId)
        ▼
[Rental ACTIVE — Người thuê đang dùng sách]
        │
        │ B2: requestReturn(bookTokenId, deliveryHash)
        ▼
[VinaLibVault.requestReturn()]
        │ → status: ReturnRequested
        │ → Chainlink Automation: checkUpkeep() phát hiện
        │
        │ B3: confirmReturn(bookTokenId, isDamaged, notes) [Admin]
        ▼
[VinaLibVault.confirmReturn()]
        │
        ├─► BookAsset.setUser(bookTokenId, address(0), 0)  → Thu hồi quyền dùng
        └─► BookAsset.verifyReturn(bookTokenId, isDamaged) → Cập nhật tình trạng sách
        │
        │ Event: RentalConcluded(...)
        ▼
[Rental CONCLUDED]
```

---

## 3. Kiến Trúc Lưu Trữ On-chain vs Off-chain

| Dữ liệu | Nơi lưu | Hình thức |
|---------|---------|-----------|
| Thông tin sách (tên, tác giả, bìa) | IPFS | CID hash → `BookAsset.tokenCIDs[tokenId]` |
| Quyền sở hữu sách (NFT) | On-chain (BookAsset) | `ownerOf(tokenId)` — ERC721 |
| Quyền sử dụng tạm thời (ERC4907) | On-chain (BookAsset) | `_users[tokenId]` — expires |
| Trạng thái sách | On-chain (BookAsset) | `bookStatuses[tokenId]` |
| Bằng chứng hợp đồng (EvidencePack) | On-chain (Vault) | `activeRentals[bookTokenId]` |
| Hash điều khoản (terms fingerprint) | On-chain (SBT + Vault) | `rentalTerms[sbtId]` + `termsHash` |
| Điều khoản hợp đồng đầy đủ | Off-chain (IPFS/Backend) | Tham chiếu qua `termsHash` |
| PSP Reference (thanh toán) | On-chain (Vault.pspRef) | String on-chain |
| Logs từ Chainlink Functions | On-chain (Vault.logs[]) | `LogData[]` array |

---

## 4. Sơ Đồ Phân Cấp Contract

```
VinaLibVault [Controller]
├── inherits: FunctionsClient (Chainlink)
├── inherits: AutomationCompatibleInterface (Chainlink)
├── inherits: ReentrancyGuard (OpenZeppelin)
├── inherits: Ownable (OpenZeppelin)
├── calls → BookAsset (ERC4907)
│            ├── inherits: ERC721
│            ├── inherits: Ownable
│            └── inherits: Pausable
└── references → RentalAgreementSBT (SBT)
                  ├── inherits: ERC721
                  └── inherits: Ownable

SuChinToken [Independent Utility]
├── inherits: ERC20
└── inherits: Ownable
```

---

## 5. Luồng Ngoại Lệ (Exception Flows)

### 5.1 Hủy niêm yết (Admin Cancel)
```
Admin → VinaLibVault.cancelListing(bookTokenId)
      → BookAsset.setUser(_, address(0), 0)   [Thu hồi quyền]
      → BookAsset.verifyReturn(_, false)        [Khôi phục status Verified]
      → status: Concluded
      → Event: RentalCancelled
```

### 5.2 Tranh chấp / Vi phạm (Collateral Claim)
```
Admin → VinaLibVault.claimCollateral(bookTokenId, reason)
      → BookAsset.setUser(_, address(0), 0)   [Thu hồi quyền]
      → BookAsset.verifyReturn(_, true)         [Mark sách hư hại]
      → status: Concluded (sách → PendingVerification)
      → Event: CollateralClaimed
```

### 5.3 Chainlink Automation (Tự Động Hóa)
```
Chainlink Network → checkUpkeep()
                  → Phát hiện: rental.status == ReturnRequested
                  → return (true, abi.encode(bookId))
                  → performUpkeep(bookId)
                  → emit UpkeepPerformed
```

---

## 6. Những Thay Đổi Kiến Trúc Đáng Chú Ý (Delta)

| Thay đổi | Trước | Sau |
|----------|-------|-----|
| SBT Minting | Vault tự mint trong `createRental()` | Mint độc lập TRƯỚC, truyền `existingSbtId` |
| Quyền `createRental` | `onlyOwner` | `msg.sender == user` (True DApp) |
| Security | Không có ReentrancyGuard | Thêm `nonReentrant` toàn bộ write functions |
| Storage | Chưa tối ưu | Slot-packing trong `EvidencePack` |
