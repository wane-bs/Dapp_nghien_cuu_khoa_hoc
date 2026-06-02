# 🔀 CHIẾN LƯỢC LAI - HƯỚNG DẪN TRIỂN KHAI

**Version**: 1.0  
**Date**: 2026-01-03  
**Strategy**: Scaffolding Ready, Minimal Implementation

---
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

**📋 Compliance Matrix**: Xem chi tiết tại `kiến trúc/cấu trúc quy luật tối cao/QUY_LUAT_TOI_CAO.md` Section 0 (dòng 29-44) để hiểu rõ phân giai đoạn và yêu cầu tuân thủ cho từng component.

**📚 Đọc kèm**:
- [QUY_LUAT_TOI_CAO.md](../cấu%20trúc%20quy%20luật%20tối%20cao/QUY_LUAT_TOI_CAO.md) - Folder structure requirements
- [ĐỊNH_VỊ_DỰ_ÁN.md](../../mô%20tả%20tổng%20hợp/ĐỊNH_VỊ_DỰ_ÁN.md) - Project positioning & priorities

---

## 🎯 TÓM TẮT CHIẾN LƯỢC

**Nguyên tắc vàng**: 
> "Cấu trúc thư mục production-ready, Code implementation minimalist"

```
┌──────────────────────────────────────────────────────────────┐
│  Folder Structure → QUY_LUAT_TOI_CAO.md (VSA + FSD)          │
│  Code Implementation → ĐỊNH_VỊ_DỰ_ÁN.md (Minimalist)         │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 BACKEND: Folder Structure vs Code

### ✅ Cấu trúc Thư mục THỰC TẾ (Đã cập nhật 2026-01-03)

```
backend/src/
├── Bootstrapper/
│   └── server.js                    ✅ Entry point (Express Router pattern)
│
├── modules/                         ✅ VSA Structure (PascalCase)
│   ├── Identity/
│   │   └── controller.js            ✅ Express Router (minimal)
│   │
│   ├── Rental/
│   │   ├── controller.js            ✅ Express Router (minimal)
│   │   └── adapters/
│   │       └── mock-legal.adapter.js ✅ Legal API adapter
│   │
│   ├── Book/
│   │   ├── controller.js            ✅ Express Router
│   │   ├── book.store.js            ✅ Module-specific store
│   │   └── adapters/
│   │       └── ipfs.adapter.js      ✅ IPFS adapter
│   │
│   ├── Payment/
│   │   └── controller.js
│   │
│   ├── IoT/
│   │   ├── controller.js
│   │   └── adapters/
│   │       └── mock-iot.adapter.js  ✅ IoT adapter
│   │
│   ├── Admin/
│   │   └── controller.js
│   │
│   ├── IPFS/
│   │   └── controller.js
│   │
│   └── Legal/                       📦 Phase 2 ready
│       ├── index.js                 📦 Template placeholder
│       ├── adapters/
│       └── templates/
│
├── Shared/
│   └── store.js                     ✅ Cross-module data (users, bookings)
│
└── BuildingBlocks/                  📦 Phase 2 ready
    ├── .gitkeep
    ├── Logging/
    │   └── .gitkeep
    └── Utils/
        └── .gitkeep
```

### 💻 Code Implementation (MINIMALIST)

#### ✅ PATTERN HIỆN TẠI: Express Router

Mỗi module sử dụng **Express Router** pattern trực tiếp (không qua module.js):

**`controller.js`** (VÍ DỤ - Identity):
```javascript
const express = require('express');
const { ethers } = require('ethers');
const { users, bookings } = require('../../Shared/store');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
    const { username, email } = req.body;
    if (users.has(username)) return res.status(400).json({ error: "User exists" });
    
    const wallet = ethers.Wallet.createRandom();
    users.set(username, { username, email, address: wallet.address });
    
    res.json({ success: true, user: { username, email, address: wallet.address } });
});

module.exports = router;
```

**Lưu ý**: 
- `server.js` load controllers trực tiếp: `require('../modules/Identity/controller')`
- Không sử dụng `*.module.js` pattern
- Store có thể local (`book.store.js`) hoặc shared (`Shared/store.js`)

**KHÔNG CẦN**:
- ❌ `*.module.js` files (đã bị xóa)
- ❌ Service layer riêng
- ❌ Validation schemas (Joi/Yup)
- ❌ Error handling middleware chi tiết
- ❌ Logging infrastructure

#### 📦 FOLDERS ĐỂ TRỐNG (CHỜ TEAM MỞ RỘNG):

- `/BuildingBlocks/Logging` - Chỉ có `.gitkeep`
- `/BuildingBlocks/Utils` - Chỉ có `.gitkeep`
- `/modules/Legal` - Template ready cho Phase 2


---

## 📁 FRONTEND: Folder Structure vs Code

### ✅ Cấu trúc Thư mục THỰC TẾ (Đã cập nhật 2026-01-03)

```
frontend/src/
├── app/
│   ├── App.tsx                      ✅ Main app với routing
│   └── styles/
│       ├── App.css
│       └── index.css
│
├── pages/                           ✅ FSD: Pages layer (8 pages)
│   ├── home/
│   ├── login/
│   ├── register/
│   ├── account/
│   ├── wallet/
│   ├── admin/
│   ├── lender-manage/
│   └── rent-out/
│
├── widgets/                         📦 FSD: Widgets layer (Phase 2)
│   └── .gitkeep                     # Chờ team design
│
├── features/                        📦 FSD: Features layer (Phase 2)
│   └── .gitkeep                     # Chờ team design
│
├── entities/                        📦 FSD: Entities layer (Phase 2)
│   └── .gitkeep                     # Chờ team design
│
└── shared/                          ✅ FSD: Shared layer
    ├── ui/                          # Basic UI components
    │   ├── Button.tsx
    │   └── Input.tsx
    └── lib/                         # Utilities
        └── api.ts                   # Axios instance
