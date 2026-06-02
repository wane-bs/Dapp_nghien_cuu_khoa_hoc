const express = require('express');
const { bookings } = require('../../Shared/store');

const router = express.Router();

router.post('/casso', (req, res) => {
    const secureToken = req.headers['secure-token'];
    if (secureToken !== 'local-secret-key') return res.status(401).json({ error: "Unauthorized" });

    const { data } = req.body;
    if (data && data.length > 0) {
        data.forEach(tx => {
            console.log(`Payment: ${tx.description}`);
            for (let [code, booking] of bookings) {
                if (tx.description.includes(code)) {
                    booking.paid = true;
                    if (booking.status === "SIGNED_UNPAID") booking.status = "PAID";
                }
            }
        });
    }
    res.json({ error: 0, message: "Success" });
});

module.exports = router;
