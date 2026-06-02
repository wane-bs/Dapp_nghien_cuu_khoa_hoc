# Bước 3 — Phân Tích Nghiệp Vụ (Business Modeling)

> **Agent:** `BusinessFintechAnalyst`
> **Workflow:** `QuyTrinhPhanTichDApp.md` — Mode: CREATION
> **Ngày tạo:** 2026-02-24
> **Input:** Sơ đồ kiến trúc từ Bước 2

---

## 1. Sơ Đồ Use-Case Tổng Quát

```
┌──────────────────────────────────────────────────────────────────┐
│                  Hệ Thống VinaLib DApp                          │
│                                                                  │
│  ┌─────────────┐      ┌─────────────────────────────────────┐   │
│  │             │      │  UC1: Thuê sách                     │   │
│  │   KHÁCH     │──────►  UC2: Trả sách                      │   │
│  │   HÀNG      │      │  UC3: Xem thông tin thuê            │   │
│  │ (Renter)    │      │  UC4: Xem thời gian còn lại         │   │
│  └─────────────┘      └─────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐      ┌─────────────────────────────────────┐   │
│  │             │      │  UC5: Mint sách NFT                 │   │
│  │    ADMIN    │──────►  UC6: Xác nhận sách (for listing)   │   │
│  │  (Library   │      │  UC7: Xác nhận trước khi cho thuê   │   │
│  │   Owner)    │      │  UC8: Xác nhận sách trả             │   │
│  └─────────────┘      │  UC9: Hủy niêm yết                  │   │
│                        │  UC10: Xử lý tranh chấp             │   │
│                        │  UC11: Cấu hình Chainlink           │   │
│                        └─────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐      ┌─────────────────────────────────────┐   │
│  │  CHAINLINK  │      │  UC12: Phát hiện ReturnRequested    │   │
│  │  AUTOMATION │──────►  UC13: Kích hoạt performUpkeep      │   │
│  └─────────────┘      └─────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Máy Trạng Thái (State Machine) — Vòng Đời Sách

```
                     [Admin: verifyForListing]
[safeMint] ──────► PendingVerification ──────────────► Verified
                          ▲                               │
                          │                               │ [createRental / Vault.markAsRented]
                          │                               ▼
                [verifyReturn(isDamaged=true)]          Rented
                          │                               │
                          │                [requestReturn → confirmReturn]
                          │                 [cancelListing / claimCollateral]
                          │                               │
                          └───────────────────────────────┘
                              [verifyReturn(isDamaged=false)] → Verified
```

---

## 3. Máy Trạng Thái — Vòng Đời Hợp Đồng Thuê (EvidencePack)

```
                [createRental()]
    ─────────────────────────────► Active ──────────────────────────┐
                                     │                              │
                                     │ [requestReturn()]            │ [confirmReturn / Admin trực tiếp]
                                     ▼                              │
                               ReturnRequested                      │
                                     │                              │
                                     │ [confirmReturn()]            │
                                     ▼                              ▼
                                 Concluded ◄──── [cancelListing / claimCollateral]
```

**Điều kiện chuyển trạng thái:**

| Transition | Điều kiện | Actor |
|------------|-----------|-------|
| → Active | Book Verified + SBT tồn tại | Khách hàng (self) |
| Active → ReturnRequested | Rental đang Active | Khách hàng hoặc Admin |
| ReturnRequested → Concluded | Rental ở ReturnRequested | Admin (onlyOwner) |
| Active → Concluded | Hủy hoặc khiếu nại | Admin (onlyOwner) |

---

## 4. Business Flows Chi Tiết

### Flow 1: Quy Trình Thuê Sách Đầy Đủ

```
1. [Admin] Mint NFT sách → BookAsset (status: PendingVerification)
2. [Admin] verifyForListing → status: Verified
3. [Khách hàng] Mint SBT trước: RentalAgreementSBT.safeMint(wallet, termsHash)
   → nhận về: existingSbtId
