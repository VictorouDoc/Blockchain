// Central place for frontend config (DEX + helper addresses)
export const DEX = {
  router: import.meta.env.VITE_UNISWAP_ROUTER,
  factory: import.meta.env.VITE_UNISWAP_FACTORY,
  wmatic: import.meta.env.VITE_WMATIC_ADDRESS, // may be empty; front can fetch via router.WETH()
}

export const CONTRACTS = {
  kyc: {
    address: import.meta.env.VITE_KYC_REGISTRY_ADDRESS,
  },
  res: {
    address: import.meta.env.VITE_ERC20_ADDRESS,
  },
  nft: {
    address: import.meta.env.VITE_ERC721_ADDRESS,
  },
}
