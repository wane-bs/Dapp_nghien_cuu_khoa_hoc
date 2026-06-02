# HỢP ĐỒNG CHO THUÊ SÁCH (P2P) – SMART‑LEGAL‑CONTRACT

**Phiên bản điều khoản:** {{version}} • **Hash điều khoản (SHA‑256):** {{termsHash}} • **Mã giao dịch:** {{rentalId}} / **Listing:** {{listingId}}

> ⚖️ **Lưu ý:** Đây là mẫu tham khảo dùng cho nghiên cứu & thiết kế sản phẩm, không phải tư vấn pháp lý. Trước khi sử dụng thương mại, cần luật sư đủ điều kiện tại Việt Nam rà soát và điều chỉnh theo thực tế.

## I. THÔNG TIN CÁC BÊN

1.  **Bên Cho Thuê (BCT):** {{lender.fullName}} — {{lender.idNumber}} — {{lender.physicalAddress}} — {{lender.contact}}.
2.  **Bên Thuê (BT):** {{renter.fullName}} — {{renter.idNumber}} — {{renter.physicalAddress}} — {{renter.contact}}.
3.  **Nền tảng (Operator):** {{operator.name}} — Mã số DN: {{operator.taxId}} — Trụ sở: {{operator.address}} — Liên hệ: {{operator.contact}}.

**Cách ký kết:** Hợp đồng hình thành bằng click‑wrap trên ứng dụng/website (lưu log: IP, user‑agent, timestamp, termsHash, version) và/hoặc chữ ký số theo NĐ 130/2018 (nếu các bên lựa chọn).

## II. CĂN CỨ PHÁP LÝ CHỦ ĐẠO

*   Luật Giao dịch điện tử 2023 (công nhận thông điệp dữ liệu, thời điểm gửi/nhận, e‑hợp đồng).
*   Nghị định 130/2018/NĐ‑CP (chữ ký số và dịch vụ chứng thực).
*   Nghị định 52/2013/NĐ‑CP và 85/2021/NĐ‑CP (sàn giao dịch TMĐT).
*   Luật Bảo vệ Quyền lợi Người tiêu dùng 2023 (minh bạch, khiếu nại, điều khoản mẫu).
*   Nghị định 13/2023/NĐ‑CP (bảo vệ dữ liệu cá nhân).
*   Luật An ninh mạng 2018 & Nghị định 53/2022 (trách nhiệm an ninh mạng).
*   Chính sách NHNN: tiền mã hóa không là phương tiện thanh toán hợp pháp tại VN (không chấp nhận thanh toán bằng crypto).

**Tham chiếu quốc tế (best practice, không ràng buộc):** UNCITRAL MLEC/MLETR; EU Data Act – Điều 30 (kill switch cho smart contracts); UK Law Commission 2021 (smart legal contracts).

## III. ĐỊNH NGHĨA

*   **"Sách":** ấn phẩm dạng sách giấy; ebook chỉ khi có giấy phép rõ ràng.
*   **"Đặt cọc":** khoản tiền bảo đảm nghĩa vụ hoàn trả nguyên trạng theo Điều 4.
*   **"Phí thuê", "Phí trễ", "Thang hư hại":** theo Phụ lục 1.
*   **"Biên bản giao/nhận điện tử":** form ảnh + checklist tình trạng; hash đính kèm on‑chain.
*   **"PSP":** đối tác trung gian thanh toán VND được cấp phép tại Việt Nam.

## IV. ĐIỀU KHOẢN

### Điều 1. Đối tượng và phạm vi
1.  BCT cho BT thuê sách theo listing {{listingId}} trên nền tảng.
2.  Ebook (nếu có) chỉ cung cấp khi được cấp phép; nền tảng được quyền gỡ nội dung vi phạm quyền tác giả.

### Điều 2. Giá, đặt cọc, thuế và thanh toán
1.  **Đơn vị thanh toán:** VND qua PSP; không chấp nhận crypto/tiền ảo.
2.  **Giá thuê/ngày:** {{pricePerDay}} VND; **Đặt cọc:** {{deposit}} VND; **Thuế** (nếu có) theo quy định.
3.  Thanh toán/hoàn tiền thực hiện qua PSP; mã tham chiếu giao dịch: {{pspRef}}.

