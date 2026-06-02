# BÁO CÁO KIỂM TRA THẨM QUYỀN VÀ CHỨC NĂNG HỆ THỐNG VINALIB-VAULT

**Ngày cập nhật**: 21/02/2026
**Phiên bản**: 2.5 (Cập nhật DApp Analysis)
**Người lập**: AI Assistant (Antigravity)

---

## 🎯 TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Hệ thống hoạt động theo mô hình **Tập trung (Admin-centric)**. Quyền hạn được kiểm soát chặt chẽ để đảm bảo tính xác thực của tài sản (Sách) và hiệu lực của hợp đồng (Smart Contract). Bên cạnh đó, các bên tham gia được phép tùy chỉnh một số **Tham số Thuê (Rental Parameters)** để linh hoạt theo thị trường.

---

## 📋 BẢNG MA TRẬN PHÂN QUYỀN (SMART CONTRACT & DAPP MATRIX)

Hệ thống hoạt động theo mô hình **Smart Contract-centric**. Quyền hạn thực sự nằm ở **Chủ Sở Hữu Node/Contract (Contract Owner)** và **Chủ Sở Hữu NFT (Book Owner)** thay vì Backend Admin truyền thống.

| Chức năng / Module | 👮 Contract Owner | 🏠 NFT Owner (Lender) | 👤 User (Renter Wallet) |
| :--- | :---: | :---: | :---: |
| **AUTH & IDENTITY (WALLET LEVEL)** |
| Kết nối Ví MetaMask | ✅ | ✅ | ✅ |
| Cấp quyền Phê duyệt NFT (setApprovalForAll) | ❌ | ✅ | ❌ |
| **QUẢN LÝ SÁCH (BookAsset.sol)** |
| Mint Sách mới (`safeMint`) | ✅ (Owner Only) | ❌ | ❌ |
| Thiết lập ảnh/metadata (IPFS CID) | ✅ | ❌ | ❌ |
| Verify/Xác nhận có thực (`verifyForListing`) | ✅ | ❌ | ❌ |
| Tạm ngưng Giao dịch Sách (`pause`/`unpause`) | ✅ | ❌ | ❌ |
| Xem danh sách (Public Call) | ✅ | ✅ | ✅ |
| **HỢP ĐỒNG & THUÊ SÁCH (VinaLibVault.sol)** |
| Tạo hợp đồng & Lưu Evidence (`createRental`) | ✅ (Owner Only) | ❌ | ❌ (Backend call) |
| Yêu cầu trả sách lượt về (`requestReturn`) | ✅ | ❌ | ✅ |
| Xác nhận hàng về & Hoàn tất (`confirmReturn`) | ✅ | ❌ | ❌ |
| Hủy niêm yết/Thu hồi (`cancelListing`) | ✅ | ❌ | ❌ |
| Tịch thu tiền cọc do tranh chấp (`claimCollateral`) | ✅ | ❌ | ❌ |
| Cấp SBT Chứng nhận (`RentalAgreementSBT`) | ✅ (Logic System) | ❌ | ❌ |
| **TÀI CHÍNH & TOKENOMIC (SuChinToken.sol - Future)** |
| Mint/Burn Token | ✅ | ❌ | ❌ |
| Ký quỹ & Tham số Vĩ mô | ✅ (Overrides) | ❌ | ❌ |

---

## 🛠️ CHI TIẾT CẤU HÌNH THAM SỐ (PARAMETER CONFIGURATION)

### 1. 🏠 Dành cho LENDER (Cấu hình theo Sách)
Lender có quyền thiết lập các tham số kinh tế cho từng đầu sách mình sở hữu. Đã triển khai giao diện **Preset Buttons** để thao tác nhanh:
*   **Rental Price (Giá thuê)**: Nhập số tiền (VND).
*   **Deposit Amount (Giá trị cọc)**: Chọn các mức % theo giá thuê (Preset: **50%, 80%, 100%, 120%, 150%**).
*   **Late Fee Policy (Phí trễ hạn)**: Chọn mức phạt theo ngày (Preset: **5%, 10%, 15%, 20%, 25%**).
*   **Min/Max Duration (Thời hạn thuê)**:
    *   Min: Chọn [1, 3, 5, 7] ngày.
    *   Max: Chọn [7, 14, 21, 30] ngày.

### 2. 👮 Dành cho ADMIN (Cấu hình Hệ thống & Override)
Admin thiết lập các tham số vĩ mô trong tab **"⚙️ Cấu hình"** trên Admin Dashboard:
*   **Global Collateral Ratio (Tỷ lệ ký quỹ chuẩn)**: Chọn mức cọc tối thiểu bắt buộc (Preset: **50% - 100%**).
*   **Platform Fee (Phí sàn)**: % doanh thu trích lại cho hệ thống (Preset: **5% - 20%**).
*   **Verify Listing**: Nút duyệt sách mới được niêm yết bởi Lender.

### 3. 👤 Dành cho USER (Lựa chọn khi Thuê)
Khi tạo đơn thuê, User có thể lựa chọn các tham số trong phạm vi cho phép:
*   **Rental Duration**: Chọn số ngày muốn thuê (trong khoảng Min-Max của Lender).
*   **Insurance (Optional)**: Chọn mua thêm gói bảo hiểm hư hại (nếu hệ thống hỗ trợ).

---

## 🛠️ CHỨC NĂNG CHI TIẾT CỦA CÁC VAI TRÒ (Updated)

*   **ADMIN**: Ngoài các chức năng quản trị, phê duyệt, Admin giờ đây đóng vai trò **"Cân bằng nền kinh tế"** (Economic Balancer), đảm bảo các tham số giá và phí hợp lý, bảo vệ cả Lender và User.
*   **LENDER**: Được trao quyền tự chủ kinh doanh nhiều hơn thông qua việc định giá và chính sách phạt, nhưng vẫn chịu sự giám sát của chuẩn hệ thống.

---

## 🔒 CƠ CHẾ BẢO MẬT & KIỂM SOÁT (WEB3 SECURITY)

1.  **Chữ ký Số & Định Tội (On-chain Signatures)**:
    *   Mọi yêu cầu thay đổi trạng thái Node (Mint, Rent, Return) bắt buộc phải ký bằng Private Key của ví MetaMask khớp với địa chỉ gán quyền. Nếu sai ví, RPC sẽ Reject trước khi Broadcast.

2.  **Smart Contract Checks (`require` Modifiers)**:
    *   Hàm `createRental` trong `VinaLibVault.sol` sẽ kiểm tra số dư ETH gửi kèm (`msg.value`) có đủ trả `Fee + Deposit` hay không.
    *   Hàm `verifyForListing` ứng dụng mẫu `onlyOwner` (bởi OpenZeppelin) giúp miễn nhiễm các cuộc gọi mạo danh Admin từ ví ngoài.

3.  **Bất biến của Evidence Pack (Immutability)**:
    *   Các tham số thuê (Fee, Hash điều khoản) được băm vào EvidencePack. Không có tác nhân nào kể cả Contract Owner có quyền thay đổi sau khi SBT Token đã được cấp phát.
