// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address initialOwner)
        ERC20(name, symbol)
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external {
        require(msg.sender == owner(), "Only owner can call this function");
        require(to != address(0), "ERC20: mint to the zero address");
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (to == address(0)) {
            revert("ERC20: transfer to the zero address");
        }
        if (from != address(0) && balanceOf(from) < amount) {
            revert("ERC20: transfer amount exceeds balance");
        }
        super._update(from, to, amount);
    }
}