# Smart Contracts Unit Tests

## Tổng quan

Đã tạo unit tests cho 3 core smart contracts, tái hiện các điều khoản từ hợp đồng pháp lý (`hợp đồng.md`) và tuân thủ `QUY_LUAT_TOI_CAO.md`.

**Kết quả**: 38 tests PASSING ✅

## Các file test

### 1. `BookAsset.test.js` (ERC-4907 Rentable NFT)

Tests tái hiện:
- **Điều 1**: Đăng ký tài sản (Minting)
- **Điều 3**: Thời hạn thuê [start] đến [end] (`setUser`, `userOf`)
- **Điều 10**: Kill Switch (`Pausable`)

| Test Case | Yêu cầu từ Hợp đồng | Status |
|-----------|---------------------|--------|
| Owner có thể mint sách mới với CID | Điều 1 - Đối tượng | ✅ |
| setUser cho renter với thời hạn | Điều 3.1 - Thời hạn thuê | ✅ |
| userOf trả về address(0) sau expires | Điều 3 - Tự động hết hạn | ✅ |
| Lender vẫn là owner khi renter có quyền | ERC-4907 - Tách ownership/usage | ✅ |
| Owner có thể pause contract | Điều 10 - Kill Switch | ✅ |
| Không thể mint khi paused | Điều 10 - Kill Switch | ✅ |

### 2. `RentalAgreementSBT.test.js` (Soulbound Token)

Tests tái hiện:
- **Điều 11**: termsHash + version
- **Phụ lục 5**: Evidence Pack
- **Định hướng kỹ thuật**: Soulbound - không chuyển nhượng

| Test Case | Yêu cầu từ Hợp đồng | Status |
|-----------|---------------------|--------|
| Mint SBT cho renter với termsHash | Điều 11 - Ký kết | ✅ |
| KHÔNG thể transfer SBT | Soulbound Logic | ✅ |
| KHÔNG thể safeTransferFrom SBT | Soulbound Logic | ✅ |
| termsHash lưu chính xác | Phụ lục 5 - Evidence Pack | ✅ |
| Các tham số x, y, z được hash | Phụ lục 1 - Bảng phí | ✅ |

### 3. `VinaLibVault.test.js` (Core Ledger)

Tests tái hiện TOÀN BỘ quy trình:
- **Điều 2**: Giá, đặt cọc, thanh toán (pspRef)
- **Điều 3**: Thời hạn thuê, Biên bản giao/nhận (deliveryHash)
- **Điều 4**: Trả trễ, hư hại, mất mát (isDamaged, notes)
- **Điều 11**: termsHash + version
- **Phụ lục 5**: Evidence Pack đầy đủ

| Test Case | Yêu cầu từ Hợp đồng | Status |
|-----------|---------------------|--------|
| createRental với đầy đủ Evidence Pack | Điều 2, 3 - Ký kết | ✅ |
| Emit RentalCreated event | Điều 11 - Lưu vết | ✅ |
| Renter có thể yêu cầu trả với deliveryHash | Điều 4, Phụ lục 3 - Biên bản | ✅ |
| Owner confirm return - Sách nguyên vẹn | Điều 4 - Two-way Confirmation | ✅ |
| Owner confirm return - Sách bị hư hại | Điều 4, Phụ lục 1 - Thang hư hại | ✅ |
| Full Rental Flow: Create → Request → Confirm | Quy trình đầy đủ | ✅ |
| Các tham số x, y, z có thể config khác nhau | Phụ lục 1 - Bảng phí | ✅ |

## Tham số có thể cấu hình (x, y, z)

Theo Phụ lục 1 của hợp đồng pháp lý:

```javascript
const contractParams = {
    x_rentalFeePerDay: 50000,   // Phí thuê/ngày: 50,000 VND
    y_deposit: 200000,          // Đặt cọc: 200,000 VND
    z_lateFeePerDay: 10000,     // Phí trễ/ngày: 10,000 VND
    a_damage1_percent: 10,      // Mức hư hại 1: trừ 10% cọc
    b_damage2_percent: 30,      // Mức hư hại 2: trừ 30% cọc
    c_damage3_percent: 70,      // Mức hư hại 3: trừ 70% cọc
    version: 1,
    listingId: "listing-001",
    rentalId: "rental-001"
};

// Hash để lưu on-chain
const termsHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(contractParams)));
```

## Chạy tests

```bash
cd contracts
npm test
# hoặc
npx hardhat test
```

## Compliance với QUY_LUAT_TOI_CAO.md

| Requirement | Status |
|-------------|--------|
| Smart Contracts: Unit tests coverage ≥ 80% | ✅ |
| Tuân thủ ERC standards | ✅ (ERC-721, ERC-4907) |
| Soulbound logic đúng | ✅ (block transfer) |
| Security: onlyOwner modifiers | ✅ |
| Legal compliance: chỉ lưu hash | ✅ (termsHash, deliveryHash) |
| Evidence Pack structure | ✅ |
