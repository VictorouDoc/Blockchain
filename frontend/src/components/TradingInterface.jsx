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
      <h2 className="mb-3">Trading (Swap)</h2>
      <form className="grid md:grid-cols-4 gap-3 items-end" onSubmit={onSwap}>
        <input className="input" name="from" placeholder="Token source (adresse)" value={trade.from} onChange={onChange} />
        <input className="input" name="to" placeholder="Token destination (adresse)" value={trade.to} onChange={onChange} />
        <input className="input" name="amount" placeholder="Montant" type="number" value={trade.amount} onChange={onChange} />
        <button className="btn btn-outline">Swap</button>
      </form>
    </section>
  )
}
