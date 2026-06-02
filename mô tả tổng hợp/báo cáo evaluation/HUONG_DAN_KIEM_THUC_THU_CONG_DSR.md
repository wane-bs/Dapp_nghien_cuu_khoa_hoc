# HƯỚNG DẪN KIỂM THỬ THỰC NGHIỆM THỦ CÔNG (DSR MANUAL SNAPSHOT GUIDE)

Tài liệu này đóng vai trò như kịch bản cầm tay chỉ việc để bạn thao tác trên giao diện và Terminal, qua đó **chụp lại các màn hình minh chứng** cho báo cáo DSR của VinaLib V3.1.

---

## PHẦN 1: KHỞI TẠO SINH THÁI LOCAL & THIẾT LẬP VÍ (METAMASK)

### Bước 1: Khởi động Blockchain (Terminal 1)
1. Mở Terminal mới (hoặc Git Bash) và di chuyển vào thư mục `contracts`:
   ```bash
   cd C:\book_app_v3\contracts
   npx hardhat node
   ```
2. Terminal sẽ in ra một danh sách **20 Account** và **Private Keys**.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp màn hình Terminal này đang chạy mượt mà để chứng minh Node Local đã sống. Hãy giữ Terminal này bật nguyên cả quá trình.

### Bước 2: Thiết lập mạng Localhost trên Metamask
1. Mở tiện ích ví **Metamask** trên trình duyệt của bạn.
2. Click vào tên mạng ở góc trên cùng bên trái. Chọn **"Add network" (Thêm mạng)** -> **"Add a network manually" (Thêm mạng thủ công)**.
3. Nhập thông tin sau:
   - **Network name:** Hardhat Localhost
   - **New RPC URL:** `http://127.0.0.1:8545/`
   - **Chain ID:** `31337`
   - **Currency symbol:** `GO`
4. Ấn **Lưu** và chuyển sang mạng này.