### Điều 3. Thời hạn và giao nhận
1.  **Thời hạn thuê:** từ {{startDate}} đến {{endDate}}.
2.  Khi giao nhận, hai bên lập **Biên bản giao/nhận điện tử** (ảnh + checklist). Hash biên bản được ghi on‑chain.
3.  BT chịu trách nhiệm bảo quản từ khi xác nhận nhận đến khi BCT xác nhận hoàn trả.

### Điều 4. Trả trễ, hư hại, mất mát
1.  **Trả trễ:** tính phí trễ {{lateFeePerDay}} VND/ngày đến khi hoàn trả (theo Phụ lục 1).
2.  **Hư hại:** trừ vào đặt cọc theo Thang hư hại (PL1). Nếu vượt đặt cọc, BT bù phần chênh lệch.
3.  **Mất mát:** bồi thường theo giá trị thay thế/thoả thuận (chi tiết trong PL1).

### Điều 5. Quyền và nghĩa vụ
*   **BCT:** Cung cấp sách đúng mô tả; phối hợp giao/nhận; cung cấp ảnh chứng cứ khi yêu cầu.
*   **BT:** Sử dụng đúng mục đích; không sao chép/xuất bản trái phép; hoàn trả đúng hạn & tình trạng.
*   **Nền tảng:** Duy trì hệ thống; lưu vết giao dịch; hỗ trợ khiếu nại; có quyền tạm dừng HĐTM khi có rủi ro bảo mật (Điều 10).

### Điều 6. Hoàn tiền, hủy giao dịch
1.  **Trước giờ giao:** theo Chính sách hoàn tiền (PL2).
2.  **Sau giờ giao:** áp dụng theo trạng thái (trễ/hư hại/mất mát).
3.  **Thời gian hoàn tiền qua PSP:** {{refundDays}} ngày làm việc.

### Điều 7. Khiếu nại và giải quyết tranh chấp
1.  Mở ticket trong {{ticketDeadlineDays}} ngày; nền tảng phản hồi trong {{responseHours}} giờ; SLA xử lý {{slaDays}} ngày.
2.  **Tranh chấp:** Thương lượng → Hòa giải qua nền tảng → Tòa án có thẩm quyền tại Việt Nam.

### Điều 8. Bảo vệ dữ liệu cá nhân
1.  **Mục đích xử lý:** thực hiện giao dịch, chăm sóc KH, phòng chống gian lận.
2.  Căn cứ pháp lý, nội dung đồng thuận, quyền chủ thể dữ liệu, thời hạn lưu giữ, bên nhận dữ liệu (PSP/vận chuyển/ bảo hiểm) — nêu tại Chính sách quyền riêng tư đính kèm.
3.  **Không lưu PII trên chuỗi**; chỉ lưu hash/pseudonymous IDs.

### Điều 9. Sở hữu trí tuệ
1.  Cấm đăng/cho thuê sách lậu, xâm phạm quyền tác giả.
2.  Nền tảng có quyền gỡ nội dung và tạm ngưng tài khoản vi phạm theo quy chế.

### Điều 10. Điều khoản an toàn kỹ thuật
1.  **Tạm dừng khẩn cấp (Pause/Kill switch):** Khi có rủi ro bảo mật/lỗi nghiêm trọng, nền tảng có quyền tạm dừng HĐTM; tiền người dùng được bảo vệ và đối soát/hoàn tiền off‑chain theo SOP.
2.  **Nâng cấp:** Thay đổi mã HĐTM chỉ áp dụng cho giao dịch tương lai; giao dịch đang diễn ra xử lý theo phiên bản đã chốt.

### Điều 11. Ràng buộc pháp–mã và chứng cứ
1.  Điều khoản này gắn với `termsHash` + `version`; hiển thị cho người dùng trước khi chấp thuận.
2.  Biên bản giao/nhận, ảnh tình trạng, mã PSP được hash và ghi sự kiện on‑chain để làm bằng chứng điện tử.

