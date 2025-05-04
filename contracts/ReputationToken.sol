// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationToken is ERC20, AccessControl {
    bytes32 public constant MINTER_BURNER_ROLE = keccak256("MINTER_BURNER_ROLE");

    constructor(string memory name, string memory symbol, address initialOwner)
        ERC20(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_BURNER_ROLE, initialOwner);
    }

    function mint(address to, uint256 amount) external {
        require(hasRole(MINTER_BURNER_ROLE, msg.sender), "Caller is not a minter");
        require(to != address(0), "ERC20: mint to the zero address");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(hasRole(MINTER_BURNER_ROLE, msg.sender), "Caller is not a burner");
        require(from != address(0), "ERC20: burn from the zero address");
        _burn(from, amount);
    }
}