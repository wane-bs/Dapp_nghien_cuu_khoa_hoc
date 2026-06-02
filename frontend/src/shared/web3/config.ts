export const CONTRACT_ADDRESSES = {
    // Deployed on Hardhat Local Node (Sprint 1)
    BookAsset: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    VinaLibVault: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    RentalAgreementSBT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

export const BookAssetABI = [
    // ERC-721 Read functions (needed by HomePage, LenderDashboard)
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenCIDs(uint256 tokenId) view returns (string)",
    // Write functions
    "function safeMint(address to, string memory cid) public",
    "function verifyForListing(uint256 tokenId) external",
    "function verifyPreRent(uint256 tokenId) external returns (bool)",
    "function markAsRented(uint256 tokenId) external",
    "function verifyReturn(uint256 tokenId, bool isDamaged) external",
    // Read functions
    "function isVerified(uint256 tokenId) external view returns (bool)",
    "function getBookStatus(uint256 tokenId) external view returns (uint8)"
];

export const VinaLibVaultABI = [
    "function createRental(address user, uint256 bookTokenId, uint64 duration, bytes32 termsHash, uint16 version, string memory pspRef, uint256 existingSbtId) external",
    "function requestReturn(uint256 bookTokenId, bytes32 deliveryHash) external",
    "function confirmReturn(uint256 bookTokenId, bool isDamaged, string memory notes) external",
    "function cancelListing(uint256 bookTokenId) external",
    "function claimCollateral(uint256 bookTokenId, string memory reason) external",
    "function calculateRemainingTime(uint256 bookTokenId) external view returns (uint256)",
    "function isAvailable(uint256 bookTokenId) external view returns (bool)",
    "function getRentalInfo(uint256 bookTokenId) external view returns (bytes32 termsHash, bytes32 deliveryHash, address renter, uint16 version, uint8 status, uint256 timestamp, string memory pspRef)"
];

export const RentalAgreementSBTABI = [
    "function safeMint(address to, bytes32 termsHash) public",
    "function rentalTerms(uint256 tokenId) public view returns (bytes32)"
];
