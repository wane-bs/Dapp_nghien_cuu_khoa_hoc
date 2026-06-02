const { ethers } = require("hardhat");

async function main() {
    // 1. Deploy Functions Router Mock
    const RouterMock = await ethers.getContractFactory("FunctionsRouterMock");
    const router = await RouterMock.deploy();
    await router.waitForDeployment();
    console.log("Local Functions Router deployed at:", router.target);

    // 2. Deploy Smart Contract chính của dự án, trỏ vào Router Mock
    const VinaLib = await ethers.getContractFactory("VinaLibVault");
    const vinalib = await VinaLib.deploy(router.target);
    await vinalib.waitForDeployment();
    console.log("VinaLibVault deployed at:", vinalib.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
