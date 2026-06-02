# Policy Engine Auto-Accept (Phase 2) — Spec (MVP)

Tài liệu này chuyển phần trao đổi trước thành **1 file Markdown** và **chi tiết hóa**:
- Policy Matrix (Tier × TrustScore × Deposit)
- Pseudo-code backend (gần code thực tế)
- Cách map vào **status hiện có**
- SLA/timeout + job nền
- Payload gợi ý cho API & DB fields

---

## 0) Mục tiêu

**Auto-accept** nhằm:
- Giảm “kẹt vì chờ duyệt” (liveness)
- Tăng conversion / UX cho renter “sạch”
- Giữ kiểm soát rủi ro bằng rule rõ ràng, có thể audit

**Nguyên tắc MVP:** không dùng ML; chỉ dùng rule-based + deadline/timeout.

---

## 1) Inputs cho Policy Engine

### 1.1 Book Tier (rủi ro tài sản)

Tier do **trung tâm gán lúc verify listing** (hoặc lúc intake) dựa trên giá trị/độ hiếm/độ dễ hư.

- **Tier A (High risk):** hiếm/đắt/dễ hư
- **Tier B (Medium risk):** phổ thông giá vừa
- **Tier C (Low risk):** giá thấp, dễ thay thế

> Gợi ý lưu trong DB: `book.riskTier = 'A' | 'B' | 'C'`

### 1.2 Book readiness gate (điều kiện “đã sẵn sàng”)

Auto-accept chỉ hợp lý khi **inventory certainty** cao:

- `book.status == VERIFIED_IN_LOCKER` (đã verify + nằm trong tủ)
- `lockerId` đã gán
- book không đang bị hold/đang rented

Nếu không thỏa, policy có thể:
- chuyển sang **MANUAL/HOLD** (chờ sách về/verify), hoặc
- **REJECT** nếu không đáp ứng điều kiện tối thiểu

> Lưu trong DB: `book.status`, `book.lockerId`, `book.isHeld`, `book.isRented`

### 1.3 TrustScore (rủi ro người thuê) — thang 0–100

MVP chỉ cần 3 biến:
- `completedRentals`
- `lateReturns`
- `disputes`

Công thức gợi ý (rule-based):

- `score = 50`
- `score += 10 * min(completedRentals, 5)`
- `score -= 20 * disputes`
- `score -= 10 * lateReturns`
- clamp vào `[0..100]`

Nhóm:
- **High:** ≥ 80
- **Medium:** 50–79
- **Low:** < 50

> Lưu trong DB: `renter.stats.completedRentals`, `renter.stats.lateReturns`, `renter.stats.disputes`

### 1.4 Deposit ratio (tỷ lệ cọc)

- `depositRatio = request.depositAmount / book.valueReference`
- MVP dùng các ngưỡng: **30% / 50% / 70%**

> Lưu trong DB: `booking.depositAmount`, `book.valueReference`

---

## 2) Outputs của Policy Engine

Policy Engine trả về 1 trong 4 outcome:

- **AUTO:** duyệt ngay (không chờ người)
- **REVIEW:** “under-review” ngắn (SLA 15–30’) hoặc cần top-up
- **MANUAL:** chờ duyệt thủ công (Admin/Lender)
- **REJECT:** từ chối / yêu cầu điều kiện bắt buộc (ví dụ KYC)

Kèm metadata:
- `reasonCode`: chuỗi giải thích quyết định
- `deadlineAt`: thời hạn xử lý (review/approve deadline)
- `requiredDepositRatio` (tuỳ chọn): nếu cần top-up

---

## 3) Policy Matrix (Tier × TrustScore × Deposit)

### 3.1 Tier C (Low risk)

| TrustScore | Deposit ≥ 30% | Deposit ≥ 50% |
|---|---:|---:|
| High (≥80) | AUTO | AUTO |
| Medium (50–79) | AUTO | AUTO |
| Low (<50) | REVIEW *(nếu <50%)* | AUTO |

### 3.2 Tier B (Medium risk)