```

**Lưu ý folders đã XÓA** (không dùng trong FSD):
- ❌ `/components` - đã xóa (empty, không cần thiết)
- ❌ `/layouts` - đã xóa (empty, không cần thiết)

### 💻 Code Implementation (MINIMALIST)

#### ✅ FILE CẦN IMPLEMENT NGAY:

**`HomePage.tsx`** (VÍ DỤ):
```tsx
// ⚡ MINIMAL - Functional only, no polish
import { useState, useEffect } from 'react';
import axios from '../../../shared/api/axios';

export const HomePage = () => {
    const [books, setBooks] = useState([]);

    useEffect(() => {
        axios.get('/api/books').then(res => setBooks(res.data));
    }, []);

    return (
        <div>
            <h1>Books</h1>
            {books.map(book => (
                <div key={book.id}>
                    <h3>{book.title}</h3>
                    <button onClick={() => rentBook(book.id)}>Rent</button>
                </div>
            ))}
        </div>
    );
};
```

**KHÔNG CẦN**:
- ❌ Design system với theme
- ❌ Reusable Card/Layout components
- ❌ State management (Redux/Zustand)
- ❌ Custom hooks infrastructure
- ❌ Styled components/CSS-in-JS

#### 📦 FOLDERS ĐỂ TRỐNG (CHỜ TEAM DESIGN):

Tạo `.gitkeep` trong:
- `/widgets`
- `/features`
- `/entities`
- `/app/providers`

---

## 🎯 CHECKLIST THỰC HIỆN

### Giai đoạn 1: Setup Structure (1-2 giờ)

**Backend**:
- [ ] ✅ Tạo folders theo VSA structure
- [ ] ✅ Tạo `.gitkeep` trong `/BuildingBlocks/*`
- [ ] ✅ Setup `server.js` basic
- [ ] ✅ Tạo modules minimalist (controller + store only)

**Frontend**:
- [ ] ✅ Tạo folders theo FSD structure
- [ ] ✅ Tạo `.gitkeep` trong `/widgets`, `/features`, `/entities`
- [ ] ✅ Setup `App.tsx` với routing basic
- [ ] ✅ Tạo pages minimalist (functional only)

### Giai đoạn 2: Current Phase (Focus Blockchain)

**Core Components** (80% effort):
- [ ] 🔴 Smart Contracts implementation
- [ ] 🔴 IPFS Simulator
- [ ] 🔴 Mock Services

**Testing Interface** (20% effort):
- [ ] 🧪 Backend: CHỈ maintain existing minimalist code
- [ ] 🧪 Frontend: CHỈ maintain existing minimalist code
- [ ] 🧪 KHÔNG thêm features phức tạp vào Backend/Frontend

### Giai đoạn 3: Team Design Integration (Tương lai)

**Khi team design hoàn thành**:
- [ ] 🎨 Thêm components vào `/widgets`
- [ ] 🎨 Thêm business logic vào `/features`
- [ ] 🎨 Thêm domain models vào `/entities`
- [ ] 🎨 Implement design system trong `/shared/ui`
- [ ] 🎨 Không cần refactor folder structure

---

## 📋 QUY TẮC VÀNG

### ✅ ĐƯỢC PHÉP (Current Phase):

1. **Backend**:
   - Tạo module mới theo VSA structure
   - Controller đơn giản (1 function = 1 endpoint)
   - In-memory store
   - Adapters cho Mock Services

2. **Frontend**:
   - Tạo page mới trong `/pages`
   - Basic components trong `/shared/ui`
   - Inline styles hoặc CSS đơn giản
   - Direct API calls (không cần service layer)

### ❌ KHÔNG ĐƯỢC PHÉP (Current Phase):

1. **Backend**:
   - ❌ Implement `/BuildingBlocks` chi tiết
   - ❌ Service layer phức tạp
   - ❌ Database migration
   - ❌ Advanced validation/middleware

2. **Frontend**:
   - ❌ Implement `/widgets`, `/features`, `/entities` ngay
   - ❌ Design system hoàn chỉnh
   - ❌ State management library
   - ❌ Component refactoring sâu

---

## 🚀 WHEN TO EXPAND

### Trigger Points để mở rộng:

**Backend**:
- ✅ Khi cần shared utilities → Implement `/BuildingBlocks/Utils`
- ✅ Khi cần logging → Implement `/BuildingBlocks/Logging`
- ✅ Khi cần database → Thêm repository pattern vào modules

**Frontend**:
- ✅ Khi team design ready → Populate `/widgets`, `/features`, `/entities`
- ✅ Khi cần shared business logic → Extract vào `/features`
- ✅ Khi cần domain models → Tạo vào `/entities`

---

## 📚 TÀI LIỆU LIÊN QUAN

- `kiến trúc/cấu trúc quy luật tối cao/QUY_LUAT_TOI_CAO.md` - Chi tiết VSA/FSD
- `mô tả tổng hợp/ĐỊNH_VỊ_DỰ_ÁN.md` - Ưu tiên phát triển
- `mô tả tổng hợp/README.md` - Overview dự án

---

## 💡 LỜI KHUYÊN

### Cho Developer hiện tại:
> "Giữ code đơn giản, chỉ đủ để test blockchain. Đừng over-engineer."

### Cho Team Design (tương lai):
> "Folder structure đã sẵn sàng. Chỉ cần thêm code vào đúng vị trí theo FSD."

### Cho Product Owner:
> "Hiện tại focus blockchain core. UI/UX sẽ polish sau khi design ready. Không ảnh hưởng timeline vì structure đã sẵn sàng."
