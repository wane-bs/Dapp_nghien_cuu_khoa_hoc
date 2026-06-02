const express = require('express');
const ipfs = require('../../../../IPFS/ipfs_simulator.js');

const router = express.Router();

router.get('/:cid', (req, res) => {
    const { cid } = req.params;
    try {
        const content = ipfs.get(cid);
        if (content) {
            // Assume image/jpeg for demo or detect type
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(content);
        } else {
            res.status(404).send("IPFS Resource Not Found");
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

module.exports = router;