| TrustScore | Deposit ≥ 30% | Deposit ≥ 50% | Deposit ≥ 70% |
|---|---:|---:|---:|
| High (≥80) | AUTO | AUTO | AUTO |
| Medium (50–79) | REVIEW | AUTO | AUTO |
| Low (<50) | MANUAL | REVIEW | REVIEW/AUTO *(tuỳ chính sách)* |

> Khuyến nghị MVP: với `Low trust`, nếu deposit ≥70% thì **REVIEW** (không AUTO).

### 3.3 Tier A (High risk)

| TrustScore | Deposit ≥ 50% | Deposit ≥ 70% |
|---|---:|---:|
| High (≥80) | MANUAL *(khuyến nghị)* | REVIEW *(hoặc MANUAL)* |
| Medium (50–79) | MANUAL | MANUAL |
| Low (<50) | REJECT *(hoặc MANUAL + KYC + ≥70%)* | MANUAL (sau KYC) |

> Khuyến nghị MVP: **Tier A luôn MANUAL**.

---

## 4) SLA/Timeout Rules

**AUTO**
- Không chờ duyệt, nhưng có **pickup window**: `pickupDeadlineAt = now + 60m`

**REVIEW**
- `reviewDeadlineAt = now + 30m`
- Quá hạn chưa pass → `EXPIRED` + release hold (+ refund nếu đã hold tiền)

**MANUAL**
- `approveDeadlineAt = now + 2h` (hoặc 24h)
- Quá hạn → `EXPIRED` + release hold (+ notify)

---

## 5) Mapping vào Status hiện có (ít phá hệ)

Giả sử status hiện có:

```
PENDING_SIGN → SIGNED_PENDING_APPROVAL → SIGNED_UNPAID → PAID → RETURN_REQUESTED → COMPLETED
```

### 5.1 AUTO
- Terms signed → chuyển thẳng `SIGNED_UNPAID` (bỏ qua `SIGNED_PENDING_APPROVAL`)
- Thanh toán → `PAID` → backend gọi on-chain `createRental`

DB fields:
- `approvalMode=AUTO`
- `pickupDeadlineAt=now+60m`
- `reasonCode=...`

### 5.2 REVIEW
- Terms signed → `SIGNED_PENDING_APPROVAL` + `approvalMode=REVIEW` + `deadlineAt=now+30m`
- Review worker:
  - pass → `SIGNED_UNPAID`
  - fail/timeout → `EXPIRED`

DB fields:
- `reviewState=PENDING|PASSED|FAILED`
- `deadlineAt`
- `reasonCode`

### 5.3 MANUAL
- Terms signed → `SIGNED_PENDING_APPROVAL` + `approvalMode=MANUAL` + `deadlineAt=now+2h`
- Approve endpoint → `SIGNED_UNPAID`
- Timeout → `EXPIRED`

DB fields:
- `approvedBy`
- `deadlineAt`
- `reasonCode`

### 5.4 REJECT
- Fail gate → `REJECTED` (hoặc `EXPIRED/CANCELLED` tuỳ semantic)

---

## 6) Data Model gợi ý (MVP)

### 6.1 Booking
```yaml
booking:
  code: string
  rentalId: string
  bookTokenId: number
  lenderId: string
  renterId: string

  status: enum
  approvalMode: enum(AUTO|REVIEW|MANUAL)
  reasonCode: string

  createdAt: datetime
  termsSignedAt: datetime?

  depositAmount: number
  valueReference: number
  depositRatio: number

  trustScore: number
  trustBand: enum(HIGH|MED|LOW)

  deadlineAt: datetime?
  pickupDeadlineAt: datetime?
  approvedBy: string?

  paidAt: datetime?
  paymentRef: string?
  paymentRefHash: string?

  flags:
    isExpired: bool
```

### 6.2 Book
```yaml
book:
  bookTokenId: number
  status: enum(PENDING_VERIFICATION|VERIFIED_IN_LOCKER|RENTED|...)
  riskTier: enum(A|B|C)
  valueReference: number
  lockerId: string?
  isHeld: bool
  isRented: bool
```

### 6.3 RenterStats
```yaml
renterStats:
  completedRentals: int
  lateReturns: int
  disputes: int
```

---

## 7) Pseudo-code Backend (chi tiết hơn)

