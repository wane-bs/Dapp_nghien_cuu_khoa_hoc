# QUY LUẬT TỐI CAO - HỆ THỐNG VINA-LIB VAULT

Tài liệu này tổng hợp các quy tắc kiến trúc, cấu trúc thư mục và các lưu ý bắt buộc cho dự án, dựa trên định hướng Vertical Slice Architecture (Backend) và Feature-Sliced Design (Frontend).

**⚠️ QUAN TRỌNG**: Dự án áp dụng **Chiến lược Lai (Hybrid Strategy)**:
- 📁 **Cấu trúc thư mục**: Tuân thủ 100% các quy định trong file này
- 💻 **Mã nguồn**: Implement theo từng giai đoạn (xem Section 0)
- 📚 **Chi tiết**: Đọc `mô tả tổng hợp/CHIẾN_LƯỢC_LAI.md`

---

## 0. PHÂN GIAI ĐOẠN PHÁT TRIỂN (Development Phases)

### 🎯 Overview: "Scaffolding Ready, Minimal Implementation"

```
┌────────────────────────────────────────────────────────┐
│  Phase 1 (HIỆN TẠI): Blockchain Core + Testing UI     │
│  → Folder Structure: 100% complete (theo QUY_LUAT)    │
│  → Code Implementation: Minimalist (chỉ đủ test)      │
├────────────────────────────────────────────────────────┤
│  Phase 2 (TƯƠNG LAI): UI/UX Integration               │
│  → Khi team design ready                              │
│  → Expand code vào folders đã tạo                     │
│  → Không cần refactor structure                       │
└────────────────────────────────────────────────────────┘
```

### 📋 Compliance Matrix (Ma trận Tuân thủ)

| Component | Folder Structure | Code Implementation | Phase |
|-----------|------------------|---------------------|-------|
| **Backend/Bootstrapper** | ✅ Bắt buộc | ✅ Minimalist | Phase 1 |
| **Backend/Modules** | ✅ Bắt buộc | ✅ Minimalist | Phase 1 |
| **Backend/BuildingBlocks** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Phase 2 |
| **Frontend/app** | ✅ Bắt buộc | ✅ Basic | Phase 1 |
| **Frontend/pages** | ✅ Bắt buộc | ✅ Functional only | Phase 1 |
| **Frontend/shared** | ✅ Bắt buộc | ✅ Basic UI kit | Phase 1 |
| **Frontend/widgets** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Phase 2 |
| **Frontend/features** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Phase 2 |
| **Frontend/entities** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Phase 2 |
| **Contracts** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | Phase 1 |
| **Mock Services** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | Phase 1 |
| **IPFS Simulator** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | Phase 1 |

### 🔍 Definition of "Minimalist" Implementation

**Backend Module (Phase 1)**:
- ✅ CÓ: `*.module.js` (route registration)
- ✅ CÓ: `*.controller.js` (request handler - đơn giản)
- ✅ CÓ: `store.js` (in-memory Map)
- ❌ KHÔNG: Service layer riêng
- ❌ KHÔNG: Validation schemas (Joi/Yup)
- ❌ KHÔNG: Sophisticated error handling

**Frontend Page (Phase 1)**:
- ✅ CÓ: Functional component
- ✅ CÓ: Basic state (useState)
- ✅ CÓ: API calls (axios)
- ✅ CÓ: Inline styles hoặc basic CSS
- ❌ KHÔNG: Reusable component extraction
- ❌ KHÔNG: Custom hooks
- ❌ KHÔNG: Complex state management

### ✅ Phase 1 Checklist (Current - Blockchain Focus)

**Must Have**:
- [x] Folder structure đầy đủ theo Sections 1-3
- [ ] Smart Contracts (100% implementation)
- [ ] IPFS Simulator (Full CIDv1 support)
- [ ] Mock Services (FPT Legal, Tuya IoT, Bank)
- [x] Backend: Minimalist modules (controller + store)
- [x] Frontend: Basic pages (functional only)

**Must NOT Have** (defer to Phase 2):
- [ ] ❌ BuildingBlocks implementation
- [ ] ❌ Frontend widgets/features/entities implementation
- [ ] ❌ Design system
- [ ] ❌ Database migration

