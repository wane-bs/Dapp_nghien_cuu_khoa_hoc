// Config Module - Quản lý cấu hình hệ thống
// GET /api/config - Public: Lấy cấu hình hiện tại
// POST /api/config - Protected (Admin): Cập nhật cấu hình

const express = require('express');
const { systemConfig } = require('../../Shared/store');
const { verifyAdmin } = require('../../Shared/auth');

const router = express.Router();

// GET /api/config - Lấy cấu hình hiện tại (Public)
router.get('/', (req, res) => {
    res.json({
        minCollateralRatio: systemConfig.minCollateralRatio,
        platformFeePercent: systemConfig.platformFeePercent
    });
});

// GET /api/config/contracts - Dynamic Contract Addresses for Frontend
router.get('/contracts', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    try {
        const contractsPath = path.join(__dirname, '../../Shared/contracts-data.json');
        if (fs.existsSync(contractsPath)) {
            const data = fs.readFileSync(contractsPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            console.warn("[Config] contracts-data.json not found");
            res.status(404).json({ error: "Contract data not found" });
        }
    } catch (error) {
        console.error("[Config] Failed to read contracts-data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/config - Cập nhật cấu hình (Admin only)
router.post('/', verifyAdmin, (req, res) => {
    const { minCollateralRatio, platformFeePercent } = req.body;

    // Validation
    if (minCollateralRatio !== undefined) {
        const ratio = Number(minCollateralRatio);
        if (isNaN(ratio) || ratio < 0 || ratio > 100) {
            return res.status(400).json({ error: "minCollateralRatio phải từ 0-100" });
        }
        systemConfig.minCollateralRatio = ratio;
    }

    if (platformFeePercent !== undefined) {
        const fee = Number(platformFeePercent);
        if (isNaN(fee) || fee < 0 || fee > 30) {
            return res.status(400).json({ error: "platformFeePercent phải từ 0-30" });
        }
        systemConfig.platformFeePercent = fee;
    }

    console.log(`[CONFIG] Updated by ${req.user?.username}: Collateral=${systemConfig.minCollateralRatio}%, Fee=${systemConfig.platformFeePercent}%`);

    res.json({
        success: true,
        config: {
            minCollateralRatio: systemConfig.minCollateralRatio,
            platformFeePercent: systemConfig.platformFeePercent
        }
    });
});

module.exports = router;