### 7.1 computeTrustScore()
```pseudo
function computeTrustScore(stats):
    score = 50
    score += 10 * min(stats.completedRentals, 5)
    score -= 20 * stats.disputes
    score -= 10 * stats.lateReturns
    return clamp(score, 0, 100)

function trustBand(score):
    if score >= 80: return "HIGH"
    if score >= 50: return "MED"
    return "LOW"
```

### 7.2 decideApproval()
```pseudo
function decideApproval(book, renterStats, request):
    # Gate 0: inventory certainty
    if book.status != VERIFIED_IN_LOCKER or book.lockerId is null:
        return { outcome:"MANUAL", reasonCode:"BOOK_NOT_READY", deadlineAt: now + 24h }

    if book.isHeld or book.isRented:
        return { outcome:"REJECT", reasonCode:"BOOK_NOT_AVAILABLE", deadlineAt: null }

    tier = book.riskTier
    score = computeTrustScore(renterStats)
    band = trustBand(score)
    depositRatio = request.depositAmount / book.valueReference

    if tier == "C":
        if band == "LOW" and depositRatio < 0.5:
            return { outcome:"REVIEW", reasonCode:"TIER_C_LOW_TRUST_NEED_REVIEW", deadlineAt: now + 30m }
        return { outcome:"AUTO", reasonCode:"TIER_C_OK", pickupDeadlineAt: now + 60m }

    if tier == "B":
        if band == "HIGH":
            return { outcome:"AUTO", reasonCode:"TIER_B_HIGH_TRUST", pickupDeadlineAt: now + 60m }
        if band == "MED":
            if depositRatio >= 0.5:
                return { outcome:"AUTO", reasonCode:"TIER_B_MED_TRUST_DEPOSIT_OK", pickupDeadlineAt: now + 60m }
            return { outcome:"REVIEW", reasonCode:"TIER_B_MED_TRUST_REVIEW", deadlineAt: now + 30m }
        # LOW
        if depositRatio >= 0.7:
            return { outcome:"REVIEW", reasonCode:"TIER_B_LOW_TRUST_HIGH_DEPOSIT_REVIEW", deadlineAt: now + 30m }
        return { outcome:"MANUAL", reasonCode:"TIER_B_LOW_TRUST_MANUAL", deadlineAt: now + 2h }

    # tier == A
    if band == "LOW":
        return { outcome:"REJECT", reasonCode:"TIER_A_LOW_TRUST_REJECT", deadlineAt: null }
    return { outcome:"MANUAL", reasonCode:"TIER_A_MANUAL", deadlineAt: now + 2h }
```

### 7.3 onTermsSigned() — map outcome → status
```pseudo
function onTermsSigned(bookingCode):
    booking = loadBooking(bookingCode)
    book = loadBook(booking.bookTokenId)
    stats = loadRenterStats(booking.renterId)

    decision = decideApproval(book, stats, booking.request)

    # snapshot for audit
    booking.trustScore = computeTrustScore(stats)
    booking.trustBand  = trustBand(booking.trustScore)
    booking.depositRatio = booking.depositAmount / book.valueReference
    booking.reasonCode = decision.reasonCode
    booking.termsSignedAt = now

    if decision.outcome == "AUTO":
        booking.status = "SIGNED_UNPAID"
        booking.approvalMode = "AUTO"
        booking.pickupDeadlineAt = decision.pickupDeadlineAt
        holdBook(book, booking.rentalId, until=booking.pickupDeadlineAt)

    else if decision.outcome == "REVIEW":
        booking.status = "SIGNED_PENDING_APPROVAL"
        booking.approvalMode = "REVIEW"
        booking.deadlineAt = decision.deadlineAt
        booking.reviewState = "PENDING"
        holdBook(book, booking.rentalId, until=booking.deadlineAt)

    else if decision.outcome == "MANUAL":
        booking.status = "SIGNED_PENDING_APPROVAL"
        booking.approvalMode = "MANUAL"
        booking.deadlineAt = decision.deadlineAt
        holdBook(book, booking.rentalId, until=booking.deadlineAt)

    else: # REJECT
        booking.status = "REJECTED"
        releaseHoldIfAny(book, booking.rentalId)

    save(booking); save(book)
    emitAuditLog("TERMS_SIGNED_DECISION", booking.code, booking.reasonCode)
```