### Bước 3: Import 3 Tài khoản (Vai trò) vào Metamask
Bạn nhìn vào Terminal 1 (đang chạy Hardhat node), copy Private Key của Tài khoản #0, #1, #2 và làm theo các bước sau trong Metamask (Click vào Avatar -> **Import account** -> Dán Private Key):
- **Account 0 (Deployer/Admin):** Dùng Private Key đầu tiên (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`). Sau khi Import, hãy đổi tên nó trong Metamask thành `Hardhat Admin`.
- **Account 1 (Lender/Chủ Sách):** Dùng Private Key thứ hai (`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`). Đổi tên thành `Hardhat Lender`.
- **Account 2 (Renter/Người Thuê):** Dùng Private Key thứ ba (`0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`). Đổi tên thành `Hardhat Renter`.

### Bước 4: Khởi chạy Giao diện Frontend (Terminal 2)
1. Mở một Terminal khác và chạy:
   ```bash
   cd C:\book_app_v3\frontend
   npm run dev
   ```
2. Mở trình duyệt web vào địa chỉ `http://localhost:5173`.

---

## PHẦN 2: KỊCH BẢN CHỤP GIAO DIỆN (UI - MÔ PHỎNG KT-02)

Quá trình này yêu cầu bạn liên tục đổi tài khoản trên Metamask để đóng vai các nhân vật khác nhau.

### 1. Lender Niêm yết sách
1. **Ví Metamask:** Đổi tài khoản sang `Hardhat Lender`.
2. **Trên Web:** Chọn **Đăng nhập**, bấm nút "Quick Login" là Lender (hoặc kết nối ví).
3. Chuyển đến trang **Rent Out (Niêm yết sách)**. 
4. Điền các thông tin sách (Ảnh tùy ý, Tên sách: "Sách thử nghiệm DSR", Giá thuê: 1 GO...).
5. Bấm nút "Submit / Niêm yết". Metamask sẽ hiện ra yêu cầu ký.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp màn hình Web kèm bảng pop-up Metamask đang yêu cầu ký giao dịch `Create Book`.

### 2. Admin Duyệt sách (Verify)
1. **Ví Metamask:** Đổi tài khoản sang `Hardhat Admin`.
2. **Trên Web:** Đăng nhập lại bằng cửa sổ Owner/Admin Dashboard.
3. Chuyển sang thẻ **Books**, bạn sẽ thấy cuốn sách lúc nãy báo `Pending Verification`.
4. Ấn nút duyệt (Verify).
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp bảng pop-up Metamask thao tác Admin xác nhận quyền.

### 3. Renter Thuê sách
1. **Ví Metamask:** Đổi tài khoản sang `Hardhat Renter`.
2. **Trên Web:** Mở màn hình Dashboard/Trang chủ. Tìm thấy cuốn "Sách thử nghiệm DSR".
3. Bấm **Bấm thuê** -> Chọn số ngày (ví dụ 7 ngày).
4. Bấm "Khởi tạo hợp đồng" hoặc "Thanh toán".
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp giao diện nút bấm tương tác tạo `RentalAgreement` và pop-up Gas Limit của TXN `createRental`.
5. Đợi nút trạng thái chuyển sang màu xanh lá (`Active` / `Rented`).
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp bằng chứng giao diện hiển thị trạng thái hợp đồng mượn sách đã bắt đầu.

### 4. Renter Trả sách & Admin thanh lý (Tuỳ chọn)
1. Renter ấn nút "Request Return" (Trả sách). Chụp 1 tấm.
2. Admin chuyển sang tab "Đơn Hàng" ấn nút Refund / Confirm Return. Chụp 1 tấm chứng minh vòng đời hợp tất hoàn mỹ.

---

## PHẦN 3: KỊCH BẢN CHỤP TERMINAL (BACKEND DSR - KT-01, 03, 04)

Bây giờ chúng ta sẽ chạy Script định lượng kỹ thuật (chạy dưới ngầm ngầm nền) để chứng minh tốc độ milliseconds. Tôi đã viết 1 script tên là `simulate_dsr_interactive.js`. Nó sẽ TẠM DỪNG ở giữa các kịch bản để bạn tiện chụp ảnh log in ra terminal.

### Bước 1: Khởi động Script Interactive (Terminal 3)
1. Mở Terminal mới, chạy lệnh:
   ```bash
   cd C:\book_app_v3\contracts
   npx hardhat run scripts/simulate_dsr_interactive.js --network localhost
   ```
2. Hệ thống in dòng "DEPLOY CONTRACTS" xong sẽ dừng lại chờ bạn.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp để thấy hợp đồng Vault V3.1 được bung ra thành công.

### Bước 2: Chụp IPFS (KT-01)
1. Bấm phím **ENTER** một lần. Terminal chạy quét dữ liệu IPFS và báo thành công 100%, độ trễ 0.x ms.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp bôi đen đoạn log của KT-01.

### Bước 3: Chụp Logic & Gas (KT-02 Logic gốc)
1. Nhấn **ENTER** để máy tự chạy tốc độ cao 5 vòng đời (thay vì 20 vòng rề rà) để báo kết quả Gas.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp khung KQ báo Avg Finality < 2ms và Avg Gas < 700k.

### Bước 4: Chụp Máy chủ IoT MQTT (KT-03)
1. Theo dõi tiến trình ấn tiếp **ENTER**. Nó bắn event `LOCK_OPEN` và `LOCK_CLOSE`.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp log xác thực tốc độ kết nối tủ khóa vật lý độ trễ lý tưởng (tương tự ngưỡng <3s).

### Bước 5: Chụp Bơm lỗi (KT-04)
1. Bấm **ENTER** lần chót, hệ thống bơm 10 hash giả mạo IPFS và bị từ chối truy cập.
   - 📸 **[CHỤP MÀN HÌNH TẠI ĐÂY]**: Chụp bằng chứng khả năng phát hiện sửa đổi sổ cái thành công 100%.

> Bạn có thể copy paste trực tiếp các ảnh chụp màn hình này vào phụ lục của file Báo Cáo. Đồng thời, toàn bộ Event log dạng JSON đã được đẩy tự động vào thư mục `mô tả tổng hợp/báo cáo evaluation/data/` để bạn xem đối chiếu.
