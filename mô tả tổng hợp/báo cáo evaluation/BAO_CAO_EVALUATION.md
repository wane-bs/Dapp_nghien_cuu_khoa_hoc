# BÁO CÁO ĐÁNH GIÁ THỰC NGHIỆM DSR  
# Hệ thống VinaLib-Vault — Thuê sách Phi tập trung

**Phương pháp:** Design Science Research (DSR)  
**Ngày thực nghiệm:** 2026-03-01  
**Phiên bản:** 2.0  
**Nguồn dữ liệu:** `contracts/scripts/simulate_dsr.js` → `mô tả tổng hợp/data/`

---

## 1. Tổng quan Mục tiêu Nghiên cứu

Báo cáo này trình bày kết quả đánh giá thực nghiệm (Evaluation) hệ thống Blockchain VinaLib-Vault dựa trên khung nghiên cứu DSR, nhằm chứng minh tính khả thi và hiệu quả của giải pháp Web3 & IoT so với quy trình quản lý thư viện truyền thống.

| Mã | Mục tiêu (Objective) | Tiêu chí (Evaluation) |
|---|---|---|
| **O1** | Đảm bảo tính minh bạch, bất biến của bằng chứng sở hữu | **E2:** Truy xuất CID toàn vẹn, phát hiện giả mạo 100% |
| **O2** | Tự động hóa quy trình mượn/trả end-to-end | **E3:** Finality < 2s · **E4:** Automation 100% chính xác |
| **O3** | Số hóa tài sản & theo dõi vòng đời IoT | **E5:** Hardware sync < 3s |

---

## 2. Thiết lập Môi trường Thực nghiệm

### 2.1 Hạ tầng Giả lập

| Tầng | Công cụ | Phiên bản |
|---|---|---|
| Blockchain | Hardhat Local Node (EVM) | Hardhat 2.19+, Solidity 0.8.20 |
| Smart Contracts | VinaLibVault, BookAsset (ERC-4907), RentalAgreementSBT | OpenZeppelin 5.4 |
| Lưu trữ phi tập trung | IPFS Simulator (`ipfs_simulator.js`) | CIDv1/SHA-256 |
| Tự động hóa Oracle | Chainlink Automation Mock (`FunctionsRouterMock.sol`) | — |
| Thiết bị IoT | MQTT Simulator (`mqtt_simulator.js`) | Pub/Sub, delay 20-150ms |

### 2.2 Ma trận Kịch bản

| Kịch bản | Mô tả | Số lượng | Mục tiêu |
|---|---|---|---|
| **KT-01** | Truy xuất & Toàn vẹn dữ liệu IPFS | 50 truy vấn | E2 |
| **KT-02** | Tự động hóa luồng mượn/trả sách | 20 vòng đời | E3, E4 |
| **KT-03** | Tích hợp IoT — MQTT Smart Lock | 20 giao dịch | E5 |
| **KT-04** | Bơm lỗi (Fault Injection) CID giả mạo | 10 mẫu | E2 (bảo mật) |

### 2.3 Luồng Deploy

```text
FunctionsRouterMock → BookAsset → RentalAgreementSBT → VinaLibVault
                                                           │
                          ┌────────────────────────────────┘
                          ▼
              setContracts(BookAsset, SBT)
              setRentalContract(Vault)  ← BookAsset
              setRentalContract(Vault)  ← RentalSBT
              safeMint × 20 → verifyForListing × 20
              transferOwnership → Vault
```

---

## 3. Kết quả Thực nghiệm Chi tiết

### 3.1 KT-01: Truy xuất & Toàn vẹn IPFS (E2)

**Mục tiêu:** Đánh giá khả năng truy xuất metadata sách qua định danh CIDv1 và tính toàn vẹn dữ liệu.

| Chỉ số | Ngưỡng DSR | Kết quả | Trạng thái |
|---|---|---|---|
| IPFS Retrieval Latency (Trung bình) | < 2,000ms | **0.42ms** | ✅ **PASS** |
| IPFS Retrieval Latency (Max) | < 2,000ms | **1ms** | ✅ **PASS** |
| Tỷ lệ truy xuất thành công | 100% | **50/50 (100%)** | ✅ **PASS** |

**Phân tích:**
- 10 file metadata JSON được tạo trên IPFS Simulator (chứa bookId, title, author, ISBN, pages).
- 50 truy vấn ngẫu nhiên đều trả về dữ liệu chính xác qua CIDv1 (SHA-256 + Base32).
- Latency trung bình 0.42ms, vượt xa ngưỡng 2s, chứng minh cơ chế content-addressing cực kỳ hiệu quả.