4. [Khách hàng] Gọi VinaLibVault.createRental(
       user=wallet,
       bookTokenId=X,
       duration=30days,
       termsHash=keccak256(terms),
       version=1,
       pspRef="PSP-TXN-12345",
       existingSbtId=Y
   )
5. Vault kiểm tra: isVerified(X) == true?
6. Vault lưu: rentalToSBT[X] = Y
7. Vault đổi trạng thái: BookAsset.markAsRented(X)
8. Vault gán quyền: BookAsset.setUser(X, wallet, now+30days)
9. Vault lưu EvidencePack: activeRentals[X]
10. Emit: RentalCreated event
```

### Flow 2: Quy Trình Trả Sách

```
1. [Khách hàng] Gọi requestReturn(bookTokenId, deliveryHash)
   → status: ReturnRequested
   → Emit: ReturnRequested event
2. [Chainlink Automation] checkUpkeep() phát hiện ReturnRequested
   → performUpkeep() → Emit: UpkeepPerformed
3. [Admin] Xác nhận thực tế → confirmReturn(bookTokenId, isDamaged, notes)
   → Thu hồi quyền: setUser(_, address(0), 0)
   → Cập nhật sách: verifyReturn(_, isDamaged)
   → status: Concluded
   → Emit: RentalConcluded event
```

---

## 5. Ước Tính Gas Consumption

| Thao tác | Ước tính Gas | Ghi chú |
|----------|-------------|---------|
| `BookAsset.safeMint()` | ~80,000 | ERC721 mint + storage |
| `BookAsset.verifyForListing()` | ~35,000 | Đổi mapping status |
| `RentalAgreementSBT.safeMint()` | ~85,000 | ERC721 mint + termsHash |
| `VinaLibVault.createRental()` | ~180,000–220,000 | 2 cross-contract calls + storage |
| `VinaLibVault.requestReturn()` | ~40,000 | Đổi status + event |
| `VinaLibVault.confirmReturn()` | ~90,000 | 2 cross-contract calls + cleanup array |
| `VinaLibVault.cancelListing()` | ~85,000 | 2 cross-contract calls + cleanup |
| `VinaLibVault.claimCollateral()` | ~85,000 | 2 cross-contract calls + cleanup |
| View functions | ~5,000–20,000 | Read-only, không tốn gas |

> **Tổng chi phí luồng thuê đầy đủ (Mint→Rent→Return):**
> ≈ 80,000 + 35,000 + 85,000 + 200,000 + 40,000 + 90,000 = **~530,000 gas**
> Trên Scroll L2: Tương đương ~$0.02–0.10 USD tùy giá gas.

---

## 6. Tokenomics SuChinToken (SUC)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Tổng cung ban đầu** | 1,000,000 SUC |
| **Chuẩn** | ERC20 |
| **Mục đích** | Traceability & Rewards — KHÔNG dùng thanh toán VND |
| **Phân phối** | 100% cho Deployer (Admin), mint thêm khi cần |
| **Cơ chế burn** | Chưa triển khai (planned) |

> ⚠️ **Cảnh báo:** `SuChinToken` được thiết kế là **Utility Token thuần túy** — KHÔNG thể thay thế VND trong thanh toán thực tế theo quy định pháp luật Việt Nam.

---

## 7. Bản Đồ Rủi Ro Nghiệp Vụ

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
|--------|--------|---------------------|
| Sách bị thuê mà không có SBT hợp lệ | Cao | `existingSbtId` bắt buộc trong createRental |
| Người thuê chuyển nhượng SBT cho người khác | Cao | Soulbound lock trong `_update()` hook |
| Vault gọi BookAsset fail (revert) | Trung bình | `require(success, ...)` (Đang xử lý: Áp dụng `IBookAsset` Interface ở Phase 4) |
| Reentrancy attack | Cao | `nonReentrant` trên tất cả write functions |
| Admin mất quyền kiểm soát | Trung bình | `Ownable` (Đang xử lý: Tích hợp Gnosis Safe ở Phase 4) |
| Sách bị cho thuê khi chưa verify | Cao | `isVerified()` check đầu tiên trong createRental |
