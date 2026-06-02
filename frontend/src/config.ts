/**
 * VinaLib Frontend Configuration
 * 
 * HƯỚNG DẪN SỬ DỤNG LOCALTUNNEL:
 * 1. Chạy `lt --port 3000` để lấy URL Backend (vd: https://xxx.loca.lt)
 * 2. Thay đổi LOCALTUNNEL_BACKEND_URL bên dưới
 * 3. Đổi USE_LOCALTUNNEL = true
 * 4. Refresh browser
 */

// ========== CẤU HÌNH URL ==========
// Đổi thành true khi muốn dùng Localtunnel
const USE_LOCALTUNNEL = false;

// URL cho chế độ localtunnel (Thay đổi sau khi chạy `lt --port 3000`)
const LOCALTUNNEL_BACKEND_URL = "https://puny-pumas-check.loca.lt";

// ========== KHÔNG CẦN SỬA PHÍA DƯỚI ==========
const API_BASE_URL = USE_LOCALTUNNEL
    ? LOCALTUNNEL_BACKEND_URL
    : "http://localhost:3001";

const MOCK_SIGN_URL = "http://localhost:4000";

export const config = {
    API_BASE_URL,
    MOCK_SIGN_URL,
};
