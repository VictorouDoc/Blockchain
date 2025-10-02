// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./KYCRegistry.sol";

/**
 * @title RealEstateToken
 * @dev Token ERC20 représentant des parts d'un bien immobilier
 * Seules les adresses whitelistées peuvent détenir et échanger ces tokens
 */
contract RealEstateToken is ERC20, Ownable {
    KYCRegistry public kycRegistry;
    

    string public propertyAddress;
    uint256 public propertyValue;
    uint256 public totalShares; 
    
 
    address public priceOracle;
    
    event PropertyDetailsUpdated(string propertyAddress, uint256 propertyValue);
    event OracleUpdated(address indexed newOracle);

    constructor(
        string memory name,
        string memory symbol,
        address _kycRegistry,
        string memory _propertyAddress,
        uint256 _propertyValue,
        uint256 _totalShares
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_kycRegistry != address(0), "RES: invalid KYC registry");
        require(_totalShares > 0, "RES: total shares must be positive");
        
        kycRegistry = KYCRegistry(_kycRegistry);
        propertyAddress = _propertyAddress;
        propertyValue = _propertyValue;
        totalShares = _totalShares;
        
        // Mint tous les tokens au créateur (qui doit être whitelisté)
        _mint(msg.sender, _totalShares * 10**decimals());
    }


    function _update(address from, address to, uint256 value) internal virtual override {

        if (from != address(0)) {
            require(kycRegistry.isAuthorized(from), "RES: sender not authorized");
        }
        if (to != address(0)) {
            require(kycRegistry.isAuthorized(to), "RES: recipient not authorized");
        }
        
        super._update(from, to, value);
    }


    function updatePropertyDetails(
        string memory _propertyAddress,
        uint256 _propertyValue
    ) external onlyOwner {
        propertyAddress = _propertyAddress;
        propertyValue = _propertyValue;
        emit PropertyDetailsUpdated(_propertyAddress, _propertyValue);
    }


    function setOracle(address _oracle) external onlyOwner {
        priceOracle = _oracle;
        emit OracleUpdated(_oracle);
    }


    function pricePerToken() public view returns (uint256) {
        return propertyValue / totalShares;
    }


    function mint(address to, uint256 amount) external onlyOwner {
        require(kycRegistry.isAuthorized(to), "RES: recipient not authorized");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}