### 7.4 approveBooking() — manual approve endpoint
```pseudo
function approveBooking(bookingCode, approverId):
    booking = loadBooking(bookingCode)
    if booking.status != "SIGNED_PENDING_APPROVAL": throw InvalidState
    if booking.approvalMode != "MANUAL": throw InvalidMode

    if now > booking.deadlineAt:
        expireBooking(booking, reason="TIMEOUT_BEFORE_APPROVE")
        throw Timeout

    booking.status = "SIGNED_UNPAID"
    booking.approvedBy = approverId
    booking.pickupDeadlineAt = now + 60m
    extendHold(booking.bookTokenId, booking.rentalId, until=booking.pickupDeadlineAt)
    save(booking)
```

### 7.5 Review worker
```pseudo
function runReview(booking):
    if isBlacklisted(booking.renterId):
        return { passed:false, reason:"BLACKLISTED" }
    if booking.trustBand == "LOW" and booking.depositRatio < 0.7:
        return { passed:false, reason:"INSUFFICIENT_DEPOSIT_FOR_LOW_TRUST" }
    return { passed:true, reason:"REVIEW_OK" }

function processReviewQueue():
    for booking in bookings where status=="SIGNED_PENDING_APPROVAL" and approvalMode=="REVIEW":
        if now > booking.deadlineAt:
            expireBooking(booking, reason="REVIEW_TIMEOUT")
            continue
        result = runReview(booking)
        if result.passed:
            booking.status = "SIGNED_UNPAID"
            booking.reviewState = "PASSED"
            booking.reasonCode += "|" + result.reason
            booking.pickupDeadlineAt = now + 60m
            extendHold(booking.bookTokenId, booking.rentalId, until=booking.pickupDeadlineAt)
        else:
            booking.status = "REJECTED"  # hoặc EXPIRED
            booking.reviewState = "FAILED"
            booking.reasonCode += "|" + result.reason
            releaseHold(booking.bookTokenId, booking.rentalId)
        save(booking)
```

### 7.6 Deadline cron (anti-stuck)
```pseudo
function processDeadlines():
    for booking in bookings where status=="SIGNED_PENDING_APPROVAL":
        if booking.deadlineAt != null and now > booking.deadlineAt:
            expireBooking(booking, reason="APPROVAL_TIMEOUT")

    for booking in bookings where status in ["SIGNED_UNPAID","PAID"]:
        if booking.pickupDeadlineAt != null and now > booking.pickupDeadlineAt and not booking.pickedUp:
            releaseHold(booking.bookTokenId, booking.rentalId)
```

### 7.7 expireBooking()
```pseudo
function expireBooking(booking, reason):
    booking.status = "EXPIRED"
    booking.reasonCode += "|" + reason
    booking.flags.isExpired = true
    releaseHold(booking.bookTokenId, booking.rentalId)

    if booking.paidAt != null:
        refund(booking)

    notify(booking.renterId, "Your request expired")
    save(booking)
```

---

## 8) API response gợi ý (để UI hiển thị mode + countdown)
```json
{
  "code": "ABC123",
  "status": "SIGNED_PENDING_APPROVAL",
  "approvalMode": "REVIEW",
  "reasonCode": "TIER_B_MED_TRUST_REVIEW",
  "trustScore": 62,
  "depositRatio": 0.30,
  "deadlineAt": "2026-01-14T10:30:00Z",
  "pickupDeadlineAt": null
}
```

---

## 9) (Optional) Neo reasonCode hash lên on-chain

Nếu muốn minh bạch policy theo hướng blockchain:
- `reasonHash = keccak256(tier + band + depositBucket + reasonCode)`
- emit event `RentalApproved(rentalId, approver=SYSTEM, reasonHash, deadlineAt)`

---

## 10) Demo scenarios

1) **AUTO:** Tier B + score 85 + deposit 30% → terms signed → `SIGNED_UNPAID`
2) **REVIEW:** Tier B + score 60 + deposit 30% → pending review → pass → `SIGNED_UNPAID`
3) **MANUAL:** Tier A + score 90 → pending manual → admin approve → `SIGNED_UNPAID`
