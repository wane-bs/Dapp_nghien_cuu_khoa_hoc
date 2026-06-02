// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.20;

interface IERC4907 {
    // Sự kiện được emit khi thông tin người thuê thay đổi
    event UpdateUser(
        uint256 indexed tokenId,
        address indexed user,
        uint64 expires
    );

    // Gán quyền sử dụng (user) cho NFT
    // @notice chủ sở hữu hoặc người được ủy quyền mới có thể gọi hàm này
    // @param user địa chỉ người thuê mới
    // @param expires thời điểm hết hạn (timestamp)
    function setUser(uint256 tokenId, address user, uint64 expires) external;

    // Lấy thông tin người thuê hiện tại
    // @param tokenId ID của NFT
    // @return user địa chỉ người thuê (hoặc 0 nếu không có)
    function userOf(uint256 tokenId) external view returns (address user);

    // Lấy thời hạn thuê hiện tại
    // @param tokenId ID của NFT
    // @return expires thời điểm hết hạn
    function userExpires(
        uint256 tokenId
    ) external view returns (uint256 expires);
}
