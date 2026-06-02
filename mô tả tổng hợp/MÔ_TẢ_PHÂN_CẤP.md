# VAI TRÒ CHÍNH (PRIMARY ROLE)
Tài liệu này đóng vai trò là bản thiết kế kỹ thuật chi tiết, phân rã hệ thống thành các tầng/lớp cụ thể với **trọng tâm** là: **Smart Contracts (Blockchain Logic)**, **IPFS Simulator (Storage Layer)**, và **Mock Services (External API Simulation)**. Backend Modules và Frontend Structure chỉ đóng vai trò **hỗ trợ kiểm thử (Testing Interface)**, giúp lập trình viên verify và demo các chức năng blockchain core.

---

# MÔ TẢ PHÂN CẤP HỆ THỐNG VINA-LIB VAULT

## 🎯 Định Vị Dự Án (Project Focus)

**Mục tiêu chính**: Xây dựng hệ thống cho thuê sách P2P **tập trung vào blockchain** với 3 trụ cột cốt lõi:

### 🔴 Core Components (Primary Focus - 80% effort)
1. **Smart Contracts** (`contracts/`) - Logic nghiệp vụ on-chain theo định hướng từ `kiến trúc/ban đầu/`
2. **IPFS Simulator** (`IPFS/`) - Lưu trữ phi tập trung cho metadata và images
3. **Mock Services** (`mock-server/`) - Giả lập FPT Legal, Tuya IoT, Banking APIs

### 🧪 Testing Interface (Supporting Role - 20% effort)
4. **Backend API** (`backend/`) - REST gateway để orchestrate blockchain calls (Testing only)
5. **Frontend UI** (`frontend/`) - React interface để demo user flows (Testing only)

**⚠️ Nguyên tắc**: Mọi thay đổi backend/frontend phải phục vụ mục đích **kiểm thử contracts** chứ KHÔNG phải tối ưu trải nghiệm người dùng.

---

## Tổng Quan Chương Trình

### 🎯 Core Architecture (Trọng tâm)
- **Smart Contracts**: 
  - ERC-4907 (BookAsset) - Rentable NFT với quyền sở hữu và quyền sử dụng tách biệt
  - Soulbound Token (RentalAgreementSBT) - Chứng chỉ hợp đồng không chuyển nhượng
  - VinaLibVault - Ledger lưu trữ Evidence Pack on-chain
  - ERC-20 (SuChinToken) - Utility token (optional)
  
- **IPFS Simulator**: CIDv1-based storage cho book images và ERC-721 metadata

- **Mock Services** (Port 4000):
  - Mock Legal (FPT eContract) - Giả lập digital signature
  - Mock IoT (Tuya) - Giả lập smart lock control
  - Mock Bank - Giả lập payment webhooks

### 🧪 Testing Infrastructure (Hỗ trợ)
- **Backend (Legacy)**: Đã bị bypass. Trước đây đóng vai trò API Gateway, hiện tại giao tiếp trực tiếp từ Frontend -> Blockchain.
- **Frontend**: React + TypeScript, Web3 DApp kết nối trực tiếp Hardhat Node (ethers.js).
  - **Smart Contract Interactor**: Component trực tiếp sign transaction bằng MetaMask.
  - **Blockchain Explorer**: Tích hợp sẵn để xem Block/Event/Tx Local.
- **Công cụ phát triển**: Hardhat (Ethereum local `:8545`), npm scripts, Ngrok (Tunneling)

### 📋 Quy trình Kinh doanh (Business Flow)
Đăng nhập ví (MetaMask) → Upload sách (Lender) → **Smart Contract: safeMint()** → **Admin Verify Listing on-chain** → Tạo Booking (User) → **Smart Contract: createRental()** → Mint SBT → Trả sách → **Smart Contract: requestReturn()** → **Admin Confirm Return on-chain** → Hoàn cọc

**⚠️ Lưu ý**: Định hướng chi tiết nằm trong `kiến trúc/ban đầu/định hướng hợp đồng.md`

---

