import { useState } from 'react'

export default function TokenCreation() {
  const [form, setForm] = useState({
    name: '', symbol: '', supply: '',
    nftName: '', nftSymbol: '',
  })

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createERC20 = async (e) => {
    e.preventDefault()
    // TODO: call backend or contract factory to deploy ERC20
    alert(`(mock) Création ERC20 ${form.name} (${form.symbol}) supply ${form.supply}`)
  }

  const createERC721 = async (e) => {
    e.preventDefault()
    // TODO: call backend or contract factory to deploy ERC721
    alert(`(mock) Création ERC721 ${form.nftName} (${form.nftSymbol})`)
  }

  return (
    <section className="grid md:grid-cols-2 gap-6">
      <div className="section">
        <h2 className="mb-3">Créer un token ERC20</h2>
        <form className="space-y-3" onSubmit={createERC20}>
          <input className="input" name="name" placeholder="Nom" value={form.name} onChange={onChange} />
          <input className="input" name="symbol" placeholder="Symbole" value={form.symbol} onChange={onChange} />
          <input className="input" name="supply" placeholder="Offre initiale" type="number" value={form.supply} onChange={onChange} />
          <button className="btn btn-primary">Déployer ERC20</button>
        </form>
      </div>

      <div className="section">
        <h2 className="mb-3">Créer une collection ERC721</h2>
        <form className="space-y-3" onSubmit={createERC721}>
          <input className="input" name="nftName" placeholder="Nom" value={form.nftName} onChange={onChange} />
          <input className="input" name="nftSymbol" placeholder="Symbole" value={form.nftSymbol} onChange={onChange} />
          <button className="btn btn-secondary">Déployer ERC721</button>
        </form>
      </div>
    </section>
  )
}
