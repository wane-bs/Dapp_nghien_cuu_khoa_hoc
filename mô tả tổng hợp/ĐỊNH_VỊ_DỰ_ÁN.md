# 🎯 ĐỊNH VỊ DỰ ÁN (PROJECT POSITIONING)

**Version**: 2.0 - Blockchain-Focused  
**Date**: 2026-01-03  
**Status**: Core Development Phase

---

## 📌 TÓM TẮT ĐỊNH VỊ MỚI

VinaLib-Vault đã được **tái định vị** từ một full-stack web application thành một **blockchain research project** với mục tiêu chính là phát triển và hoàn thiện các thành phần blockchain core.

```
┌─────────────────────────────────────────────────────────────┐
│                  🎯 MỤC TIÊU CHÍNH (80%)                     │
│                                                              │
│  1. Smart Contracts (contracts/)                            │
│  2. IPFS Simulator (IPFS/)                                  │
│  3. Mock Services (mock-server/)                            │
├─────────────────────────────────────────────────────────────┤
│                 🧪 HỖ TRỢ KIỂM THỬ (20%)                     │
│                                                              │
│  4. Backend API (backend/) - Orchestration only             │
│  5. Frontend UI (frontend/) - Demo interface only           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔀 CHIẾN LƯỢC LAI (HYBRID STRATEGY)

### **Nguyên tắc: "Scaffolding Ready, Minimal Implementation"**

Dự án áp dụng chiến lược **kết hợp** giữa hai approaches:

```
┌──────────────────────────────────────────────────────────────┐
│  📁 CẤU TRÚC THƯ MỤC (Folder Structure)                      │
│     → Tuân thủ QUY_LUAT_TOI_CAO.md                           │
│     → VSA (Backend) + FSD (Frontend) đầy đủ                  │
│     → Sẵn sàng cho team design tích hợp                      │
├──────────────────────────────────────────────────────────────┤
│  💻 MÃ NGUỒN (Code Implementation - Current Phase)           │
│     → Minimalist, chỉ đủ để test blockchain                 │
│     → Không implement full FSD/VSA patterns                  │
│     → Focus: Smart Contracts + Mock Services + IPFS          │
└──────────────────────────────────────────────────────────────┘
```

### **Ý nghĩa Chiến lược**:

1. **Cấu trúc thư mục production-ready** (theo `QUY_LUAT_TOI_CAO.md`):
   - ✅ Tạo sẵn folder `/features`, `/widgets`, `/entities` (FSD)
   - ✅ Tạo sẵn folder `/BuildingBlocks`, modules structure (VSA)
   - ✅ Đảm bảo team design có thể integrate dễ dàng
   - ✅ Không cần refactor structure sau này

2. **Code implementation tối giản** (theo `ĐỊNH_VỊ_DỰ_ÁN.md`):
   - ⚡ Controller đơn giản, chỉ orchestrate blockchain calls
   - ⚡ Frontend components basic, không polished
   - ⚡ Không implement full FSD layers hiện tại
   - ⚡ Focus effort vào Smart Contracts

3. **Lợi ích**:
   - 🎯 Đạt được testing goals ngay lập tức
   - 🎯 Sẵn sàng mở rộng khi UI/UX design hoàn thành
   - 🎯 Tránh refactor lớn sau này
   - 🎯 Code hiện tại đơn giản, dễ maintain

**📋 Chi tiết kỹ thuật**:
- [CHIẾN_LƯỢC_LAI.md](../kiến%20trúc/đề%20án%20của%20huy/CHIẾN_LƯỢC_LAI.md) - Implementation guidelines
- [QUY_LUAT_TOI_CAO.md](../kiến%20trúc/cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md) - Architecture rules

---

## 🔴 CORE COMPONENTS (Primary Focus)

### 1. Smart Contracts (`contracts/`)
**Ưu tiên**: ⭐⭐⭐⭐⭐ (Cao nhất)

**Mục tiêu**:
- Triển khai đầy đủ logic nghiệp vụ on-chain theo `kiến trúc/ban đầu/định hướng hợp đồng.md`
- Đảm bảo tuân thủ các tiêu chuẩn ERC-721, ERC-4907 (Rentable NFT)
- Implement Soulbound Token (RentalAgreementSBT) không thể chuyển nhượng
- Xây dựng Evidence Ledger (VinaLibVault) lưu trữ bằng chứng pháp lý

**Contracts chính**:
- `BookAsset.sol` - ERC-4907 Rentable NFT
- `RentalAgreementSBT.sol` - Soulbound Token cho hợp đồng thuê
- `VinaLibVault.sol` - Core Ledger & Evidence Pack storage
- `SuChinToken.sol` - ERC-20 Utility Token (optional)

**Deliverables**:
- ✅ Unit tests với coverage > 90%
- ✅ Integration tests cho full rental workflow
- ✅ Gas optimization
- ✅ Security audit checklist compliance

---

### 2. IPFS Simulator (`IPFS/`)
**Ưu tiên**: ⭐⭐⭐⭐ (Rất cao)

**Mục tiêu**:
- Mô phỏng IPFS storage layer hoàn chỉnh
- Generate CIDv1 chuẩn cho images và metadata
- Tuân thủ ERC-721 Metadata Standard

**Cấu trúc**:
```
IPFS/
├── images/          # Book cover images (CID-based naming)
├── metadata/        # ERC-721 JSON metadata (CID-based naming)
└── ipfs_simulator.js # CID generator & storage manager
```

**Deliverables**:
- ✅ CIDv1 generation algorithm
- ✅ File storage với CID-based naming
- ✅ REST API endpoint `/ipfs/:cid`
- ✅ ERC-721 metadata schema compliance

---

### 3. Mock Services (`mock-server/`)
**Ưu tiên**: ⭐⭐⭐⭐ (Rất cao)

**Mục tiêu**:
- Giả lập đầy đủ các external APIs để hệ thống hoạt động độc lập
- Zero dependency vào third-party services
- Deterministic behavior cho testing

**Services**:
- **Mock FPT Legal**: Digital signature simulation, termsHash generation
- **Mock Tuya IoT**: Smart lock control simulation
- **Mock Banking**: Payment webhook simulation

**Deliverables**:
- ✅ Full API compatibility với specs gốc
- ✅ Deterministic hashing cho legal contracts
- ✅ UI interfaces cho manual testing (`/mock-ui/`)

---

## 🧪 TESTING INTERFACE (Supporting Role)

### 4. Backend API (`backend/`)
**Ưu tiên**: ⭐⭐ (Hỗ trợ)

**Vai trò**: 
- **Orchestration layer** ONLY - không chứa business logic
- Gateway để frontend gọi Smart Contracts
- Tích hợp với Mock Services

**📁 Cấu trúc Thư mục THỰC TẾ** (Cập nhật 2026-01-03):
```
backend/src/
├── Bootstrapper/
│   └── server.js          # Entry point (Express Router pattern)
├── Shared/
│   └── store.js           # Cross-module data (users, bookings)
├── modules/               # VSA: 8 Modules (PascalCase)
│   ├── Identity/          # controller.js
│   ├── Rental/            # controller.js, adapters/mock-legal.adapter.js
│   ├── Book/              # controller.js, book.store.js, adapters/
│   ├── Payment/           # controller.js
│   ├── IoT/               # controller.js, adapters/mock-iot.adapter.js
│   ├── Admin/             # controller.js
│   ├── IPFS/              # controller.js
│   └── Legal/             # 📦 Phase 2 ready (template)
└── BuildingBlocks/        # 📦 Phase 2 ready
    ├── Logging/           # .gitkeep
    └── Utils/             # .gitkeep
