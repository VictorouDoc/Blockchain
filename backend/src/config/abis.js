// Smart Contract ABIs for Real Estate Platform
// These are minimal ABIs - only include events and functions you need

// ==========================================
// RealEstateToken (ERC-20 with KYC)
// ==========================================
const RES_TOKEN_ABI = [
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',

  // View functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // State-changing functions (if needed)
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// ==========================================
// PropertyNFT (ERC-721)
// ==========================================
const PROPERTY_NFT_ABI = [
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  'event PropertyMinted(uint256 indexed tokenId, address indexed owner, string metadataURI)',

  // View functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',

  // State-changing functions
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
];

// ==========================================
// KYCRegistry
// ==========================================
const KYC_REGISTRY_ABI = [
  // Events
  'event AddressWhitelisted(address indexed user, uint256 timestamp)',
  'event AddressRemovedFromWhitelist(address indexed user, uint256 timestamp)',
  'event AddressBlacklisted(address indexed user, uint256 timestamp)',
  'event AddressRemovedFromBlacklist(address indexed user, uint256 timestamp)',

  // View functions
  'function isWhitelisted(address user) view returns (bool)',
  'function isBlacklisted(address user) view returns (bool)',
  'function canTransact(address user) view returns (bool)',

  // Admin functions (if you need to call them)
  'function addToWhitelist(address user)',
  'function removeFromWhitelist(address user)',
  'function addToBlacklist(address user)',
  'function removeFromBlacklist(address user)',
];

// ==========================================
// Uniswap V2 Pair
// ==========================================
const UNISWAP_V2_PAIR_ABI = [
  // Events
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Mint(address indexed sender, uint amount0, uint amount1)',
  'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',

  // View functions
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function price0CumulativeLast() view returns (uint)',
  'function price1CumulativeLast() view returns (uint)',
  'function totalSupply() view returns (uint)',
  'function balanceOf(address) view returns (uint)',
];

// ==========================================
// PriceOracle
// ==========================================
const PRICE_ORACLE_ABI = [
  // Events
  'event PriceUpdated(address indexed token, uint256 price, uint256 timestamp)',

  // View functions
  'function getPrice(address token) view returns (uint256)',
  'function getLatestPrice() view returns (uint256)',
  'function lastUpdateTime() view returns (uint256)',

  // Admin functions (for oracle bot)
  'function updatePrice(uint256 newPrice)',
  'function updatePriceWithToken(address token, uint256 newPrice)',
];

// ==========================================
// Uniswap V2 Factory (optional, for discovering pairs)
// ==========================================
const UNISWAP_V2_FACTORY_ABI = [
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairs(uint) view returns (address pair)',
  'function allPairsLength() view returns (uint)',
];

// ==========================================
// ERC-20 Generic (for any token)
// ==========================================
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

module.exports = {
  RES_TOKEN_ABI,
  PROPERTY_NFT_ABI,
  KYC_REGISTRY_ABI,
  UNISWAP_V2_PAIR_ABI,
  PRICE_ORACLE_ABI,
  UNISWAP_V2_FACTORY_ABI,
  ERC20_ABI,
};