### Điều 12. Luật áp dụng, hiệu lực
1.  **Luật áp dụng:** pháp luật Việt Nam. Hiệu lực điện tử tương đương văn bản giấy.
2.  Hợp đồng có hiệu lực từ thời điểm BT chấp thuận trên ứng dụng/website hoặc khi chữ ký số được xác nhận (tuỳ phương thức).

---

## PHỤ LỤC 1 — BẢNG PHÍ & THANG HƯ HẠI

*   **Phí thuê/ngày:** {{pricePerDay}} VND • **Đặt cọc:** {{deposit}} VND • **Phí trễ/ngày:** {{lateFeePerDay}} VND
*   **Thang hư hại:**
    *   **Mức 1** (rách <2cm, cong mép nhẹ): trừ {{damageTier1Percent}}% cọc.
    *   **Mức 2** (bút mực/ố bẩn vài trang): trừ {{damageTier2Percent}}% cọc.
    *   **Mức 3** (rách nhiều trang/bong gáy): trừ {{damageTier3Percent}}% cọc.
    *   **Mất sách:** bồi thường giá thay thế + phí xử lý {{lostBookFee}} VND.

## PHỤ LỤC 2 — CHÍNH SÁCH HOÀN TIỀN & HỦY

*   **Trước giờ giao ≥24h:** hoàn 100%. • **<24h:** khấu trừ {{cancellationFeePercent}}%.
*   **Sau giao:** theo trạng thái thực tế (trễ/hư hại/mất mát).
*   **Quy trình hoàn tiền qua PSP;** thời gian hoàn: {{refundDays}} ngày làm việc.

## PHỤ LỤC 3 — BIÊN BẢN GIAO/NHẬN ĐIỆN TỬ (MẪU)

**Mã HĐ:** {{rentalId}} / **Listing ID:** {{listingId}} • **Timestamp:** {{timestamp}}
**Ảnh trước/sau** (URL hoặc CID) + hash; **Checklist tình trạng:** bìa, gáy, trang, đánh dấu.
**Xác nhận:** BCT [e‑sign/click‑confirm] • BT [e‑sign/click‑confirm].

## PHỤ LỤC 4 — THÔNG BÁO QUYỀN RIÊNG TƯ (TÓM TẮT)

*   **Dữ liệu thu thập:** thông tin tài khoản, liên hệ, lịch sử giao dịch, ảnh biên bản (lưu off‑chain).
*   **Mục đích:** thực hiện hợp đồng, hỗ trợ KH, phòng chống gian lận, lưu trữ chứng cứ.
*   **Cơ sở pháp lý:** thực hiện HĐ; đồng thuận (nếu cần); tuân thủ pháp luật.
*   **Quyền của chủ thể dữ liệu:** truy cập/sửa/xóa/hạn chế/XK dữ liệu (theo quy định hiện hành).
*   **Bên nhận dữ liệu:** PSP, vận chuyển, bảo hiểm (nếu áp dụng).

## PHỤ LỤC 5 — GÓI CHỨNG CỨ (EVIDENCE PACK)

*   **Log chấp thuận:** userId, IP, user‑agent, timestamp, termsHash, version.
*   **Biên bản giao/nhận:** preCheckHash/postCheckHash + thời gian; ảnh minh chứng.
*   **Đối soát thanh toán:** pspRef + trạng thái hoàn tiền (nếu có).
*   **Chuỗi lưu giữ (chain of custody):** ai truy cập, thời điểm, mục đích.

---

## CHỮ KÝ/CHẤP THUẬN (ĐIỆN TỬ)

| Bên Cho Thuê (BCT) | Bên Thuê (BT) | Nền tảng (Operator) |
| :--- | :--- | :--- |
| {{lender.signatureStatus}} | {{renter.signatureStatus}} | {{operator.signatureStatus}} |

**Ngày:** {{signDate}}
