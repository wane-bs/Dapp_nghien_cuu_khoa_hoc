// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC4907.sol";

interface IBookAsset is IERC4907 {
    function isVerified(uint256 tokenId) external view returns (bool);

    function verifyForListing(uint256 tokenId) external;

    function markAsRented(uint256 tokenId) external;

    function verifyReturn(uint256 tokenId, bool isDamaged) external;
}