### 🎨 Phase 2 Checklist (Future - UI/UX Integration)

**Triggers để chuyển sang Phase 2**:
- ✅ Team design hoàn thành mockups/prototypes
- ✅ Smart Contracts đã audit và stable
- ✅ Product Owner approve UI/UX investment

**Then Implement**:
- [ ] Frontend: Populate `/widgets`, `/features`, `/entities`
- [ ] Backend: BuildingBlocks (Logging, Utils)
- [ ] Design system trong `/shared/ui`
- [ ] Advanced state management (if needed)



## 1. Backend (Node.js)

### Kiến Trúc: Vertical Slice Architecture (VSA)
Tổ chức mã nguồn xoay quanh **Tính năng (Feature)** thay vì Layers kỹ thuật. Mỗi Module là một lát cắt dọc (Slice) độc lập chứa trọn vẹn logic của một nghiệp vụ.

### Cấu Trúc Thư Mục (@backend/src)
- **`/Bootstrapper`**: Điểm khởi đầu (Entry Point).
    - `server.js`: Khởi tạo Express app, cấu hình Middleware và load các Modules. Tuyệt đối KHÔNG chứa logic nghiệp vụ.
- **`/Modules`**: Chứa các Bounded Contexts (Phạm vi nghiệp vụ).
    - **Nguyên tắc**: Mỗi thư mục con là một Module độc lập (ví dụ: `Identity`, `Rental`).
    - **Thành phần mỗi Module** (Current Phase - Minimalist):
        - `controller.js`: Express Router, xử lý HTTP Request/Response.
        - `store.js` (optional): Kho dữ liệu module-specific (in-memory).
        - `/adapters` (optional): Giao tiếp với external services (Mock APIs).

> [!NOTE]
> **Roadmap**: `*.module.js` pattern sẽ được thêm vào trong Phase phát triển tiếp theo để  cải thiện encapsulation.  
> Hiện tại implementation dùng Express Router trực tiếp. Xem [CHIẾN_LƯỢC_LAI.md](../đề%20án%20của%20huy/CHIẾN_LƯỢC_LAI.md) để hiểu lý do.
- **`/BuildingBlocks`** (Dự kiến): Các thư viện kỹ thuật dùng chung (Logging, Utils).

### Quy Tắc Quan Trọng

#### 🎯 Phase 1 (Current - Minimalist)

1. **Cô lập Module**: Các Module hạn chế gọi trực tiếp lẫn nhau. Nếu cần giao tiếp, thông qua Shared Store.
   - ✅ **Allowed**: `users.get()`, `bookings.get()` từ shared store
   - ❌ **Not allowed**: Direct module-to-module function calls

2. **Controller mỏng (Ultra-thin)**:
   - ✅ **DO**: Nhận request → Validate đơn giản → Orchestrate calls → Trả response
   - ❌ **DON'T**: Business logic phức tạp, transformations, calculations
   - 📏 **Target**: Mỗi controller function ≤ 20 lines

3. **Naming**: 
   - Code (biến, hàm): Tiếng Anh
   - Comment và documentation: Tiếng Việt
   - File naming: `kebab-case` (ví dụ: `identity.controller.js`)

4. **Store Pattern**:
   - ✅ **Allowed**: `Map`, `Set` cho in-memory storage
   - ❌ **Not allowed**: Database, ORM, complex queries
   - 💾 **Persistence**: Data loss on restart is acceptable

#### 🎨 Phase 2 (Future - Expanded)

<details>
<summary>📦 Khi migrate sang Phase 2 (Click để xem)</summary>

1. **Service Layer**: Extract business logic từ controllers
2. **BuildingBlocks/Logging**: Implement structured logging
3. **BuildingBlocks/Utils**: Common utilities (date, string, validation)
4. **Event-driven**: Module communication qua Event Bus
5. **Database**: Migrate từ in-memory sang persistent storage

