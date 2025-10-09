import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("Smart Contracts Tests", async function () {
  const { viem } = await network.connect();

  it("KYCRegistry: Should whitelist and authorize addresses", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [_, user1] = await viem.getWalletClients();

    // Whitelist user1
    await kycRegistry.write.whitelist([user1.account.address]);

    const isWhitelisted = await kycRegistry.read.isWhitelisted([user1.account.address]);
    const isAuthorized = await kycRegistry.read.isAuthorized([user1.account.address]);

    assert.equal(isWhitelisted, true);
    assert.equal(isAuthorized, true);

    console.log("  ✅ KYCRegistry whitelist test passed");
  });

  it("KYCRegistry: Should blacklist addresses", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [_, user1] = await viem.getWalletClients();

    // Whitelist then blacklist
    await kycRegistry.write.whitelist([user1.account.address]);
    await kycRegistry.write.blacklist([user1.account.address]);

    const isBlacklisted = await kycRegistry.read.isBlacklisted([user1.account.address]);
    const isAuthorized = await kycRegistry.read.isAuthorized([user1.account.address]);

    assert.equal(isBlacklisted, true);
    assert.equal(isAuthorized, false);

    console.log("  ✅ KYCRegistry blacklist test passed");
  });

  it("RealEstateToken: Should deploy with correct parameters", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [deployer] = await viem.getWalletClients();
    await kycRegistry.write.whitelist([deployer.account.address]);

    const token = await viem.deployContract("RealEstateToken", [
      "Real Estate Share",
      "RES",
      kycRegistry.address,
      "123 Champs-Élysées, Paris",
      50000000n,
      1000n
    ]);

    const name = await token.read.name();
    const symbol = await token.read.symbol();
    const propertyAddress = await token.read.propertyAddress();
    const propertyValue = await token.read.propertyValue();

    assert.equal(name, "Real Estate Share");
    assert.equal(symbol, "RES");
    assert.equal(propertyAddress, "123 Champs-Élysées, Paris");
    assert.equal(propertyValue, 50000000n);

    console.log("  ✅ RealEstateToken deployment test passed");
  });

  it("RealEstateToken: Should calculate price per token correctly", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [deployer] = await viem.getWalletClients();
    await kycRegistry.write.whitelist([deployer.account.address]);

    const token = await viem.deployContract("RealEstateToken", [
      "Test Token",
      "TST",
      kycRegistry.address,
      "Test Property",
      100000000n, // $1,000,000
      1000n       // 1000 shares
    ]);

    const pricePerToken = await token.read.pricePerToken();

    assert.equal(pricePerToken, 100000n); // 100,000,000 / 1000

    console.log("  ✅ Price calculation test passed");
  });

  it("RealEstateToken: Should allow transfers between whitelisted users", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [deployer, user1] = await viem.getWalletClients();

    await kycRegistry.write.whitelist([deployer.account.address]);
    await kycRegistry.write.whitelist([user1.account.address]);

    const token = await viem.deployContract("RealEstateToken", [
      "Test Token",
      "TST",
      kycRegistry.address,
      "Test",
      1000000n,
      1000n
    ]);

    const initialBalance = await token.read.balanceOf([deployer.account.address]);
    assert.ok(initialBalance > 0n);

    // Transfer to whitelisted user
    const transferAmount = 10n * 10n ** 18n; // 10 tokens
    await token.write.transfer([user1.account.address, transferAmount]);

    const user1Balance = await token.read.balanceOf([user1.account.address]);
    assert.equal(user1Balance, transferAmount);

    console.log("  ✅ Transfer between whitelisted users test passed");
  });

  it("PropertyNFT: Should mint NFT to whitelisted user", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [_, user1] = await viem.getWalletClients();

    await kycRegistry.write.whitelist([user1.account.address]);

    const nft = await viem.deployContract("PropertyNFT", [kycRegistry.address]);

    await nft.write.mintProperty([
      user1.account.address,
      "123 Champs-Élysées, Paris",
      250n,
      50000000n,
      "ipfs://QmDoc",
      "ipfs://QmToken"
    ]);

    const owner = await nft.read.ownerOf([0n]);
    assert.equal(owner.toLowerCase(), user1.account.address.toLowerCase());

    const metadata = await nft.read.getPropertyMetadata([0n]);
    assert.equal(metadata.propertyAddress, "123 Champs-Élysées, Paris");
    assert.equal(metadata.surface, 250n);
    assert.equal(metadata.value, 50000000n);

    console.log("  ✅ PropertyNFT minting test passed");
  });

  it("PropertyNFT: Should get correct token count", async function () {
    const kycRegistry = await viem.deployContract("KYCRegistry");

    const [_, user1] = await viem.getWalletClients();
    await kycRegistry.write.whitelist([user1.account.address]);

    const nft = await viem.deployContract("PropertyNFT", [kycRegistry.address]);

    const initialCount = await nft.read.totalMinted();
    assert.equal(initialCount, 0n);

    // Mint first NFT
    await nft.write.mintProperty([
      user1.account.address,
      "Property 1",
      100n,
      1000000n,
      "ipfs://doc1",
      "ipfs://token1"
    ]);

    // Mint second NFT
    await nft.write.mintProperty([
      user1.account.address,
      "Property 2",
      200n,
      2000000n,
      "ipfs://doc2",
      "ipfs://token2"
    ]);

    const finalCount = await nft.read.totalMinted();
    assert.equal(finalCount, 2n);

    console.log("  ✅ NFT counting test passed");
  });

  it("Full Integration: Deploy all contracts and perform operations", async function () {
    const [deployer, user1, user2] = await viem.getWalletClients();

    // 1. Deploy KYC
    const kyc = await viem.deployContract("KYCRegistry");

    // 2. Whitelist users
    await kyc.write.whitelist([deployer.account.address]);
    await kyc.write.whitelist([user1.account.address]);
    // user2 is NOT whitelisted

    // 3. Deploy token
    const token = await viem.deployContract("RealEstateToken", [
      "Real Estate Share",
      "RES",
      kyc.address,
      "123 Champs-Élysées, Paris",
      50000000n,
      1000n
    ]);

    // 4. Deploy NFT
    const nft = await viem.deployContract("PropertyNFT", [kyc.address]);

    // 5. Transfer tokens to whitelisted user1 (should work)
    const amount = 10n * 10n ** 18n;
    await token.write.transfer([user1.account.address, amount]);

    const user1TokenBalance = await token.read.balanceOf([user1.account.address]);
    assert.equal(user1TokenBalance, amount);

    // 6. Mint NFT to user1 (should work)
    await nft.write.mintProperty([
      user1.account.address,
      "Property A",
      150n,
      30000000n,
      "ipfs://docA",
      "ipfs://tokenA"
    ]);

    const nftOwner = await nft.read.ownerOf([0n]);
    assert.equal(nftOwner.toLowerCase(), user1.account.address.toLowerCase());

    // 7. Try to transfer token to non-whitelisted user2 (should fail)
    let transferFailed = false;
    try {
      await token.write.transfer([user2.account.address, amount]);
    } catch (error) {
      transferFailed = true;
    }
    assert.equal(transferFailed, true, "Transfer to non-whitelisted should fail");

    // 8. Blacklist user1
    await kyc.write.blacklist([user1.account.address]);

    const isUser1Blacklisted = await kyc.read.isBlacklisted([user1.account.address]);
    assert.equal(isUser1Blacklisted, true);

    console.log("  ✅ Full integration test passed");
  });
});