## I. 🔴 Smart Contracts (Blockchain Core - PRIMARY FOCUS)

Hệ thống Blockchain quản lý tài sản số, tính pháp lý và kết nối dữ liệu thực. **Đây là trọng tâm phát triển chính** của dự án.

### 1. `BookAsset.sol` (Rentable NFT) - **PRIORITY 1**
- **Chuẩn**: ERC-721 + ERC-4907
- **Vai trò**: Đại diện kỹ thuật số cho cuốn sách thực tế
- **Chức năng**:
  - Kế thừa `ERC4907`: Tách biệt quyền sở hữu (Owner) và quyền sử dụng (User)
  - `safeMint(to, cid)`: Tạo mới BookAsset, gắn CID IPFS cho metadata
  - `setUser(tokenId, user, expires)`: Gán quyền sử dụng tạm thời (từ VinaLibVault)
  - `userOf(tokenId)`: Query người đang có quyền sử dụng
  - **New**: `verifyForListing()`, `verifyPreRent()`, `verifyReturn()` (Admin Only)
  - **Book Status**: `PendingVerification` | `Verified` | `Rented` | `Returned`

### 2. `RentalAgreementSBT.sol` (Soulbound Token) - **PRIORITY 1**
- **Chuẩn**: ERC-721 (Soulbound Variant)
- **Vai trò**: Chứng nhận hợp đồng thuê đã ký kết (Digital Receipt)
- **Cơ chế Soulbound**: 
  - Override `_update()` để chặn `transfer`/`transferFrom`
  - Token gắn chặt với ví người thuê, không thể chuyển nhượng
- **Metadata**: Lưu `termsHash` (SHA-256 của điều khoản hợp đồng)

### 3. `VinaLibVault.sol` (Core Ledger) - **PRIORITY 1**
- **Vai trò**: Sổ cái xác thực trung tâm & Lưu trữ Evidence Pack
- **Mô hình**: Trusted Backend (Admin role điều phối off-chain verification)
- **Cấu trúc `EvidencePack`**:
  ```solidity
  struct EvidencePack {
      bytes32 termsHash;      // Hash điều khoản hợp đồng
      string pspRef;          // Payment Service Provider Reference
      bytes32 deliveryHash;   // Hash biên bản giao nhận
      uint8 version;          // Phiên bản hợp đồng
      RentalStatus status;    // Active/ReturnRequested/Concluded
  }
  ```
- **Quy trình On-chain**:
  1. **`createRental()`**: Check `isVerified` → Gắn kết SBT có sẵn → Gán `setUser` (User trực tiếp gọi).
  2. **`requestReturn()`**: (Renter) Chuyển status → ReturnRequested.
  3. **`confirmReturn()`**: (OnlyOwner) Thu hồi quyền sử dụng → Status: Concluded.
- **Chainlink Integration**: Đã kích hoạt Chainlink Automation (checkUpkeep/performUpkeep) cho việc tự động dọn dẹp hợp đồng hết hạn.

### 4. `SuChinToken.sol` (Utility Token)
- **Chuẩn**: ERC-20
- **Vai trò**: Token tiện ích (SUC) cho loyalty/rewards (optional feature)
- **Đặc điểm**: `Ownable`, Mintable (dev environment)

### 5. `IERC4907.sol` & `ERC4907.sol`
- **Vai trò**: Interface và Implementation của Rentable NFT Standard
- **Hàm cốt lõi**: `setUser()`, `userOf()`, event `UpdateUser`

### 6. `Mocks.sol`
- **Vai trò**: Giả lập Chainlink Functions Router cho local testing

### ⚖️ Legal Constraints Compliance (Bắt buộc)

**Theo Section 5 - QUY_LUAT_TOI_CAO.md**, các Smart Contracts PHẢI tuân thủ:

#### 1. Thanh toán Off-chain
- ✅ `VinaLibVault.sol` chỉ lưu `pspRef` (Payment Service Provider Reference)
- ✅ `SuChinToken` chỉ là logic token (Traceability), KHÔNG lưu giá trị tiền cọc thực
- ✅ Hợp đồng chỉ ghi nhận bằng chứng thanh toán, không giữ tiền (Escrow)

