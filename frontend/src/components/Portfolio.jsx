import { useAccount } from 'wagmi'

// Placeholder portfolio; in real app, fetch from backend/indexer
export default function Portfolio() {
  const { address, isConnected } = useAccount()

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
            <div className="stat-value">—</div>
            <div className="stat-desc">Basée sur oracle (à venir)</div>
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
