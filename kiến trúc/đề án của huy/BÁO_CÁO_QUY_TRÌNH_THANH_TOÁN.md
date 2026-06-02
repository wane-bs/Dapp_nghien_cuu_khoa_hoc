# BÁO CÁO QUY TRÌNH THANH TOÁN HIỆN TẠI VÀ CÁC ĐIỂM CẦN BỔ SUNG

**Ngày báo cáo:** 17/01/2026
**Người thực hiện:** Antigravity (AI Assistant)
**Phạm vi:** Quét toàn bộ backend (Node.js) và Smart Contracts (Solidity).

---

## 1. Tổng quan quy trình hiện tại
Hiện tại, hệ thống đã hoàn tất **Phase 1.5**, bao gồm quy trình **từ lúc tạo đơn thuê đến lúc người thuê thanh toán (Escrow)** và **quyết toán (Settlement)** cho người cho thuê.

**Điểm mạnh hiện tại:**
- ✅ Escrow wallet hoạt động ổn định
- ✅ Monthly payout mechanism (ngày 5 hàng tháng)
- ✅ Transaction logging đầy đủ
- ✅ Platform fee calculation chính xác

**Điểm nghẽn hiện tại (cần Phase 2 giải quyết):**
- ⚠️ **Tất cả booking đều phải chờ duyệt thủ công** → giảm UX
- ⚠️ **Không có cơ chế phân biệt rủi ro** → Admin overload với low-risk bookings
- ⚠️ **Thiếu timeout mechanism** → bookings có thể bị "stuck" vô thời hạn

### 1.1 Luồng dữ liệu đã có (Implemented)
1.  **Tạo đơn thuê (Booking Creation):**
    -   **Module:** `Rental/controller.js` (`POST /`)
    -   **Trạng thái:** `PENDING_SIGN` → `SIGNED_PENDING_APPROVAL`.

2.  **Thanh toán (Payment - Renter Side):**
    -   **Module:** `Rental/controller.js` (`POST /:code/pay-wallet`)
    -   **Hành động:**
        -   Trừ tiền người thuê: `user.balance -= price`.
        -   **Cộng tiền vào ví Escrow:** `systemWallets.escrow += price`.
        -   Ghi log giao dịch `PAYMENT_TO_ESCROW`.
        -   Cập nhật trạng thái Booking: `PAID`.

3.  **Xác nhận Trả & Quyết toán (Settlement):**
    -   **Module:** `Admin/controller.js` (`POST /confirm-return`)
    -   **Hành động:**
        -   Trừ tiền Escrow: `systemWallets.escrow -= price`.
        -   Tính phí sàn: `revenue += fee`.
        -   Ghi nhận doanh thu chờ: `lender.pendingIncome += (price - fee)`.
        -   Cập nhật trạng thái: `COMPLETED`.

4.  **Rút tiền (Monthly Payout):**
    -   **Module:** `Admin/controller.js` (`POST /payout`)
    -   **Hành động:** Chuyển `pendingIncome` -> `balance` cho tất cả Lender.

### 1.2 Smart Contract (Solidity)
-   **Contract:** `VinaLibVault.sol`
-   **Chức năng:** Quản lý quyền sử dụng (`setUser`) và trạng thái sách (`isVerified`, `isRented`).
-   **Thanh toán:** Contract hiện tại **không xử lý dòng tiền**. Dữ liệu tài chính được xử lý Off-chain trên Backend (Trusted Model).
-   **Token:** `SuChinToken.sol` (ERC20) tồn tại nhưng chưa được tích hợp vào luồng thanh toán của `Rental`.

---

## 2. Các thành phần còn thiếu (Gap Analysis)

### 2.1 Backend Gap Analysis

| Thành phần | Trạng thái | Mô tả |
| :--- | :--- | :--- |
| **Logic Trả tiền cho Lender** | ✅ Completed | Đã implement `pendingIncome` và `payout` API. |
| **Logic Tính phí (Fee)** | ✅ Completed | Config Module đã hoạt động (`platformFeePercent`). |
| **Thời điểm quyết toán** | ✅ Completed | Manual Trigger (Simulation cho Monthly Payout). |
| **Intelligent Approval System** | ❌ **Missing (Phase 2)** | **Chưa có: Policy Engine, TrustScore, Auto-Accept logic** |
| **Timeout/Deadline Management** | ❌ **Missing (Phase 2)** | **Chưa có cron job để expire stuck bookings** |
| **Risk Tier Classification** | ❌ **Missing (Phase 2)** | **Chưa phân loại sách theo tier A/B/C** |
| **RenterStats Tracking** | ❌ **Missing (Phase 2)** | **Chưa theo dõi lịch sử thuê/tranh chấp** |
| **Xử lý tiền cọc (Deposit)** | ⚠️ Unclear (Phase 3) | Tiền cọc vẫn gộp chung vào giá thuê. |

### 2.2 Frontend Gap Analysis
-   **Tab Cấu hình (Config Tab):** ✅ Đã kết nối API. Admin có thể cập nhật `minCollateralRatio` và `platformFee`.
-   **Dashboard:** ✅ Đã hiển thị Stats (Revenue, Escrow) và Transaction History.
-   **Approval Dashboard:** ❌ **Missing (Phase 2)** - Chưa có UI để Admin xử lý MANUAL approvals
-   **Risk Tier UI:** ❌ **Missing (Phase 2)** - Chưa có dropdown chọn Tier khi verify sách
-   **Booking Status Detail:** ⚠️ **Incomplete** - Chưa hiển thị `approvalMode` và countdown timers


