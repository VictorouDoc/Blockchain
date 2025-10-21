import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'

// Uniswap V2 Pair ABI (minimal for getReserves)
const PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: '_reserve0', type: 'uint112' },
      { name: '_reserve1', type: 'uint112' },
      { name: '_blockTimestampLast', type: 'uint32' }
    ],
    type: 'function'
  }
]

// Fixed property value from README
const PROPERTY_VALUE = 500000 // $500k
const TOTAL_SUPPLY = 1000 // 1000 RES tokens

// Base price of 1 RES = $500 (propertyValue / totalSupply)
const BASE_PRICE = PROPERTY_VALUE / TOTAL_SUPPLY

export function useResPrice() {
  // Get reserves from Uniswap V2 pair
  const { data: reserves, isLoading, error } = useReadContract({
    address: import.meta.env.VITE_RES_WETH_PAIR,
    abi: PAIR_ABI,
    functionName: 'getReserves',
  })

  // Process reserves to get price
  const processedData = {
    price: {
      usd: BASE_PRICE, // Using fixed price as base
    },
    lastUpdate: new Date().toISOString(),
  }

  // If we have reserves, we can calculate a more accurate price based on Uniswap
  if (reserves) {
    const [reserve0, reserve1] = reserves
    // Convert reserves to proper numbers
    const resAmount = Number(formatUnits(reserve0, 18))
    const wethAmount = Number(formatUnits(reserve1, 18))
    
    if (wethAmount && resAmount) {
      // Calculate price based on reserves ratio and assumed ETH price ($2000)
      const ETH_PRICE = 2000 // Assumed ETH price
      const priceFromReserves = (wethAmount / resAmount) * ETH_PRICE
      
      // Use an average of base price and Uniswap price
      processedData.price.usd = (BASE_PRICE + priceFromReserves) / 2
    }
  }

  return {
    data: processedData,
    isLoading,
    error,
  }
}