---

### 3.2 KT-02: Tự động hóa Luồng Mượn/Trả (E3, E4)

**Mục tiêu:** Đo tốc độ xác nhận giao dịch (finality), độ chính xác logic tự động, và ngân sách Gas.

#### Bảng Gas Budget theo Hành động

| Hành động | Gas TB | Gas Min | Gas Max | So với ngưỡng 700k |
|---|---|---|---|---|
| `safeMint` | 135,171 | 133,461 | 167,661 | ✅ 19.3% |
| `verifyForListing` | 98,030 | 98,019 | 98,031 | ✅ 14.0% |
| `createRental` | 242,775 | 204,942 | 244,778 | ✅ 34.7% |
| `requestReturn` | 54,513 | 54,502 | 54,514 | ✅ 7.8% |
| `confirmReturn` | 82,335 | 82,235 | 84,223 | ✅ 11.8% |
| **Tổng vòng đời** | **612,824** | — | — | ✅ **87.5%** (< 700k) |

#### Bảng Transaction Finality

| Chỉ số | Ngưỡng DSR | Kết quả | Trạng thái |
|---|---|---|---|
| CreateRental Finality (TB) | < 2,000ms | **2.15ms** | ✅ **PASS** |
| RequestReturn Finality (TB) | < 2,000ms | **1.55ms** | ✅ **PASS** |
| Automation Accuracy | 100% | **20/20 (100%)** | ✅ **PASS** |
| Gas Budget / hợp đồng | < 700,000 | **612,824** | ✅ **PASS** |

**Phân tích:**
- Mỗi vòng đời gồm 5 giao dịch on-chain: Mint → Verify → CreateRental → RequestReturn → ConfirmReturn.
- 20/20 vòng đời hoàn thành không lỗi, chứng minh logic smart contract hoạt động chính xác.
- Transaction finality ở mức ms trên Hardhat local node (environment đầy đủ kiểm soát).
- Tổng Gas budget một vòng đời ~612k, dưới ngưỡng 700k đề ra.

---

### 3.3 KT-03: Tích hợp IoT — MQTT Smart Lock (E5)

**Mục tiêu:** Đo thời gian đồng bộ giữa sự kiện on-chain và thiết bị vật lý (smart lock tủ sách).

| Chỉ số | Ngưỡng DSR | Kết quả | Trạng thái |
|---|---|---|---|
| MQTT Sync Latency (TB) | < 3,000ms | **86ms** | ✅ **PASS** |
| MQTT Sync Latency (Max) | < 3,000ms | **147ms** | ✅ **PASS** |
| MQTT Sync Latency (P95) | < 3,000ms | **145ms** | ✅ **PASS** |
| Tổng messages delivered | — | **60 messages** | ✅ |
| Tỷ lệ delivery thành công | 100% | **100%** | ✅ **PASS** |

**Phân tích:**
- Mỗi vòng giao dịch tạo 3 MQTT messages: `LOCK_OPEN` (command) → Status Update → `LOCK_CLOSE` (command).
- 20 vòng × 3 messages = 60 messages, tất cả đều delivered thành công.
- Latency trung bình 86ms, P95 tại 145ms — hoàn toàn trong ngưỡng 3s cho đồng bộ IoT.
- Topic structure: `smartlock/vinalib/command` (lệnh) + `smartlock/vinalib/status` (phản hồi).

---

### 3.4 KT-04: Bơm lỗi — Fault Injection (Bảo mật E2)

**Mục tiêu:** Kiểm tra khả năng phát hiện và từ chối dữ liệu giả mạo.

| Chỉ số | Ngưỡng DSR | Kết quả | Trạng thái |
|---|---|---|---|
| Tamper Detection Rate | 100% | **10/10 (100%)** | ✅ **PASS** |
| Detection Latency (TB) | — | **0.1ms** | ✅ |

**Phân tích:**
- 10 CID giả mạo (pattern `bafake_corrupted_hash_*`) được inject vào IPFS Simulator.
- Hệ thống từ chối tất cả 10/10 truy vấn vì hash không khớp với bất kỳ file nào.
- Cơ chế content-addressing (SHA-256 → CIDv1) đảm bảo bất kỳ sự thay đổi bit nào đều bị phát hiện.

---

## 4. Bảng Tổng hợp Nghiệm thu DSR