**Migration Example**:
```javascript
// Phase 1 (Current)
const register = (req, res) => {
    users.set(username, { username, email });
    res.json({ success: true });
};

// Phase 2 (Future)
const register = async (req, res) => {
    const result = await userService.register(req.body);
    logger.info('User registered', { username });
    res.json(result);
};
```
</details>

#### ⚠️ Anti-patterns (TRÁNH trong Phase 1)

- ❌ Tạo service layer khi controller vẫn đơn giản
- ❌ Install validation libraries (Joi, Yup) khi chưa cần thiết
- ❌ Setup logging infrastructure khi `console.log` đủ dùng
- ❌ Viết custom middleware khi Express built-ins đủ dùng

---

## 2. Frontend (React)

### Kiến Trúc: Feature-Sliced Design (FSD)
Chia ứng dụng thành các Tầng (Layers) phân cấp rõ ràng. Quy tắc **Phụ thuộc một chiều**: Layer trên chỉ được import từ Layer dưới, không được import ngược lại.

### Cấu Trúc Thư Mục (@frontend/src)
Thứ tự Layer từ trên xuống dưới (Cao -> Thấp):
1. **`/app`**: Khởi tạo ứng dụng.
    - `App.tsx`: Routing, Layout wrapping.
    - `/styles`: Global CSS (`index.css`, `App.css`).
    - `/providers`: Context Providers.
2. **`/pages`**: Các trang hoàn chỉnh (Composition Root cho UI).
    - Mỗi trang (ví dụ: `home`, `login`) có thư mục riêng chứa `ui/Page.tsx`.
3. **`/widgets`** (Dự kiến): Các khối UI lớn độc lập (Header, Sidebar).
4. **`/features`** (Dự kiến): Các chức năng nghiệp vụ tương tác (Auth, RentButton).
5. **`/entities`** (Dự kiến): Các thực thể nghiệp vụ (User, Product).
6. **`/shared`**: Các thành phần dùng chung, không chứa logic nghiệp vụ cụ thể.
    - `/ui`: UI Kit cơ bản (Button, Input, Layout).
    - `/api`: Cấu hình Axios.
    - `/lib`: Helper functions.

### Quy Tắc Quan Trọng

#### 🎯 Phase 1 (Current - Minimalist)

1. **Folder Structure nhưng Minimal Code**:
   - ✅ **CREATE**: All 6 FSD layers folders (`app`, `pages`, `widgets`, `features`, `entities`, `shared`)
   - ✅ **IMPLEMENT**: Chỉ `/app`, `/pages`, `/shared`
   - 📦 **EMPTY**: `/widgets`, `/features`, `/entities` (để `.gitkeep`)

2. **Pages Layer (Implement ngay)**:
   - ✅ Mỗi page là functional component đơn giản
   - ✅ Direct API calls (không cần service abstraction)
   - ✅ Inline styles hoặc CSS module đơn giản
   - ❌ KHÔNG extract thành widgets/features ngay

3. **Shared Layer (Implement ngay)**:
   - ✅ `/shared/ui`: Basic components (Button, Input) - tái sử dụng
   - ✅ `/shared/api`: Axios config đơn giản
   - ✅ `/shared/lib`: Utilities cơ bản (formatDate, formatPrice)
   - ❌ KHÔNG tạo complicated component library

4. **Import Rules (Đơn giản hóa)**:
   - ✅ **Allowed**: Pages import từ Shared
   - ✅ **Allowed**: Pages import từ Pages khác (tạm thời)
   - 📝 **Note**: Sẽ refactor khi migrate sang Phase 2

#### 🎨 Phase 2 (Future - Full FSD)

<details>
<summary>📦 Khi team design ready (Click để xem)</summary>

1. **Widgets Layer**:
   - Extract complex UI blocks từ Pages (Header, Sidebar, BookCard)
   - Widgets compose từ Shared UI components

2. **Features Layer**:
   - Business logic có tương tác (AuthForm, RentBookFlow)
   - State management nếu cần (Zustand/Redux)

3. **Entities Layer**:
   - Domain models (User, Book, Rental)
   - API services (userApi, bookApi)

