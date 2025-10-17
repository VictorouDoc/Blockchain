import { useState } from 'react'

export default function TradingInterface() {
  const [trade, setTrade] = useState({ from: '', to: '', amount: '' })
  const onChange = (e) => setTrade((t) => ({ ...t, [e.target.name]: e.target.value }))
  const onSwap = async (e) => {
    e.preventDefault()
    // TODO: Integrate Uniswap or backend route to perform swap
    alert(`(mock) Swap ${trade.amount} ${trade.from} vers ${trade.to}`)
  }

  return (
    <section className="section">
      <div className="flex items-center justify-between">
        <h2 className="mb-3">Trading (Swap)</h2>
        <span className="badge">QuickSwap</span>
      </div>
      <form className="grid md:grid-cols-4 gap-3 items-end" onSubmit={onSwap}>
        <div>
          <label className="label">Token source (adresse)</label>
          <input className="input" name="from" placeholder="0x... WMATIC" value={trade.from} onChange={onChange} />
        </div>
        <div>
          <label className="label">Token destination (adresse)</label>
          <input className="input" name="to" placeholder="0x... RES" value={trade.to} onChange={onChange} />
        </div>
        <div>
          <label className="label">Montant</label>
          <input className="input" name="amount" placeholder="0.00" type="number" value={trade.amount} onChange={onChange} />
        </div>
        <button className="btn btn-outline">Swap</button>
      </form>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="stat">
          <div>
            <div className="stat-title">Quote</div>
            <div className="stat-value text-lg">—</div>
            <div className="stat-desc">1 MATIC ≈ ? RES</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Slippage</div>
            <div className="stat-value text-lg">0.5%</div>
            <div className="stat-desc">par défaut</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Deadline</div>
            <div className="stat-value text-lg">10 min</div>
            <div className="stat-desc">swap timeout</div>
          </div>
        </div>
      </div>
    </section>
  )
}
