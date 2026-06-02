# INDEX — Thư Mục Báo Cáo VinaLib DApp

> **Cập nhật lần cuối:** 2026-02-24
> **Tổng số file:** 12 (có mặt) + 6 (chưa được tạo bởi workflow)

---

## Nhóm 1: Báo Cáo Workflow QuyTrinhPhanTichDApp (Mode: CREATION)

Output trực tiếp từ việc phân tích toàn bộ Smart Contracts của dự án:

| File | Nội dung |
|------|---------|
| [BUOC1_PHAN_TICH_KY_THUAT.md](./BUOC1_PHAN_TICH_KY_THUAT.md) | Endpoints, Access Control Matrix, biến trạng thái |
| [BUOC2_KIEN_TRUC_HE_THONG.md](./BUOC2_KIEN_TRUC_HE_THONG.md) | DFD, kiến trúc On-chain/Off-chain, sơ đồ contract |
| [BUOC3_PHAN_TICH_NGHIEP_VU.md](./BUOC3_PHAN_TICH_NGHIEP_VU.md) | Use-Case, State Machine, Business Flows, Gas Estimate |
| [BUOC4_API_DOCS.md](./BUOC4_API_DOCS.md) | API Reference đầy đủ cho Frontend |
| [DAPP_DOCUMENTATION_REPORT.md](./DAPP_DOCUMENTATION_REPORT.md) | Workflow Summary Report (PASS/FAIL từng bước) |

---

## Nhóm 2: File Output Đã Thu Thập Từ Dự Án ✅

Các file output thực tế từ các workflow đã chạy trong dự án — đã sao chép vào đây:

| File | Nguồn gốc | Workflow tạo ra |
|------|-----------|----------------|
| [TECHNICAL_INVENTORY.json](./TECHNICAL_INVENTORY.json) | `contracts/` | Master_PhanTichChuyenGiao — Bước 1 |
| [EXTRACTED_LOGIC.md](./EXTRACTED_LOGIC.md) | `contracts/` | Master_PhanTichChuyenGiao — Bước 2 |
| [PROJECT_MANIFEST_REFACTORED.json](./PROJECT_MANIFEST_REFACTORED.json) | `contracts/` | Master_PhanTichChuyenGiao — Bước 3 |
| [BASE_DESIGN_SPEC.md](./BASE_DESIGN_SPEC.md) | `contracts/` | Master_PhanTichChuyenGiao — Bước 3 |
| [AUDIT_REPORT.md](./AUDIT_REPORT.md) | `contracts/` | Master_KiemDinhBaoMat — Bước 4 |
| [FRONTEND_MAP.json](./FRONTEND_MAP.json) | `frontend/` | QuyTrinhTichHopGiaoDien — Bước 2 |

---

## Nhóm 3: Tổng Hợp Hệ Thống

| File | Nội dung |
|------|---------|
| [WORKFLOW_OUTPUT_TONG_HOP.md](./WORKFLOW_OUTPUT_TONG_HOP.md) | Bản đồ + Input/Output của tất cả 12 workflows |

---

## ⚠️ File Chưa Tồn Tại Trong Dự Án

Các file output này được định nghĩa bởi workflow nhưng **chưa được tạo ra** (workflow tương ứng chưa được chạy hoặc chưa hoàn thành):

| File cần có | Workflow | Lý do chưa có |
|-------------|---------|---------------|
| `DESIGN_SPEC.md` | Master_KienTrucThietKe | Chưa chạy GĐ1 độc lập |
| `E2E_SCENARIOS.md` | QuyTrinhKiemThuTrinhDuyet | Chưa chạy GĐ6 |
| `FINAL_E2E_REPORT.md` | QuyTrinhKiemThuTrinhDuyet | Chưa chạy GĐ6 |
| `BACKEND_DEPRECATION_PLAN.md` | QuyTrinhTaiCauTrucBackend | Chưa chạy GĐ7 |
| `BAO_CAO_EVALUATION.md` | quy-trinh-kiem-dinh-vinalib-vault | Chưa chạy DSR Eval |
| `BAO_CAO_THAM_DINH_KE_HOACH.md` | quy-trinh-tham-dinh-ke-hoach | Chưa chạy Auditor |
