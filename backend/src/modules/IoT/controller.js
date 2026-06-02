const express = require('express');
const isLocal = process.env.NODE_ENV === 'local' || true;
const IoTService = isLocal
    ? require('./adapters/mock-iot.adapter')
    : { generatePasscode: () => { throw "Not loaded" } };

const router = express.Router();

router.post('/:id/unlock', async (req, res) => {
    try {
        const ticket = await IoTService.generatePasscode(req.params.id);
        res.json({ success: true, ticket });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
