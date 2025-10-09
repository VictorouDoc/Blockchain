const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenizedAssetPlatform", (m) => {
  // Deploy KYCRegistry
  const kycRegistry = m.contract("KYCRegistry");

  // Deploy RealEstateToken
  const realEstateToken = m.contract("RealEstateToken", [
    "Real Estate Share",
    "RES",
    kycRegistry,
    "123 Avenue des Champs-Élysées, Paris",
    50000000,
    1000
  ]);

  // Deploy PropertyNFT
  const propertyNFT = m.contract("PropertyNFT", [kycRegistry]);

  return { kycRegistry, realEstateToken, propertyNFT };
});
