# 🏊 DEX Integration - Uniswap V2 (QuickSwap)

## 📋 Overview

The RealEstateToken (RES) is tradeable on **QuickSwap** (Uniswap V2 fork) on Polygon Amoy testnet.

### Why QuickSwap?
- Native to Polygon ecosystem
- Low gas fees
- Uniswap V2 compatible (easy integration)
- Active on Amoy testnet

---

## 🔧 Setup Process

### 1. Deploy Contracts First

```bash
npx hardhat run scripts/deploy.js --network amoy
```

This deploys:
- `KYCRegistry` - Manages whitelist/blacklist
- `RealEstateToken` - ERC-20 token with KYC enforcement
- `PropertyNFT` - ERC-721 NFT for properties

### 2. Setup Liquidity Pool

```bash
npx hardhat run scripts/setup-liquidity.js --network amoy
```

This script:
1. ✅ Creates RES/WMATIC pair on QuickSwap
2. ✅ Whitelists the Router contract
3. ✅ Whitelists the Pair contract
4. ✅ Adds initial liquidity (100 RES + 0.1 MATIC)
5. ✅ Tests swap quote

---

## 📍 Contract Addresses (Polygon Amoy)

### QuickSwap (Uniswap V2)
```
Router:  0x8954AfA98594b838bda56FE4C12a09D7739D179b
Factory: 0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32
```

### Your Deployed Contracts
Check `deployments/amoy-<timestamp>.json` for:
- RealEstateToken address
- KYCRegistry address
- PropertyNFT address

### Pool Info
Check `deployments/pool-amoy-<timestamp>.json` for:
- Pair address (RES/WMATIC)
- Initial liquidity details

---

## 🔐 KYC Compliance on DEX

**IMPORTANT**: Only whitelisted addresses can hold and trade RES tokens.

### How it works:

1. **Router is whitelisted** → Can receive tokens during swaps
2. **Pair contract is whitelisted** → Can hold liquidity
3. **Users must be whitelisted** → Otherwise transfers will revert

### Code enforcement (in RealEstateToken.sol):

```solidity
function _update(address from, address to, uint256 value) internal virtual override {
    if (from != address(0)) {
        require(kycRegistry.isAuthorized(from), "RES: sender not authorized");
    }
    if (to != address(0)) {
        require(kycRegistry.isAuthorized(to), "RES: recipient not authorized");
    }

    super._update(from, to, value);
}
```

---

## 🧪 Testing the DEX

### Test 1: Get Quote
```javascript
// Get expected output for 1 MATIC → RES
const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, signer);
const path = [WMATIC, RES_TOKEN];
const amountsOut = await router.getAmountsOut(
    ethers.parseEther("1"),
    path
);
console.log("1 MATIC =", ethers.formatEther(amountsOut[1]), "RES");
```

### Test 2: Swap MATIC for RES (whitelisted user)
```javascript
// User must be whitelisted first!
await kycRegistry.whitelist(userAddress);

// Swap 0.01 MATIC for RES
const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 min
await router.swapExactETHForTokens(
    0, // Accept any amount of RES
    [WMATIC, RES_TOKEN],
    userAddress,
    deadline,
    { value: ethers.parseEther("0.01") }
);
```

### Test 3: Swap RES for MATIC (whitelisted user)
```javascript
// Approve router first
await resToken.approve(ROUTER_ADDRESS, ethers.parseEther("10"));

// Swap 10 RES for MATIC
await router.swapExactTokensForETH(
    ethers.parseEther("10"),
    0, // Accept any amount of MATIC
    [RES_TOKEN, WMATIC],
    userAddress,
    deadline
);
```

### Test 4: Verify non-whitelisted users are blocked
```javascript
// This should REVERT with "RES: recipient not authorized"
const nonWhitelistedSigner = await provider.getSigner(1);
const routerAsNonWhitelisted = router.connect(nonWhitelistedSigner);

try {
    await routerAsNonWhitelisted.swapExactETHForTokens(
        0,
        [WMATIC, RES_TOKEN],
        nonWhitelistedAddress,
        deadline,
        { value: ethers.parseEther("0.01") }
    );
    console.log("❌ ERROR: Non-whitelisted user could swap!");
} catch (error) {
    console.log("✅ Correctly blocked:", error.message);
}
```

---

## 📊 Pool Analytics

### Check Reserves
```javascript
const pairABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
];

const pair = new ethers.Contract(PAIR_ADDRESS, pairABI, provider);
const [reserve0, reserve1] = await pair.getReserves();
const token0 = await pair.token0();

console.log("Reserve Token0:", ethers.formatEther(reserve0));
console.log("Reserve Token1:", ethers.formatEther(reserve1));
```

### Calculate Current Price
```javascript
const priceRESinMATIC = Number(reserve1) / Number(reserve0);
console.log("1 RES =", priceRESinMATIC, "MATIC");
```

---

## 🔗 Frontend Integration

### Using Wagmi/Viem (recommended)
```typescript
import { useWriteContract, useReadContract } from 'wagmi';

// Swap MATIC for RES
const { writeContract } = useWriteContract();

const swapMATICForRES = async (amountIn: string) => {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    await writeContract({
        address: ROUTER_ADDRESS,
        abi: routerABI,
        functionName: 'swapExactETHForTokens',
        args: [
            0n, // amountOutMin
            [WMATIC, RES_TOKEN],
            userAddress,
            deadline
        ],
        value: parseEther(amountIn)
    });
};
```

### Get Quote in Real-time
```typescript
const { data: quote } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: routerABI,
    functionName: 'getAmountsOut',
    args: [parseEther("1"), [WMATIC, RES_TOKEN]]
});
```

---

## 🎯 Next Steps for Bastien (Frontend)

1. **Create Swap UI**:
   - Input field for MATIC amount
   - Display expected RES output (using `getAmountsOut`)
   - Swap button (calls `swapExactETHForTokens`)

2. **Show KYC Status**:
   - Check if user is whitelisted
   - Display warning if not
   - Button to request KYC (for admin demo)

3. **Display Pool Stats**:
   - Current reserves
   - RES price in MATIC
   - User's RES balance
   - User's liquidity (if they provided any)

4. **Add Liquidity UI** (optional):
   - Input for RES amount
   - Calculate required MATIC
   - Call `addLiquidityETH`

---

## 🚨 Common Issues

### Issue 1: "RES: recipient not authorized"
**Solution**: Whitelist the user first
```bash
npx hardhat console --network amoy
> const kyc = await ethers.getContractAt("KYCRegistry", KYC_ADDRESS);
> await kyc.whitelist("0xUserAddress");
```

### Issue 2: "Insufficient liquidity"
**Solution**: Add more liquidity to the pool
```bash
npx hardhat run scripts/setup-liquidity.js --network amoy
```

### Issue 3: "TransferHelper: TRANSFER_FROM_FAILED"
**Solution**: Approve router first
```javascript
await resToken.approve(ROUTER_ADDRESS, amount);
```

---

## 📚 Resources

- [QuickSwap Docs](https://docs.quickswap.exchange/)
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [QuickSwap Analytics](https://info.quickswap.exchange/)

---

## ✅ Checklist for Demo

- [ ] Deploy contracts on Amoy
- [ ] Setup liquidity pool
- [ ] Whitelist demo users
- [ ] Test swap on-chain (via script or Hardhat console)
- [ ] Verify non-whitelisted users are blocked
- [ ] Document pool address and initial liquidity
- [ ] Integrate in frontend
- [ ] Test swap via UI
- [ ] Show real-time price updates

---

**Created by Victor (Lead Blockchain)**
*Last updated: 2025-01-XX*
