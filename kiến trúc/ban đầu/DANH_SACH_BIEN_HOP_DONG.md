# DANH SÁCH BIẾN & PLACEHOLDERS CẦN CẤU HÌNH (HỢP ĐỒNG CHO THUÊ SÁCH P2P)

Tài liệu này liệt kê các biến, vùng giữ chỗ (placeholders) và các mục cần lựa chọn trong file cấu trúc hợp đồng (`hợp đồng.md`). Các giá trị này cần được thay thế bằng dữ liệu thực tế từ hệ thống (Database, User Input, System Config) khi tạo hợp đồng.

## 1. Metadata & Header (Thông Tin Chung)

| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu Đề Xuất |
| :--- | :--- | :--- |
| `[version]` | Phiên bản của điều khoản hợp đồng (vd: `v1.0`). | `System Config` |
| `[termsHash]` | Mã băm (SHA-256) của nội dung điều khoản để xác thực. | `Computed (Smart Contract)` |
| `[rentalId]` | Mã định danh duy nhất của giao dịch thuê. | `Database (Rental ID)` |
| `[listingId]` | Mã tài sản hoặc mã tin đăng của cuốn sách. | `Database (Book ID)` |

## 2. Thông Tin Các Bên (Mục I)

### Bên Cho Thuê (BCT) & Bên Thuê (BT)
Dữ liệu này được lấy từ hồ sơ người dùng (KYC/Profile).

| Biến/Placeholder | Ý Nghĩa |
| :--- | :--- |
| `[Họ tên/Pháp nhân]` | Tên đầy đủ theo giấy tờ pháp lý. |
| `[CMND/CCCD/MST]` | Số định danh cá nhân hoặc Mã số thuế. |
| `[Địa chỉ]` | Địa chỉ thường trú/liên hệ. |
| `[Email/Điện thoại]` | Thông tin liên lạc xác thực. |

### Nền tảng (Operator)
Dữ liệu tĩnh của công ty vận hành.

| Biến/Placeholder | Ý Nghĩa |
| :--- | :--- |
| `[Tên pháp nhân vận hành]` | Tên công ty. |
| `[xxx]` | Mã số doanh nghiệp & Địa chỉ trụ sở. |
| `[email/tổng đài]` | Kênh liên hệ hỗ trợ chính thức. |

## 3. Điều Khoản & Giao Dịch (Mục IV)

### Tài Chính & Thời Gian
| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu |
| :--- | :--- | :--- |
| `[VND]` | Giá trị tiền tệ: Giá thuê/ngày, Tiền đặt cọc. | `Listing Data` |
| `[pspRef]` | Mã tham chiếu giao dịch từ cổng thanh toán. | `Payment Gateway` |
| `[start]`, `[end]` | Thời điểm bắt đầu và kết thúc thuê. | `Rental Request` |

### Quy Định & Chính Sách (Config)
| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu |
| :--- | :--- | :--- |
| `[x]` (Điều 6) | Số ngày làm việc để hoàn tiền. | `Policy Config` |
| `[x]` (Điều 7) | Thời hạn mở khiếu nại (ngày), phản hồi (giờ), SLA (ngày). | `Policy Config` |
| `[Trọng tài/Tòa án]` | Cơ quan giải quyết tranh chấp (Cần fix cứng trong code). | `Static Template` |

## 4. Phụ Lục (Bảng Phí & Tham Số)

### Phụ Lục 1: Phí & Hư Hại
| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu |
| :--- | :--- | :--- |
| `[x]`, `[y]`, `[z]` | Giá thuê/ngày, Đặt cọc, Phí trễ/ngày. | `Listing/Policy` |
| `[a]`, `[b]`, `[c]` | % Khấu trừ cọc cho hư hại Mức 1, 2, 3. | `Damage Policy` |
| `[..]` | Phí xử lý bổ sung khi mất sách (nếu có). | `Global Config` |

### Phụ Lục 2: Hủy & Hoàn Tiền
| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu |
| :--- | :--- | :--- |
| `[..]` | % Khấu trừ khi hủy dưới 24h. | `Cancellation Policy` |
| `[x]` | Thời gian hoàn tiền (lặp lại). | `Policy Config` |

### Phụ Lục 3: Biên Bản Giao Nhận
| Biến/Placeholder | Ý Nghĩa |
| :--- | :--- |
| `[..]` | Timestamp, Rental Ref IDs. |
| `[e‑sign/click‑confirm]` | Trạng thái xác thực (vd: "Đã ký bằng chữ ký số", "Đã xác nhận qua App"). |

## 5. Footer (Ký Kết)
| Biến/Placeholder | Ý Nghĩa | Nguồn Dữ Liệu |
| :--- | :--- | :--- |
| `[Ký số/Click‑accept]` | Placeholder hiển thị trạng thái ký của 3 bên. | `Signature State` |
| `[ngày/tháng/năm]` | Ngày hiệu lực hợp đồng. | `Contract Creation Date` |
