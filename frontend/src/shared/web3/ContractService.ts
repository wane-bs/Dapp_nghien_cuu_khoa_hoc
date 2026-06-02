import { Contract, Signer, Provider, ethers } from 'ethers';
import { CONTRACT_ADDRESSES, BookAssetABI, VinaLibVaultABI, RentalAgreementSBTABI } from './config';

export class ContractService {
    private signerOrProvider: Signer | Provider;
    public bookAsset: Contract;
    public vault: Contract;
    public sbt: Contract;

    constructor(signerOrProvider: Signer | Provider) {
        this.signerOrProvider = signerOrProvider;

        this.bookAsset = new Contract(CONTRACT_ADDRESSES.BookAsset, BookAssetABI, signerOrProvider);
        this.vault = new Contract(CONTRACT_ADDRESSES.VinaLibVault, VinaLibVaultABI, signerOrProvider);
        this.sbt = new Contract(CONTRACT_ADDRESSES.RentalAgreementSBT, RentalAgreementSBTABI, signerOrProvider);
    }

    // --- BookAsset Methods ---
    async getBookStatus(tokenId: number) {
        return await this.bookAsset.getBookStatus(tokenId);
    }

    async isBookVerified(tokenId: number) {
        return await this.bookAsset.isVerified(tokenId);
    }

    async mintBook(to: string, cid: string) {
        const tx = await this.bookAsset.safeMint(to, cid);
        return await tx.wait();
    }

    // --- Vault Methods ---
    async createRental(
        user: string,
        bookTokenId: number,
        durationInSecs: number,
        termsHash: string,
        version: number,
        pspRef: string,
        existingSbtId: number
    ) {
        const hashBytes = ethers.hexlify(ethers.toUtf8Bytes(termsHash)).padEnd(66, '0');
        const tx = await this.vault.createRental(
            user,
            bookTokenId,
            durationInSecs,
            hashBytes,
            version,
            pspRef,
            existingSbtId
        );
        return await tx.wait();
    }

    async requestReturn(bookTokenId: number, deliveryHash: string) {
        const hashBytes = ethers.hexlify(ethers.toUtf8Bytes(deliveryHash)).padEnd(66, '0');
        const tx = await this.vault.requestReturn(bookTokenId, hashBytes);
        return await tx.wait();
    }

    async confirmReturn(bookTokenId: number, isDamaged: boolean, notes: string) {
        const tx = await this.vault.confirmReturn(bookTokenId, isDamaged, notes);
        return await tx.wait();
    }

    async getRentalInfo(bookTokenId: number) {
        return await this.vault.getRentalInfo(bookTokenId);
    }
}
