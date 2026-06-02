# VAI TRÒ CHÍNH (PRIMARY ROLE)
Tài liệu này đóng vai trò là hướng dẫn vận hành (Operation Manual), cung cấp các lệnh chi tiết để khởi chạy môi trường phát triển local (Zero-cost) cho toàn bộ hệ thống **VinaLib Web3 Full-Stack**. 

**Mục tiêu chính** là khởi chạy và tương tác an toàn giữa 6 thành phần cốt lõi: 
1. **Blockchain Node (Smart Contracts)** - Lớp xử lý nghiệp vụ cốt lõi (Hardhat HTTP)
2. **Mock Services** - Giả lập dịch vụ Pháp lý FPT, IoT Tuya, và Cổng thanh toán
3. **Backend API & IPFS Simulator** - API Gateway trung gian mô hình hóa Microservices và lưu trữ phân tán
4. **Web3 Frontend (React SPA)** - Lớp giao diện người dùng tương tác qua MetaMask/Ethers.js (Chạy riêng rẽ ở các Port khác nhau tùy role)
5. **Blockchain Explorer** - Trình duyệt khối nội bộ tra cứu Transaction độc lập

---

# Hướng Dẫn Chạy Toàn Bộ Hệ Thống VinaLib-Vault

## Yêu cầu Hệ thống (Prerequisites)

| Thành phần | Phiên bản yêu cầu | Kiểm tra |
|------------|-------------------|----------|
| Node.js | v18+ (khuyến nghị v20 LTS) | `node --version` |
| npm | v9+ | `npm --version` |
| Trình duyệt | Chrome/Brave/Edge | (Cần cài đặt Extension **MetaMask**) |

> **Lưu ý Windows**: Đảm bảo sử dụng PowerShell hoặc Terminal mới (không phải CMD cũ). Bạn sẽ cần mở đồng thời ít nhất **5 Terminals** trong VS Code hoặc Terminal App.

---

## Cấu Hình Môi Trường Cốt Lõi (Core Environment)

### Terminal 1: Khởi chạy Local Node & Chạy Smart Contracts
Terminal này sẽ đóng vai trò là mạng lưới Blockchain cục bộ (Local EVM) cho phép các giao dịch mô phỏng diễn ra nhanh chóng với phí Gas = 0.

```powershell
# 1. Di chuyển vào thư mục Smart Contract
cd contracts

# 2. Khởi chạy Node cục bộ 
npx hardhat node
```
*Giữ nguyên Terminal này trong suốt quá trình phát triển. Nó sẽ lắng nghe ở `http://127.0.0.1:8545` và in ra các logs giao dịch.*

**Lưu ý:** Copy Private Key của `Account #0` để Import vào ví MetaMask làm tài khoản **Owner/Admin**.

---

### Terminal 1A: Triển khai (Deploy) Smart Contracts
Sau khi Node đã chạy ổn định ở Terminal 1, bạn **bắt buộc** phải mở một Terminal mới để deploy mã nguồn.

```powershell
# 1. Di chuyển vào thư mục Smart Contract
cd contracts

# 2. Chạy kịch bản Deploy
npx hardhat run scripts/deploy_full.js --network localhost
```
*Chạy xong có thể tắt Terminal này đi. Mã hợp đồng mới sẽ tự động được ghi đè vào Frontend Config.*

---

### Terminal 2: Khởi chạy Mock Services (FPT Legal, Tuya IoT, Bank)
Dịch vụ giả lập các Third-party APIs.

```powershell
# 1. Di chuyển vào thư mục mock server
cd mock-server

# 2. Cài đặt thư viện (Chỉ làm lần đầu)
npm install

# 3. Khởi chạy
npm start
```
*Mock Server sẽ chạy ở: `http://localhost:4000`.*

---

### Terminal 3: Khởi chạy Backend API & IPFS Simulator
Lớp Gateway và Storage. Nếu không bật, Frontend sẽ không thể upload ảnh sách, hoặc duyệt hợp đồng.

```powershell
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt thư viện (Chỉ làm lần đầu)
npm install

# 3. Khởi chạy Server
npm start
```
*Backend Server sẽ chạy ở: `http://localhost:3000`.*

---

### Terminal 4: Khởi chạy Web3 Frontend (React App)
Giao diện người dùng tương tác với hệ thống. Do Port 3000 đã được Backend dùng, chúng ta phải khởi chạy Web UI theo các Role ở các port khác nhau (Tham khảo Cấu hình Map Ports của dự án).

> **CẢNH BÁO QUAN TRỌNG VỀ TERMINAL**:  
> Cú pháp set Port khác nhau tuỳ thuộc vào loại Terminal bạn đang dùng. Nếu dùng sai, bạn sẽ gặp lỗi `EADDRINUSE` (trùng Port 3000 của Backend).
> - **PowerShell**: `$env:PORT=3001; npm start`
> - **Git Bash / Linux / Mac**: `PORT=3001 npm start`
> - **CMD (Command Prompt cũ)**: `set PORT=3001 && npm start`

