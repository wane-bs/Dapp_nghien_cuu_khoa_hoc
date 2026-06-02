import Safe, { SafeAccountConfig, PredictedSafeProps } from '@safe-global/protocol-kit';
import { ethers, Signer, Provider, Contract } from 'ethers';
import safeDeployments from './safe_deployments.json';
import { CONTRACT_ADDRESSES, VinaLibVaultABI } from './config';

// Interface representing a proposed Safe transaction for our local mock DApp
export interface LocalSafeTx {
    id: string; // unique ID
    safeAddress: string;
    to: string;
    value: string;
    data: string;
    threshold: number;
    signatures: { signer: string; data: string }[];
    executed: boolean;
    description: string;
}

export class SafeService {
    private signer: Signer;
    private provider: Provider;

    constructor(signer: Signer) {
        this.signer = signer;
        if (!signer.provider) throw new Error('Signer missing provider');
        this.provider = signer.provider;
    }

    /**
     * Set up local Safe configuration
     */
    private getSafeConfig(safeAddress: string) {
        return {
            provider: (window as any).ethereum || 'http://127.0.0.1:8545', // Use injected provider or local rpc
            // In v6, Safe handles signing via EIP-1193 directly or private key
            safeAddress,
            contractNetworks: {
                '31337': { // Hardhat chain ID
                    safeMasterCopyAddress: safeDeployments.safeMasterCopyAddress,
                    safeProxyFactoryAddress: safeDeployments.safeProxyFactoryAddress,
                    multiSendAddress: safeDeployments.multiSendAddress,
                    multiSendCallOnlyAddress: safeDeployments.multiSendCallOnlyAddress,
                    fallbackHandlerAddress: safeDeployments.fallbackHandlerAddress,
                    signMessageLibAddress: safeDeployments.signMessageLibAddress,
                    createCallAddress: safeDeployments.createCallAddress,
                    safeMasterCopyAbi: '',
                    safeProxyFactoryAbi: '',
                    multiSendAbi: '',
                    multiSendCallOnlyAbi: '',
                    fallbackHandlerAbi: '',
                    signMessageLibAbi: '',
                    createCallAbi: ''
                }
            }
        };
    }

    /**
     * Inits a connected Safe instance
     * Note: In local Hardhat network without real Safe deployments, this will throw "SafeProxy contract is not deployed".
     * For local demo, we mock the Safe behavior below.
     */
    async getSafe(safeAddress: string): Promise<Safe | null> {
        try {
            const config = this.getSafeConfig(safeAddress);
            return await Safe.init(config as any);
        } catch (e) {
            console.warn("Could not init Safe SDK, using mock fallback", e);
            return null;
        }
    }

    /**
     * Propose a transaction (e.g., admin calling verifyForListing)
     * For demo purposes, we return a mock LocalSafeTx object.
     */
    async proposeTransaction(safeAddress: string, to: string, data: string, description: string): Promise<LocalSafeTx> {
        let threshold = 1; // Default mock threshold to 1 for easy testing

        try {
            const safe = await this.getSafe(safeAddress);
            if (safe) {
                threshold = await safe.getThreshold();
            }
        } catch (e) {
            // ignore
        }

        // We simulate the API service since this is local Hardhat node
        const txId = Date.now().toString();

        const proposedTx: LocalSafeTx = {
            id: txId,
            safeAddress,
            to,
            value: "0",
            data,
            threshold,
            signatures: [],
            executed: false,
            description
        };

        return proposedTx;
    }

    /**
     * Sign an existing transaction proposal
     */
    async signTransaction(safeAddress: string, proposal: LocalSafeTx): Promise<LocalSafeTx> {
        try {
            const safe = await this.getSafe(safeAddress);
            if (safe) {
                const safeTransactionData = {
                    to: proposal.to,
                    value: proposal.value,
                    data: proposal.data
                };
                const safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] });
                await safe.signTransaction(safeTransaction);
            }
        } catch (e) {
            console.warn("Mocking signTransaction locally.");
        }

        // In a real app, you would submit `signedTx` payload to the Transaction Service.
        // Here, we'll extract the newest signature and append it to our local model
        const signerAddress = await this.signer.getAddress();
        const existingSigs = proposal.signatures.map(s => s.signer);

        if (!existingSigs.includes(signerAddress)) {
            // For purely mockup local execution, we just store that the user signed it.
            proposal.signatures.push({
                signer: signerAddress,
                data: "mock_signature_data"
            });
        }

        return proposal;
    }

    /**
     * Execute a fully signed transaction
     */
    async executeTransaction(safeAddress: string, proposal: LocalSafeTx) {
        try {
            const safe = await this.getSafe(safeAddress);
            if (safe) {
                const safeTransactionData = {
                    to: proposal.to,
                    value: proposal.value,
                    data: proposal.data
                };
                let safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] });
                safeTransaction = await safe.signTransaction(safeTransaction);
                const executeTxResponse = await safe.executeTransaction(safeTransaction);
                await (executeTxResponse.transactionResponse as any)?.wait?.();
                proposal.executed = true;
                return proposal;
            }
        } catch (e) {
            console.warn("Mocking executeTransaction locally by invoking signer directly.");
        }

        // Fallback: Direct execution by signer
        const txResponse = await this.signer.sendTransaction({
            to: proposal.to,
            value: proposal.value,
            data: proposal.data
        });
        await txResponse.wait();

        proposal.executed = true;
        return proposal;
    }

    /**
     * Factory: Create a new Safe for test Admins
     */
    async deployNewSafe(owners: string[], threshold: number): Promise<string> {
        const safeAccountConfig: SafeAccountConfig = {
            owners,
            threshold,
        };

        const predictedSafe: PredictedSafeProps = {
            safeAccountConfig
        };

        const config = {
            provider: (window as any).ethereum || 'http://127.0.0.1:8545',
            predictedSafe,
            contractNetworks: this.getSafeConfig('').contractNetworks
        };

        const safe = await Safe.init(config as any);
        return await safe.getAddress();
    }
}
