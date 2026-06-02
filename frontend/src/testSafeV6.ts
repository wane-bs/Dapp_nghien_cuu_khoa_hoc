import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit';
import { ethers, Signer, Provider } from 'ethers';

export class SafeTest {
    private signer: Signer;
    private provider: Provider;

    constructor(signer: Signer, provider: Provider) {
        this.signer = signer;
        this.provider = provider;
    }

    async testDeploy() {
        // Mock ContractNetworks
        const contractNetworks = { '31337': { safeMasterCopyAddress: '', safeProxyFactoryAddress: '', multiSendAddress: '', multiSendCallOnlyAddress: '', fallbackHandlerAddress: '', signMessageLibAddress: '', createCallAddress: '', simulateTxAccessorAddress: '' } };

        const predictedSafe: PredictedSafeProps = {
            safeAccountConfig: {
                owners: ["0x123"],
                threshold: 1
            }
        };

        const safe = await Safe.init({
            provider: window.ethereum as any, // or just a string rpc? Let's use `this.provider`
            signer: "0xprivatekey", // Wait, v6 accepts a private key string for the signer, or perhaps an EIP-1193 provider?
            predictedSafe,
            contractNetworks
        });

        const deploymentTx = await safe.createSafeDeploymentTransaction();
        const address = await safe.getAddress();
        console.log(deploymentTx, address);
    }
}
