// hooks/useContracts.js
const KYC_ABI = [] // TODO: coller l’ABI officielle (isApproved(address) -> bool)
const ERC20_ABI = [] // TODO
const ERC721_ABI = [] // TODO

export function useContracts() {
  return {
    kycRegistry: {
      address: import.meta.env.VITE_KYC_REGISTRY_ADDRESS,
      abi: KYC_ABI,
    },
    realEstateToken: {
      address: import.meta.env.VITE_ERC20_ADDRESS,
      abi: ERC20_ABI,
    },
    propertyNft: {
      address: import.meta.env.VITE_ERC721_ADDRESS,
      abi: ERC721_ABI,
    },
  }
}