4. **Full FSD Rules**:
   - ❌ Không Cross-Import trong cùng layer
   - ✅ Strict one-way dependency: app → pages → widgets → features → entities → shared

**Migration Path**:
```
Phase 1:           Phase 2:
pages/             pages/
  home/              home/
    HomePage.tsx ──→   ui/HomePage.tsx (compose widgets/features)
                     widgets/
                       BookList.tsx (extracted)
                     features/
                       RentButton.tsx (extracted)
```

</details>

#### ⚠️ Anti-patterns (TRÁNH trong Phase 1)

- ❌ Quá mức engineering: Tạo widgets/features khi pages vẫn đơn giản
- ❌ Premature abstraction: Extract components khi chưa có pattern rõ ràng
- ❌ Design system: Tạo theme/variant system khi chỉ có 2-3 pages
- ❌ Complex routing: Nested routes, guards khi chưa cần thiết

---

## 3. Contracts (Solidity/Chainlink)

### Mục Tiêu
Quản lý logic Blockchain, định danh (Identity), tài sản (Assets) và thỏa thuận (Agreements). Tích hợp Chainlink Functions & Automation để kết nối với thế giới thực.

### Cấu Trúc Thư Mục (@contracts)
- `/contracts`: Mã nguồn Solidity.
    - **Token System**:
        - `SuChinToken.sol` (ERC-20): Token tiện ích thanh toán giả lập trong hệ thống local.
        - `BookAsset.sol` (ERC-4907): NFT đại diện cho sách, hỗ trợ chuẩn cho thuê (Rentable NFT).
        - `RentalAgreementSBT.sol` (Soulbound Token): Đại diện cho hợp đồng thuê đã ký, gắn liền với định danh người thuê (không thể chuyển nhượng).
    - **Core**:
        - `VinaLibVault.sol`: Contract chính tích hợp Chainlink Client & Automation.
    - **Interfaces**:
        - `IERC4907.sol`: Chuẩn giao diện cho thuê tài sản.

### Các Tệp Quan Trọng & Chức Năng
1. **`BookAsset.sol`** (ERC-721 + ERC-4907):
    - `setUser(tokenId, user, expires)`: Đặt người thuê và thời hạn thuê cho sách.
    - `userOf(tokenId)`: Kiểm tra ai đang là người thuê hiện tại.
2. **`RentalAgreementSBT.sol`**:
    - Soulbound Token: Chặn hàm `transfer` để đảm bảo tính pháp lý gắn liền với chủ sở hữu.
3. **`VinaLibVault.sol`**:
    - `sendRequest`: Gửi yêu cầu Chainlink Functions (gọi API Legal/IoT).
    - `checkUpkeep`/`performUpkeep`: Tự động hóa quy trình kiểm tra hạn thuê.

### Quy Tắc Quan Trọng
1. **Standards Compliance**: Tuân thủ các chuẩn ERC (ERC-20, ERC-721, ERC-4907) để đảm bảo tương thích ví và marketplace.
2. **Soulbound Logic**: Với các Token định danh hoặc chứng nhận (Certificate), phải vô hiệu hóa khả năng chuyển nhượng.
3. **Security**:
   - Sử dụng `Ownable` để quản lý quyền admin (mint, config).
   - Không lưu Private Key hay Bí mật API trực tiếp trong code SC.

---

## 4. Quy Luật Chung (Toàn Dự Án)

1. **Ngôn ngữ**:
    - **Code**: Tiếng Anh.
    - **Comment/Docs/Commit Note**: Tiếng Việt (Ưu tiên).
2. **Đường dẫn (Paths)**: Luôn sử dụng Absolute Path hoặc Alias (nếu có config) để tránh lầm lẫn.
3. **Môi trường (Environment)**:
    - Code cần hỗ trợ biến môi trường (`process.env`) để dễ dàng chuyển đổi Local/Prod.
    - Hiện tại đang chạy chế độ Mock/Local là chính.

---

## 5. Ràng Buộc Pháp Lý & Kỹ Thuật (Bắt buộc)
*Phiên bản cập nhật ngày 31/12/2025 theo Báo cáo Đối chiếu Hợp đồng*

