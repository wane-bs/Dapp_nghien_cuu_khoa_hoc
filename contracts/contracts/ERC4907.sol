// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC4907.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract ERC4907 is ERC721, IERC4907 {
    struct UserInfo {
        address user; // Địa chỉ người thuê
        uint64 expires; // Thời điểm hết hạn
    }

    mapping(uint256 => UserInfo) internal _users;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {}

    /// @notice Gán địa chỉ người thuê cho NFT
    /// @dev Throws nếu người gọi không phải owner hoặc được approved
    function setUser(
        uint256 tokenId,
        address user,
        uint64 expires
    ) public virtual override {
        // Yêu cầu logic kiểm tra quyền (Override từ ERC721)
        // require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        // OpenZeppelin v5 thay đổi cách check, tạm thời dùng ownerOf để check đơn giản

        address owner = ownerOf(tokenId);
        require(
            owner == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(owner, msg.sender),
            "ERC4907: caller is not owner nor approved"
        );

        UserInfo storage info = _users[tokenId];
        info.user = user;
        info.expires = expires;
        emit UpdateUser(tokenId, user, expires);
    }

    /// @notice Lấy địa chỉ người thuê
    function userOf(
        uint256 tokenId
    ) public view virtual override returns (address) {
        if (uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        }
        return address(0);
    }

    /// @notice Lấy thời hạn người thuê
    function userExpires(
        uint256 tokenId
    ) public view virtual override returns (uint256) {
        return _users[tokenId].expires;
    }

    /// @dev Override supportsInterface để hỗ trợ 0xad097b5c (IERC4907)
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC4907).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
