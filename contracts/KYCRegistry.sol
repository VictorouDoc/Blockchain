// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KYCRegistry
 * @dev Gère la whitelist et blacklist des utilisateurs pour la conformité KYC
 */
contract KYCRegistry is AccessControl {
    bytes32 public constant KYC_OFFICER_ROLE = keccak256("KYC_OFFICER_ROLE");

    // Mapping pour la whitelist
    mapping(address => bool) private _whitelisted;
    
    // Mapping pour la blacklist
    mapping(address => bool) private _blacklisted;

    // Événements
    event AddressWhitelisted(address indexed account, address indexed officer);
    event AddressRemovedFromWhitelist(address indexed account, address indexed officer);
    event AddressBlacklisted(address indexed account, address indexed officer);
    event AddressRemovedFromBlacklist(address indexed account, address indexed officer);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_OFFICER_ROLE, msg.sender);
    }


    function whitelist(address account) external onlyRole(KYC_OFFICER_ROLE) {
        require(account != address(0), "KYC: zero address");
        require(!_blacklisted[account], "KYC: address is blacklisted");
        
        _whitelisted[account] = true;
        emit AddressWhitelisted(account, msg.sender);
    }

    function removeFromWhitelist(address account) external onlyRole(KYC_OFFICER_ROLE) {
        _whitelisted[account] = false;
        emit AddressRemovedFromWhitelist(account, msg.sender);
    }


    function blacklist(address account) external onlyRole(KYC_OFFICER_ROLE) {
        require(account != address(0), "KYC: zero address");
        
        _blacklisted[account] = true;
        _whitelisted[account] = false; // Retire aussi de la whitelist
        
        emit AddressBlacklisted(account, msg.sender);
    }


    function removeFromBlacklist(address account) external onlyRole(KYC_OFFICER_ROLE) {
        _blacklisted[account] = false;
        emit AddressRemovedFromBlacklist(account, msg.sender);
    }


    function isAuthorized(address account) public view returns (bool) {
        return _whitelisted[account] && !_blacklisted[account];
    }


    function isWhitelisted(address account) public view returns (bool) {
        return _whitelisted[account];
    }


    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }


    function batchWhitelist(address[] calldata accounts) external onlyRole(KYC_OFFICER_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0) && !_blacklisted[accounts[i]]) {
                _whitelisted[accounts[i]] = true;
                emit AddressWhitelisted(accounts[i], msg.sender);
            }
        }
    }
}