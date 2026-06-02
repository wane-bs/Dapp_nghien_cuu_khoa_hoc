const { ethers } = require("hardhat");

async function main() {
    console.log("Simulating Chainlink Functions via Mock Router...");

    // 1. Get deployed contracts
    // Note: In a real script we'd need the addresses. For this local test we might deploy fresh or read from a file.
    // For simplicity, let's assume we are running this against a specific address or re-deploying.
    // But to keep it usable with `npx hardhat run`, let's just deploy them here transiently OR attach if known.

    // Since we don't have a persistent deployment file system here yet, let's Demo the Flow in one go:

    const [deployer] = await ethers.getSigners();

    // Attach to existing if known, or Deploy new for demo
    // Let's look for the router address if saved, otherwise we might have to run deploy.js first and save it.
    // For this "script", let's just do a full run: Deploy -> Request -> Fulfill

    const RouterMock = await ethers.getContractFactory("FunctionsRouterMock");
    const router = await RouterMock.deploy();
    await router.waitForDeployment();
    console.log("Router deployed:", router.target);

    const VinaLib = await ethers.getContractFactory("VinaLibVault");
    const vinalib = await VinaLib.deploy(router.target);
    await vinalib.waitForDeployment();
    console.log("VinaLib deployed:", vinalib.target);

    // 2. Create a Request
    console.log("Creating Booking/Request...");
    const tx = await vinalib.sendRequest("return 1", [], []);
    const receipt = await tx.wait();

    // Parse logs to find RequestId
    // simple hack: get the ID from the event if we could parse, but Mock Router sends simple event.
    // Let's just assume we know the ID or fetch it.

    // In our Mock Router:
    // event RequestSent(bytes32 indexed id);
    const filter = router.filters.RequestSent();
    const events = await router.queryFilter(filter);
    const requestId = events[events.length - 1].args[0];
    console.log("Request ID:", requestId);

    // 3. Simulate Fulfillment (The "Oracle" Part)
    console.log("Simulating Oracle Response...");

    // We want to return "5" logs found (Hex encoded)
    // uint256(5) -> 0x000...05
    const responseBytes = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [5]);
    const errorBytes = "0x";

    await router.fulfillRequest(requestId, responseBytes, errorBytes);
    console.log("Request Fulfilled!");

    // 4. Check VinaLib Logs
    // VinaLib logs array
    // logs(0)
    try {
        const log = await vinalib.logs(0);
        console.log("Contract Log Content:", log.logContent); // Should be some bytes or string representation
        console.log("Yield Updated!");
    } catch (e) {
        console.log("No logs found (Error?)");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