---

## 3. Giải pháp và Lộ trình Tích hợp (Phased Approach)

### Nguyên tắc thiết kế
1. **Ưu tiên Off-chain trước:** Logic tài chính và quyết toán hoàn thiện trên Backend Node.js trước.
2. **Tích hợp On-chain sau:** Sau khi hệ thống ổn định, mới migrate lên NDAChain (Phase cuối).
3. **Backward compatible:** Mỗi giai đoạn phải đảm bảo hệ thống vẫn chạy được.

---

### PHASE 1: Hoàn thiện Logic Tài chính Core (Escrow & Monthly Settlement) - ✅ COMPLETED
**Trạng thái:** Hoàn thành 100%
**Mục tiêu:** Xây dựng hệ thống tài chính hoàn chỉnh, tuân thủ chính sách **quyết toán ngày 5 hàng tháng**.

#### 1.1 Backend - Tạo Module Config (System Configuration)
**File:** `backend/src/modules/Config/controller.js` (NEW)

```javascript
// GET /api/config - Lấy cấu hình hệ thống
// POST /api/config - Admin cập nhật cấu hình (Protected)

const systemConfig = {
    minCollateralRatio: 80,  // % - Tỷ lệ ký quỹ tối thiểu
    platformFeePercent: 10   // % - Phí sàn
};
```

#### 1.2 Backend - Escrow Wallet & User Balance Logic
**File:** `backend/src/Shared/store.js` (UPDATE)

Cập nhật cấu trúc lưu trữ để hỗ trợ việc giam tiền:

```javascript
const systemWallets = {
    escrow: { balance: 0 },        // Ví tạm giữ (Giữ tiền Renter trả)
    revenue: { balance: 0 },       // Doanh thu sàn (Realized Revenue)
    pendingPayout: { balance: 0 }  // Tổng tiền đang giữ của Lender (Liability)
};

// User Object Updates:
// user.pendingIncome: Tiền chờ quyết toán (Lender nhìn thấy nhưng chưa dùng được)
// user.balance: Tiền khả dụng (Vào ví vào ngày 5)
```

#### 1.3 Backend - Payment Flow (Renter trả tiền)
**File:** `backend/src/modules/Rental/controller.js` (UPDATE)

**Route:** `POST /:code/pay-wallet`
*(Logic không đổi: Tiền từ Renter chui vào Escrow)*

```javascript
user.balance -= booking.price;
systemWallets.escrow.balance += booking.price; // Tiền nằm im ở Escrow
```

#### 1.4 Backend - Order Completion (Ghi nhận Doanh thu treo)
**File:** `backend/src/modules/Admin/controller.js` (UPDATE)

**Route:** `POST /api/admin/booking/:code/confirm-return`

*Thay đổi: Tiền KHÔNG về ví Lender ngay. Chuyển sang trạng thái `pendingIncome`.*

```javascript
// 1. Tính toán
const platformFee = booking.price * (systemConfig.platformFeePercent / 100);
const lenderAmount = booking.price - platformFee;
const lender = users.get(lenderInfo.username);

// 2. Chuyển dòng tiền hệ thống
systemWallets.escrow.balance -= booking.price;       // Rút khỏi Escrow
systemWallets.revenue.balance += platformFee;        // Sàn thu phí ngay lập tức
systemWallets.pendingPayout.balance += lenderAmount; // Chuyển sang quỹ chờ trả

// 3. Ghi nhận cho Lender (Pending)
lender.pendingIncome = (lender.pendingIncome || 0) + lenderAmount;

// 4. Log Transaction
transactionLog.push({
    type: 'INCOME_PENDING',
    bookingCode: code,
    lender: lender.username,
    amount: lenderAmount,
    note: "Settlement scheduled for 5th of next month",
    timestamp: Date.now()
});
```

#### 1.5 Backend - Monthly Payout Job (Quyết toán định kỳ)
**File:** `backend/src/cron/payout.js` (NEW) hoặc tích hợp vào Admin API trigger.

**Logic:** Chạy vào ngày 5 hàng tháng.

```javascript
function processMonthlyPayout() {
    console.log("Starting Monthly Payout Logic...");
    let totalPayout = 0;

    users.forEach(user => {
        if (user.pendingIncome > 0) {
            const amount = user.pendingIncome;
            
            // CHUYỂN TIỀN CHÍNH THỨC
            user.balance += amount;        // Cộng vào ví khả dụng
            user.pendingIncome = 0;        // Reset pending
            
            totalPayout += amount;

            transactionLog.push({
                type: 'MONTHLY_PAYOUT',
                user: user.username,
                amount: amount,
                timestamp: Date.now()
            });
        }
    });
    
    // Cập nhật ví hệ thống
    systemWallets.pendingPayout.balance -= totalPayout;
    console.log(`Payout Complete. Total distributed: ${totalPayout}`);
}
```

#### 1.6 Frontend - Cập nhật Dashboard User/Lender
**File:** `frontend/src/pages/admin/ui/OwnerDashboard.tsx` và `frontend/src/pages/wallet/WalletPage.tsx` (UPDATE)