1.  **Thanh Toán & Tiền Cọc (Payment & Deposit)**:
    *   Tiền cọc và Thanh toán thực tế phải được xử lý **Off-chain (VND)** thông qua cổng thanh toán (PSP) hợp pháp.
    *   **SuChinToken** chỉ đóng vai trò Logic Token (Traceability) để vận hành quy trình hệ thống, **KHÔNG** dùng để lưu trữ giá trị tiền cọc thực.
    *   Hợp đồng thông minh chỉ ghi nhận bằng chứng thanh toán (qua `pspRef`) chứ không trực tiếp giữ tiền (Escrow).

2.  **Ràng Buộc Xác Thực (Validation Constraints)**:
    *   **Ma Trận Phê Duyệt Tự Động (Policy Engine Matrix)**:
        *   Hợp đồng thuê (RentalAgreementSBT) được mint on-chain dựa trên **kết quả của Policy Engine**:
            *   `AUTO`: SBT mint **ngay lập tức** sau khi User ký hợp đồng (không cần Lender can thiệp)
            *   `REVIEW`: SBT mint **tự động sau timeout** nếu không có từ chối (30 phút)
            *   `MANUAL`: SBT mint **sau khi Admin approve** (yêu cầu human oversight)
            *   `REJECT`: **Không mint** - đơn bị từ chối
        *   Ma trận quyết định dựa trên: `Book Risk Tier` × `User TrustScore` × `Deposit Ratio`
    *   **Trả Sách**: Yêu cầu Người Thuê gửi request -> Admin xác nhận tình trạng -> Mới thực thi `returnBook` trên chuỗi.
    *   **Verify External Data**: Mọi dữ liệu từ ngoại lai (như `pspRef`) phải được verify (qua Chainlink Functions hoặc Trusted Backend) trước khi ghi vào blockchain.

3.  **An Toàn & Bảo Mật (Security & Access Control)**:
    *   Các hàm thay đổi trạng thái quan trọng (`createRental`, `returnBook`) **KHÔNG** được để `external` cho bất kỳ ai gọi. Phải có Modifier (`onlyOwner`, `onlyBackend`) hoặc cơ chế Verify Signature.
    *   **Data Privacy**: Chỉ lưu trữ Hash của dữ liệu nhạy cảm (PII, nội dung hợp đồng) lên Blockchain. Không lưu plain text.
    *   **Versioning**: `EvidencePack` phải bao gồm thông tin phiên bản (`version`) của điều khoản hợp đồng tại thời điểm ký kết.

4.  **Pháp Lý (Legal Validity)**:
    *   Hợp đồng mẫu (Template) chỉ để tham khảo off-chain. Chỉ hợp đồng "đã ký số" mới được coi là bản chính thức để lưu trữ on-chain.

---

## 6. CODE REVIEW CHECKLIST (PHÂN THEO PHASE)

### 📋 Checklist cho mọi Pull Request

#### ✅ Phase 1 (Current) - BẮT BUỘC kiểm tra:

**Folder Structure**:
- [ ] Folder structure tuân thủ VSA (Backend) hoặc FSD (Frontend)
- [ ] Không tạo folders ngoài quy định trong Sections 1-2
- [ ] Nếu tạo folder mới, có giải thích trong PR description

**Backend Code Quality**:
- [ ] Controller functions ≤ 20 lines
- [ ] Không có service layer (trừ khi cực kỳ cần thiết)
- [ ] Sử dụng in-memory store (Map/Set), không có database calls
- [ ] Naming: English for code, Vietnamese for comments
- [ ] Không install thêm validation libraries (Joi, Yup) trong Phase 1

**Frontend Code Quality**:
- [ ] Chỉ implement code trong `/app`, `/pages`, `/shared`
- [ ] `/widgets`, `/features`, `/entities` chỉ có `.gitkeep` hoặc để trống
- [ ] Components đơn giản, không có complex state management
- [ ] Direct API calls (không abstraction layer)
- [ ] Inline styles hoặc simple CSS, không có styled-components/emotion