```

**💻 Code Implementation** (Hiện tại - Express Router Pattern):
- ⚡ Mỗi module CHỈ có: `controller.js` (Express Router)
- ⚡ Store: local (`book.store.js`) hoặc shared (`Shared/store.js`)
- ⚡ Adapters nằm trong module tương ứng
- ⚡ Không có `*.module.js` files (đã xóa)

**Nguyên tắc phát triển HIỆN TẠI**:
- ❌ KHÔNG tối ưu performance cho production
- ❌ KHÔNG implement full authentication/authorization
- ❌ KHÔNG cần database persistence (in-memory OK)
- ✅ CHỈ cần đủ để trigger blockchain calls
- ✅ CHỈ cần đủ để demo workflows
- ✅ Giữ folder structure VSA để team mở rộng sau

---

### 5. Frontend UI (`frontend/`)
**Ưu tiên**: ⭐ (Tối thiểu)

**Vai trò**:
- **Demo interface** để visualize blockchain workflows
- Manual testing tool cho developers

**📁 Cấu trúc Thư mục THỰC TẾ** (Cập nhật 2026-01-03):
```
frontend/src/
├── app/                   # Khởi tạo app
│   ├── App.tsx
│   └── styles/
├── pages/                 # 8 pages (FSD Layer)
│   ├── home/
│   ├── login/
│   ├── register/
│   ├── account/
│   ├── wallet/
│   ├── admin/
│   ├── lender-manage/
│   └── rent-out/
├── widgets/               # 📦 Phase 2 (.gitkeep)
├── features/              # 📦 Phase 2 (.gitkeep)
├── entities/              # 📦 Phase 2 (.gitkeep)
└── shared/                # Shared components (FSD Layer)
    ├── ui/                # Button, Input
    └── lib/               # api.ts, utilities