**Yêu cầu hiển thị tách biệt 2 mục riêng biệt:**
1.  **Số dư khả dụng (Available Balance):** Số tiền thực tế trong ví, có thể dùng để thuê sách hoặc rút ra ngay.
2.  **Tiền chờ quyết toán (Pending Income):** Doanh thu từ việc cho thuê, **đang bị khóa** và sẽ được cộng vào Số dư khả dụng vào ngày 5 hàng tháng.

*Note: Cần có tooltip hoặc dòng chú thích nhỏ giải thích quy tắc ngày 5 để người dùng không thắc mắc tại sao tiền chưa về.*

#### 1.7 Checklist Phase 1
- [x] Module Config: Backend API + Frontend integration
- [x] Store Update: Thêm `systemWallets.pendingPayout` và `user.pendingIncome`
- [x] `confirm-return`: Update logic cộng vào `pendingIncome` thay vì `balance`
- [x] **Payout Mechanism:** Tạo API hoặc Script để Admin trigger trả tiền (simulation cho ngày 5)
- [x] Test Flow: Renter Pay -> Admin Confirm -> Lender check Pending -> Trigger Payout -> Lender check Balance

---

### PHASE 2: Policy Engine Auto-Accept (Intelligent Approval System)
**Thời gian ước tính:** 3-4 ngày  
**Trạng thái:** Planned
**Mục tiêu:** Tự động hóa quy trình duyệt dựa trên ma trận rủi ro, giảm thời gian chờ và tăng conversion rate.

#### 2.1 Overview và Nguyên tắc thiết kế
**Vấn đề hiện tại:**
- Tất cả booking đều phải chờ Admin/Lender duyệt thủ công (status `SIGNED_PENDING_APPROVAL`)
- Gây "kẹt" và giảm UX cho renter có lịch sử tốt
- Không có cơ chế phân biệt rủi ro giữa các loại sách và người thuê

**Giải pháp:**
- **Rule-based Auto-Accept**: Dựa trên 3 yếu tố (Book Tier, TrustScore, Deposit Ratio)
- **4 Approval Modes**: AUTO, REVIEW, MANUAL, REJECT
- **SLA/Timeout**: Đảm bảo không có booking nào bị "stuck" vô thời hạn

#### 2.2 Input Parameters cho Policy Engine

##### 2.2.1 Book Risk Tier (Rủi ro tài sản)
**Gán bởi:** Admin khi verify listing

| Tier | Mô tả | Ví dụ |
|:---:|:---|:---|
| **A** | High risk - Hiếm/đắt/dễ hư | Sách cổ, First Edition, giá > 5M VND |
| **B** | Medium risk - Phổ thông giá vừa | Sách thông dụng 500K-5M VND |
| **C** | Low risk - Giá thấp, dễ thay thế | Sách bình dân < 500K VND |

**Data field:** `book.riskTier = 'A' | 'B' | 'C'`

##### 2.2.2 TrustScore (Rủi ro người thuê) - Thang 0–100
**Công thức MVP (rule-based):**
```javascript
function computeTrustScore(stats) {
    let score = 50; // Base score
    score += 10 * Math.min(stats.completedRentals, 5); // Max +50
    score -= 20 * stats.disputes; // Heavy penalty
    score -= 10 * stats.lateReturns; // Moderate penalty
    return Math.max(0, Math.min(100, score)); // Clamp [0..100]
}

function getTrustBand(score) {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
}
```

**Data fields:**
- `renter.stats.completedRentals`
- `renter.stats.lateReturns`
- `renter.stats.disputes`

##### 2.2.3 Deposit Ratio (Tỷ lệ cọc)
```javascript
depositRatio = booking.depositAmount / book.valueReference
```

**Ngưỡng MVP:** 30% / 50% / 70%

#### 2.3 Policy Matrix (Tier × TrustScore × Deposit)

##### Tier C (Low Risk Books)
| TrustScore | Deposit ≥ 30% | Deposit ≥ 50% |
|:---|:---:|:---:|
| **High** (≥80) | AUTO | AUTO |
| **Medium** (50-79) | AUTO | AUTO |
| **Low** (<50) | REVIEW | AUTO |

##### Tier B (Medium Risk Books)
| TrustScore | Deposit ≥ 30% | Deposit ≥ 50% | Deposit ≥ 70% |
|:---|:---:|:---:|:---:|
| **High** (≥80) | AUTO | AUTO | AUTO |
| **Medium** (50-79) | REVIEW | AUTO | AUTO |
| **Low** (<50) | MANUAL | REVIEW | REVIEW |

##### Tier A (High Risk Books)
| TrustScore | Deposit ≥ 50% | Deposit ≥ 70% |
|:---|:---:|:---:|
| **High** (≥80) | MANUAL | REVIEW |
| **Medium** (50-79) | MANUAL | MANUAL |
| **Low** (<50) | REJECT | MANUAL (+ KYC) |

**Nguyên tắc MVP:** Tier A luôn cần human oversight (MANUAL/REVIEW minimum)

#### 2.4 Approval Modes và Status Mapping

##### AUTO (Tự động duyệt)
- **Hành vi:** Terms signed → Bỏ qua `SIGNED_PENDING_APPROVAL` → Chuyển thẳng `SIGNED_UNPAID`
- **Pickup window:** 60 phút (tránh hold sách vô thời hạn)
- **DB fields:**
  ```javascript
  approvalMode: 'AUTO',
  pickupDeadlineAt: now + 60m,
  reasonCode: 'TIER_B_HIGH_TRUST'
  ```

