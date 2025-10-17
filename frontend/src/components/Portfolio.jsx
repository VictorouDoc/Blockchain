import { useAccount } from 'wagmi'
import { useResPrice } from '../hooks/useOracle'

// Placeholder portfolio; in real app, fetch from backend/indexer
export default function Portfolio() {
  const { address, isConnected } = useAccount()
  const { data: resPrice, isLoading: priceLoading, error: priceError } = useResPrice()

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
            <div className="stat-value">—</div>
            <div className="stat-desc">Tokenisé</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">NFTs</div>
            <div className="stat-value">—</div>
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
                `$${Number(resPrice.price.usd).toLocaleString()}`
              )}
            </div>
            <div className="stat-desc">Oracle {resPrice?.lastUpdate ? `• ${new Date(resPrice.lastUpdate).toLocaleTimeString()}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm text-neutral-400 mb-2">Derniers actifs</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-400">Asset #{i}</div>
                <span className="badge">NFT</span>
              </div>
              <div className="mt-2 text-lg font-semibold">Property #{i}</div>
              <div className="text-xs text-neutral-500">0x... tokenId {i-1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
