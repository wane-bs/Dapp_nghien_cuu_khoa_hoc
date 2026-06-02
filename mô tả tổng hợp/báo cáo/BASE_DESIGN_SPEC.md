# Base Design Specification

## 1. Định danh cốt lõi (Core Identities)

### Storage Structs (`VinaLibVault`)
| Struct Name | Fields (Slot Packed) | Size/Type |
|-------------|----------------------|-----------|
| `EvidencePack` | `termsHash` | bytes32 (Slot 1) |
|             | `deliveryHash` | bytes32 (Slot 2) |
|             | `renter` | address (20B, Slot 3) |
|             | `version` | uint16 (2B, Slot 3) |
|             | `status` | RentalStatus enum (1B, Slot 3) |
|             | `timestamp` | uint256 (Slot 4) |
|             | `pspRef` | string (dynamic, Slot 5+) |

### Enums
- **`BookStatus`** (`BookAsset`):
  - `PendingVerification` (0): Chờ Admin xác nhận
  - `Verified` (1): Đã xác nhận, sẵn sàng
  - `Rented` (2): Đang cho thuê
  - `Returned` (3): Đã trả, chờ verify lại
- **`RentalStatus`** (`VinaLibVault`):
  - `Active` (0): Đang thuê
  - `ReturnRequested` (1): Đã gửi yêu cầu trả
  - `Concluded` (2): Đã hoàn tất (đã trả, hoặc bị hủy/claim)

## 2. Phân loại Thành phần (Component Status)

- **BookAsset.sol**: `KEEP` ✅ (Logic quản lý NFT và kiểm duyệt đã tối ưu)
- **RentalAgreementSBT.sol**: `KEEP` ✅ (Logic Soulbound chặt chẽ, an toàn)
- **VinaLibVault.sol**: `KEEP` ✅ (Logic Vault cốt lõi đã triển khai tốt, bao gồm ReentrancyGuard, slot packing, check quyền hợp lệ). Test case đã cover các luồng.
- **SuChinToken.sol**: `KEEP` ✅ (Utility test)
- **ERC4907, IERC4907, Mocks.sol**: `KEEP` ✅ (Core lib)

## 3. Kiến trúc Frontend-facing (Interface Extraction)
Từ cấu trúc trên, Frontend chỉ cần giao tiếp các View Functions và trạng thái chuẩn từ `VinaLibVault` và `BookAsset`.
Sử dụng `PROJECT_MANIFEST_REFACTORED.json` để lấy các `abi_snapshot` tối giản khi query trạng thái. Dòng tiền logic sẽ không cần gọi đến file code Solidity gốc nữa.
