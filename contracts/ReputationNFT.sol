// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    mapping(address => uint256) public reputationScore;  // 0 to 100 score for simplicity
    mapping(address => uint256) public userToken;         // Maps freelancer to their NFT

    constructor() ERC721("Freelancer Reputation", "FREP") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    function mint(address freelancer) external onlyOwner returns (uint256) {
        require(userToken[freelancer] == 0, "Already minted");

        tokenCounter++;
        _safeMint(freelancer, tokenCounter);
        _setTokenURI(tokenCounter, "ipfs://default"); // Placeholder metadata URI
        userToken[freelancer] = tokenCounter;
        reputationScore[freelancer] = 50; // Everyone starts neutral at 50/100
        return tokenCounter;
    }

    function updateReputation(address freelancer, int8 change) external onlyOwner {
        require(userToken[freelancer] != 0, "User has no reputation token");

        if (change > 0) {
            reputationScore[freelancer] += uint8(change);
        } else {
            uint8 penalty = uint8(-change);
            if (reputationScore[freelancer] >= penalty) {
                reputationScore[freelancer] -= penalty;
            } else {
                reputationScore[freelancer] = 0;
            }
        }

        // (Optional Future Work) Update token URI based on reputation score
    }

    function getReputation(address freelancer) external view returns (uint256) {
        return reputationScore[freelancer];
    }
}
