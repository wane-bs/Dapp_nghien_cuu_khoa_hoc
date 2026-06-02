# HƯỚNG DẪN THIẾT KẾ VÀ PHÁT TRIỂN GIAO DIỆN - VINALIB VAULT

**Phiên bản**: 1.0  
**Ngày tạo**: 2026-01-18  
**Dự án**: VinaLib-Vault - Hệ thống Cho thuê Sách P2P với Hợp đồng Thông minh

---

## 📋 MỤC LỤC
1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Chiến Lược Phát Triển](#2-chiến-lược-phát-triển)
3. [Kiến Trúc Frontend](#3-kiến-trúc-frontend)
4. [Các Màn Hình Chính](#4-các-màn-hình-chính)
5. [Yêu Cầu Thiết Kế UI/UX](#5-yêu-cầu-thiết-kế-uiux)
6. [Quy Trình Nghiệp Vụ](#6-quy-trình-nghiệp-vụ)
7. [Hướng Dẫn Kỹ Thuật](#7-hướng-dẫn-kỹ-thuật)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Giới Thiệu Dự Án
**VinaLib-Vault** là hệ thống cho thuê sách P2P (Peer-to-Peer) tích hợp công nghệ Blockchain, cho phép:
- **Chủ sách (Lender)**: Đăng sách và cho thuê
- **Người thuê (Renter)**: Tìm kiếm, thuê sách và thanh toán
- **Quản trị viên (Admin)**: Duyệt sách, phê duyệt giao dịch, quản lý hệ thống

### 1.2. Công Nghệ Nền Tảng
- **Frontend**: React 19 + TypeScript
- **Backend**: Node.js + Express
- **Blockchain**: Smart Contracts (ERC-721, ERC-4907)
- **Port**: Frontend chạy tại `:3001`

### 1.3. Đặc Điểm Quan Trọng
- ✅ **Hệ thống Demo/Testing**: Giao diện phục vụ kiểm thử blockchain flows
- ✅ **Phân giai đoạn**: Phase 1 (Testing UI) → Phase 2 (Production UI)
- ✅ **Bảo mật**: Xác thực 2 chiều (User Request ↔ Admin Confirm)

---

## 2. CHIẾN LƯỢC PHÁT TRIỂN

### 2.1. Phân Giai Đoạn (Development Phases)

#### 🎯 PHASE 1 - HIỆN TẠI (Testing Interface)
**Mục tiêu**: Tạo giao diện tối thiểu để kiểm thử Smart Contracts

**Yêu cầu**:
- ✅ **Chức năng** (Functionality): Hoàn chỉnh 100%
- ⚠️ **Thiết kế** (Design): Đơn giản, functional-first
- 📦 **Cấu trúc thư mục**: Đầy đủ (theo FSD)
- ❌ **KHÔNG cần**: Design system phức tạp, animations phức tạp

**Đặc điểm UI Phase 1**:
```
✅ CÓ:
- Các form nhập liệu cơ bản (input, button, select)
- Hiển thị danh sách sách, booking
- Inline CSS hoặc CSS module đơn giản
- Responsive layout cơ bản

❌ KHÔNG CÓ:
- Design system với theme provider
- Component library phức tạp
- Micro-animations, transitions
- Custom hooks infrastructure
```

#### 🎨 PHASE 2 - TƯƠNG LAI (Production UI)
**Kích hoạt khi**:
- ✅ Team design hoàn thành mockups/prototypes
- ✅ Smart Contracts đã audit và ổn định
- ✅ Product Owner approve đầu tư UI/UX

**Nâng cấp**:
- 🎨 Design system hoàn chỉnh
- 🎭 Component library với variants
- ✨ Animations và transitions
- 📱 Mobile-first responsive design

---

## 3. KIẾN TRÚC FRONTEND

### 3.1. Feature-Sliced Design (FSD)

**Cấu trúc thư mục**: `frontend/src/`

```
src/
├── app/              ← Layer 1: Khởi tạo ứng dụng
│   ├── App.tsx       
│   ├── styles/       (Global CSS)
│   └── providers/    (Context Providers)
│
├── pages/            ← Layer 2: Các trang hoàn chỉnh
│   ├── home/         
│   ├── login/
│   ├── register/
│   ├── account/
│   ├── wallet/
│   ├── rent-out/
│   ├── owner/        (Admin Dashboard)
│   └── lender-manage/
│
├── widgets/          ← Layer 3: Khối UI lớn (PHASE 2)
│   └── .gitkeep      [Chỉ folder, chưa implement]
│
├── features/         ← Layer 4: Chức năng nghiệp vụ (PHASE 2)
│   └── .gitkeep      [Chỉ folder, chưa implement]
│
├── entities/         ← Layer 5: Thực thể nghiệp vụ (PHASE 2)
│   └── .gitkeep      [Chỉ folder, chưa implement]
│
└── shared/           ← Layer 6: Components dùng chung
    ├── ui/           (Button, Input, Layout)
    ├── api/          (Axios config)
    └── lib/          (Utils: formatDate, formatPrice)
```

### 3.2. Quy Tắc Import (Phase 1)

**Được phép**:
- ✅ Pages import từ Shared
- ✅ Pages import từ Pages khác (tạm thời)
- ✅ Shared không import từ Pages

**Cấm**:
- ❌ Widgets, Features, Entities không được implement code (chỉ folders)
- ❌ Cross-import phức tạp

---

## 4. CÁC MÀN HÌNH CHÍNH

### 4.1. Ma Trận Màn Hình

| Tên Màn Hình | Route | Vai Trò | Chức Năng Chính | Ưu Tiên |
|--------------|-------|---------|-----------------|---------|
| **LoginPage** | `/login` | Tất cả | Đăng nhập hệ thống | P0 |
| **RegisterPage** | `/register` | Tất cả | Đăng ký tài khoản | P0 |
| **HomePage (Dashboard)** | `/dashboard` | Renter, Lender | Xem sách, đặt thuê, quản lý booking | P0 |
| **RentOutPage** | `/rent-out` | Lender | Upload và đăng sách lên hệ thống | P0 |
| **AccountPage** | `/account` | Tất cả | Hồ sơ cá nhân, lịch sử giao dịch | P1 |
| **WalletPage** | `/wallet` | Tất cả | Quản lý số dư ví, nạp/rút tiền | P0 |
| **OwnerDashboard (Admin)** | `/owner` | Admin | Duyệt sách, phê duyệt thuê, xác nhận trả | P0 |
| **LenderDashboard** | `/lender-manage` | Lender | Quản lý sách đã đăng | P1 |

### 4.2. Chi Tiết Từng Màn Hình

#### 📄 4.2.1. LoginPage (`/login`)
**Mục đích**: Xác thực người dùng vào hệ thống

**Components cần có**:
- Input: Username
- Input: Password (type="password")
- Button: Đăng nhập
- Link: Chuyển sang RegisterPage

**API Endpoint**: `POST /api/login`

**Validation**:
- Username không được rỗng
- Password tối thiểu 6 ký tự (Phase 1: không mã hóa)

**UI Notes**:
- Đơn giản, centered layout
- Hiển thị lỗi nếu đăng nhập thất bại

---

#### 📄 4.2.2. RegisterPage (`/register`)
**Mục đích**: Tạo tài khoản mới

**Components cần có**:
- Input: Username
- Input: Email
- Input: Password
- Select/Radio: Role (USER, LENDER, ADMIN)
- Button: Đăng ký
- Link: Quay lại LoginPage

**API Endpoint**: `POST /api/register`

**Validation**:
- Email format hợp lệ
- Username unique (backend check)

---

#### 📄 4.2.3. HomePage / Dashboard (`/dashboard`)
**Mục đích**: Màn hình chính - Xem sách và quản lý booking

**Sections**:

**A. Danh sách sách (Book List)**
- Hiển thị: Hình ảnh sách, Tên, Tác giả, Giá thuê, Tiền cọc
- Filter: Theo trạng thái (VERIFIED, RENTED)
- Button: "Thuê sách" (chỉ với sách VERIFIED)

**B. Active Rentals (Booking đang hoạt động)**
- Hiển thị: Mã booking, Tên sách, Trạng thái
- Trạng thái:
  - `PENDING_SIGN`: Chờ ký hợp đồng
  - `SIGNED_PENDING_APPROVAL`: Chờ Admin duyệt
  - `SIGNED_UNPAID`: Chờ thanh toán
  - `PAID`: Đã thanh toán, có thể unlock
  - `RETURN_REQUESTED`: Đã yêu cầu trả
  - `COMPLETED`: Hoàn thành
- Actions:
  - Button: "Ký hợp đồng" (nếu PENDING_SIGN)
  - Button: "Thanh toán" (nếu SIGNED_UNPAID)
  - Button: "Unlock Device" (nếu PAID)
  - Button: "Yêu cầu trả sách" (nếu PAID)

**API Endpoints**:
- `GET /api/books` - Lấy danh sách sách
- `POST /api/booking` - Tạo booking mới
- `GET /api/booking` - Lấy danh sách booking của user

**UI Layout Phase 1**:
```
+-----------------------------------+
| Header: VinaLib-Vault | Logout   |
+-----------------------------------+
| Sidebar:                          |
| - Dashboard                       |
| - Rent Out (if Lender)            |
| - Account                         |
| - Wallet                          |
+---------------+-------------------+
| Book Catalog  | Active Bookings   |
| [Card][Card]  | [List Item]       |
| [Card][Card]  | [List Item]       |
+---------------+-------------------+
```

---

#### 📄 4.2.4. RentOutPage (`/rent-out`)
**Chỉ dành cho**: Lender

**Mục đích**: Upload sách mới lên hệ thống

**Form Fields**:
- Input: Tên sách
- Textarea: Mô tả
- Input: Tác giả
- Input: Giá thuê (VND)
- Input: Tiền cọc tối thiểu (VND)
- Input: Giá trị sách (VND)
- File Upload: Hình ảnh sách
- Input: Locker ID (ID tủ sách)
- Button: Đăng sách

**API Endpoint**: `POST /api/books`

**Process**:
1. User upload thông tin sách
2. Backend tạo sách với status `PENDING_VERIFICATION`
3. Admin phải verify trên OwnerDashboard
4. Sau khi verify → status `VERIFIED` → xuất hiện trên Catalog

**UI Notes**:
- Form validation cơ bản
- Preview hình ảnh sau khi upload
- Success message sau khi đăng thành công

---

#### 📄 4.2.5. OwnerDashboard (Admin) (`/owner`)
**Chỉ dành cho**: Admin

**Mục đích**: Quản lý toàn bộ hệ thống

**Sections**:

**A. Pending Books (Sách chờ duyệt)**
- Hiển thị: Danh sách sách có status `PENDING_VERIFICATION`
- Thông tin: Hình ảnh, Tên, Chủ sách, Giá thuê, Cọc
- Actions:
  - Select: Chọn Risk Tier (A/B/C)
  - Button: "Duyệt sách" → API: `POST /api/admin/books/:id/verify-listing`

**B. Pending Approvals (Booking chờ duyệt)**
- Hiển thị: Danh sách booking có status `SIGNED_PENDING_APPROVAL`
- Thông tin:
  - Mã booking
  - Người thuê (username)
  - Tên sách
  - TrustScore
  - Approval Mode (AUTO/REVIEW/MANUAL)
  - Reason Code
- Actions:
  - Button: "Phê duyệt" → API: `POST /api/admin/booking/:code/approve`
  - Button: "Từ chối" → API: `POST /api/admin/booking/:code/reject`

**C. Return Requests (Yêu cầu trả sách)**
- Hiển thị: Danh sách booking có status `RETURN_REQUESTED`
- Actions:
  - Button: "Xác nhận trả" → API: `POST /api/admin/booking/:code/confirm-return`

**D. System Stats (Thống kê hệ thống)**
- Tổng số sách
- Tổng số booking
- Doanh thu hệ thống
- Số dư ví hệ thống

**API Endpoints**:
- `GET /api/admin/books/pending`
- `GET /api/admin/rentals`
- `POST /api/admin/books/:id/verify-listing`
- `POST /api/admin/booking/:code/approve`
- `POST /api/admin/booking/:code/confirm-return`
- `GET /api/admin/stats`

---

#### 📄 4.2.6. WalletPage (`/wallet`)
**Mục đích**: Quản lý số dư và thanh toán

**Components**:
- Display: Số dư hiện tại (VND)
- Input: Số tiền nạp
- Button: Nạp tiền (giả lập)
- Table: Lịch sử giao dịch (Transaction History)

**API Endpoints**:
- `GET /api/user/:username/balance`
- `GET /api/user/:username/transactions`
- `POST /api/user/:username/deposit` (mock)

---

#### 📄 4.2.7. AccountPage (`/account`)
**Mục đích**: Hồ sơ cá nhân

**Sections**:
- Display: Username, Email, Role
- Display: Wallet Address (blockchain address)
- Display: TrustScore (nếu là Renter)
- Table: Transaction History
- Stats:
  - Số lần thuê hoàn thành (completedRentals)
  - Số lần trả muộn (lateReturns)
  - Số tranh chấp (disputes)

**API Endpoint**: `GET /api/user/:username`

---

## 5. YÊU CẦU THIẾT KẾ UI/UX

### 5.1. Design Principles (Phase 1)

#### ✅ PHẢI CÓ (Must Have)
1. **Functional First**: Chức năng hoàn chỉnh > Thẩm mỹ
2. **Clear Information Hierarchy**: Thông tin quan trọng nổi bật
3. **Consistent Layout**: Tất cả pages dùng chung layout structure
4. **Readable Typography**: Font size ≥ 14px, line-height ≥ 1.5
5. **Color Coding for Status**:
   - 🟢 Green: Success, Verified, Completed
   - 🟡 Yellow: Pending, Review
   - 🔴 Red: Rejected, Error
   - 🔵 Blue: Active, Paid
6. **Responsive**: Desktop-first, mobile cơ bản

#### ❌ KHÔNG CẦN (Phase 1)
1. ❌ Brand identity phức tạp
2. ❌ Custom illustrations
3. ❌ Micro-interactions
4. ❌ Loading skeletons
5. ❌ Dark mode toggle

### 5.2. UI Components Chuẩn (Shared UI Kit)

**File**: `frontend/src/shared/ui/`

#### Button Component
```tsx
// Phase 1: Simple variants
<Button variant="primary">Đăng nhập</Button>
<Button variant="secondary">Hủy</Button>
<Button variant="danger">Từ chối</Button>

// Variants:
- primary: Background xanh dương
- secondary: Background xám
- danger: Background đỏ
```

#### Input Component
```tsx
<Input 
  label="Username"
  type="text"
  placeholder="Nhập username"
  required
/>
```

#### Card Component (cho Book Display)
```tsx
<Card>
  <img src={book.image} alt={book.name} />
  <h3>{book.name}</h3>
  <p>Tác giả: {book.author}</p>
  <p>Giá: {formatPrice(book.rentalPrice)} VND</p>
  <Badge status={book.status} />
</Card>
```

#### Badge Component (Status Display)
```tsx
<Badge status="VERIFIED">Đã duyệt</Badge>
<Badge status="PENDING">Chờ duyệt</Badge>
```

### 5.3. Color Palette (Phase 1 - Simple)

```css
/* Primary Colors */
--color-primary: #1976d2;      /* Blue - Primary actions */
--color-success: #4caf50;      /* Green - Success states */
--color-warning: #ff9800;      /* Orange - Warnings */
--color-danger: #f44336;       /* Red - Errors, rejections */

/* Neutral Colors */
--color-bg: #ffffff;           /* Background */
--color-text: #333333;         /* Text */
--color-border: #e0e0e0;       /* Borders */
--color-gray: #9e9e9e;         /* Secondary text */

/* Status Colors */
--status-verified: #4caf50;
--status-pending: #ff9800;
--status-rented: #2196f3;
--status-completed: #9e9e9e;
```

### 5.4. Typography

```css
/* Font Family */
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

/* Font Sizes */
--font-size-h1: 32px;
--font-size-h2: 24px;
--font-size-h3: 20px;
--font-size-body: 16px;
--font-size-small: 14px;
```

### 5.5. Layout Structure

**Chuẩn Layout cho tất cả Pages (trừ Login/Register)**:

```
┌─────────────────────────────────────────┐
│ Header (60px height)                    │
│ - Logo/Title  |  Navigation  |  Logout  │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Main Content Area           │
│ (200px)  │                              │
│          │                              │
│ - Menu   │  [Page Content]              │
│          │                              │
└──────────┴──────────────────────────────┘
```

---

## 6. QUY TRÌNH NGHIỆP VỤ

### 6.1. Rental Workflow (Quy trình thuê sách)

**Bước 1: Lender đăng sách**
```
Lender → RentOutPage → Upload thông tin sách
→ Backend tạo sách (status: PENDING_VERIFICATION)
→ Admin nhận thông báo
```

**Bước 2: Admin duyệt sách**
```
Admin → OwnerDashboard → Tab "Pending Books"
→ Chọn Risk Tier (A/B/C)
→ Click "Duyệt sách"
→ Smart Contract: BookAsset.verifyForListing()
→ Status: VERIFIED
→ Sách xuất hiện trên Catalog
```

**Bước 3: Renter tạo booking**
```
Renter → Dashboard → Chọn sách → Click "Thuê sách"
→ Hiển thị modal: Nhập thông tin thuê (ngày bắt đầu, kết thúc)
→ POST /api/booking
→ Status: PENDING_SIGN
```

**Bước 4: Renter ký hợp đồng**
```
Renter → Dashboard → Active Bookings → Click "Ký hợp đồng"
→ Redirect tới Mock Legal UI
→ Click "Sign" trên Legal UI
→ Backend nhận webhook
→ Policy Engine đánh giá:
   - TrustScore calculation
   - Risk Tier check
   - Deposit Ratio check
   
   Kết quả:
   → AUTO: Status = SIGNED_UNPAID (bỏ qua Admin)
   → REVIEW/MANUAL: Status = SIGNED_PENDING_APPROVAL
```

**Bước 5: Admin phê duyệt (nếu cần)**
```
Admin → OwnerDashboard → Tab "Pending Approvals"
→ Xem thông tin: TrustScore, Approval Mode, Reason
→ Click "Phê duyệt" hoặc "Từ chối"
→ Nếu phê duyệt: Status = SIGNED_UNPAID
```

**Bước 6: Renter thanh toán**
```
Renter → Dashboard → Active Bookings → Click "Thanh toán"
→ Chọn phương thức:
   - Wallet: Trừ tiền từ số dư
   - Bank: Giả lập chuyển khoản (Mock)
→ Backend gọi Smart Contract:
   → VinaLibVault.createRental()
   → Mint RentalAgreementSBT
   → BookAsset.setUser(renter)
→ Status: PAID
```

**Bước 7: Renter unlock thiết bị**
```
Renter → Dashboard → Click "Unlock Device"
→ Backend → Mock Tuya IoT
→ Trả về ticket_id (OTP)
→ Hiển thị OTP cho user
```

**Bước 8: Renter yêu cầu trả sách**
```
Renter → Dashboard → Click "Yêu cầu trả sách"
→ Backend → Smart Contract: VinaLibVault.requestReturn()
→ Status: RETURN_REQUESTED
```

**Bước 9: Admin xác nhận trả sách**
```
Admin → OwnerDashboard → Tab "Return Requests"
→ Kiểm tra tình trạng sách vật lý
→ Click "Xác nhận trả"
→ Backend → Smart Contract: VinaLibVault.confirmReturn()
   → Revoke BookAsset.setUser()
   → Status: COMPLETED
→ Settlement: Chuyển tiền cho Lender, hoàn cọc cho Renter
```

### 6.2. Policy Engine Auto-Accept (Phase 2)

**Cơ chế tự động duyệt** dựa trên 3 yếu tố:

| Risk Tier | TrustScore Band | Deposit Ratio | Decision | Deadline |
|-----------|-----------------|---------------|----------|----------|
| **C (Low Risk)** | HIGH/MED | ≥30% | 🟢 AUTO | +60m |
| **C (Low Risk)** | LOW | ≥50% | 🟢 AUTO | +60m |
| **C (Low Risk)** | LOW | <50% | 🟡 REVIEW | +30m |
| **B (Medium)** | HIGH | ≥30% | 🟢 AUTO | +60m |
| **B (Medium)** | MED | ≥50% | 🟢 AUTO | +60m |
| **B (Medium)** | MED | <50% | 🟡 REVIEW | +30m |
| **B (Medium)** | LOW | ≥70% | 🟡 REVIEW | +30m |
| **B (Medium)** | LOW | <70% | 🟠 MANUAL | +2h |
| **A (High Risk)** | HIGH/MED | Any | 🟠 MANUAL | +2h |
| **A (High Risk)** | LOW | Any | 🔴 REJECT | - |

**TrustScore Formula**:
```
score = 50 (base)
  + 10 × min(completedRentals, 5)
  - 20 × disputes
  - 10 × lateReturns

Bands:
- HIGH: ≥80
- MED: 50-79
- LOW: <50
```

**UI Requirements**:
- Hiển thị TrustScore trên AccountPage
- Hiển thị Approval Mode + Reason Code trên OwnerDashboard
- Badge màu sắc tương ứng với Decision:
  - 🟢 AUTO: Green
  - 🟡 REVIEW: Yellow
  - 🟠 MANUAL: Orange
  - 🔴 REJECT: Red

---

## 7. HƯỚNG DẪN KỸ THUẬT

### 7.1. Cấu Trúc Một Page (Example: HomePage)

**File**: `frontend/src/pages/home/HomePage.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { getBooks, createBooking } from '../../shared/api/bookApi';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const data = await getBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleRentBook = async (bookId: string) => {
    await createBooking({ bookId, startDate: '2026-01-20', endDate: '2026-01-27' });
    alert('Booking created!');
  };

  return (
    <div className="home-page">
      <h1>Book Catalog</h1>
      <div className="book-grid">
        {books.map(book => (
          <Card key={book.id}>
            <img src={book.imageUrl} alt={book.name} />
            <h3>{book.name}</h3>
            <p>Tác giả: {book.author}</p>
            <p>Giá: {book.rentalPrice} VND</p>
            <Button onClick={() => handleRentBook(book.id)}>
              Thuê sách
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### 7.2. API Integration Pattern

**File**: `frontend/src/shared/api/bookApi.ts`

```tsx
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export const getBooks = async () => {
  const response = await axios.get(`${API_BASE}/api/books`);
  return response.data;
};

export const createBooking = async (data: any) => {
  const response = await axios.post(`${API_BASE}/api/booking`, data, {
    headers: {
      'x-user-id': localStorage.getItem('username')
    }
  });
  return response.data;
};
```

### 7.3. Styling Guidelines (Phase 1)

**Option 1: CSS Module** (Recommended)
```css
/* HomePage.module.css */
.bookGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}
```

**Option 2: Inline CSS** (Cho prototype nhanh)
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px'
}}>
  {/* Content */}
</div>
```

### 7.4. State Management (Phase 1)

**KHÔNG SỬ DỤNG**: Redux, Zustand, Recoil

**SỬ DỤNG**: 
- React `useState` cho local state
- React `useContext` cho global state đơn giản (auth, user info)

**Example**: Auth Context

```tsx
// shared/providers/AuthContext.tsx
import React, { createContext, useState } from 'react';

interface AuthContextType {
  user: any;
  login: (username: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username: string) => {
    setUser({ username });
    localStorage.setItem('username', username);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 7.5. Routing Setup

**File**: `frontend/src/app/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/login/LoginPage';
import { RegisterPage } from '../pages/register/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { OwnerDashboard } from '../pages/owner/OwnerDashboard';
import { AuthProvider } from '../shared/providers/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 7.6. Form Validation (Phase 1 - Simple)

**Không cần**: Joi, Yup, React Hook Form

**Sử dụng**: HTML5 validation + Manual checks

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Simple validation
  if (!username || username.length < 3) {
    setError('Username phải có ít nhất 3 ký tự');
    return;
  }
  
  // Submit
  submitForm();
};

<form onSubmit={handleSubmit}>
  <input 
    type="text" 
    required 
    minLength={3}
    value={username}
    onChange={e => setUsername(e.target.value)}
  />
  {error && <p className="error">{error}</p>}
</form>
```

---

## 8. CHECKLIST CHO DESIGNER

### 8.1. Trước Khi Bắt Đầu
- [ ] Đọc kỹ tài liệu này
- [ ] Xem file `DIAGRAMS.html` để hiểu architecture
- [ ] Xem file `QUY_LUAT_TOI_CAO.md` sections 2 (Frontend)
- [ ] Xác nhận đã hiểu phân Phase 1 vs Phase 2

### 8.2. Phase 1 Deliverables
- [ ] Mockups/Wireframes cho 8 màn hình chính
- [ ] Định nghĩa Shared UI Components (Button, Input, Card, Badge)
- [ ] Color palette đơn giản (4-6 màu)
- [ ] Typography specifications
- [ ] Layout grid system
- [ ] Responsive breakpoints (Desktop, Tablet, Mobile)

### 8.3. Design Handoff (Bàn giao cho Dev)
- [ ] Figma/Sketch/XD file với clear naming
- [ ] Component specifications (sizes, colors, states)
- [ ] Interaction notes (click flows, validations)
- [ ] Asset export (icons, images) trong đúng format
- [ ] Spacing system (8px grid recommended)

### 8.4. Collaboration với Dev Team
- [ ] Demo mockups trước khi implement
- [ ] Review HTML/CSS implementation
- [ ] Feedback loop: Design → Dev → Review → Iterate
- [ ] Prioritize: Chức năng > Thẩm mỹ cho Phase 1

---

## 9. TÀI LIỆU THAM KHẢO

### 9.1. Files Bắt Buộc Đọc
1. `mô tả tổng hợp/SYSTEM_DESCRIPTION.json` - Mô tả chi tiết hệ thống
2. `mô tả tổng hợp/DIAGRAMS.html` - Sơ đồ kiến trúc (mở bằng browser)
3. `kiến trúc/cấu trúc quy luật tối cao/QUY_LUAT_TOI_CAO.md` - Quy tắc tối cao
4. `kiến trúc/đề án của huy/policy_engine_auto_accept_spec_v0.1.md` - Policy Engine spec

### 9.2. Tài Nguyên Bên Ngoài
- **Feature-Sliced Design**: https://feature-sliced.design/
- **React 19 Docs**: https://react.dev/
- **ERC-4907 Standard**: https://eips.ethereum.org/EIPS/eip-4907

### 9.3. Design Inspiration (Phase 2 prep)
- Airbnb (for rental marketplace)
- Stripe Dashboard (for clean admin UI)
- Coinbase (for wallet/transaction UI)

---

## 10. FAQ

**Q: Tại sao Phase 1 không cần design phức tạp?**  
A: Phase 1 tập trung vào testing blockchain flows. UI chỉ cần đủ để kiểm thử chức năng, không phải production-ready.

**Q: Khi nào chuyển sang Phase 2?**  
A: Khi (1) Team design hoàn thành mockups, (2) Smart Contracts đã ổn định, (3) Product Owner approve đầu tư UI/UX.

**Q: Có thể dùng UI library (Material-UI, Ant Design) không?**  
A: Phase 1: Tránh để giảm dependencies. Phase 2: Có thể cân nhắc nếu phù hợp với design system.

**Q: Responsive design ưu tiên gì?**  
A: Desktop-first (primary use case là admin/lender manage). Mobile basic support là đủ cho Phase 1.

**Q: Animation có cần thiết không?**  
A: Phase 1: Không. Phase 2: Thêm micro-interactions cho better UX.

---

## 11. LIÊN HỆ VÀ HỖ TRỢ

**Technical Lead**: [Thông tin liên hệ]  
**Product Owner**: [Thông tin liên hệ]  
**Design Review**: [Lịch họp hàng tuần]

---

**Phiên bản**: 1.0  
**Cập nhật lần cuối**: 2026-01-18  
**Người tạo**: Antigravity AI Assistant

---

> 📝 **Lưu ý**: Tài liệu này là living document, sẽ được cập nhật theo tiến độ dự án. Mọi thay đổi lớn cần thông báo cho toàn team.