#### 2. Xác nhận hợp lệ & Phê duyệt (Validation)
- ✅ **Niêm yết sách**: Admin phải gọi `verifyForListing` để sách `isVerified`, lúc này User mới có thể gọi `createRental()`.
- ✅ **Trả Sách**: `requestReturn()` (User) → `confirmReturn()` (Admin/Automation) → Mới thực thi thu hồi trạng thái.

#### 3. An Toàn & Bảo Mật
- ✅ `onlyOwner` modifier cho các hàm quan trọng (`createRental`, `confirmReturn`)
- ✅ Data Privacy: Chỉ lưu Hash (`termsHash`, `deliveryHash`), không lưu plain text
- ✅ Versioning: `EvidencePack` có field `version` để track phiên bản hợp đồng
- ✅ Multi-sig Admin (Gnosis Safe): Đang triển khai tích hợp ở Phase này thay cho EOA Admin.
- ⏳ Cơ chế nâng cấp (Upgrade Mechanism): Đã được chuyển vào **Pending Phase 2**.

#### 4. Soulbound Logic
- ✅ `RentalAgreementSBT`: Override `_update()` để chặn `transfer`/`transferFrom`
- ✅ Token gắn chặt với ví người thuê (không thể chuyển nhượng)

**Tham khảo chi tiết**: [QUY_LUAT_TOI_CAO.md Section 5](file:///c:/book_app_v2/kiến%20trúc/cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md#L311-L333)

---

## II. 🔴 IPFS Simulator (Storage Layer - PRIMARY FOCUS)

### Module IPFS (Lưu trữ Phi tập trung)
- **Mục đích**: Giả lập IPFS Gateway tự quản lý (Self-hosted Mock)
- **Vị trí vật lý**: `c:\book_app_v2\IPFS` (Hoạt động độc lập, giả lập IPFS Node)
- **Cấu trúc lưu trữ**:
  - **`/images`**: Binary image files (.jpg, .png). **Tên file = CID**
  - **`/metadata`**: ERC-721 Metadata JSON. **Tên file = CID**
- **Cơ chế định danh**: CIDv1 (Content Identifier) đảm bảo tính duy nhất
- **Định dạng Metadata (JSON)**:
  ```json
  {
      "name": "Tên sách",
      "description": "Mô tả chi tiết",
      "image": "https://ipfs.io/ipfs/<Image_CID>",
      "attributes": [
          { "trait_type": "Author", "value": "Tác giả" },
          { "trait_type": "Price", "value": "Giá thuê" }
      ]
  }
  ```
- **Routes**: `/ipfs/:cid` (Auto-search trong `/images` và `/metadata`)

---

## III. 🔴 Mock Services (External API Simulation - PRIMARY FOCUS)

### Mock Server Architecture (Port 4000)
Giả lập các dịch vụ bên thứ 3 để hệ thống hoạt động độc lập, không phụ thuộc external APIs.

#### 1. Mock Legal Service (FPT eContract)
- **Endpoint**: `POST /fpt/electronic-sign/create`
- **Chức năng**: Tạo chữ ký số giả lập, trả về `termsHash` (deterministic hashing)
- **Response**: `{ document_id, signing_url, terms_hash }`

#### 2. Mock IoT Service (Tuya Smart Lock)
- **Endpoint**: `POST /tuya/v1.0/devices/:id/unlock`
- **Chức năng**: Giả lập mở khóa tủ sách
- **Response**: `{ ticket_id, valid_until, success }`

#### 3. Mock Banking Service (Casso Webhook)
- **Endpoint**: `POST /api/webhook/casso` (Webhook to Backend)
- **Chức năng**: Giả lập thông báo chuyển khoản ngân hàng
- **UI**: Mock Bank Interface tại `/mock-ui/bank`

---

## IV. 🧪 Backend Modules (Testing Gateway - SUPPORTING ROLE)

**⚠️ Vai trò**: Backend chỉ là **orchestration layer** để kiểm thử Smart Contracts, KHÔNG phải business logic chính.

Hệ thống Backend được tổ chức theo kiến trúc **Vertical Slice Architecture**, chia thành các Modules độc lập.

### 1. Module Identity (Định Danh & Phân Quyền)
- **Mục đích**: Quản lý người dùng, tài khoản ví, số dư và **Vai trò (Role)**.
- **Routes**: `/api/register`, `/api/login`, `/api/user/...`
- **Chức năng chính**:
    - **Authentication**: Xác thực user qua Token/Header.
    - **Role Management**: Phân loại người dùng (`USER`, `LENDER`, `ADMIN`).
    - **Register**: Tạo user + ví Ethereum giả lập.
    - **Balance**: Quản lý số dư VND.
    - **Transactions**: Xem lịch sử giao dịch (Phase 1.5).

### 1.1 Module Config (Cấu hình Hệ thống) - **NEW Phase 1**
- **Mục đích**: Quản lý tham số hệ thống động.
- **Routes**: `/api/config`
- **Chức năng chính**:
    - Điều chỉnh **Min Collateral Ratio** (Tỷ lệ ký quỹ).
    - Điều chỉnh **Platform Fee** (Phí sàn).
    - Lưu cấu hình vào `systemConfig` (InMemory).

### 2. Module Rental (Thuê Mượn)
- **Mục đích**: Quản lý yêu cầu thuê của User.
- **Routes**: `/api/booking`
- **Chức năng chính**:
    - **Booking**: Tạo hợp đồng chờ ký.
    - **Payment**: Chuyển tiền vào **System Escrow** (Phase 1).
    - **Status Flow**: `PENDING_SIGN` → `SIGNED_PENDING_APPROVAL` → (Chuyển Admin duyệt) → `SIGNED_UNPAID` → `PAID` → `ACTIVE`.
    - **Requests**: Xử lý yêu cầu trả sách của User (`RETURN_REQUESTED`).
- **Lưu ý**: Các quyền Phê duyệt và Xác nhận trả ĐÃ CHUYỂN sang Module Admin.

### 3. Module Payment (Thanh Toán)
- **Mục đích**: Xử lý dòng tiền (Off-chain).
- **Routes**: `/api/webhook/casso`, `/api/booking/:code/pay-wallet`
- **Chức năng chính**:
    - **Webhook Casso**: Nhận tín hiệu chuyển khoản ngân hàng thật (qua ngrok/localtunnel).
    - **Webhook Casso**: Nhận tín hiệu chuyển khoản ngân hàng thật (qua ngrok/localtunnel).
    - **Internal Wallet**: Trừ tiền số dư giả lập. (Primary payment method for Demo)
    - **Note**: Chuyển khoản ngân hàng trực tiếp đã được ẩn khỏi luồng Booking, thay vào đó là nạp tiền vào Wallet.

### 4. Module IoT (Kết nối Thiết bị)
- **Mục đích**: Điều khiển thiết bị phần cứng.
- **Routes**: `/api/devices/:id/unlock`
- **Chức năng chính**: Generate Passcode/Ticket để mở khóa tủ.

### 5. Module Book (Quản lý Sách)
- **Mục đích**: Quản lý Listing và Assets.
- **Routes**: `/api/books`
- **Chức năng chính**:
    - **Rent Out**: Upload ảnh, tạo Metadata.
    - **Status Flow**: `PENDING_VERIFICATION` (Mới tạo) → `VERIFIED` (Admin duyệt) → `RENTED`.
    - **Listing**: Chỉ hiển thị sách có status `VERIFIED`.

### 6. Module Admin (Trung tâm Kiểm soát)
- **Mục đích**: Trung tâm điều phối và xác thực (Admin-centric Architecture).
- **Routes**: `/api/admin` (Protected Middleware)
- **Chức năng chính**:
    - **Book Verification**:
        - `verify-listing`: Duyệt sách mới niêm yết (Gán Risk Tier A/B/C).
        - `reject-listing`: Từ chối niêm yết sách (Bắt buộc kèm lý do).
        - `verify-pre-rent`: Xác nhận sách đủ điều kiện thuê.
    - **Rental Management**:
        - `approve`: Phê duyệt thủ công đơn thuê (thay cho Lender).
        - `confirm-return`: Xác nhận trả sách, **Settlement** (Tính phí sàn, chuyển tiền cho Lender).
    - **Monitor**: Giám sát toàn hệ thống.
    - **Finance**:
        - `stats`: Xem doanh thu, escrow, pending (Phase 1.5).
        - `payout`: Kích hoạt quyết toán tiền về cho Lender (Manual/Cron).

### 7. Module IPFS (Lưu trữ)
- **Mục đích**: Giả lập Gateway IPFS tự quản lý (Self-hosted Mock IPFS).
- **Vị trí vật lý**: `c:\book_app_v2\IPFS` (Hoạt động độc lập với Backend, giả lập Node lưu trữ rời).
- **Cấu trúc lưu trữ**:
    - **`/images`**: Lưu trữ file ảnh bìa sách (Binary image files: .jpg, .png). Tên file chính là CID.
    - **`/metadata`**: Lưu trữ thông tin sách dưới dạng JSON (ERC-721 Metadata Standard). Tên file chính là CID.
- **Cơ chế định danh file**: Sử dụng CID (Content Identifier) v1 để đảm bảo tính duy nhất và toàn vẹn dữ liệu.
- **Định dạng Metadata (JSON)**:
    ```json
    {
        "name": "Tên sách",
        "description": "Mô tả chi tiết",
        "image": "https://ipfs.io/ipfs/<Image_CID>",
        "attributes": [
            { "trait_type": "Author", "value": "Tác giả" },
            { "trait_type": "Price", "value": "Giá thuê" }
        ]
    }
    ```
- **Routes**: `/ipfs/:cid` (Tự động tìm kiếm CID trong các thư mục con).

### 8. Module Legal (Hợp đồng Pháp lý - Phase 2)
- **Mục đích**: Quản lý templates, sinh hợp đồng động và workflows ký kết.
- **Vị trí**: `backend/src/modules/Legal/`
- **Trạng thái**: ✅ **IMPLEMENTED** (Phase 2 Completed)
- **Cấu trúc**:
    - `contract.controller.js`: API endpoints cho việc tạo và xem hợp đồng.
    - `contract.generator.js`: Engine thay thế biến (`{{variable}}`) vào Markdown templates.
    - `tempStore.js`: Quản lý lưu trữ hợp đồng tạm (Preview) với TTL (Time-To-Live).
    - `templates/`: Thư mục chứa mẫu hợp đồng chuẩn (`rental_agreement.md`).
    - `adapters/`: FPT eContract adapter (Mock).
- **Chức năng chính**:
    - **Dynamic Generation**: Tạo hợp đồng từ Template + Booking Data + Config.
    - **Preview Workflow**: Cho phép User xem trước và quyết định (Accept/Reject).
    - **Security**: Tính `termsHash` (SHA-256) để đảm bảo tính toàn vẹn dữ liệu trước khi ký.
    - **Routes**: `/api/legal/preview`, `/api/legal/accept`, `/api/legal/reject`.

**Ghi chú**: Module Legal hoạt động song song với Rental module để xử lý flow ký kết trước khi thanh toán.


---

### 9. Module Policy Engine (Quyết định Thông minh - Phase 2)
- **Mục đích**: Tự động hóa quy trình duyệt đơn thuê dựa trên rủi ro.
- **Routes**: `/api/policy`
- **Chức năng chính**:
    - **TrustScore**: Tính điểm tin cậy người thuê dựa trên lịch sử.
    - **Policy Matrix**: Quyết định duyệt (AUTO/REVIEW/MANUAL) dựa trên:
        - **Book Tier**: A (High Risk) / B (Medium) / C (Low Risk).
        - **Trust Score**: High / Medium / Low.
        - **Deposit Ratio**: Tỷ lệ cọc so với giá trị thực.
    - **Deadline Monitor**: Tự động hủy đơn chờ duyệt quá lâu (mỗi 5 phút).

---

## V. 🧪 Frontend Structure (Testing UI - SUPPORTING ROLE)

**⚠️ Vai trò**: Frontend chỉ là **demo interface** để kiểm thử blockchain flows, KHÔNG phải production UI.

Dự án Frontend (React/Vite) được tổ chức để tương tác chặt chẽ với các Smart Contracts thông qua Backend gateway.

### 1. Phân trang Chính (`pages`)
- **`Dashboard.tsx`**: Test rental flows
  - Hiển thị danh sách sách đang thuê (`Active Rentals`)
  - Test "Trả sách" (Trigger `VinaLibVault.requestReturn()`)
  - Xem lịch sử giao dịch
  
- **`Booking.tsx`**: Test booking workflow
  - Booking Form → Review Contract → Sign (Mock) → Payment (Mock)
  - Trigger `MockLegalService` và `VinaLibVault.createRental()`
  
- **`OwnerDashboard.tsx`**: Admin Dashboard (System Controls)
  - Duyệt sách (Verify Listing)
  - Phê duyệt đơn thuê (Approve Booking)
  - Xác nhận trả sách (Confirm Return)

- **`Explorer/`**: Blockchain Explorer - **NEW Phase 2**
  - **ExplorerHome.tsx**: Dashboard chính
    - Network stats (Block Height, Gas Price, Avg Block Time)
    - Latest Blocks grid
    - Latest Transactions grid
    - Auto-refresh mỗi 5 giây
  - **ExplorerEvents.tsx**: Event logs viewer
    - Decode events: BookVerified, BookStatusChanged, UpdateUser, Transfer
    - Event filtering và timestamp display
  - **ExplorerLayout.tsx**: Layout wrapper
  - **OnChainDataExplorer.tsx**: Specialized viewer cho VinaLib Contracts (Evidence Pack, Book Assets)
  - **ExplorerService.ts** (api/): Service layer
    - `getNetworkStats()`, `getRecentBlocks()`, `getRecentTxs()`
    - `getBlock()`, `getTransaction()`, `getAddressInfo()`
    - `getRecentEvents()`: Decoded contract events
    - Direct RPC connection: `http://127.0.0.1:8545`

### 2. Shared Layer (`shared/`)
- **`shared/ui`**:
  - **Basic UI**: Button, Input, Badge, Card
  - **Loading**: Skeleton, SkeletonCard, SkeletonTable (Phase 2)
  - **Layout**: MainLayout (Responsive), SplitLayout
- **`shared/lib`**: Axios instance, toast helpers, utilities
- **`app/styles`**:
  - `variables.css`: Design Tokens
  - `responsive.css`: Grid & Mobile-first utilities (Phase 2)

### 3. FSD Layers (Phase 2 Ready)
- **`widgets/`**: 📦 Chờ team design (Header, Sidebar, BookCard)
- **`features/`**: 📦 Chờ team design (AuthFlow, RentBookFlow)
- **`entities/`**: 📦 Chờ team design (User, Book, Rental models)

---

## VI. 📦 Static Assets (Tài nguyên Tĩnh)

### 1. Hình ảnh Sách (`frontend/public/images/books/`)
- **Mục đích**: Lưu trữ ảnh bìa sách cho giao diện demo
- **Định dạng**: `.jpg`, `.png`
- **Sách hiện có**:
  - `de-men-phieu-luu-ky.jpg` - Dế Mèn Phiêu Lưu Ký
  - `số_đỏ.jpg` - Số Đỏ
  - `blockchain_cơ_bản.jpg` - Sách Blockchain Cơ Bản
  - `mastering_ethereum.jpg` - Mastering Ethereum
  - `smart_contract_security.jpg` - Smart Contract Security
- **Cách sử dụng**: Frontend load từ `imageUrl` trong API response

> **Ghi chú**: CID (Content Identifier) từ IPFS chỉ được sử dụng để mint NFT token on-chain, không hiển thị trực tiếp cho UI testing để giảm complexity.