**Smart Contracts** (Priority cao):
- [ ] Tuân thủ ERC standards (ERC-20, ERC-721, ERC-4907)
- [ ] Implement Soulbound logic đúng (block transfer)
- [ ] Security: `onlyOwner` modifiers cho critical functions
- [ ] Legal compliance: Chỉ lưu hash, không lưu sensitive data
- [ ] Gas optimization: Sử dụng `uint256` thay vì `uint8`, packed structs
- [ ] Unit tests coverage ≥ 80%

**Mock Services**:
- [ ] Deterministic behavior (same input → same output)
- [ ] API compatibility với specs gốc (FPT, Tuya, Bank)
- [ ] Response format đúng chuẩn

**IPFS Simulator**:
- [ ] CIDv1 format đúng chuẩn
- [ ] ERC-721 metadata schema compliance
- [ ] File naming: `{CID}.{ext}`

#### ❌ Phase 1 - CẤM các patterns sau:

**Backend**:
- [ ] ❌ Tạo `/BuildingBlocks` implementation (chỉ folders allowed)
- [ ] ❌ Service layer phức tạp
- [ ] ❌ Database migrations
- [ ] ❌ Event Bus implementation
- [ ] ❌ Complex error handling middleware

**Frontend**:
- [ ] ❌ Implement code trong `/widgets`, `/features`, `/entities`
- [ ] ❌ Design system với theme provider
- [ ] ❌ State management libraries (Redux, Zustand, Recoil)
- [ ] ❌ Custom hooks infrastructure
- [ ] ❌ Complex component abstraction

#### 🎨 Phase 2 - CHỈ ĐƯỢC khi có triggers:

**Triggers để approve Phase 2 work**:
- [ ] ✅ Team design đã hoàn thành mockups/prototypes
- [ ] ✅ Smart Contracts đã audit và stable (≥ 90% test coverage)
- [ ] ✅ Product Owner đã approve UI/UX investment
- [ ] ✅ Có roadmap rõ ràng cho Phase 2 features

**Nếu có đủ triggers, allowed**:
- [ ] Frontend: Populate `/widgets`, `/features`, `/entities`
- [ ] Backend: Implement `/BuildingBlocks` (Logging, Utils)
- [ ] Design system trong `/shared/ui`
- [ ] State management (nếu complexity cao)
- [ ] Database migration scripts

---

### 🚨 Red Flags (REJECT PR ngay lập tức)

Các patterns sau **KHÔNG BAO GIỜ** được accept trong Phase 1:

1. **Over-engineering**:
   - Installing 5+ new packages cho một feature đơn giản
   - Tạo abstraction layer khi chỉ có 1-2 use cases
   - Generic utility functions khi chỉ dùng 1 lần

2. **Premature Optimization**:
   - Caching layer khi data còn ít
   - Complex indexing trong in-memory store
   - Performance profiling khi app chưa có bottleneck

3. **Scope Creep**:
   - PR implement Phase 2 features khi chưa có triggers
   - Thêm "nice-to-have" features không liên quan blockchain testing
   - Refactor lớn không liên quan đến task chính

4. **Architecture Violations**:
   - Backend không theo VSA structure
   - Frontend không theo FSD layers
   - Smart Contracts không tuân thủ legal constraints (Section 5)

---

### 📏 Metrics để Track Compliance

**Weekly Review**:
- Lines of code in `/BuildingBlocks`: Should be 0 (Phase 1)
- Lines of code in `/widgets`+`/features`+`/entities`: Should be 0 (Phase 1)
- Number of backend packages: Should stay minimal (<15)
- Number of frontend packages: Should stay minimal (<25)
- Smart Contract test coverage: Should be ≥ 80%

**When to escalate**:
- Nếu complexity tăng quá nhanh → Review với team lead
- Nếu có nhiều anti-patterns → Training session
- Nếu không tuân thủ phases → Update roadmap

---

**📚 Tham khảo thêm**:
- `mô tả tổng hợp/CHIẾN_LƯỢC_LAI.md` - Chi tiết implementation guidelines
- `mô tả tổng hợp/ĐỊNH_VỊ_DỰ_ÁN.md` - Project positioning & priorities
