// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Contract SBT Đại diện cho Hợp đồng Thuê đã ký
// Soulbound: Không thể chuyển nhượng (Transfer)
contract RentalAgreementSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor()
        ERC721("Rental Agreement License", "RAL")
        Ownable(msg.sender)
    {}

    // Mapping từ TokenID sang Hash của điều khoản hợp đồng
    mapping(uint256 => bytes32) public rentalTerms;

    address public rentalContract;

    function setRentalContract(address _addr) external onlyOwner {
        rentalContract = _addr;
    }

    function safeMint(address to, bytes32 termsHash) public {
        require(
            msg.sender == owner() || msg.sender == rentalContract,
            "Not authorized"
        );
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        rentalTerms[tokenId] = termsHash;
    }

    // Hàm hook chặn chuyển nhượng (Soulbound Logic)
    // OpenZeppelin v5 dùng _update thay cho _beforeTokenTransfer
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Nếu from != address(0) (không phải mint) và to != address(0) (không phải burn)
        // Thì chặn chuyển nhượng
        if (from != address(0) && to != address(0)) {
            revert("SBT: Token is Soulbound and cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }
}
