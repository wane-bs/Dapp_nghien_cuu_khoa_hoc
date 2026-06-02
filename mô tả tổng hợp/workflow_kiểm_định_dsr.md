---
title: Workflow Tổng Hợp Kiểm Định Thực Nghiệm DSR VinaLib Web3
description: Quy trình 3 bước chuẩn hóa đánh giá hệ thống Smart Contract và quy trình Offline-to-Online theo bộ tiêu chuẩn DSR (Design Science Research).
version: 1.0.0
type: Master Eval Workflow
---

## 🛑 Quy Luật Sinh Tử (Survival Rules)

**TẤT CẢ AGENT PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU ĐÂY KHI THỰC THI WORKFLOW NÀY:**
1. **Tuyệt đối tuân thủ thứ tự:** Chỉ chuyển sang bước tiếp theo khi bước trước đó đã hoàn thành.
2. **Kiểm tra Input/Output:** Ở mỗi bước, kiểm tra sự tồn tại của Input. Đảm bảo Output được tạo đúng định dạng.
3. **Báo cáo trung thực (No Hallucination):** Dừng và báo User nếu xảy ra lỗi. Không bịa đặt kết quả.
4. **Không tự ý thay đổi quy trình:** Không thay đổi quy trình, tên file Output, thư mục.

---

# Workflow: Kiểm Định Thực Nghiệm DSR

**Mục tiêu:** Workflow này hệ thống hóa toàn bộ chuỗi quy trình từ việc Thẩm định Kế hoạch, Rà soát Mã nguồn đến lúc Chạy Giả lập và Xuất Báo cáo DSR cuối cùng. Phương pháp nhằm chứng minh tính ưu việt của hệ thống VinaLib Web3 qua 3 tiêu chí: O1 (Cost), O2 (Performance) và O3 (Transparency & Anti-tampering).

---

## Giai đoạn 1: Tiền Kiểm Định Kế Hoạch (Pre-validation)
*Dựa trên Meta-Workflow tham chiếu: `quy-trinh-tham-dinh-ke-hoach.md`*

**1. Mục đích:** Đánh giá độ phủ và tính khả thi của file `KẾ_HOẠCH_KIỂM_THỬ_DSR.md` trước khi tiến hành viết Script.
**2. Các bước thực thi:**
- **Khảo sát Kiến trúc Tổng thể:** Đảm bảo các kịch bản mô phỏng đồng đều cho các trường hợp tải mạng (Baseline vs Stress Test).
- **Phân bổ và Tối ưu Tài nguyên:** Thiết lập giới hạn Retry/Batch trong lập trình giả lập, bỏ qua rủi ro timeout không nằm trong trọng tâm (như Network Congestion khi chạy Local).
- **Rà soát Chuỗi cung ứng Dữ liệu:** Đóng gói rủi ro Rate-limit của API lấy giá Gas (ví dụ dùng Fallback `$35/AVAX`) và đồng bộ tham chiếu khối mạng thay vì đồng hồ local.
**3. Chuẩn Output:** Tệp báo cáo `BAO_CAO_THAM_DINH_KE_HOACH.md` được đánh dấu `[APPROVED]`.

---

## Giai đoạn 2: Kiểm Định Độ Ổn Định Core & Cấu Trúc (V&V - Code Validation)
*Dựa trên Meta-Workflow tham chiếu: `QuyTrinhKiemDinhVaXacThuc.md`*

**1. Mục đích:** Đảm bảo Smart Contract và Data Pipeline nguyên vẹn, không có rò rỉ bảo mật làm sai lệch số liệu Gas tiêu thụ.
**2. Các bước thực thi:**
- **Thẩm định Kỹ thuật (Smart Contract Auditor):** Rà soát Bug, Reentrancy, kiểm soát quyền Pausable và Ownable trên các hợp đồng `BookAsset.sol`, `RentalAgreementSBT.sol`, `VinaLibVault.sol`.
- **Thẩm định Luồng Dữ liệu (Integration QA):** Quét các file Automation Test (JS/Python), phá bỏ các biến mã băm IPFS (CID) tĩnh tĩnh/hard-code. Thay thế bằng cơ chế `ipfs.generateCIDv1()` sinh động từ `ipfs_simulator.js` để dữ liệu khớp với thực tế chạy DSR.
- **Thực thi và Khớp lệnh Test:** Chạy `npx hardhat test` toàn bộ Codebase, điều kiện tiên quyết là Pass rate 100% (Ví dụ 38/38 ca Test qua trót lọt).
**3. Chuẩn Output:** Tệp báo cáo `BAO_CAO_KIEM_DINH_XAC_THUC.md` chốt mốc `[APPROVED VÀ ĐÓNG BĂNG PHIÊN BẢN]`.

---

## Giai đoạn 3: Thực Hiện Kiểm Thử Mô Phỏng DSR (Execution & Metrics)
*Dựa trên Meta-Workflow tham chiếu: `quy-trinh-kiem-dinh-vinalib-vault.md`*

**1. Mục đích:** Bước hành động thu thập dữ liệu bằng máy thông qua Script Tự động.
**2. Các bước thực thi:**
- **Setup Môi trường Data Automation:** Khởi tạo mạng Hardhat Localhost. Kéo Script đo lường `run_dsr_simulation.js` chứa các thông số đo `ipfsLatency`, `gasUsed` vào hệ thống.
- **Giả lập Song song (Simulation):** 
  - Block 1: Chạy 100 Giao dịch Baseline tuần tự xuyên qua vòng đời (Mint -> Verify -> CreateRental -> Returns)
  - Block 2: Chạy Tải Đồng thời (Stress Test) bằng Promise.all (Ví dụ 50 requests xin trả sách cùng 1 Node).
- **Xuất Dữ liệu Data Sanity:** Cất Logs ra định dạng `transaction_logs.csv`. Kiểm tra tính hợp lệ bằng các tool Parser (đều đủ nội dung Headers, gwei, cost usd).
- **Phân Tích Báo Cáo:** Nội suy từ Transaction Logs ra các chỉ số so sánh Web2 và Web3, tính thời gian lưu trữ IPFS và tổng vòng đời phí On-chain. Móc nối Test Trace Log Hardhat vào làm Minh chứng (Appendix).
**3. Chuẩn Output:** Tệp Báo cáo Học thuật chung cuộc `BAO_CAO_EVALUATION.md`.

---
**=> END OF DSR MASTER WORKFLOW <=**
