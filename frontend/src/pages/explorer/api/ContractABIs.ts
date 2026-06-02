// Contract ABIs for On-Chain Data Reading
// Minimal ABI definitions for read-only query functions

// BookAsset.sol - ERC-721 + ERC-4907 Rentable NFT
export const BOOK_ASSET_ABI = [
    // ERC-721 Standard
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",

    // Book Metadata
    "function tokenCIDs(uint256 tokenId) view returns (string)",

    // Book Status (Admin Verification)
    "function getBookStatus(uint256 tokenId) view returns (uint8)",
    "function isVerified(uint256 tokenId) view returns (bool)",
    "function lastVerifiedAt(uint256 tokenId) view returns (uint256)",
    "function lastVerifiedBy(uint256 tokenId) view returns (address)",

    // ERC-4907 Rental Rights
    "function userOf(uint256 tokenId) view returns (address)",
    "function userExpires(uint256 tokenId) view returns (uint256)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event BookVerified(uint256 indexed tokenId, address verifier, uint8 newStatus, uint256 timestamp)",
    "event BookStatusChanged(uint256 indexed tokenId, uint8 oldStatus, uint8 newStatus)",
    "event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires)"
];

// VinaLibVault.sol - Rental Workflow Manager
export const VINALIB_VAULT_ABI = [
    // External contract addresses
    "function bookAssetAddress() view returns (address)",
    "function rentalSBTAddress() view returns (address)",

    // Evidence Pack Query
    "function activeRentals(uint256 bookTokenId) view returns (bytes32 termsHash, uint16 version, string pspRef, bytes32 deliveryHash, uint256 timestamp, address renter, uint8 status)",

    // Events
    "event RentalCreated(address indexed user, uint256 indexed bookId, uint64 expires, bytes32 termsHash, uint16 version, string pspRef)",
    "event ReturnRequested(uint256 indexed bookId, address indexed renter, bytes32 deliveryHash)",
    "event RentalConcluded(uint256 indexed bookId, address indexed renter, uint256 timestamp, bool isDamaged, string notes)"
];

// RentalAgreementSBT.sol - Soulbound Token
export const RENTAL_SBT_ABI = [
    // ERC-721 Standard
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",

    // Rental Terms
    "function rentalTerms(uint256 tokenId) view returns (bytes32)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// SuChinToken.sol - ERC-20 Utility Token
export const SUCHIN_TOKEN_ABI = [
    // ERC-20 Standard
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Book Status Enum (matches BookAsset.sol)
export enum BookStatus {
    PendingVerification = 0,
    Verified = 1,
    Rented = 2,
    Returned = 3
}

// Rental Status Enum (matches VinaLibVault.sol)
export enum RentalStatus {
    Active = 0,
    ReturnRequested = 1,
    Concluded = 2
}

// Helper to get status label
export function getBookStatusLabel(status: number): string {
    switch (status) {
        case BookStatus.PendingVerification: return "Pending Verification";
        case BookStatus.Verified: return "Verified ✅";
        case BookStatus.Rented: return "Rented 📖";
        case BookStatus.Returned: return "Returned 📦";
        default: return "Unknown";
    }
}

export function getRentalStatusLabel(status: number): string {
    switch (status) {
        case RentalStatus.Active: return "Active 🟢";
        case RentalStatus.ReturnRequested: return "Return Requested 🟡";
        case RentalStatus.Concluded: return "Concluded ⚪";
        default: return "Unknown";
    }
}