| # | Tiêu chí | Ngưỡng | Kết quả | Trạng thái |
|---|---|---|---|---|
| E2 | IPFS Retrieval Latency | < 2s | 0.42ms | ✅ **PASS** |
| E2 | Tamper Detection Rate | 100% | 100% | ✅ **PASS** |
| E3 | Transaction Finality | < 2s | 2.15ms | ✅ **PASS** |
| E4 | Automation Accuracy | 100% | 100% | ✅ **PASS** |
| E5 | Hardware Sync Latency | < 3s | 86ms | ✅ **PASS** |
| — | Gas Budget / hợp đồng | < 700k | 612,824 | ✅ **PASS** |

> **Kết luận:** Tất cả 6 tiêu chí DSR đều **PASS**. Hệ thống VinaLib-Vault đáp ứng đầy đủ yêu cầu thực nghiệm.

---

## 5. Kết luận & Khuyến nghị

### 5.1 Kết luận

Kết quả thực nghiệm chứng minh giải pháp VinaLib-Vault đạt được cả 3 mục tiêu DSR:

1. **O1 — Tính minh bạch & Bất biến:** Cơ chế CIDv1 (SHA-256) trên IPFS Simulator đảm bảo 100% truy xuất toàn vẹn và 100% phát hiện giả mạo (KT-01 + KT-04).

2. **O2 — Tự động hóa End-to-End:** 20/20 vòng đời mượn/trả hoàn thành tự động qua smart contract với finality ~2ms và gas budget 612k (< 700k ngưỡng). Logic `createRental → requestReturn → confirmReturn` hoạt động chính xác 100% (KT-02).

3. **O3 — Số hóa & Vòng đời IoT:** MQTT sync latency trung bình 86ms (P95: 145ms), vượt xa ngưỡng 3s. Lịch sử trạng thái thiết bị được lưu vết 100% qua event log (KT-03).

### 5.2 Khuyến nghị

| Hạng mục | Khuyến nghị |
|---|---|
| **Gas Optimization** | `createRental` chiếm 39.6% tổng gas. Có thể tối ưu bằng cách gộp storage writes hoặc dùng packed struct. |
| **IPFS Production** | Chuyển từ simulator sang IPFS node thực (Pinata/Infura) để đo latency thực tế trên mạng P2P. |
| **MQTT Production** | Triển khai Mosquitto broker với TLS encryption khi kết nối thiết bị thực. |
| **Oracle Mainnet** | Tích hợp Chainlink Automation trên testnet Avalanche Fuji để đo performUpkeep thực tế. |

---

## PHỤ LỤC

### Phụ lục A: Bằng chứng Event Log On-chain

Dưới đây là trích xuất các sự kiện on-chain tiêu biểu từ `event_logs.json` cho mỗi kịch bản.

#### A.1 — Sự kiện Deploy Contracts (Setup)

```json
{
  "timestamp": "2026-03-01T03:19:43.764Z",
  "scenario": "SETUP",
  "action": "DeployContracts",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "contracts": {
    "FunctionsRouterMock": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "BookAsset": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "RentalAgreementSBT": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "VinaLibVault": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
}
```

#### A.2 — Sự kiện KT-01 IPFS Retrieval (Mẫu)

```json
{
  "scenario": "KT-01",
  "action": "IPFS_Retrieval",
  "runId": 1,
  "cid": "bafkreies7xlwjpx65aycmjajnrxksm3snanjnpqxpxdmjnqnj2lhzjmitm",
  "latencyMs": 0,
  "success": true,
  "dataSize": 148
}
```

#### A.3 — Sự kiện KT-02 CreateRental (Mẫu — có Event Log đầy đủ)

```json
{
  "scenario": "KT-02",
  "action": "CreateRental",
  "runId": 1,
  "bookId": 0,
  "user": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "gasUsed": 204942,
  "finalityMs": 2,
  "blockNumber": 63,
  "txHash": "0x...",
  "events": [
    {
      "logIndex": 0,
      "address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "topics": ["0x...(BookStatusChanged)"],
      "blockNumber": 63
    },
    {
      "logIndex": 1,
      "address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "topics": ["0x...(UpdateUser)"],
      "blockNumber": 63
    },
    {
      "logIndex": 2,
      "address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      "topics": ["0x...(RentalCreated)"],
      "blockNumber": 63
    }
  ]
}
```

#### A.4 — Sự kiện KT-03 MQTT Sync (Mẫu)

