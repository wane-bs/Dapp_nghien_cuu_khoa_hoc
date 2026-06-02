const ipfsSimulator = require('../../../../../IPFS/ipfs_simulator.js');
const path = require('path');

exports.uploadFile = async (fileBuffer, folder = 'storage') => {
    try {
        console.log(`[IPFS Adapter] Uploading file to IPFS Simulator (Folder: ${folder})...`);
        const cid = ipfsSimulator.add(fileBuffer, folder);
        console.log(`[IPFS Adapter] Uploaded successfully. CID: ${cid}`);
        return cid;
    } catch (error) {
        console.error("[IPFS Adapter] Error uploading file:", error);
        throw error;
    }
};

exports.uploadMetadata = async (metadata) => {
    try {
        console.log("[IPFS Adapter] Uploading metadata to IPFS Simulator...");
        const buffer = Buffer.from(JSON.stringify(metadata));
        const cid = ipfsSimulator.add(buffer, 'metadata');
        console.log(`[IPFS Adapter] Metadata uploaded successfully. CID: ${cid}`);
        return cid;
    } catch (error) {
        console.error("[IPFS Adapter] Error uploading metadata:", error);
        throw error;
    }
};

exports.getFile = (cid) => {
    return ipfsSimulator.get(cid);
};