```

**Lưu ý**: Đã xóa `/components` và `/layouts` (không dùng trong FSD)

**💻 Code Implementation** (Hiện tại - Minimalist):
- ⚡ CHỈ implement `/app`, `/pages`, `/shared`
- ⚡ Các folder `/widgets`, `/features`, `/entities` có `.gitkeep`
- ⚡ Components cơ bản, không theo FSD patterns đầy đủ
- ⚡ Styling đơn giản, không cần design system

**Nguyên tắc phát triển HIỆN TẠI**:
- ❌ KHÔNG cần polished UI/UX
- ❌ KHÔNG cần responsive design
- ❌ KHÔNG cần accessibility features
- ❌ KHÔNG implement full FSD layers ngay
- ✅ CHỈ cần functional buttons để trigger APIs
- ✅ CHỈ cần basic status display
- ✅ Giữ folder structure FSD để team design integrate sau

**🎨 Sẵn sàng cho Team Design**:
- Khi team design hoàn thành, chỉ cần thêm code vào folders đã có
- Không cần refactor structure
- Có thể dần dần migrate components từ `/pages` sang `/widgets`/`/features`

---

## 📋 CHECKLIST TUÂN THỦ ĐỊNH VỊ MỚI

### ✅ Đúng định hướng (Encouraged):
- [ ] Thêm unit tests cho Smart Contracts
- [ ] Tối ưu gas cho contract calls
- [ ] Implement thêm Mock Service features
- [ ] Cải thiện IPFS CID generation algorithm
- [ ] Thêm security checks cho contracts

### ❌ Sai định hướng (Discouraged):
- [ ] Làm đẹp UI với animations/transitions
- [ ] Implement complex state management (Redux/Zustand)
- [ ] Tối ưu backend performance (caching, load balancing)
- [ ] Build production-ready authentication system
- [ ] Implement database migrations

---

## 🎓 ĐỊNH HƯỚNG PHÁT TRIỂN

### Phase 1: Core Completion (Current)
**Focus**: Hoàn thiện 3 core components
- Smart Contracts: 100% implementation + testing
- IPFS Simulator: Full CIDv1 support
- Mock Services: All external APIs simulated

### Phase 2: Integration Testing
**Focus**: E2E testing blockchain workflows
- Rental creation → Payment → Usage rights assignment
- Return request → Confirmation → Rights revocation
- Edge cases: Disputes, timeouts, failures

### Phase 3: Documentation & Research Output
**Focus**: Publish findings
- Technical whitepaper
- Smart Contract audit report
- IPFS integration patterns
- Mock service architecture documentation

---

## 📚 TÀI LIỆU THAM KHẢO

### Định hướng kỹ thuật gốc:
- `kiến trúc/ban đầu/định hướng hợp đồng.md` - Smart Contract specs
- `kiến trúc/ban đầu/_guide line xây dựng.md` - Implementation guidelines
- `kiến trúc/ban đầu/hợp đồng.md` - Legal contract structure

### Quy luật kiến trúc:
- `kiến trúc/cấu trúc quy luật tối cao/QUY_LUAT_TOI_CAO.md` - **Folder structure** (VSA/FSD)
  - ⚠️ **Lưu ý**: TUÂN THỦ folder structure, NHƯNG không bắt buộc implement full patterns ngay

### Tài liệu đã cập nhật:
- `kiến trúc/đề án của huy/CHIẾN_LƯỢC_LAI.md` - **Hướng dẫn chi tiết** về Hybrid Strategy
- `mô tả tổng hợp/README.md` - Overview với định vị mới
- `mô tả tổng hợp/MÔ_TẢ_PHÂN_CẤP.md` - Architecture với core-first approach
- `mô tả tổng hợp/RUN_INSTRUCTIONS.md` - Startup guide với priority labels
- `mô tả tổng hợp/MÔ_TẢ_GIAO_DIỆN_CHI_TIẾT.md` - Testing scenarios

---

## 🔗 MỐI QUAN HỆ VỚI QUY_LUAT_TOI_CAO.md

### Compliance Strategy (Chiến lược Tuân thủ):

**Alignment với QUY_LUAT_TOI_CAO.md**:

| Component | Folder Structure | Code Implementation | QUY_LUAT Section | Phase |
|-----------|------------------|---------------------|------------------|-------|
| **Backend/Bootstrapper** | ✅ Bắt buộc | ✅ Minimalist | Section 1 | Phase 1 |
| **Backend/Modules** | ✅ Bắt buộc | ✅ Minimalist | Section 1 | Phase 1 |
| **Backend/BuildingBlocks** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Section 1 | Phase 2 |
| **Frontend/app** | ✅ Bắt buộc | ✅ Basic | Section 2 | Phase 1 |
| **Frontend/pages** | ✅ Bắt buộc | ✅ Functional only | Section 2 | Phase 1 |
| **Frontend/shared** | ✅ Bắt buộc | ✅ Basic UI kit | Section 2 | Phase 1 |
| **Frontend/widgets** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Section 2 | Phase 2 |
| **Frontend/features** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Section 2 | Phase 2 |
| **Frontend/entities** | ✅ Bắt buộc (folder only) | 📦 .gitkeep | Section 2 | Phase 2 |
| **Contracts** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | Section 3 | Phase 1 |
| **Mock Services** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | - | Phase 1 |
| **IPFS Simulator** | ✅ Bắt buộc | ⭐ FULL (Priority 1) | - | Phase 1 |

**Tham khảo**: Xem `QUY_LUAT_TOI_CAO.md` Section 0 (dòng 29-44) để hiểu đầy đủ Compliance Matrix.

### Ràng buộc Pháp lý (từ QUY_LUAT - Section 5):

**☑️ PHẢI TUÂN THỦ trong Smart Contracts**:

1. **Thanh toán Off-chain**:
   - ✅ `VinaLibVault.sol` CHỈ ghi `pspRef`, KHÔNG giữ tiền
   - ✅ `SuChinToken` chỉ là logic token, không lưu giá trị thực

2. **Xác nhận 2 chiều**:
   - ✅ `createRental()`: Cần Admin Verify trước khi mint SBT
   - ✅ `confirmReturn()`: Cần Admin confirm trước khi conclude

3. **Security**:
   - ✅ `onlyOwner` modifier cho các hàm quan trọng
   - ✅ Chỉ lưu hash (không lưu plain text) lên blockchain
   - ✅ `version` field trong `EvidencePack`

4. **Soulbound Logic**:
   - ✅ `RentalAgreementSBT`: Block `transfer`/`transferFrom`

**📋 Checklist Compliance**:
- [ ] `VinaLibVault.sol` implement đúng `EvidencePack` structure
- [ ] Payment flow verify `pspRef` trước khi `createRental()`
- [ ] Two-way confirmation trong `requestReturn()` + `confirmReturn()`
- [ ] Data privacy: chỉ lưu `termsHash`, `deliveryHash` (không lưu raw data)

---

## ⚠️ Anti-patterns (TRÁNH trong Phase 1)

**Theo Section 1.4 và 2.4 của QUY_LUAT_TOI_CAO.md**:

### Backend
- ❌ Tạo service layer khi controller vẫn đơn giản
- ❌ Install validation libraries (Joi, Yup) khi chưa cần thiết
- ❌ Setup logging infrastructure khi `console.log` đủ dùng
- ❌ Viết custom middleware khi Express built-ins đủ dùng
- ❌ Database migrations trong Phase 1

### Frontend
- ❌ Quá mức engineering: Tạo widgets/features khi pages vẫn đơn giản
- ❌ Premature abstraction: Extract components khi chưa có pattern rõ ràng
- ❌ Design system: Tạo theme/variant system khi chỉ có 2-3 pages
- ❌ Complex routing: Nested routes, guards khi chưa cần thiết
- ❌ State management libraries (Redux, Zustand, Recoil)

### Smart Contracts (CHỈ CẤM trong testing, OK khi production-ready)
- ⚠️ Hardcode addresses/keys (testing OK, production NO)
- ⚠️ Skip access control modifiers (testing OK với mock, production cần strict)

**Mục tiêu**: Giữ code đơn giản để tập trung verify blockchain core logic.

---

## 🎯 KẾT LUẬN

**Câu hỏi hướng dẫn khi phát triển**:
> "Thay đổi này có giúp test/improve Smart Contracts, IPFS hoặc Mock Services không?"

- ✅ **NẾU CÓ** → Proceed
- ❌ **NẾU KHÔNG** → Re-prioritize

**Mục tiêu cuối cùng**: Tạo ra một **blockchain research prototype** với Smart Contracts production-ready, không phải một full-stack web application.
