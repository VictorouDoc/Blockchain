// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./KYCRegistry.sol";


contract PropertyNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;

    KYCRegistry public kycRegistry;
    
    uint256 private _nextTokenId;
    
    struct PropertyMetadata {
        string propertyAddress;
        uint256 surface; // en m²
        uint256 value; // en USD (avec 2 décimales)
        uint256 mintedAt;
        string documentURI; // IPFS hash des documents légaux
    }
    
    mapping(uint256 => PropertyMetadata) public properties;
    
    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string propertyAddress,
        uint256 value
    );
    
    event PropertyMetadataUpdated(uint256 indexed tokenId);

    constructor(
        address _kycRegistry
    ) ERC721("Property Certificate", "PROP") Ownable(msg.sender) {
        require(_kycRegistry != address(0), "PROP: invalid KYC registry");
        kycRegistry = KYCRegistry(_kycRegistry);
    }


    function mintProperty(
        address to,
        string memory _propertyAddress,
        uint256 _surface,
        uint256 _value,
        string memory _documentURI,
        string memory _tokenURI
    ) external onlyOwner returns (uint256) {
        require(kycRegistry.isAuthorized(to), "PROP: recipient not authorized");
        require(bytes(_propertyAddress).length > 0, "PROP: empty address");
        require(_surface > 0, "PROP: invalid surface");
        
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        properties[tokenId] = PropertyMetadata({
            propertyAddress: _propertyAddress,
            surface: _surface,
            value: _value,
            mintedAt: block.timestamp,
            documentURI: _documentURI
        });
        
        emit PropertyMinted(tokenId, to, _propertyAddress, _value);
        
        return tokenId;
    }

    function updatePropertyMetadata(
        uint256 tokenId,
        uint256 _value,
        string memory _documentURI
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "PROP: token does not exist");
        
        PropertyMetadata storage metadata = properties[tokenId];
        metadata.value = _value;
        metadata.documentURI = _documentURI;
        
        emit PropertyMetadataUpdated(tokenId);
    }


    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        

        if (from != address(0)) {
            require(kycRegistry.isAuthorized(from), "PROP: sender not authorized");
        }
        if (to != address(0)) {
            require(kycRegistry.isAuthorized(to), "PROP: recipient not authorized");
        }
        
        return super._update(to, tokenId, auth);
    }


    function getPropertyMetadata(uint256 tokenId) 
        external 
        view 
        returns (PropertyMetadata memory) 
    {
        require(ownerOf(tokenId) != address(0), "PROP: token does not exist");
        return properties[tokenId];
    }


    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }


    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(ownerOf(tokenId) != address(0), "PROP: token does not exist");
        
        string memory uri = super.tokenURI(tokenId);
        
        // Si pas d'URI custom, retourne les données on-chain
        if (bytes(uri).length == 0) {
            PropertyMetadata memory metadata = properties[tokenId];
            return string(abi.encodePacked(
                "data:application/json;base64,",
                _encodeMetadata(tokenId, metadata)
            ));
        }
        
        return uri;
    }

    function _encodeMetadata(uint256 tokenId, PropertyMetadata memory metadata) 
        private 
        pure 
        returns (string memory) 
    {
        //utiliser une vraie lib de base64 encoding si on passe en prod
        return string(abi.encodePacked(
            '{"name":"Property Certificate #',
            tokenId.toString(),
            '","description":"Real Estate Property Certificate","attributes":[',
            '{"trait_type":"Address","value":"', metadata.propertyAddress, '"},',
            '{"trait_type":"Surface","value":"', metadata.surface.toString(), ' m2"},',
            '{"trait_type":"Value","value":"$', (metadata.value / 100).toString(), '"}',
            ']}'
        ));
    }
}