##### REVIEW (Review nhanh tự động)
- **Hành vi:** Terms signed → `SIGNED_PENDING_APPROVAL` + worker job review sau max 30 phút
- **Review checks:**
  - Blacklist check
  - Fraud pattern detection (tương lai)
  - Deposit threshold re-validation
- **Pass → `SIGNED_UNPAID`**, Fail/Timeout → `EXPIRED`
- **DB fields:**
  ```javascript
  approvalMode: 'REVIEW',
  reviewState: 'PENDING' | 'PASSED' | 'FAILED',
  deadlineAt: now + 30m
  ```

##### MANUAL (Duyệt thủ công)
- **Hành vi:** Terms signed → `SIGNED_PENDING_APPROVAL` + chờ Admin/Lender approve
- **Timeout:** 2 giờ (hoặc 24h tùy policy)
- **Endpoint:** `POST /api/admin/booking/:code/approve`
- **DB fields:**
  ```javascript
  approvalMode: 'MANUAL',
  approvedBy: null, // Set khi approve
  deadlineAt: now + 2h
  ```

##### REJECT (Từ chối)
- **Hành vi:** Terms signed → `REJECTED` ngay lập tức
- **Lý do:** Sách chưa sẵn sàng, TrustScore quá thấp cho Tier A, thiếu KYC
- **DB fields:**
  ```javascript
  approvalMode: 'REJECT',
  reasonCode: 'TIER_A_LOW_TRUST_REJECT'
  ```

#### 2.5 SLA/Timeout Rules (Anti-Stuck Mechanism)

| Mode | Deadline | Hành động khi timeout | Release hold |
|:---|:---|:---|:---:|
| **AUTO** | pickup: 60m | Expire nếu chưa thanh toán | ✓ |
| **REVIEW** | 30m | `EXPIRED` + refund | ✓ |
| **MANUAL** | 2h | `EXPIRED` + notify | ✓ |

**Cron Job:** Chạy mỗi 5 phút quét `deadlineAt` và `pickupDeadlineAt`

#### 2.6 Data Model Updates

##### Booking Collection
```javascript
booking = {
    // ... existing fields
    
    // Policy Engine fields (NEW)
    approvalMode: 'AUTO' | 'REVIEW' | 'MANUAL' | 'REJECT',
    reasonCode: string, // e.g. 'TIER_B_HIGH_TRUST'
    trustScore: number,
    trustBand: 'HIGH' | 'MEDIUM' | 'LOW',
    depositRatio: number,
    
    // Deadline tracking
    deadlineAt: Date | null, // For REVIEW/MANUAL approval
    pickupDeadlineAt: Date | null, // For AUTO mode
    
    // Review-specific
    reviewState: 'PENDING' | 'PASSED' | 'FAILED' | null,
    
    // Manual approval
    approvedBy: string | null,
    
    // Flags
    isExpired: boolean
}
```

##### Book Collection
```javascript
book = {
    // ... existing fields
    riskTier: 'A' | 'B' | 'C', // NEW
    valueReference: number, // For deposit ratio calculation
    
    // Inventory readiness gate
    status: 'PENDING_VERIFICATION' | 'VERIFIED_IN_LOCKER' | 'RENTED' | ...,
    lockerId: string | null,
    isHeld: boolean,
    isRented: boolean
}
```

##### RenterStats (NEW collection hoặc embed trong User)
```javascript
renterStats = {
    userId: string,
    completedRentals: number,
    lateReturns: number,
    disputes: number,
    // Future: blacklisted, kycVerified
}
```

#### 2.7 Backend Implementation

##### 2.7.1 Policy Decision Logic
**File:** `backend/src/modules/PolicyEngine/decider.js` (NEW)

```javascript
function decideApproval(book, renterStats, request) {
    // Gate 0: Inventory certainty check
    if (book.status !== 'VERIFIED_IN_LOCKER' || !book.lockerId) {
        return { 
            outcome: 'MANUAL', 
            reasonCode: 'BOOK_NOT_READY', 
            deadlineAt: addHours(new Date(), 24) 
        };
    }
    
    if (book.isHeld || book.isRented) {
        return { outcome: 'REJECT', reasonCode: 'BOOK_NOT_AVAILABLE' };
    }
    
    // Compute inputs
    const tier = book.riskTier;
    const score = computeTrustScore(renterStats);
    const band = getTrustBand(score);
    const depositRatio = request.depositAmount / book.valueReference;
    
    // Apply policy matrix
    if (tier === 'C') {
        if (band === 'LOW' && depositRatio < 0.5) {
            return { 
                outcome: 'REVIEW', 
                reasonCode: 'TIER_C_LOW_TRUST_NEED_REVIEW', 
                deadlineAt: addMinutes(new Date(), 30) 
            };
        }
        return { 
            outcome: 'AUTO', 
            reasonCode: 'TIER_C_OK', 
            pickupDeadlineAt: addMinutes(new Date(), 60) 
        };
    }
    
    if (tier === 'B') {
        if (band === 'HIGH') {
            return { 
                outcome: 'AUTO', 
                reasonCode: 'TIER_B_HIGH_TRUST', 
                pickupDeadlineAt: addMinutes(new Date(), 60) 
            };
        }
        if (band === 'MEDIUM') {
            if (depositRatio >= 0.5) {
                return { outcome: 'AUTO', reasonCode: 'TIER_B_MED_TRUST_DEPOSIT_OK', pickupDeadlineAt: addMinutes(new Date(), 60) };
            }
            return { outcome: 'REVIEW', reasonCode: 'TIER_B_MED_TRUST_REVIEW', deadlineAt: addMinutes(new Date(), 30) };
        }
        // LOW
        if (depositRatio >= 0.7) {
            return { outcome: 'REVIEW', reasonCode: 'TIER_B_LOW_TRUST_HIGH_DEPOSIT', deadlineAt: addMinutes(new Date(), 30) };
        }
        return { outcome: 'MANUAL', reasonCode: 'TIER_B_LOW_TRUST_MANUAL', deadlineAt: addHours(new Date(), 2) };
    }
    
    // Tier A
    if (band === 'LOW') {
        return { outcome: 'REJECT', reasonCode: 'TIER_A_LOW_TRUST_REJECT' };
    }
    return { outcome: 'MANUAL', reasonCode: 'TIER_A_MANUAL', deadlineAt: addHours(new Date(), 2) };
}
```

