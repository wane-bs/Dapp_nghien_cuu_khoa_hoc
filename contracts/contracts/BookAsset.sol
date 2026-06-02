// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC4907.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Contract NFT đại diện cho Tài sản Sách (Có thể cho thuê)
// Tuân thủ QUY_LUAT_TOI_CAO.md Section 3: ERC-4907 + Book Verification

error TokenDoesNotExist();
error NotPendingVerification();
error BookNotVerified();
error NotAuthorized();
error BookNotVerifiedForRent();
error BookNotRented();
error NotOwnerNorApprovedNorRentalContract();

contract BookAsset is ERC4907, Ownable, Pausable {
    uint256 private _nextTokenId;

    // --- Book Status Management (Admin Verification) ---
    // Theo yêu cầu: Admin xác nhận tình trạng sách trước niêm yết/thuê/trả
    enum BookStatus {
        PendingVerification, // Chờ Admin xác nhận
        Verified, // Đã xác nhận, sẵn sàng cho thuê
        Rented, // Đang được thuê
        Returned // Đã trả, chờ verify lại
    }

    mapping(uint256 => BookStatus) public bookStatuses;
    mapping(uint256 => string) public tokenCIDs;

    address public rentalContract;

    function setRentalContract(address _addr) external onlyOwner {
        rentalContract = _addr;
    }

    // Verification metadata
    mapping(uint256 => uint256) public lastVerifiedAt;
    mapping(uint256 => address) public lastVerifiedBy;

    // Events cho Verification
    event BookVerified(
        uint256 indexed tokenId,
        address verifier,
        BookStatus newStatus,
        uint256 timestamp
    );
    event BookStatusChanged(
        uint256 indexed tokenId,
        BookStatus oldStatus,
        BookStatus newStatus
    );

    constructor() ERC4907("VinaLib Book Asset", "VBA") Ownable(msg.sender) {}

    // Tạo mới một sách (Asset) - Status mặc định là PendingVerification
    // @param to địa chỉ nhận
    // @param cid IPFS Content ID của ảnh bìa/metadata
    function safeMint(address to, string memory cid) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        tokenCIDs[tokenId] = cid;
        bookStatuses[tokenId] = BookStatus.PendingVerification;

        emit BookStatusChanged(
            tokenId,
            BookStatus.PendingVerification,
            BookStatus.PendingVerification
        );
    }

    // --- Admin Verification Functions ---

    // Xác nhận sách MỚI đủ điều kiện niêm yết (Admin only)
    function verifyForListing(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        if (bookStatuses[tokenId] != BookStatus.PendingVerification)
            revert NotPendingVerification();

        BookStatus oldStatus = bookStatuses[tokenId];
        bookStatuses[tokenId] = BookStatus.Verified;
        lastVerifiedAt[tokenId] = block.timestamp;
        lastVerifiedBy[tokenId] = msg.sender;

        emit BookVerified(
            tokenId,
            msg.sender,
            BookStatus.Verified,
            block.timestamp
        );
        emit BookStatusChanged(tokenId, oldStatus, BookStatus.Verified);
    }

    // Xác nhận tình trạng sách TRƯỚC KHI cho thuê (Admin only)
    // Trả về true nếu sách đã Verified và chưa hết hạn verification
    function verifyPreRent(uint256 tokenId) external onlyOwner returns (bool) {
        if (bookStatuses[tokenId] != BookStatus.Verified)
            revert BookNotVerified();

        // Update verification timestamp
        lastVerifiedAt[tokenId] = block.timestamp;
        lastVerifiedBy[tokenId] = msg.sender;

        emit BookVerified(
            tokenId,
            msg.sender,
            BookStatus.Verified,
            block.timestamp
        );
        return true;
    }

    // Đánh dấu sách đang được thuê (Called by Vault sau createRental)
    function markAsRented(uint256 tokenId) external {
        if (msg.sender != owner() && msg.sender != rentalContract)
            revert NotAuthorized();
        if (bookStatuses[tokenId] != BookStatus.Verified)
            revert BookNotVerifiedForRent();

        BookStatus oldStatus = bookStatuses[tokenId];
        bookStatuses[tokenId] = BookStatus.Rented;

        emit BookStatusChanged(tokenId, oldStatus, BookStatus.Rented);
    }

    // Xác nhận sách đã trả và verify tình trạng (Admin only or Vault)
    function verifyReturn(uint256 tokenId, bool isDamaged) external {
        if (msg.sender != owner() && msg.sender != rentalContract)
            revert NotAuthorized();
        if (bookStatuses[tokenId] != BookStatus.Rented) revert BookNotRented();

        BookStatus oldStatus = bookStatuses[tokenId];
        // Nếu hư hại, để PendingVerification để admin kiểm tra thêm
        // Nếu không hư hại, đặt thẳng Verified để có thể thuê lại
        bookStatuses[tokenId] = isDamaged
            ? BookStatus.PendingVerification
            : BookStatus.Verified;
        lastVerifiedAt[tokenId] = block.timestamp;
        lastVerifiedBy[tokenId] = msg.sender;

        emit BookVerified(
            tokenId,
            msg.sender,
            bookStatuses[tokenId],
            block.timestamp
        );
        emit BookStatusChanged(tokenId, oldStatus, bookStatuses[tokenId]);
    }

    // --- Query Functions ---

    function isVerified(uint256 tokenId) external view returns (bool) {
        return bookStatuses[tokenId] == BookStatus.Verified;
    }

    function getBookStatus(uint256 tokenId) external view returns (BookStatus) {
        return bookStatuses[tokenId];
    }

    // Ghi đè Base URI nếu cần (ví dụ trỏ đến IPFS)
    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/";
    }

    // Trả về URI của Token (BaseURI + CID)
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory cid = tokenCIDs[tokenId];
        return string.concat(_baseURI(), cid);
    }

    // --- Pausable Logic ---
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Override _update to check whenNotPaused
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }

    // Override setUser to allow Rental Contract
    function setUser(
        uint256 tokenId,
        address user,
        uint64 expires
    ) public override {
        // Allow Owner OR Rental Contract
        address owner = ownerOf(tokenId);
        if (
            owner != msg.sender &&
            getApproved(tokenId) != msg.sender &&
            !isApprovedForAll(owner, msg.sender) &&
            msg.sender != rentalContract
        ) revert NotOwnerNorApprovedNorRentalContract();

        // Copy logic from ERC4907 since we cannot call super.setUser if we want to bypass checks
        // But since we are overriding, we just perform the logic
        // NOTE: We could call super.setUser IF we could satisfy its require.
        // But ERC4907.setUser has strict require.
        // So we Must duplicate logic or use internal helper if available.
        // ERC4907 has internal _users mapping. It IS internal.
        // So we can write to it.

        UserInfo storage info = _users[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId, user, expires);
    }
}
