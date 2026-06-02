const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    try {
        // Fetch Block 9
        const block = await provider.getBlock(9, true); // Get full txs
        if (!block) {
            console.log("Block 9 not found");
            return;
        }

        console.log("Block #9 Info:");
        console.log("Gas Used:", block.gasUsed.toString());
        console.log("Transactions:", block.prefetchedTransactions.length);

        for (const tx of block.prefetchedTransactions) {
            console.log("------------------------------------------------");
            console.log("Tx Hash:", tx.hash);
            console.log("From:", tx.from);
            console.log("To:", tx.to); // If null, it's a deployment
            console.log("Value:", ethers.formatEther(tx.value));

            // Get Receipt for Gas Used per Tx
            const receipt = await provider.getTransactionReceipt(tx.hash);
            console.log("Tx Gas Used:", receipt.gasUsed.toString());

            // Check Input Data size (rough heuristic for contract size)
            console.log("Input Data Length:", tx.data.length);
            if (!tx.to) {
                console.log("TYPE: CONTRACT DEPLOYMENT (High Gas Expected)");
            } else {
                console.log("TYPE: FUNCTION CALL / TRANSFER");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
