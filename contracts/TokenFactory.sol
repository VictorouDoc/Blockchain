// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RealEstateToken.sol";
import "./PropertyNFT.sol";

/**
 * @title TokenFactory
 * @dev Factory contract to deploy ERC20 and ERC721 tokens
 * Simple version without clones for guaranteed compatibility
 */
contract TokenFactory {
    // Events
    event ERC20Created(address indexed creator, address indexed tokenAddress, string name, string symbol, uint256 initialSupply);
    event ERC721Created(address indexed creator, address indexed nftAddress, string name, string symbol);

    // Track deployed tokens
    address[] public deployedERC20s;
    address[] public deployedERC721s;

    // Mapping user -> deployed tokens
    mapping(address => address[]) public userERC20s;
    mapping(address => address[]) public userERC721s;

    // KYC Registry address (required for all deployments)
    address public kycRegistry;

    constructor(address _kycRegistry) {
        require(_kycRegistry != address(0), "Factory: invalid KYC registry");
        kycRegistry = _kycRegistry;
    }

    /**
     * @dev Deploy a new ERC20 token (RealEstateToken)
     * @param name Token name
     * @param symbol Token symbol
     * @param propertyAddress Physical address of the property
     * @param propertyValue Value of the property in USD
     * @param totalShares Total number of shares (tokens)
     * @return address of deployed token
     */
    function createERC20(
        string memory name,
        string memory symbol,
        string memory propertyAddress,
        uint256 propertyValue,
        uint256 totalShares
    ) external returns (address) {
        require(bytes(name).length > 0, "Factory: name required");
        require(bytes(symbol).length > 0, "Factory: symbol required");
        require(bytes(propertyAddress).length > 0, "Factory: property address required");
        require(propertyValue > 0, "Factory: property value must be > 0");
        require(totalShares > 0, "Factory: total shares must be > 0");

        // Deploy new RealEstateToken
        RealEstateToken newToken = new RealEstateToken(
            name,
            symbol,
            kycRegistry,
            propertyAddress,
            propertyValue,
            totalShares
        );

        address tokenAddress = address(newToken);

        // Track deployment
        deployedERC20s.push(tokenAddress);
        userERC20s[msg.sender].push(tokenAddress);

        emit ERC20Created(msg.sender, tokenAddress, name, symbol, totalShares);

        return tokenAddress;
    }

    /**
     * @dev Deploy a new ERC721 NFT collection (PropertyNFT)
     * @param name Collection name
     * @param symbol Collection symbol
     * @return address of deployed NFT contract
     *
     * Note: Name and symbol are ignored because PropertyNFT has hardcoded values
     * This is kept for interface compatibility
     */
    function createERC721(
        string memory name,
        string memory symbol
    ) external returns (address) {
        require(bytes(name).length > 0, "Factory: name required");
        require(bytes(symbol).length > 0, "Factory: symbol required");

        // Deploy new PropertyNFT (uses hardcoded "Property Certificate" / "PROP")
        PropertyNFT newNFT = new PropertyNFT(kycRegistry);

        address nftAddress = address(newNFT);

        // Track deployment
        deployedERC721s.push(nftAddress);
        userERC721s[msg.sender].push(nftAddress);

        emit ERC721Created(msg.sender, nftAddress, name, symbol);

        return nftAddress;
    }

    /**
     * @dev Get total number of deployed ERC20 tokens
     */
    function getTotalERC20s() external view returns (uint256) {
        return deployedERC20s.length;
    }

    /**
     * @dev Get total number of deployed ERC721 collections
     */
    function getTotalERC721s() external view returns (uint256) {
        return deployedERC721s.length;
    }

    /**
     * @dev Get all ERC20s deployed by a user
     */
    function getUserERC20s(address user) external view returns (address[] memory) {
        return userERC20s[user];
    }

    /**
     * @dev Get all ERC721s deployed by a user
     */
    function getUserERC721s(address user) external view returns (address[] memory) {
        return userERC721s[user];
    }

    /**
     * @dev Get specific deployed ERC20 by index
     */
    function getERC20ByIndex(uint256 index) external view returns (address) {
        require(index < deployedERC20s.length, "Factory: index out of bounds");
        return deployedERC20s[index];
    }

    /**
     * @dev Get specific deployed ERC721 by index
     */
    function getERC721ByIndex(uint256 index) external view returns (address) {
        require(index < deployedERC721s.length, "Factory: index out of bounds");
        return deployedERC721s[index];
    }
}
