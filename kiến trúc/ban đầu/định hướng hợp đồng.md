# TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION) HỆ THỐNG HỢP ĐỒNG THUÊ SÁCH THÔNG MINH (P2P-SLC)
**Phiên bản:** 1.0  
**Ngày khởi tạo:** 31/12/2025

## TỔNG QUAN HỆ THỐNG
Hệ thống là sự kết hợp giữa **Hợp đồng thông minh (Smart Contract)** và **Hợp đồng pháp lý (Legal Contract)** nhằm thực hiện giao dịch cho thuê sách ngang hàng (P2P). Hệ thống tách biệt **Quyền sở hữu (Ownership)** và **Quyền sử dụng (Usage Rights)** thông qua các tiêu chuẩn Token hóa.

## KIẾN TRÚC CÁC THÀNH PHẦN MÃ NGUỒN

### 2.1. Lớp Tài sản (Asset Layer - ERC4907)
*   **Chức năng:** Quản lý NFT đại diện cho sách và gán quyền người dùng tạm thời.
*   **Hàm cốt lõi:**
    *   `setUser(tokenId, user, expires)`: Thiết lập địa chỉ người thuê và thời hạn hết hạn.
    *   `userOf(tokenId)`: Truy vấn người đang có quyền sử dụng hiện tại.
*   **Logic thực thi:** Quyền sử dụng tự động chấm dứt khi thời gian hệ thống vượt quá giá trị `expires`.

### 2.2. Lớp Chứng chỉ (Legal Layer - RentalAgreementSBT)
*   **Chức năng:** Tạo bằng chứng ký kết hợp đồng không thể chuyển nhượng (Soulbound Token).
*   **Đặc tính:** Chặn hàm chuyển tiền (`transfer`) thông qua ghi đè hàm `_update`.
*   **Dữ liệu đính kèm:** Lưu trữ mã băm (`termsHash`) của phiên bản điều khoản pháp lý.

### 2.3. Lớp Quản lý (Management Layer - RentalManager)
*   **Chức năng:** Điều phối thanh toán VND, xử lý tiền cọc và lưu trữ bằng chứng (Evidence Pack).

## ĐẶC TẢ DỮ LIỆU (DATA SCHEMA)

### 3.1. Cấu trúc UserInfo:
*   `address user`: Địa chỉ ví người thuê.
*   `uint64 expires`: Thời điểm hết hạn thuê (Unix timestamp).

### 3.2. Gói bằng chứng điện tử (Evidence Pack):
*   `termsHash`: `bytes32` (SHA-256 của nội dung hợp đồng).
*   `pspRef`: `string` (Mã đối soát giao dịch từ cổng thanh toán VND).
*   `deliveryHash`: `bytes32` (Hash của ảnh và biên bản bàn giao sách).

## QUY TRÌNH THỰC THI (WORKFLOW)

### Bước 1: Ký kết & Đặt cọc
*   BT chấp thuận hợp đồng trên ứng dụng.
*   Hệ thống gọi `safeMint()` tạo SBT (RAL) cho BT làm bằng chứng pháp lý.
*   BT thanh toán Tiền thuê và Đặt cọc qua PSP bằng VND.

### Bước 2: Kích hoạt Quyền sử dụng
*   Sau khi đối soát `pspRef`, hệ thống gọi `setUser()` gán quyền cho BT.
*   Thời hạn thuê (`start/end`) được ghi nhận chính xác vào biến `expires`.

### Bước 3: Giao nhận & Lưu bằng chứng
*   Hai bên thực hiện Biên bản giao nhận điện tử.
*   Hash của biên bản được ghi nhận on-chain để làm chứng cứ tranh chấp.

### Bước 4: Hoàn trả & Thanh toán
*   Khi kết thúc thời hạn, quyền `userOf()` tự động trở về `address(0)`.
*   BCT kiểm tra tình trạng sách theo Thang hư hại (Phụ lục 1).
*   Hệ thống giải tỏa đặt cọc sau khi trừ phí trễ hoặc phí hư hại (nếu có).

## RÀNG BUỘC KỸ THUẬT & AN NINH
*   **Soulbound Logic:** Cấm chuyển nhượng SBT để đảm bảo trách nhiệm cá nhân.
*   **Kill Switch:** Nền tảng có quyền tạm dừng hợp đồng (`Pause`) khi có rủi ro bảo mật.
*   **Quyền riêng tư:** Chỉ lưu trữ mã băm (hash) của dữ liệu định danh (PII) trên Blockchain.

## LUẬT ÁP DỤNG
*   Tuân thủ Luật Giao dịch điện tử 2023 và các quy định hiện hành tại Việt Nam.
*   Không chấp nhận thanh toán bằng tiền mã hóa (Crypto) trong mọi trường hợp.
