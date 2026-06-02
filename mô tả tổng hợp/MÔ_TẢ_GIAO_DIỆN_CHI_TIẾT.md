# MÔ TẢ CHI TIẾT GIAO DIỆN NGƯỜI DÙNG (FRONTEND SPECS)

Tài liệu này mô tả chi tiết các trang màn hình trong hệ thống VinaLib-Vault, bao gồm thông tin hiển thị, dữ liệu yêu cầu nhập vào và logic xử lý tương ứng.

---

## 1. PHÂN HỆ CHUNG & XÁC THỰC (AUTHENTICATION)

### 1.1 Trang Đăng Nhập (Login Page)
- **URL**: `/login`
- **Mục đích**: Xác thực người dùng để truy cập hệ thống.
- **Thông Tin Hiển Thị**:
    - Form đăng nhập (Username, Password).
    - Các nút "Quick Login" (Đăng nhập nhanh cho testing): User, Admin, Lender.
    - Liên kết tới trang Đăng ký.
- **Thông Tin Yêu Cầu**:
    - `username` (Bắt buộc).
    - `password` (Tùy chọn trong môi trường Dev/Mock).
- **Xử Lý Logic**:
    - Gọi fallback hàm Login nội bộ (Web3 Dapp yêu cầu Connect Wallet).
    - Nếu thành công:
        - Lưu thông tin `user` vào Context/Local Storage.
        - Điều hướng tới `/dashboard` (nếu là User/Lender) hoặc `/owner` (nếu là Admin).
    - Môi trường thực tế: Xác thực bằng MetaMask signature thay vì username/password.

### 1.2 Trang Đăng Ký (Register Page)
- **URL**: `/register`
- **Mục đích**: Tạo tài khoản mới.
- **Thông Tin Hiển Thị**:
    - Form đăng ký.
- **Thông Tin Yêu Cầu**:
    - `username`: Tên đăng nhập mong muốn.
    - `email`: Địa chỉ email.
- **Xử Lý Logic (Web3 Flow)**:
    - User sử dụng Wallet để đăng nhập, form đăng ký chỉ map thông tin cá nhân.
    - Lưu local thông tin giả lập (Offline Mode).
    - Sau khi thành công, chuyển hướng về trang Login.

---

## 2. PHÂN HỆ NGƯỜI THUÊ (RENTER PORTAL)

### 2.1 Trang Chủ / Dashboard (Home Page)
- **URL**: `/dashboard`
- **Mục đích**: Tìm kiếm sách, thuê sách và quản lý trạng thái thuê hiện tại.
- **Thông Tin Hiển Thị**:
    - **Danh sách Sách (Phải)**: Ảnh bìa, Tên sách, Tác giả, Giá thuê/ngày, Token ID (link tới Explorer), Badge Tier (A/B/C) kèm tooltip giải thích.
    - **Giỏ Thuê / Trạng thái Đơn hàng (Trái)**:
        - **Trust Score**: Điểm tín dụng người dùng (Cao/Trung bình/Thấp).
        - **Trạng thái đơn hiện tại**: `PENDING_SIGN`, `SIGNED_PENDING_APPROVAL`, `SIGNED_UNPAID`, `PAID`, `ACTIVE`...
        - **Thông báo**: Các button hành động tương ứng với trạng thái (Ký hợp đồng, Thanh toán, Mở khóa, Trả sách). Mọi kết quả thao tác (Thành công/Lỗi/Đang chờ) đều được thông báo qua hệ thống **Toast Notifications** (popup mượt ở góc màn hình), loại bỏ hoàn toàn `alert()` truyền thống để nâng cao UX.
- **Thông Tin Yêu Cầu**:
    - **Chọn sách**: Nhấn nút "Chọn" từ danh sách.
    - **Thời hạn thuê**: Chọn số ngày (3, 7, 14, 30 ngày).
    - **Bằng chứng trả sách** (khi trả): Upload ảnh (Tùy chọn).
