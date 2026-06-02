# Kế Hoạch Kiểm Thử Thực Nghiệm DSR
**Dự án:** VinaLib Web3 — Hệ thống Thuê sách Phi tập trung  
**Phiên bản:** 1.0  
**Ngày lập:** 2026-02-23  
**Nguồn tham chiếu:** `quy-trinh-kiem-dinh-vinalib-vault.md`, `Master_KiemDinhBaoMat.md`

---

## 1. Mục tiêu Kiểm thử (Objectives)

Kế hoạch này triển khai **Phương pháp Nghiên cứu Thiết kế Khoa học (Design Science Research - DSR)** dựa trên khung thiết kế tổng thể, nhằm giải quyết các vấn đề lớn (Tranh chấp, Quy trình thủ công, Quản lý vòng đời) thông qua các mục tiêu cốt lõi định hướng đánh giá (Evaluation):

| Mã Mục tiêu | Mục tiêu cốt lõi (Objective - O) | Tiêu chí đánh giá thực nghiệm (Evaluation - E) |
|---|---|---|
| **O1** | Đảm bảo tính minh bạch, không thể sửa đổi cơ chế sở hữu và bằng chứng | **E2:** Khả năng truy xuất ảnh/bằng chứng toàn vẹn qua CID. |
| **O2** | Tự động hóa quy trình thuê/mượn end-to-end, loại bỏ trung gian | **E3:** Tốc độ xác nhận giao dịch (finality) đạt mức < 2s.<br>**E4:** Độ chính xác của các trigger tự động từ Oracle (không có lỗi logic). |
| **O3** | Số hóa tài sản (tạo Digital Twin) và theo dõi lịch sử vòng đời thiết bị/sách | **E5:** Dữ liệu vòng đời cập nhật theo thời gian thực. |

---

## 2. Thiết lập Khung Thực nghiệm DSR (Experimental Setup)

Khác với việc so sánh A/B Testing thông thường, hệ thống sẽ được giả lập trong môi trường khép kín tập trung vào việc đo lường 4 tiêu chí E2, E3, E4, E5 nhằm chứng thực mức độ khả thi và tính thực dụng của giải pháp Web3 & IoT.

### Môi trường Giả lập (Simulation Environment)
- **Blockchain:** DApp EVM chạy Local (Hardhat Node).
- **Lưu trữ phi tập trung:** Kịch bản Node IPFS Local (xử lý file và sinh chuẩn định danh CIDv1).
- **Tự động hóa (Oracle):** Chainlink Automation Mock (mô phỏng trigger kết thúc hợp đồng).
- **Phần cứng (IoT):** Kịch bản MQTT Broker (Mosquitto/Aedes) giả định thiết bị khóa thông minh (Smart Lock) của tủ sách.

### Ma trận Kịch bản Giả lập (Simulation Matrix)
| Kịch bản | Số lượng mô phỏng | Phục vụ Mục tiêu |
|---|---|---|
| KT-01: Truy xuất & Toàn vẹn (Data Integrity) | Lấy ngẫu nhiên 50 truy vấn | Đánh giá **E2** (Khả năng truy xuất bằng chứng qua CID) |
| KT-02: Tự động hóa (Smart Contract & Oracle) | 20 vòng đời mượn/trả | Đánh giá **E3**, **E4** (Tốc độ giao dịch & Logic tự động trả sách) |
| KT-03: Tích hợp Vật lý (IoT Lifecycle Sync) | 20 giao dịch phát tín hiệu | Đánh giá **E5** (Cập nhật dữ liệu thiết bị thời gian thực theo MQTT) |
| KT-04: Bơm lỗi (Fault Injection) | Giả mạo 10 tệp/CID | Đánh giá tính kháng lỗi, bảo mật cốt lõi |

---

## 3. Chỉ số Đo lường (Evaluation Metrics)

### 3.1 Metric cho O1 (Tính minh bạch & Bất biến)
| Chỉ số | Mô tả | Tiêu chí (E2) |
|---|---|---|
| IPFS Retrieval Latency (Tốc độ lấy ảnh/metadata) | Thời gian đọc metadata thông qua định danh `CIDv1` từ storage | < 2s |
| Tamper Detection (Phát hiện giả mạo) | Hệ thống từ chối/cảnh báo nếu file gốc bị can thiệp làm thay đổi hash | Tỷ lệ bắt lỗi 100% |