##### 2.7.2 Integration vào Rental Flow
**File:** `backend/src/modules/Rental/controller.js` (UPDATE)

```javascript
// POST /:code/sign-terms (hoặc khi terms được accepted)
async function handleTermsSigned(req, res) {
    const { code } = req.params;
    const booking = await getBooking(code);
    const book = await getBook(booking.bookTokenId);
    const stats = await getRenterStats(booking.renterId);
    
    // Run policy engine
    const decision = decideApproval(book, stats, booking);
    
    // Snapshot for audit
    booking.trustScore = computeTrustScore(stats);
    booking.trustBand = getTrustBand(booking.trustScore);
    booking.depositRatio = booking.depositAmount / book.valueReference;
    booking.reasonCode = decision.reasonCode;
    booking.termsSignedAt = new Date();
    
    // Map decision to status
    if (decision.outcome === 'AUTO') {
        booking.status = 'SIGNED_UNPAID';
        booking.approvalMode = 'AUTO';
        booking.pickupDeadlineAt = decision.pickupDeadlineAt;
        await holdBook(book, booking.rentalId, decision.pickupDeadlineAt);
        
    } else if (decision.outcome === 'REVIEW') {
        booking.status = 'SIGNED_PENDING_APPROVAL';
        booking.approvalMode = 'REVIEW';
        booking.deadlineAt = decision.deadlineAt;
        booking.reviewState = 'PENDING';
        await holdBook(book, booking.rentalId, decision.deadlineAt);
        
    } else if (decision.outcome === 'MANUAL') {
        booking.status = 'SIGNED_PENDING_APPROVAL';
        booking.approvalMode = 'MANUAL';
        booking.deadlineAt = decision.deadlineAt;
        await holdBook(book, booking.rentalId, decision.deadlineAt);
        
    } else { // REJECT
        booking.status = 'REJECTED';
        await releaseHoldIfAny(book, booking.rentalId);
    }
    
    await saveBooking(booking);
    await auditLog('TERMS_SIGNED_DECISION', { code, reasonCode: booking.reasonCode });
    
    res.json({ success: true, booking });
}
```

##### 2.7.3 Review Worker Job
**File:** `backend/src/cron/reviewWorker.js` (NEW)

```javascript
async function processReviewQueue() {
    const pendingReviews = await getBookings({
        status: 'SIGNED_PENDING_APPROVAL',
        approvalMode: 'REVIEW',
        reviewState: 'PENDING'
    });
    
    for (const booking of pendingReviews) {
        // Timeout check
        if (new Date() > booking.deadlineAt) {
            await expireBooking(booking, 'REVIEW_TIMEOUT');
            continue;
        }
        
        // Run review checks
        const reviewResult = await runReviewChecks(booking);
        
        if (reviewResult.passed) {
            booking.status = 'SIGNED_UNPAID';
            booking.reviewState = 'PASSED';
            booking.pickupDeadlineAt = addMinutes(new Date(), 60);
            await extendHold(booking.bookTokenId, booking.rentalId, booking.pickupDeadlineAt);
        } else {
            booking.status = 'REJECTED';
            booking.reviewState = 'FAILED';
            booking.reasonCode += '|' + reviewResult.reason;
            await releaseHold(booking.bookTokenId, booking.rentalId);
        }
        
        await saveBooking(booking);
    }
}

async function runReviewChecks(booking) {
    // Blacklist check
    const isBlacklisted = await checkBlacklist(booking.renterId);
    if (isBlacklisted) {
        return { passed: false, reason: 'BLACKLISTED' };
    }
    
    // Insufficient deposit for low trust
    if (booking.trustBand === 'LOW' && booking.depositRatio < 0.7) {
        return { passed: false, reason: 'INSUFFICIENT_DEPOSIT_FOR_LOW_TRUST' };
    }
    
    return { passed: true, reason: 'REVIEW_OK' };
}
```

##### 2.7.4 Deadline Cron Job
**File:** `backend/src/cron/deadlineMonitor.js` (NEW)