- **Xử Lý Logic (Web3 DApp)**:
    - **Tạo Hợp Đồng**: Quá trình tạo hợp đồng tạo SBT riêng biệt (hoặc do Backend gọi), sau đó Frontend trigger hoặc Backend gọi `VinaLibVault.createRental(renter, assetId, duration, termsHash, version, pspRef, existingSbtId)`. LƯU Ý: Không sử dụng `msg.value` (Pay ETH) trực tiếp vào Hàm này.
    - **Thanh toán**: (Off-chain/Logic) Xảy ra độc lập thay vì trả trực tiếp qua Smart Contract, bằng chứng thanh toán lưu trong `pspRef`.
    - **Mở khóa IoT**: (Mô phỏng) Đọc log `RentalCreated` từ blockchain để ra lệnh mở khóa tủ vật lý qua Tuya Lock.
    - **Trả sách**: Frontend gọi `VinaLibVault.requestReturn(assetId)`. Transaction ghi `ReturnRequested` lên hệ thống Ledger.

### 2.2 Chi Tiết Sách (Book Detail Page)
- **URL**: `/books/:id`
- **Mục đích**: Xem thông tin chi tiết trước khi thuê.
- **Thông Tin Hiển Thị**:
    - Thông tin cơ bản: Tên, Tác giả, Chủ sở hữu.
    - Tài chính: Giá thuê, Tiền cọc (theo %), Phí trễ hạn.
    - Risk Tier: A/B/C.
    - Trạng thái xác thực: Verified/Pending.
- **Thông Tin Yêu Cầu**:
    - Thời hạn thuê mong muốn.
- **Xử Lý Logic (Web3 DApp)**:
    - Tính toán Tổng chi phí = (Giá * Số ngày) + Cọc.
    - Gọi hàm `BookAsset.ownerOf()` on-chain để lấy chủ sở hữu.
    - Nút "Gửi yêu cầu thuê" gọi trực tiếp Metamask -> Transaction `createRental`.

### 2.3 Tài Khoản (Account Page)
- **URL**: `/account`
- **Mục đích**: Xem hồ sơ và lịch sử thuê.
- **Thông Tin Hiển Thị**:
    - Thông tin cá nhân: Username, Email, Wallet Address.
    - **Trust Score Chi Tiết**: Điểm số, Xếp hạng, Thống kê (Số lần thuê, Trả muộn, Tranh chấp).
    - **Lịch sử Thuê**: Danh sách các đơn hàng cũ và trạng thái. Liên kết tới Evidence Hash và Rental SBT on-chain.
- **Thông Tin Yêu Cầu**:
    - Không có input chính (Chủ yếu là view).
    - Nút "Trả sách" (nếu đơn đang active) -> Gọi API trả sách.

### 2.4 Ví Của Tôi (Wallet Page)
- **URL**: `/wallet`
- **Mục đích**: Quản lý tài chính cá nhân.
- **Thông Tin Hiển Thị**:
    - **Số dư khả dụng**: Tiền có thể dùng ngay.
    - **Chờ quyết toán**: Tiền doanh thu chưa về ví (đối với Lender).
    - **Lịch sử giao dịch**: Bảng danh sách Nạp tiền, Thanh toán, Nhận doanh thu.
    - Thông tin tài khoản ngân hàng (Mock) để nạp tiền.
- **Xử Lý Logic**:
    - Fetch dữ liệu từ `GET /api/user/:username/balance` và `/transactions`.

### 2.5 Cài Đặt (Settings Page)
- **URL**: `/settings`
- **Thông Tin Yêu Cầu**:
    - Đổi mật khẩu: Mật khẩu cũ, Mới, Xác nhận.
    - Cấu hình thông báo: Email, Reminder, Marketing (Checkboxes).
- **Xử Lý Logic**:
    - Client-side validation (độ dài mật khẩu, khớp mật khẩu).
    - Giả lập lưu cấu hình (chưa có API backend thực tế cho settings user).

---

## 3. PHÂN HỆ CHỦ SÁCH (LENDER PORTAL)