**Cách 1: Khởi chạy cho User / Lender (Port 3001 / 3002)**
```bash
# Di chuyển vào thư mục Frontend
cd frontend

# Chạy bằng script có sẵn (Khuyên dùng)
npm run start:lender
```
*Giao diện User/Lender sẽ mở tại: `http://localhost:3001` (hoặc 3002).*

**Cách 2: Khởi chạy cho Admin / Owner (Port 3003)**
> Bắt buộc phải chạy ở Port 3003 để hệ thống tự động nhận diện quyền Admin.
```bash
# Dùng script có sẵn
npm run start:admin

# Hoặc chạy thủ công trên PowerShell:
$env:PORT=3003; npm start

# Hoặc chạy thủ công trên Git Bash:
PORT=3003 npm start
```
*Giao diện Admin sẽ mở tại: `http://localhost:3003/owner`.*

---

### Terminal 5 (Tùy chọn): Khởi chạy Blockchain Explorer 
Công cụ tra cứu khối và đọc Data trực tiếp từ Contract không cần Backend.

```powershell
# Từ thư mục frontend
npm run explorer
```
*Trình duyệt khối mở tại: `http://localhost:3004`.*

---

## Kịch Bản Trải Nghiệm & Tương Tác Web3 (User Journey)

### 1. Cấu hình MetaMask cho Local Testing
1. Mở extension **MetaMask**.
2. Thêm mạng thủ công (Add Network manually):
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH` (hoặc `AVA`)
3. **Import Account**: Dùng Private Key từ `Terminal 1`. Khuyến cáo Import 2 tài khoản, 1 làm Admin (Account #0) và 1 làm Lender/User (Account #1).

### 2. Trải nghiệm Chu trình Hoạt động (App Flow)
Toàn bộ hệ thống Microservices nay đã có thể chạy thông suốt:

1. **Kết nối Ví**: Truy cập `http://localhost:3001`, Connect Wallet.
2. **Yêu cầu Niêm Yết**: Lender gửi Mã chủ sách (Public Key) và thông tin sách.
3. **Admin Cấp Phát (Minting)**: Admin truy cập `http://localhost:3003` (Tab Cấp phát), nhập thông tin và Mã chủ sách của Lender để tiến hành chức năng Mint trên Blockchain thay cho Lender (Custodial Mode).
4. **Phê duyệt Niêm Yết**: Vẫn từ Admin, sách mới sẽ rơi vào danh sách Chờ Duyệt (Pending Verification) để Admin check lỗi lần cuối và duyệt. Hệ thống sẽ bật thông báo **Toast Notification** báo thành công.
5. **Ký Phiếu Thuê (Renting)**: User tạo Booking. Backend gọi Mock Legal (Terminal 2) sinh ra Hợp đồng Số và mã Hash bảo mật. User thanh toán ETH và nhận Soulbound Token. (Có popup Toast báo nộp tiền thành công).
6. **Mở Khóa Lấy Sách**: Khi Hợp đồng Active, Backend gọi Mock IoT (Terminal 2) sinh mã Passcode cho User. (Lưu ý: Khi người dùng bấm Mở Khóa Thiết Bị, giao diện sẽ phản hồi trực quan bằng **Toast Notification** ở góc màn hình).

---

## Xử Lý Sự Cố (Troubleshooting)

### Giao dịch thất bại (Revert) / Frontend báo lỗi "Hợp đồng không tồn tại"
- **Nguyên nhân:** Khi khởi động lại Terminal 1 (Hardhat Node), blockchain bị reset. Frontend lưu Config cũ.
- **Cách sửa:** Chạy LẠI `Terminal 1A` để Deploy. Cực kỳ quan trọng.

### Xung đột Cổng (EADDRINUSE: address already in use)
- **Nguyên nhân 1:** Quên đổi Port khi Start React App làm đụng Port 3000 của Backend.
- **Nguyên nhân 2 (Rất phổ biến):** Bạn đang dùng Git Bash hoặc CMD nhưng lại copy lệnh `$env:PORT=...` của PowerShell. Khi đó biến môi trường không được set, React mặc định chạy vào cổng 3000 và gây ra lỗi `0.0.0.0:3001` hoặc đụng độ Backend.
- **Cách sửa:** Xem lại bảng **CẢNH BÁO QUAN TRỌNG VỀ TERMINAL** ở mục 4 để nhập đúng lệnh tương ứng với Terminal (PowerShell / Git Bash), hoặc chỉ cần dùng `npm run start:lender` | `npm run start:admin`.

### Lỗi "Nonce too high" hoặc Meta Mask kẹt 
- **Cách sửa:** Mở MetaMask -> Cài đặt -> Advanced -> **"Clear activity tab data"** (Xóa dữ liệu hoạt động).
