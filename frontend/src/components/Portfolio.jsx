import { useAccount, useReadContract } from 'wagmi'
import { useResPrice } from '../hooks/useOracle'
import { useContracts } from '../hooks/useContracts'
import { formatUnits } from 'viem'

export default function Portfolio() {
  const { address, isConnected } = useAccount()
  const { data: resPrice, isLoading: priceLoading, error: priceError } = useResPrice()
  const { realEstateToken, propertyNft } = useContracts()

  // Fetch RES token balance
  const { data: resBalance, isLoading: resLoading } = useReadContract({
    address: realEstateToken.address,
    abi: realEstateToken.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && !!realEstateToken.address },
  })

  // Fetch user's NFT balance (only when connected)
  const { data: nftBalance, isLoading: nftLoading } = useReadContract({
    address: propertyNft.address,
    abi: propertyNft.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && !!propertyNft.address },
  })

  const formattedResBalance = resBalance ? formatUnits(resBalance, 18) : '0'

  return (
    <section className="section">
      <div className="flex items-center justify-between">
        <h2>Portfolio</h2>
        {isConnected && (
          <span className="badge">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        )}
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="stat">
          <div>
            <div className="stat-title">Balance RES</div>
            <div className="stat-value">
              {!isConnected && '—'}
              {isConnected && resLoading && <span className="skeleton inline-block h-5 w-24" />}
              {isConnected && !resLoading && Number(formattedResBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="stat-desc">Tokenisé</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">NFTs</div>
            <div className="stat-value">
              {!isConnected && '—'}
              {isConnected && nftLoading && <span className="skeleton inline-block h-5 w-16" />}
              {isConnected && !nftLoading && (nftBalance?.toString() || '0')}
            </div>
            <div className="stat-desc">Property Certificates</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Valeur estimée</div>
            <div className="stat-value">
              {priceLoading && <span className="skeleton inline-block h-5 w-24" />}
              {!priceLoading && priceError && <span className="text-amber-400">Indispo</span>}
              {!priceLoading && !priceError && resPrice?.price?.usd != null && (
                `$${(Number(formattedResBalance) * Number(resPrice.price.usd)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              )}
            </div>
            <div className="stat-desc">
              {resPrice?.price?.usd && `$${Number(resPrice.price.usd).toLocaleString()}/RES`}
              {resPrice?.lastUpdate && ` • ${new Date(resPrice.lastUpdate).toLocaleTimeString()}`}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">RES Token Contract</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Address</span>
              <span className="text-xs font-mono text-neutral-200">
                {realEstateToken.address?.slice(0, 6)}...{realEstateToken.address?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Symbol</span>
              <span className="text-xs font-semibold text-neutral-200">RES</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Total Supply</span>
              <span className="text-xs font-semibold text-neutral-200">1,000 RES</span>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${realEstateToken.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 inline-block mt-2"
            >
              Voir sur Etherscan ↗
            </a>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">Property Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Property Value</span>
              <span className="text-xs font-semibold text-neutral-200">$500,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Price per Share</span>
              <span className="text-xs font-semibold text-neutral-200">
                ${resPrice?.price?.usd ? Number(resPrice.price.usd).toLocaleString() : '500'}/RES
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Location</span>
              <span className="text-xs text-neutral-200">123 Main St, Paris</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Network</span>
              <span className="text-xs text-neutral-200">Sepolia Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
