// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Token Tiện ích SuChin (SUC)
// Logic/Utility Token (Traceability & Rewards ONLY - NO Payment Settlement)
// WARNING: This token must NOT be used for financial settlement (VND replacement).
contract SuChinToken is ERC20, Ownable {
    constructor() ERC20("SuChin Token", "SUC") Ownable(msg.sender) {
        // Mint số lượng ban đầu cho người tạo (deployer)
        // 1 triệu token
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Hàm mint thêm token (Chỉ dành cho môi trường Test/Dev)
    // Trong thực tế sẽ cần cơ chế chặt chẽ hơn
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