```javascript
// Run every 5 minutes
async function monitorDeadlines() {
    const now = new Date();
    
    // Check approval deadlines (REVIEW/MANUAL)
    const pendingApprovals = await getBookings({
        status: 'SIGNED_PENDING_APPROVAL',
        deadlineAt: { $lte: now }
    });
    
    for (const booking of pendingApprovals) {
        await expireBooking(booking, 'APPROVAL_TIMEOUT');
    }
    
    // Check pickup deadlines (AUTO/approved but not paid)
    const unpaidBookings = await getBookings({
        status: { $in: ['SIGNED_UNPAID', 'PAID'] },
        pickupDeadlineAt: { $lte: now },
        pickedUp: false
    });
    
    for (const booking of unpaidBookings) {
        await releaseHold(booking.bookTokenId, booking.rentalId);
        // Optionally expire or send reminder
    }
}

async function expireBooking(booking, reason) {
    booking.status = 'EXPIRED';
    booking.reasonCode += '|' + reason;
    booking.isExpired = true;
    
    await releaseHold(booking.bookTokenId, booking.rentalId);
    
    if (booking.paidAt) {
        await refundPayment(booking);
    }
    
    await notify(booking.renterId, 'Your booking request has expired.');
    await saveBooking(booking);
}
```

##### 2.7.5 Manual Approval Endpoint
**File:** `backend/src/modules/Admin/controller.js` (UPDATE)

```javascript
// POST /api/admin/booking/:code/approve
async function approveBooking(req, res) {
    const { code } = req.params;
    const approverId = req.user.username; // From auth middleware
    
    const booking = await getBooking(code);
    
    if (booking.status !== 'SIGNED_PENDING_APPROVAL') {
        return res.status(400).json({ error: 'Invalid booking state' });
    }
    
    if (booking.approvalMode !== 'MANUAL') {
        return res.status(400).json({ error: 'Not a manual approval booking' });
    }
    
    if (new Date() > booking.deadlineAt) {
        await expireBooking(booking, 'TIMEOUT_BEFORE_APPROVE');
        return res.status(410).json({ error: 'Booking expired' });
    }
    
    // Approve
    booking.status = 'SIGNED_UNPAID';
    booking.approvedBy = approverId;
    booking.pickupDeadlineAt = addMinutes(new Date(), 60);
    
    await extendHold(booking.bookTokenId, booking.rentalId, booking.pickupDeadlineAt);
    await saveBooking(booking);
    await auditLog('MANUAL_APPROVAL', { code, approverId });
    
    res.json({ success: true, booking });
}
```

#### 2.8 Frontend Updates

##### 2.8.1 Admin Panel - Approval Dashboard
**File:** `frontend/src/pages/admin/ApprovalDashboard.tsx` (NEW)

Hiển thị:
- List of pending MANUAL approvals với countdown timer
- Filter by Tier/TrustBand
- One-click approve/reject với reason input

##### 2.8.2 Renter UI - Booking Status
**File:** `frontend/src/pages/rental/BookingDetail.tsx` (UPDATE)

Hiển thị theo `approvalMode`:
```typescript
{booking.approvalMode === 'AUTO' && (
    <Alert severity="success">
        Your request was auto-approved! Please pay within {countdown}.
    </Alert>
)}

{booking.approvalMode === 'REVIEW' && (
    <Alert severity="info">
        Under automatic review (max 30 min). Reason: {booking.reasonCode}
    </Alert>
)}

{booking.approvalMode === 'MANUAL' && (
    <Alert severity="warning">
        Waiting for manual approval. Deadline: {formatDeadline(booking.deadlineAt)}
    </Alert>
)}
```

##### 2.8.3 Book Management - Risk Tier Assignment
**File:** `frontend/src/pages/admin/BookVerification.tsx` (UPDATE)

Thêm dropdown chọn Tier (A/B/C) khi Admin verify sách.

#### 2.9 Checklist Phase 2
- [ ] **Backend:**
  - [ ] Tạo `PolicyEngine/decider.js` với policy matrix
  - [ ] Update `Rental/controller.js` - Terms signed flow
  - [ ] Review worker cron job (`cron/reviewWorker.js`)
  - [ ] Deadline monitor cron job (`cron/deadlineMonitor.js`)
  - [ ] Manual approval endpoint (`Admin/controller.js`)
  - [ ] RenterStats collection/logic
- [ ] **Database:**
  - [ ] Add `riskTier` field to Book schema
  - [ ] Add `approvalMode`, `reasonCode`, `deadlineAt`, etc. to Booking schema
  - [ ] Create RenterStats collection
- [ ] **Frontend:**
  - [ ] Approval Dashboard cho Admin
  - [ ] Update Booking detail page với approval status
  - [ ] Risk Tier selector trong Book verification
- [ ] **Testing:**
  - [ ] Unit test policy matrix (all combinations)
  - [ ] Integration test: AUTO flow (high trust + tier C)
  - [ ] Integration test: REVIEW flow với timeout
  - [ ] Integration test: MANUAL approval + deadline expiry
  - [ ] Load test: Cron jobs với 1000+ bookings

---

### PHASE 3: Deposit & Collateral Management (Off-chain Accounting)
**Thời gian ước tính:** 2 ngày  
**Mục tiêu:** Tách riêng tiền thuê và tiền cọc về mặt kế toán trên Database (vẫn giữ Off-chain).

#### 3.1 Data Model Enhancement (Database Only)
**File:** `backend/src/modules/Rental/controller.js`

Cập nhật booking structure:
```javascript
booking = {
    ...existingFields,
    rentalFee: 50000,      // Tiền thuê thuần
    depositAmount: 40000,  // Tiền cọc (80% collateral)
    totalPayment: 90000,   // Tổng thu = rentalFee + depositAmount
    depositStatus: 'HELD'  // HELD | REFUNDED | DEDUCTED
}
```