### 3.1 Niêm Yết Sách (Rent Out Page)
- **URL**: `/rent-out`
- **Mục đích**: Đăng tải sách mới lên hệ thống.
- **Thông Tin Yêu Cầu**:
    - **Ảnh bìa**: File ảnh.
    - **Thông tin**: Tên sách, Giá thuê/ngày.
    - **Cấu hình nâng cao**: Tỷ lệ cọc (%), Phí trễ hạn (%), Thời hạn tối thiểu/tối đa.
- **Xử Lý Logic (Web3 DApp)**:
    1. **Upload IPFS**: Hình ảnh bìa và Metadata sách được upload lên IPFS Simulator lấy `CIDv1`.
    2. **Niêm yết (Mint)**: Lender (hoặc System Account) gọi `BookAsset.safeMint(to, CIDv1)` qua mạng Hardhat Local RPC. Sách bắt đầu ở state `PENDING_VERIFICATION`.

### 3.2 Quản Lý Cho Thuê (Lender Dashboard)
- **URL**: `/lender/manage`
- **Mục đích**: Theo dõi sách và doanh thu của Lender.
- **Thông Tin Hiển Thị**:
    - **Thống kê**: Tổng số sách, Sách đang cho thuê, Sách chờ duyệt.
    - **Doanh thu**: Số dư khả dụng, Tiền chờ quyết toán.
    - **Danh sách Sách**: Table chi tiết (ID, Tên, Giá, Trạng thái). Có link tới Token ID on-chain.
    - **Lịch sử Cho thuê**: Các đơn hàng liên quan đến sách của mình (View Only).
- **Lưu ý**: Lender **không** có quyền duyệt đơn hay xác nhận trả. Các quyền này thuộc về Admin (theo mô hình Custodial/Verified).

---

## 4. PHÂN HỆ QUẢN TRỊ (ADMIN PORTAL)

### 4.1 Owner Dashboard
- **URL**: `/owner`
- **Mục đích**: Trung tâm điều hành toàn bộ hệ thống.
- **Các Tabs Chức Năng**:
    1. **Đơn Hàng (Rentals)**:
       - Xem tất cả đơn thuê.
       - Filter: Cần xử lý, Tất cả, Hoàn tất.
       - **Action**: "Duyệt" ( Approve đơn chờ), "Xác nhận Trả" (Check hư hại). Trả về **Toast Notification** báo kết quả.
    2. **Sách (Books)**:
       - Xem sách đang `PENDING_VERIFICATION`.
       - **Action**: "Duyệt Niêm Yết" (Gán Risk Tier & Verify).
    3. **Cấu hình (Config)**:
       - Chỉnh sửa tham số hệ thống: `Min Collateral Ratio`, `Platform Fee`.
       - **Action**: "Quyết toán ngay" (Trigger Payout thủ công).
    4. **Thống kê (Stats)**:
       - Xem tổng quan tài chính: Doanh thu sàn, Quỹ Escrow, Pending Payout.
       - Xem log giao dịch toàn hệ thống.

---

## 5. PHÂN HỆ EXPLORER (BLOCKCHAIN VIEW)

### 5.1 Dashboard Explorer
- **URL**: `/explorer` (Port 3004)
- **Mục đích**: Minh bạch hóa dữ liệu Blockchain.
- **Thông Tin Hiển Thị**:
    - **Network Stats**: Block Height, Gas Price, Avg Block Time.
    - **Latest Blocks**: Danh sách block mới sinh ra.
    - **Latest Transactions**: Các giao dịch mới nhất trên mạng lưới.

### 5.2 On-Chain Data Explorer
- **URL**: `/explorer/onchain`
- **Mục đích**: Tra cứu dữ liệu trực tiếp ("Soi") từ Smart Contracts.
- **Tính Năng**:
    - **Contract Viewer**: Chọn contract (`VinaLibVault`, `BookAsset`...) và nhập ID để xem state hiện tại.
    - **Evidence Pack Viewer**: Nhập `BookTokenID` để xem cấu trúc Evidence Pack (`TermsHash`, `Status`, `Renter`) đang lưu trên Ledger.
    - **Raw Data Decoder**: Công cụ giải mã Hex data từ logs.

---
**Tài liệu này được trích xuất từ mã nguồn Frontend hiện tại (React/Vite) ngày 2026-02-04.**