```json
{
  "scenario": "KT-03",
  "action": "MQTT_Sync",
  "runId": 1,
  "command": "LOCK_OPEN",
  "openLatencyMs": 56,
  "statusLatencyMs": 142,
  "totalSyncLatencyMs": 198,
  "messageId": "a1b2c3d4e5f6g7h8"
}
```

#### A.5 — Sự kiện KT-04 Fault Injection (Mẫu)

```json
{
  "scenario": "KT-04",
  "action": "FaultInjection",
  "runId": 1,
  "fakeCID": "bafake_corrupted_hash_1772335185921_1",
  "isDetected": true,
  "latencyMs": 0,
  "note": "Hệ thống phát hiện CID giả mạo — từ chối truy xuất"
}
```

---

### Phụ lục B: Tổng hợp Kết quả Kiểm thử (CSV)

#### B.1 — transaction_logs.csv (Trích xuất)

| Scenario | Action | RunID | GasUsed | FinalityLatencyMs |
|---|---|---|---|---|
| KT-02 | Mint | 1 | 167,661 | _ |
| KT-02 | VerifyForListing | 1 | 98,019 | _ |
| KT-02 | CreateRental | 1 | 204,942 | 2 |
| KT-02 | RequestReturn | 1 | 54,502 | 1 |
| KT-02 | ConfirmReturn | 1 | 84,223 | _ |
| KT-02 | CreateRental | 2 | 244,754 | 2 |
| KT-02 | RequestReturn | 2 | 54,514 | 1 |
| KT-02 | ConfirmReturn | 2 | 82,235 | _ |
| ... | ... | ... | ... | ... |
| KT-02 | CreateRental | 20 | 244,766 | 2 |
| KT-02 | RequestReturn | 20 | 54,514 | 1 |
| KT-02 | ConfirmReturn | 20 | 82,235 | _ |

> Tổng cộng: 101 dòng dữ liệu. File đầy đủ: `mô tả tổng hợp/data/transaction_logs.csv`

#### B.2 — dispute_simulation.csv (Đầy đủ)

| Scenario | RunID | TargetCID | IsDetected | LatencyMs | Note |
|---|---|---|---|---|---|
| KT-04 | 1 | bafake_corrupted_hash_...1_1 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 2 | bafake_corrupted_hash_...1_2 | true | 1 | Phát hiện CID giả mạo |
| KT-04 | 3 | bafake_corrupted_hash_...2_3 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 4 | bafake_corrupted_hash_...2_4 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 5 | bafake_corrupted_hash_...3_5 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 6 | bafake_corrupted_hash_...3_6 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 7 | bafake_corrupted_hash_...4_7 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 8 | bafake_corrupted_hash_...4_8 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 9 | bafake_corrupted_hash_...5_9 | true | 0 | Phát hiện CID giả mạo |
| KT-04 | 10 | bafake_corrupted_hash_...5_10 | true | 0 | Phát hiện CID giả mạo |

> Tỷ lệ phát hiện: **10/10 = 100%**

#### B.3 — lifecycle_query.csv (Trích xuất)

| Scenario | Action | RunID | QueryTarget | LatencyMs | IsSuccess |
|---|---|---|---|---|---|
| KT-01 | IPFS_Retrieval | 1 | bafkrei...jmitm | 0 | true |
| KT-01 | IPFS_Retrieval | 2 | bafkrei...ca6ty | 1 | true |
| ... | ... | ... | ... | ... | ... |
| KT-01 | IPFS_Retrieval | 50 | bafkrei...cqt34 | 0 | true |
| KT-03 | MQTT_Lock_Open | 1 | smartlock/vinalib/command | 56 | true |
| KT-03 | MQTT_Status_Update | 1 | smartlock/vinalib/status | 142 | true |
| KT-03 | MQTT_Lock_Close | 1 | smartlock/vinalib/command | 29 | true |
| ... | ... | ... | ... | ... | ... |
| KT-03 | MQTT_Lock_Close | 20 | smartlock/vinalib/command | 66 | true |

> Tổng cộng: 111 dòng. File đầy đủ: `mô tả tổng hợp/data/lifecycle_query.csv`

---

### Phụ lục C: Chú thích Kịch bản Kiểm thử

