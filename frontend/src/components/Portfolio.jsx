import { useAccount } from 'wagmi'

// Placeholder portfolio; in real app, fetch from backend/indexer
export default function Portfolio() {
  const { address, isConnected } = useAccount()

  return (
    <section className="section">
      <div className="flex items-center justify-between">
        <h2>Portfolio</h2>
        {isConnected && (
          <span className="text-xs text-neutral-400">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        )}
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1,2,3].map((i) => (
          <div key={i} className="card p-3 bg-neutral-950">
            <div className="text-sm text-neutral-400">Asset #{i}</div>
            <div className="mt-2 text-2xl font-semibold">0.00</div>
            <div className="text-xs text-neutral-500">ERC20 / NFT</div>
          </div>
        ))}
      </div>
    </section>
  )
}