#### 3.2 Payment Split Logic
```javascript
// Khi thanh toán:
user.balance -= booking.totalPayment;
systemWallets.escrow.balance += booking.totalPayment;

// Metadata
booking.escrow = {
    rental: booking.rentalFee,
    deposit: booking.depositAmount
};
```

#### 3.3 Settlement với Deposit
```javascript
// Khi confirm-return:
if (!isDamaged) {
    // Hoàn cọc cho Renter
    renter.balance += booking.depositAmount;
    booking.depositStatus = 'REFUNDED';
} else {
    // Giữ lại cọc, chuyển cho Lender
    lenderAmount += booking.depositAmount;
    booking.depositStatus = 'DEDUCTED';
}

// Quyết toán Rental Fee
const platformFee = booking.rentalFee * (systemConfig.platformFeePercent / 100);
const lenderRentalAmount = booking.rentalFee - platformFee;
lender.balance += lenderRentalAmount + (isDamaged ? booking.depositAmount : 0);
```

#### 3.4 Checklist Phase 3
- [ ] Tách `rentalFee` và `depositAmount` trong booking
- [ ] Validation: `depositAmount >= rentalFee * (minCollateralRatio / 100)`
- [ ] Logic hoàn cọc / khấu trừ cọc
- [ ] Frontend: Hiển thị breakdown (Rental + Deposit)
- [ ] Test: Scenario sách nguyên vẹn vs hư hại

---

### PHASE 4: NDAChain Integration (On-chain Reputation Settlement)
**Thời gian ước tính:** 5-7 ngày  
**Mục tiêu:** Migrate logic xác thực trạng thái thuê lên NDAChain để tính TrustScore minh bạch, nhưng **KHÔNG giữ tiền thật**.

#### 3.1 Smart Contract Design (Non-Financial)
**File:** `contracts/contracts/ReputationVault.sol` (NEW)

**Nguyên tắc:** 
- Contract này **KHÔNG** giữ ERC-20 hay Native Token.
- Chỉ giữ **Trạng thái Thanh toán** (Payment Status) được oracle/admin xác thực.
- Dữ liệu này dùng để tính điểm uy tín cho hành vi "Thanh toán đúng hạn".

```solidity
contract ReputationVault {
    struct RentalState {
        address renter;
        address lender;
        bool isDepositLocked; // Logic flag, not real money
        bool isSettled;
    }
    
    // Mapping rentalId => RentalState
    mapping(bytes32 => RentalState) public rentalStates;
    
    // Event chỉ mang tính thông báo, không có value transfer
    event DepositLockedLogically(bytes32 rentalId, address renter);
    event SettlementVerified(bytes32 rentalId, bool success);

    function lockDepositLogic(bytes32 rentalId, address renter, address lender) external onlyAdmin {
        rentalStates[rentalId] = RentalState({
            renter: renter,
            lender: lender,
            isDepositLocked: true,
            isSettled: false
        });
        emit DepositLockedLogically(rentalId, renter);
    }

    function settle(bytes32 rentalId, bool isDamaged) external onlyAdmin {
        RentalState storage state = rentalStates[rentalId];
        require(state.isDepositLocked, "Deposit not locked");
        
        state.isSettled = true;
        // Logic tính điểm uy tín (TrustScore) sẽ chạy ở đây hoặc Off-chain listener
        emit SettlementVerified(rentalId, !isDamaged);
    }
}
```

#### 3.2 Backend Integration
**File:** `backend/src/modules/Rental/controller.js`

```javascript
// Khi pay-wallet (User đã trả tiền Off-chain):
// Backend gọi Contract để đánh dấu "Đã cọc uy tín"
const tx = await reputationVaultContract.lockDepositLogic(
    ethers.utils.id(bookingCode),
    userAddress,
    lenderAddress
);
booking.onChainTxHash = tx.hash;
```

#### 3.3 Tuân thủ Quy Luật Tối Cao
- **Tiền:** 100% Off-chain (VND).
- **Token:** Không dùng SuChinToken để thanh toán.
- **Vai trò Blockchain:** Chỉ lưu "Bằng chứng đã thanh toán" (Proof of Payment) để xây dựng Identity.

#### 4.4 Checklist Phase 4
- [ ] Deploy `ReputationVault.sol` lên NDAChain testnet
- [ ] Backend: Web3 provider setup for status updates
- [ ] Event listener: Đồng bộ Reputation events về backend
- [ ] Update TrustScore logic dựa trên On-chain events

---

## 4. Timeline Tổng thể

| Phase | Nội dung | Thời gian | Output |
|:---:|:---|:---:|:---|
| **Phase 1** | Escrow & Settlement (Off-chain) | ✅ DONE | Hệ thống thanh toán hoàn chỉnh trên Backend |
| **Phase 2** | Policy Engine Auto-Accept | 3-4 ngày | Intelligent approval system với AUTO/REVIEW/MANUAL modes |
| **Phase 3** | Deposit & Collateral | 2 ngày | Logic tiền cọc đầy đủ |
| **Phase 4** | NDAChain Integration | 5-7 ngày | Smart contract quyết toán on-chain |
| **Total** | | **10-13 ngày** (chưa tính Phase 1 đã hoàn thành) | Full-stack payment + approval system |

---

## 5. KPIs & Success Metrics

