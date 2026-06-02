import { ethers } from 'ethers';

// Types
export interface BlockInfo {
    number: number;
    hash: string;
    timestamp: number;
    transactions: number;
    gasUsed: string;
    gasLimit: string;
    miner: string;
}

export interface TxInfo {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    blockNumber: number;
    timestamp?: number;
    status?: number | null; // 1 success, 0 failure
    gasPrice?: string;
    gasUsed?: string;
    input?: string;
}

export interface EventInfo {
    name: string;
    signature: string;
    blockNumber: number;
    transactionHash: string;
    args: Record<string, any>;
    timestamp?: number;
}

// Minimal ABI for Events we care about (Strict Compliance)
const EVENT_ABI = [
    "event BookVerified(uint256 indexed tokenId, address verifier, uint8 newStatus, uint256 timestamp)",
    "event BookStatusChanged(uint256 indexed tokenId, uint8 oldStatus, uint8 newStatus)",
    "event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export const RPC_URL = "http://127.0.0.1:8545";

class ExplorerService {
    private provider: ethers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
    }

    public async isConnected(): Promise<boolean> {
        try {
            await this.provider.getNetwork();
            return true;
        } catch (e) {
            return false;
        }
    }

    public async getNetworkStats() {
        const blockNum = await this.provider.getBlockNumber();
        const feeData = await this.provider.getFeeData();
        const gasPriceInGwei = feeData.gasPrice
            ? ethers.formatUnits(feeData.gasPrice, 'gwei')
            : '0';

        return {
            blockNumber: blockNum,
            gasPrice: parseFloat(gasPriceInGwei).toFixed(2)
        };
    }

    public async getRecentBlocks(limit: number = 5): Promise<BlockInfo[]> {
        const currentBlock = await this.provider.getBlockNumber();
        const startBlock = currentBlock;
        const endBlock = Math.max(0, currentBlock - limit + 1);

        const blocks: BlockInfo[] = [];

        for (let i = startBlock; i >= endBlock; i--) {
            const block = await this.provider.getBlock(i, false);
            if (block) {
                blocks.push({
                    number: block.number,
                    hash: block.hash || '',
                    timestamp: block.timestamp,
                    transactions: block.transactions.length,
                    gasUsed: block.gasUsed.toString(),
                    gasLimit: block.gasLimit.toString(),
                    miner: block.miner
                });
            }
        }
        return blocks;
    }

    public async getRecentTxs(limit: number = 10): Promise<TxInfo[]> {
        const currentBlock = await this.provider.getBlockNumber();
        const txs: TxInfo[] = [];

        // Scan backwards until we have enough txs or hit safety limit
        // Since this is for a local generic chain, we scan a few blocks
        let scanBlock = currentBlock;
        const safetyLimit = Math.max(0, currentBlock - 20); // Only scan last 20 blocks max for homepage

        while (txs.length < limit && scanBlock >= safetyLimit) {
            const block = await this.provider.getBlock(scanBlock, true);
            if (block && block.prefetchedTransactions) {
                // Add transactions from this block (reversed to show newest first from within block if needed, though block iteration is already usually enough)
                const blockTxs = [...block.prefetchedTransactions].reverse();

                for (const tx of blockTxs) {
                    if (txs.length >= limit) break;
                    txs.push({
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        value: ethers.formatEther(tx.value),
                        blockNumber: block.number,
                        timestamp: block.timestamp
                    });
                }
            }
            scanBlock--;
        }

        return txs;
    }

    public async getBlock(blockNumberOrHash: string | number): Promise<BlockInfo & { rawTxs: string[] } | null> {
        try {
            let query = blockNumberOrHash;
            // Ethers v6 requires block numbers to be actual Numbers or Hex Strings
            // If it's a decimal string (e.g. "123"), convert to number
            if (typeof query === 'string' && /^\d+$/.test(query)) {
                query = parseInt(query, 10);
            }

            const block = await this.provider.getBlock(query, false);
            if (!block) return null;

            return {
                number: block.number,
                hash: block.hash || '',
                timestamp: block.timestamp,
                transactions: block.transactions.length,
                gasUsed: block.gasUsed.toString(),
                gasLimit: block.gasLimit.toString(),
                miner: block.miner,
                rawTxs: [...block.transactions] // Copy readonly array
            };
        } catch (e) {
            console.error("Get Block Error", e);
            return null;
        }
    }

    public async getTransaction(hash: string): Promise<TxInfo | null> {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) return null;

            const receipt = await this.provider.getTransactionReceipt(hash);
            const block = tx.blockNumber ? await this.provider.getBlock(tx.blockNumber) : null;

            return {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: ethers.formatEther(tx.value),
                blockNumber: tx.blockNumber || 0,
                timestamp: block?.timestamp,
                status: receipt?.status,
                gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
                gasUsed: receipt?.gasUsed.toString(),
                input: tx.data
            };
        } catch (e) {
            console.error("Get Tx Error", e);
            return null;
        }
    }

    public async getAddressInfo(address: string) {
        try {
            const balance = await this.provider.getBalance(address);
            const code = await this.provider.getCode(address);
            const txCount = await this.provider.getTransactionCount(address);

            return {
                address,
                balance: ethers.formatEther(balance),
                isContract: code !== '0x',
                txCount
            };
        } catch (e) {
            console.error("Get Address Error", e);
            return null;
        }
    }

    public async getRecentEvents(limit: number = 20): Promise<EventInfo[]> {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 100); // Scan last 100 blocks

            // 1. Fetch Logs
            const logs = await this.provider.getLogs({
                fromBlock,
                toBlock: 'latest'
            });

            // 2. Decode with Interface
            const iface = new ethers.Interface(EVENT_ABI);
            const decodedEvents: EventInfo[] = [];

            // We need block timestamps, so we might need to fetch blocks if not cached
            // For simple view, we'll fetch explicitly or approximate.
            // Be efficient: fetch unique blocks.
            const blockCache = new Map<number, number>();

            // Reverse to show newest first
            for (const log of logs.reverse()) {
                if (decodedEvents.length >= limit) break;

                try {
                    const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
                    if (parsed) {
                        // Fetch timestamp (naive generic fetch)
                        let timestamp = 0;
                        if (blockCache.has(log.blockNumber)) {
                            timestamp = blockCache.get(log.blockNumber)!;
                        } else {
                            const block = await this.provider.getBlock(log.blockNumber);
                            timestamp = block?.timestamp || 0;
                            blockCache.set(log.blockNumber, timestamp);
                        }

                        // Clean Args (Convert BigInt to String for UI)
                        const args: Record<string, string> = {};
                        parsed.fragment.inputs.forEach((input, index) => {
                            const val = parsed.args[index];
                            args[input.name] = (typeof val === 'bigint') ? val.toString() : val;
                        });

                        decodedEvents.push({
                            name: parsed.name,
                            signature: parsed.signature,
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            args: args,
                            timestamp: timestamp
                        });
                    }
                } catch (e) {
                    // Ignore logs that don't match our ABI (e.g. internal unrelated events)
                }
            }

            return decodedEvents;
        } catch (e) {
            console.error("Get Events Error", e);
            return [];
        }
    }

    // ============================================
    // ON-CHAIN DATA QUERY METHODS
    // ============================================

    /**
     * Query Book NFT information from BookAsset contract
     */
    public async getBookAssetInfo(contractAddress: string, tokenId: number): Promise<BookAssetInfo | null> {
        try {
            const abi = [
                "function ownerOf(uint256 tokenId) view returns (address)",
                "function tokenCIDs(uint256 tokenId) view returns (string)",
                "function getBookStatus(uint256 tokenId) view returns (uint8)",
                "function isVerified(uint256 tokenId) view returns (bool)",
                "function userOf(uint256 tokenId) view returns (address)",
                "function userExpires(uint256 tokenId) view returns (uint256)",
                "function lastVerifiedAt(uint256 tokenId) view returns (uint256)",
                "function lastVerifiedBy(uint256 tokenId) view returns (address)"
            ];

            const contract = new ethers.Contract(contractAddress, abi, this.provider);

            const [owner, cid, status, isVerified, user, userExpires, lastVerifiedAt, lastVerifiedBy] = await Promise.all([
                contract.ownerOf(tokenId).catch(() => null),
                contract.tokenCIDs(tokenId).catch(() => ''),
                contract.getBookStatus(tokenId).catch(() => 0),
                contract.isVerified(tokenId).catch(() => false),
                contract.userOf(tokenId).catch(() => ethers.ZeroAddress),
                contract.userExpires(tokenId).catch(() => BigInt(0)),
                contract.lastVerifiedAt(tokenId).catch(() => BigInt(0)),
                contract.lastVerifiedBy(tokenId).catch(() => ethers.ZeroAddress)
            ]);

            if (!owner) return null;

            return {
                tokenId,
                owner,
                cid,
                status: Number(status),
                isVerified,
                user: user === ethers.ZeroAddress ? null : user,
                userExpires: Number(userExpires),
                lastVerifiedAt: Number(lastVerifiedAt),
                lastVerifiedBy: lastVerifiedBy === ethers.ZeroAddress ? null : lastVerifiedBy
            };
        } catch (e) {
            console.error("Get Book Asset Error", e);
            return null;
        }
    }

    /**
     * Query Evidence Pack from VinaLibVault contract
     */
    public async getEvidencePack(contractAddress: string, bookTokenId: number): Promise<EvidencePackInfo | null> {
        try {
            const abi = [
                "function activeRentals(uint256 bookTokenId) view returns (bytes32 termsHash, uint16 version, string pspRef, bytes32 deliveryHash, uint256 timestamp, address renter, uint8 status)"
            ];

            const contract = new ethers.Contract(contractAddress, abi, this.provider);
            const rental = await contract.activeRentals(bookTokenId);

            // Check if rental exists (termsHash != 0)
            if (rental.termsHash === ethers.ZeroHash) return null;

            return {
                bookTokenId,
                termsHash: rental.termsHash,
                version: Number(rental.version),
                pspRef: rental.pspRef,
                deliveryHash: rental.deliveryHash,
                timestamp: Number(rental.timestamp),
                renter: rental.renter,
                status: Number(rental.status)
            };
        } catch (e) {
            console.error("Get Evidence Pack Error", e);
            return null;
        }
    }

    /**
     * Query Rental SBT information
     */
    public async getRentalSBTInfo(contractAddress: string, tokenId: number): Promise<RentalSBTInfo | null> {
        try {
            const abi = [
                "function ownerOf(uint256 tokenId) view returns (address)",
                "function rentalTerms(uint256 tokenId) view returns (bytes32)"
            ];

            const contract = new ethers.Contract(contractAddress, abi, this.provider);

            const [owner, termsHash] = await Promise.all([
                contract.ownerOf(tokenId).catch(() => null),
                contract.rentalTerms(tokenId).catch(() => ethers.ZeroHash)
            ]);

            if (!owner) return null;

            return {
                tokenId,
                owner,
                termsHash
            };
        } catch (e) {
            console.error("Get Rental SBT Error", e);
            return null;
        }
    }

    /**
     * Query SUC Token balance and info
     */
    public async getSUCTokenInfo(contractAddress: string, address?: string): Promise<SUCTokenInfo | null> {
        try {
            const abi = [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address account) view returns (uint256)"
            ];

            const contract = new ethers.Contract(contractAddress, abi, this.provider);

            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);

            let balance = null;
            if (address) {
                balance = await contract.balanceOf(address);
            }

            return {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: ethers.formatUnits(totalSupply, decimals),
                balance: balance ? ethers.formatUnits(balance, decimals) : null,
                queryAddress: address || null
            };
        } catch (e) {
            console.error("Get SUC Token Error", e);
            return null;
        }
    }
}

// New Types for On-Chain Data
export interface BookAssetInfo {
    tokenId: number;
    owner: string;
    cid: string;
    status: number;
    isVerified: boolean;
    user: string | null;
    userExpires: number;
    lastVerifiedAt: number;
    lastVerifiedBy: string | null;
}

export interface EvidencePackInfo {
    bookTokenId: number;
    termsHash: string;
    version: number;
    pspRef: string;
    deliveryHash: string;
    timestamp: number;
    renter: string;
    status: number;
}

export interface RentalSBTInfo {
    tokenId: number;
    owner: string;
    termsHash: string;
}

export interface SUCTokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    balance: string | null;
    queryAddress: string | null;
}

export const explorerService = new ExplorerService();