### 3.2 Metric cho O2 (Tự động hóa luồng)
| Chỉ số | Mô tả | Tiêu chí (E3, E4) |
|---|---|---|
| Transaction Finality (Tốc độ xác nhận) | Thời gian gửi TX `createRental` đến khi có `TxReceipt` | < 2s (Localhost) |
| Automation Accuracy (Độ chính xác Oracle) | Chainlink Upkeep gọi thành công `performUpkeep` khi dứt điểm thời gian thuê | 100% (Không lỗi vòng lặp) |
| Gas Budget (Ngân sách Gas thao tác) | Lượng Gas trung bình cho việc thuê sách (kiểm toán để không vượt trần) | < 700,000 Gas/hợp đồng |

### 3.3 Metric cho O3 (Số hóa & Vòng đời IoT)
| Chỉ số | Mô tả | Tiêu chí (E5) |
|---|---|---|
| Hardware Sync Latency (Độ trễ đồng bộ) | Khoảng hở thời gian từ khi TX thành công đến khi tủ khóa nhận MQTT `OPEN` | < 3s |
| Lifecycle Tracking (Lưu vết vòng đời) | Lịch sử trạng thái thiết bị on-chain diễn biến thành chuỗi (Verified → Rented → Returned) | Tỷ lệ lưu vết 100% |

---

## 4. Công cụ & Môi trường (Toolchain)

| Thành phần | Công cụ | Trách nhiệm thực thi |
|---|---|---|
| Tầng Blockchain | Hardhat Local Node | Đo lường Transaction Finality & Giới hạn Gas. |
| Tầng Tự động | Scripts Hardhat / Ethers.js | Kích hoạt bộ Automation giả lập. |
| Tầng Lưu trữ | Node.js Script (`IPFS/ipfs_simulator.js`) | Chuẩn hóa dữ liệu sách, băm CIDv1 và tạo vùng nhớ đệm giả. |
| Tầng Thiết bị | Mosquitto (MQTT Broker) + Python/JS Client | Kênh Publish/Subscribe giả định thao tác vật lý trên Lock. |

---

## 5. Kế hoạch Thực thi (Execution Timeline)

```text
Bước 1 — Thiết lập môi trường Thực nghiệm (Setup)
├── [ ] Khởi chạy Hardhat Node và Deploy nhóm Contract
├── [ ] Kích hoạt IPFS Simulator
└── [ ] Khởi chạy công cụ MQTT Broker giả lập IoT (Mosquitto/Aedes)

Bước 2 — Chạy Thực nghiệm Tập trung (Simulation Phase)
├── [ ] Chạy KT-01: Gửi 50 request tải metadata IPFS (Đo lường E2)
├── [ ] Chạy KT-02: Giả lập 20 luồng mượn/trả sách (Đo lường E3, E4 và Gas)
└── [ ] Chạy KT-03: Kích hoạt liên kết lệnh đóng mở MQTT trên Smart Contract (Đo lường E5)

Bước 3 — Thu thập & Trực quan hóa Dữ liệu đo
├── [ ] Trích xuất log tốc độ từ các script Python/JS thành mảng Json/CSV
└── [ ] Python Pandas/Matplotlib: Vẽ biểu đồ Histogram (Biểu đồ phân phối độ trễ xác nhận)

Bước 4 — Nộp Báo cáo DSR
└── [ ] Tổng hợp kết quả (Pass/Fail dựa trên ngưỡng thời gian thực < 2s, < 3s) vào BAO_CAO_EVALUATION.md
```

---

## 6. Điều kiện Nghiệm thu (Sign-off Criteria)

| Điều kiện | Ngưỡng yêu cầu | Hành động nếu FAIL |
|---|---|---|
| Transaction Finality (E3) | Đạt < 2s | Tối ưu hóa cấu trúc biến, giảm ghi on-chain dữ liệu thừa. |
| Automation & IoT Sync (E4, E5)| Tỷ lệ thành công 100% | Rà soát luồng event bắn ra và tinh chỉnh lại delay trên MQTT client. |
| Data Integrity Validation (E2) | Bắt lỗi 100% | Cắt gọn và cập nhật lại cơ chế so khớp chữ ký/chuỗi băm (hash). |

> **Khi tất cả ngưỡng DSR được thông qua:** Kế hoạch thực nghiệm hoàn tất, tài liệu sẵn sàng được đóng gói thành Báo Cáo Phân Tích Thực Nghiệm cuối cùng.
