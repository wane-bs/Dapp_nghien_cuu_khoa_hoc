const ipfs = require('./ipfs_simulator.js');

console.log("--- STARTING IPFS SIMULATOR TEST ---");

const imageContent = "This is a test image content";
const metadataContent = JSON.stringify({ name: "Test Book", author: "Tester" });

try {
    // Test Image Upload
    const imageCid = ipfs.add(imageContent, 'images');
    console.log(`Uploaded Image CID: ${imageCid}`);

    // Test Metadata Upload
    const metadataCid = ipfs.add(metadataContent, 'metadata');
    console.log(`Uploaded Metadata CID: ${metadataCid}`);

    // Test Retrieval
    const retrievedImage = ipfs.get(imageCid);
    console.log(`Retrieved Image: ${retrievedImage.toString()}`);

    const retrievedMetadata = ipfs.get(metadataCid);
    console.log(`Retrieved Metadata: ${retrievedMetadata.toString()}`);

    if (retrievedImage.toString() === imageContent && retrievedMetadata.toString() === metadataContent) {
        console.log("SUCCESS: Content matches!");
    } else {
        console.error("FAILURE: Content Mismatch!");
    }

} catch (e) {
    console.error("ERROR:", e);
}
