// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleTokenFactory
 * @dev Factory to deploy simple ERC20 and ERC721 tokens without KYC enforcement
 * This is a simplified version for guaranteed compatibility
 */
contract SimpleTokenFactory {
    // Events
    event ERC20Created(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply
    );
    event ERC721Created(
        address indexed creator,
        address indexed nftAddress,
        string name,
        string symbol
    );

    // Track deployed tokens
    address[] public deployedERC20s;
    address[] public deployedERC721s;

    mapping(address => address[]) public userERC20s;
    mapping(address => address[]) public userERC721s;

    /**
     * @dev Deploy a simple ERC20 token
     */
    function createERC20(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) external returns (address) {
        require(bytes(name).length > 0, "Factory: name required");
        require(bytes(symbol).length > 0, "Factory: symbol required");
        require(totalSupply > 0, "Factory: supply must be > 0");

        SimpleERC20 newToken = new SimpleERC20(name, symbol, totalSupply, msg.sender);
        address tokenAddress = address(newToken);

        deployedERC20s.push(tokenAddress);
        userERC20s[msg.sender].push(tokenAddress);

        emit ERC20Created(msg.sender, tokenAddress, name, symbol, totalSupply);

        return tokenAddress;
    }

    /**
     * @dev Deploy a simple ERC721 NFT collection
     */
    function createERC721(
        string memory name,
        string memory symbol
    ) external returns (address) {
        require(bytes(name).length > 0, "Factory: name required");
        require(bytes(symbol).length > 0, "Factory: symbol required");

        SimpleERC721 newNFT = new SimpleERC721(name, symbol, msg.sender);
        address nftAddress = address(newNFT);

        deployedERC721s.push(nftAddress);
        userERC721s[msg.sender].push(nftAddress);

        emit ERC721Created(msg.sender, nftAddress, name, symbol);

        return nftAddress;
    }

    function getUserERC20s(address user) external view returns (address[] memory) {
        return userERC20s[user];
    }

    function getUserERC721s(address user) external view returns (address[] memory) {
        return userERC721s[user];
    }
}

/**
 * @title SimpleERC20
 * @dev Basic ERC20 token without KYC
 */
contract SimpleERC20 is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        _mint(creator, totalSupply * 10**18);
    }
}

/**
 * @title SimpleERC721
 * @dev Basic ERC721 NFT collection
 */
contract SimpleERC721 is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor(
        string memory name,
        string memory symbol,
        address creator
    ) ERC721(name, symbol) Ownable(creator) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
