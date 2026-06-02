const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getArtifact(contractPath) {
    const p = path.join(__dirname, "../node_modules/@safe-global/safe-contracts/build/artifacts/contracts/", contractPath);
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    return { abi: data.abi, bytecode: data.bytecode };
}

async function deployContract(wallet, artifactPath) {
    const artifact = getArtifact(artifactPath);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    // Wait for the provider to sync the latest nonce securely
    await delay(1000);
    const nonce = await wallet.provider.getTransactionCount(wallet.address, "pending");

    const tx = await factory.deploy({ nonce });
    await tx.waitForDeployment();
    return await tx.getAddress();
}

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    console.log("Deploying Safe contracts with:", wallet.address);

    const safeAddress = await deployContract(wallet, "Safe.sol/Safe.json");
    console.log("Safe:", safeAddress);

    const factoryAddress = await deployContract(wallet, "proxies/SafeProxyFactory.sol/SafeProxyFactory.json");
    console.log("SafeProxyFactory:", factoryAddress);

    const multiSendAddress = await deployContract(wallet, "libraries/MultiSend.sol/MultiSend.json");
    console.log("MultiSend:", multiSendAddress);

    const multiSendCallOnlyAddress = await deployContract(wallet, "libraries/MultiSendCallOnly.sol/MultiSendCallOnly.json");
    console.log("MultiSendCallOnly:", multiSendCallOnlyAddress);

    const fallbackHandlerAddress = await deployContract(wallet, "handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json");
    console.log("CompatibilityFallbackHandler:", fallbackHandlerAddress);

    const signMessageLibAddress = await deployContract(wallet, "libraries/SignMessageLib.sol/SignMessageLib.json");
    console.log("SignMessageLib:", signMessageLibAddress);

    const createCallAddress = await deployContract(wallet, "libraries/CreateCall.sol/CreateCall.json");
    console.log("CreateCall:", createCallAddress);

    const config = {
        safeMasterCopyAddress: safeAddress,
        safeProxyFactoryAddress: factoryAddress,
        multiSendAddress: multiSendAddress,
        multiSendCallOnlyAddress: multiSendCallOnlyAddress,
        fallbackHandlerAddress: fallbackHandlerAddress,
        signMessageLibAddress: signMessageLibAddress,
        createCallAddress: createCallAddress
    };

    const frontendDir = path.join(__dirname, "../../frontend/src/shared/web3");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(frontendDir, "safe_deployments.json"),
        JSON.stringify(config, null, 2)
    );

    console.log("Done. Saved to frontend safe_deployments.json");
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