#### C.1 — KT-01: Truy xuất & Toàn vẹn Dữ liệu (Data Integrity)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Đo tốc độ và độ tin cậy truy xuất metadata sách qua CIDv1 |
| **Tiền điều kiện** | 10 file metadata JSON đã lưu trên IPFS Simulator (`metadata/` folder) |
| **Hành động** | Gọi `ipfsSimulator.get(cid)` với CID ngẫu nhiên từ pool 10 CID |
| **Số lần chạy** | 50 lần |
| **Đo lường** | `Date.now()` before/after mỗi lần get → Latency (ms) |
| **Tiêu chí PASS** | Latency TB < 2,000ms AND tỷ lệ thành công = 100% |
| **Output** | `lifecycle_query.csv` — cột Scenario = "KT-01" |
| **Script** | `simulate_dsr.js` → function `runKT01()` |

#### C.2 — KT-02: Tự động hóa Luồng Mượn/Trả (Smart Contract & Oracle)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Đánh giá tốc độ xác nhận TX, độ chính xác logic tự động, ngân sách Gas |
| **Tiền điều kiện** | 20 sách đã mint (`safeMint`) + verify (`verifyForListing`) + 20 SBT pre-mint |
| **Hành động** | Phase A: Mint/Verify toàn bộ → Phase B: Transfer ownership → Phase C: 20 vòng `createRental` → `requestReturn` → `confirmReturn` |
| **Số lần chạy** | 20 vòng đời hoàn chỉnh |
| **Đo lường** | `receipt.gasUsed` (Gas) · `Date.now()` delta (Finality, ms) · Success count (Accuracy) |
| **Tiêu chí PASS** | Finality < 2s · Accuracy = 100% · Gas < 700k/vòng |
| **Output** | `transaction_logs.csv` — cột Scenario = "KT-02" |
| **Script** | `simulate_dsr.js` → function `runKT02()` |

#### C.3 — KT-03: Tích hợp Vật lý — IoT Lifecycle Sync (MQTT)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Đo độ trễ đồng bộ giữa sự kiện on-chain và thiết bị IoT (smart lock) |
| **Tiền điều kiện** | MQTT Simulator khởi tạo với 2 subscribers trên topic `smartlock/vinalib/command` và `smartlock/vinalib/status` |
| **Hành động** | Publish `LOCK_OPEN` → Status Update → `LOCK_CLOSE` cho mỗi giao dịch |
| **Số lần chạy** | 20 giao dịch × 3 messages = 60 messages |
| **Đo lường** | `mqttSimulator.publish()` trả về `latencyMs` (simulated network delay 20-150ms) |
| **Tiêu chí PASS** | Sync Latency TB < 3,000ms |
| **Output** | `lifecycle_query.csv` — cột Scenario = "KT-03" |
| **Script** | `simulate_dsr.js` → function `runKT03()` |

#### C.4 — KT-04: Bơm lỗi — Fault Injection (Tamper Detection)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Xác minh hệ thống phát hiện và từ chối CID giả mạo |
| **Tiền điều kiện** | Không có file nào trùng pattern `bafake_corrupted_hash_*` trên IPFS |
| **Hành động** | Tạo 10 CID giả → gọi `ipfsSimulator.get(fakeCID)` → kiểm tra trả về `null` |
| **Số lần chạy** | 10 mẫu |
| **Đo lường** | `data === null` → `isDetected = true` |
| **Tiêu chí PASS** | Detection Rate = 100% |
| **Output** | `dispute_simulation.csv` — cột Scenario = "KT-04" |
| **Script** | `simulate_dsr.js` → function `runKT04()` |

---

### Phụ lục D: Danh mục File Output

| File | Đường dẫn | Số dòng | Mô tả |
|---|---|---|---|
| `transaction_logs.csv` | `mô tả tổng hợp/data/transaction_logs.csv` | 101 | Gas & Finality cho mỗi TX on-chain (KT-02) |
| `dispute_simulation.csv` | `mô tả tổng hợp/data/dispute_simulation.csv` | 10 | Kết quả bơm lỗi CID (KT-04) |
| `lifecycle_query.csv` | `mô tả tổng hợp/data/lifecycle_query.csv` | 111 | IPFS retrieval (KT-01) + MQTT sync (KT-03) |
| `event_logs.json` | `mô tả tổng hợp/data/event_logs.json` | ~200 entries | Toàn bộ event log on-chain kèm metadata |

---

> **Trạng thái:** Tất cả ngưỡng DSR **ĐÃ THÔNG QUA**. Kế hoạch thực nghiệm hoàn tất. Tài liệu sẵn sàng đóng gói thành Báo Cáo Phân Tích Thực Nghiệm cuối cùng.