### Phase 1 Success Criteria:
- ✅ 100% bookings có giao dịch trong `transactionLog`
- ✅ Escrow balance = Sum(unpaid bookings)
- ✅ Lender balance tăng sau khi Admin confirm return
- ✅ Platform revenue được ghi nhận chính xác

### Phase 2 Success Criteria:
- ✅ Policy matrix coverage: 100% scenarios được test
- ✅ AUTO approval rate: 60-70% cho Tier B/C với high trust
- ✅ Timeout mechanism: 0% stuck bookings sau 24h
- ✅ Avg approval time: < 5 phút cho AUTO, < 30 phút cho REVIEW

### Phase 3 Success Criteria:
- ✅ Deposit được hoàn/khấu trừ đúng logic
- ✅ Không có "money leak" (tổng tiền hệ thống cân bằng)

### Phase 4 Success Criteria:
- ✅ Smart contract pass audit
- ✅ Gas cost < 0.5 USD/transaction
- ✅ 99.9% uptime trên NDAChain mainnet

---

## 6. Rủi ro & Mitigation

| Rủi ro | Impact | Mitigation |
|:---|:---:|:---|
| Escrow logic sai → mất tiền | HIGH | Unit test toàn bộ edge cases, code review 2 người |
| Admin config sai phí → financial loss | MEDIUM | Thêm validation: platformFee ∈ [0, 30] |
| **Policy matrix sai → auto-approve high-risk bookings** | **HIGH** | **Extensive unit tests cho policy matrix, shadow mode testing trước khi rollout** |
| **Timeout mechanism fail → stuck bookings** | **MEDIUM** | **Monitoring + alerts cho cron jobs, fallback manual cleanup** |
| **TrustScore manipulation** | **MEDIUM** | **Audit trail cho mọi stat update, rate limiting** |
| Smart contract bug | CRITICAL | Audit bởi firm chuyên nghiệp, bug bounty program |
| NDAChain downtime | MEDIUM | Fallback sang off-chain mode tự động |

---

## 7. File Changes Summary

### Cần tạo mới:
1. `backend/src/modules/Config/controller.js` ✅ (Phase 1 - DONE)
2. **`backend/src/modules/PolicyEngine/decider.js`** (Phase 2 - NEW)
3. **`backend/src/cron/reviewWorker.js`** (Phase 2 - NEW)
4. **`backend/src/cron/deadlineMonitor.js`** (Phase 2 - NEW)
5. **`frontend/src/pages/admin/ApprovalDashboard.tsx`** (Phase 2 - NEW)
6. `contracts/contracts/ReputationVault.sol` (Phase 4)

### Cần sửa đổi:
1. `backend/src/Shared/store.js` - Thêm escrow wallets ✅ (Phase 1)
2. `backend/src/modules/Rental/controller.js` - Payment logic ✅ (Phase 1) + **Terms signed flow** (Phase 2)
3. `backend/src/modules/Admin/controller.js` - Settlement logic ✅ (Phase 1) + **Manual approval endpoint** (Phase 2)
4. `frontend/src/pages/admin/ui/OwnerDashboard.tsx` - Config UI ✅ (Phase 1)
5. **`frontend/src/pages/rental/BookingDetail.tsx`** - Approval status UI (Phase 2)
6. **`frontend/src/pages/admin/BookVerification.tsx`** - Risk Tier selector (Phase 2)

### Cần bổ sung Schema:
1. **Book:** `riskTier`, `valueReference`, `lockerId`, `isHeld` (Phase 2)
2. **Booking:** `approvalMode`, `reasonCode`, `trustScore`, `trustBand`, `depositRatio`, `deadlineAt`, `pickupDeadlineAt`, `reviewState`, `approvedBy`, `isExpired` (Phase 2)
3. **RenterStats (NEW collection):** `completedRentals`, `lateReturns`, `disputes` (Phase 2)

### Tổng số files: 
- **Phase 1:** 4 files (COMPLETED)
- **Phase 2:** 9 files (6 NEW + 3 UPDATE)
- **Phase 3:** 2 files (UPDATE existing)
- **Phase 4:** 3 files (1 NEW + 2 UPDATE)

---

## 8. Kết luận

Hệ thống hiện tại đã hoàn thành **Phase 1** (Escrow & Settlement - 100% DONE).

**Lộ trình tiếp theo:**

1. **Phase 2 (PRIORITY HIGH - Policy Engine Auto-Accept):** 
   - Giải quyết điểm nghẽn UX (chờ duyệt thủ công)
   - Tăng conversion rate thông qua auto-approval
   - Foundation cho hệ thống quản lý rủi ro dài hạn
   - **Estimate:** 3-4 ngày

2. **Phase 3 (Deposit Management):** 
   - Hoàn thiện logic tài chính với tiền cọc
   - Xử lý trường hợp sách bị hư hại
   - **Estimate:** 2 ngày

3. **Phase 4 (NDAChain Integration):** 
   - Nâng cấp lên blockchain cho transparency
   - Chỉ thực hiện sau khi Phase 2-3 ổn định
   - **Estimate:** 5-7 ngày

**Khuyến nghị hành động:**
- ✅ **Next Sprint:** Triển khai Phase 2 (Policy Engine) - Critical path
- Parallel track: Thiết kế DB schema updates sẵn cho Phase 2+3
- Phase 4 có thể defer nếu cần prioritize features khác
