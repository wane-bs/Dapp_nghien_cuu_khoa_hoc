const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    try {
        const num = await provider.getBlockNumber();
        console.log("Current block:", num);

        // Test with Number
        try {
            const b1 = await provider.getBlock(num);
            console.log("getBlock(number) success:", !!b1);
        } catch (e) { console.log("getBlock(number) failed:", e.message); }

        // Test with String Decimal
        try {
            const strNum = num.toString();
            // In ethers v6, getBlock(string) usually expects a hash or a specific tag like "latest".
            // Decimal strings might be ambiguous or treated as invalid hashes if they don't look like 0x...
            const b2 = await provider.getBlock(strNum);
            console.log(`getBlock("${strNum}") success:`, !!b2);
        } catch (e) { console.log(`getBlock("string") failed:`, e.message); }

        // Test with Hex String
        try {
            const hexNum = "0x" + num.toString(16);
            const b3 = await provider.getBlock(hexNum);
            console.log(`getBlock("${hexNum}") success:`, !!b3);
        } catch (e) { console.log(`getBlock("hex") failed:`, e.message); }

    } catch (e) {
        console.log("Provider connection failed:", e.message);
    }
}

main();
