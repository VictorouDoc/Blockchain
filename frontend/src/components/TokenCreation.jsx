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
        <div className="flex items-center justify-between">
          <h2 className="mb-3">Créer un token ERC20</h2>
          <span className="badge">Admin</span>
        </div>
        <p className="muted mb-3">Déploie un token fongible pour représenter des parts d’un bien (RES).</p>
        <form className="space-y-3" onSubmit={createERC20}>
          <div>
            <label className="label">Nom</label>
            <input className="input" name="name" placeholder="Real Estate Share" value={form.name} onChange={onChange} />
          </div>
          <div>
            <label className="label">Symbole</label>
            <input className="input" name="symbol" placeholder="RES" value={form.symbol} onChange={onChange} />
          </div>
          <div>
            <label className="label">Offre initiale</label>
            <input className="input" name="supply" placeholder="1000000" type="number" value={form.supply} onChange={onChange} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary">Déployer ERC20</button>
            <button type="button" className="btn btn-outline" onClick={()=>setForm({ ...form, name:'Real Estate Share', symbol:'RES', supply:'1000000' })}>Exemple</button>
          </div>
        </form>
      </div>

      <div className="section">
        <div className="flex items-center justify-between">
          <h2 className="mb-3">Créer une collection ERC721</h2>
          <span className="badge">Admin</span>
        </div>
        <p className="muted mb-3">Déploie une collection pour émettre des certificats de propriété (NFT).</p>
        <form className="space-y-3" onSubmit={createERC721}>
          <div>
            <label className="label">Nom</label>
            <input className="input" name="nftName" placeholder="Property Certificate" value={form.nftName} onChange={onChange} />
          </div>
          <div>
            <label className="label">Symbole</label>
            <input className="input" name="nftSymbol" placeholder="PROP" value={form.nftSymbol} onChange={onChange} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary">Déployer ERC721</button>
            <button type="button" className="btn btn-outline" onClick={()=>setForm({ ...form, nftName:'Property Certificate', nftSymbol:'PROP' })}>Exemple</button>
          </div>
        </form>
      </div>
    </section>
  )
}
