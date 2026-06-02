// Auth Helpers - Shared across modules
// Tuân thủ QUY_LUAT_TOI_CAO.md: Minimalist, sử dụng Shared Store
// Security requirement từ Section 5

const { users } = require('./store');

/**
 * Lấy user từ header x-user-id
 * Trả về null nếu không tìm thấy
 */
function getUserFromRequest(req) {
    const userId = req.headers['x-user-id'] || req.body?.username;
    if (!userId) return null;
    return users.get(userId) || null;
}

/**
 * Middleware: Xác thực user đã đăng nhập
 * Attach user vào req.user
 */
function verifyUser(req, res, next) {
    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    req.user = user;
    next();
}

/**
 * Middleware: Chỉ cho phép ADMIN role
 * Phải gọi sau verifyUser hoặc tự check
 */
function verifyAdmin(req, res, next) {
    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Admin only" });
    }
    req.user = user;
    next();
}

/**
 * Middleware: Cho phép LENDER hoặc ADMIN
 */
function verifyLenderOrAdmin(req, res, next) {
    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== 'LENDER' && user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Forbidden: Lender or Admin only" });
    }
    req.user = user;
    next();
}

module.exports = {
    getUserFromRequest,
    verifyUser,
    verifyAdmin,
    verifyLenderOrAdmin
};
