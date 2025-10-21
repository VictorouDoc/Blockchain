import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TOKEN_FACTORY_ABI } from '../config/factory-abi'
import { parseEther } from 'viem'

export default function TokenCreation() {
  const { address, isConnected } = useAccount()
  const factoryAddress = import.meta.env.VITE_TOKEN_FACTORY_ADDRESS

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    nftName: '',
    nftSymbol: '',
  })

  const { writeContract, data: txHash, isPending, isError, error } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const [lastCreatedAddress, setLastCreatedAddress] = useState(null)
  const [lastAction, setLastAction] = useState(null) // Track which action was performed

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createERC20 = async (e) => {
    e.preventDefault()

    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      alert('❌ TokenFactory pas configuré. Vérifie VITE_TOKEN_FACTORY_ADDRESS dans .env')
      return
    }

    if (!form.name || !form.symbol || !form.totalSupply) {
      alert('❌ Tous les champs sont requis')
      return
    }

    try {
      setLastCreatedAddress(null)
      setLastAction('ERC20')
      writeContract({
        address: factoryAddress,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createERC20',
        args: [
          form.name,
          form.symbol,
          BigInt(form.totalSupply),
        ],
      })
    } catch (err) {
      console.error('Error creating ERC20:', err)
      alert('Erreur: ' + err.message)
    }
  }

  const createERC721 = async (e) => {
    e.preventDefault()

    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      alert('❌ TokenFactory pas configuré. Vérifie VITE_TOKEN_FACTORY_ADDRESS dans .env')
      return
    }

    if (!form.nftName || !form.nftSymbol) {
      alert('❌ Nom et symbole requis')
      return
    }

    try {
      setLastCreatedAddress(null)
      setLastAction('ERC721')
      writeContract({
        address: factoryAddress,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'createERC721',
        args: [form.nftName, form.nftSymbol],
      })
    } catch (err) {
      console.error('Error creating ERC721:', err)
      alert('Erreur: ' + err.message)
    }
  }

  return (
    <section className="grid md:grid-cols-2 gap-6">
      <div className="section">
        <div className="flex items-center justify-between">
          <h2 className="mb-3">Créer un token ERC20</h2>
          <span className="badge">Admin</span>
        </div>
        <p className="muted mb-3">Déploie un token ERC20 simple (sans KYC).</p>

        {!isConnected && (
          <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-800 rounded-md p-3 mb-4">
            Connecte ton wallet pour créer un token
          </div>
        )}

        <form className="space-y-3" onSubmit={createERC20}>
          <div>
            <label className="label">Nom</label>
            <input className="input" name="name" placeholder="My Token" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Symbole</label>
            <input className="input" name="symbol" placeholder="MTK" value={form.symbol} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Supply total</label>
            <input className="input" name="totalSupply" placeholder="1000000" type="number" value={form.totalSupply} onChange={onChange} required />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              disabled={!isConnected || isPending || isTxPending}
            >
              {isPending || isTxPending ? 'Déploiement...' : 'Déployer ERC20'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={()=>setForm({ ...form, name:'My Token', symbol:'MTK', totalSupply:'1000000' })}
            >
              Exemple
            </button>
          </div>

          {isTxSuccess && lastAction === 'ERC20' && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-800 rounded-md p-3">
              ✅ Token ERC20 créé ! TX: {txHash?.slice(0, 10)}...
            </div>
          )}
          {isError && lastAction === 'ERC20' && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-800 rounded-md p-3">
              ❌ Erreur: {error?.message?.slice(0, 100)}
            </div>
          )}
        </form>
      </div>

      <div className="section">
        <div className="flex items-center justify-between">
          <h2 className="mb-3">Créer une collection ERC721</h2>
          <span className="badge">Admin</span>
        </div>
        <p className="muted mb-3">Déploie une collection pour émettre des certificats de propriété (NFT).</p>

        {!isConnected && (
          <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-800 rounded-md p-3 mb-4">
            Connecte ton wallet pour créer une collection NFT
          </div>
        )}

        <form className="space-y-3" onSubmit={createERC721}>
          <div>
            <label className="label">Nom</label>
            <input className="input" name="nftName" placeholder="Property Certificate" value={form.nftName} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Symbole</label>
            <input className="input" name="nftSymbol" placeholder="PROP" value={form.nftSymbol} onChange={onChange} required />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              disabled={!isConnected || isPending || isTxPending}
            >
              {isPending || isTxPending ? 'Déploiement...' : 'Déployer ERC721'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={()=>setForm({ ...form, nftName:'Property Certificate', nftSymbol:'PROP' })}
            >
              Exemple
            </button>
          </div>

          {isTxSuccess && lastAction === 'ERC721' && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-800 rounded-md p-3">
              ✅ Collection ERC721 créée ! TX: {txHash?.slice(0, 10)}...
            </div>
          )}
          {isError && lastAction === 'ERC721' && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-800 rounded-md p-3">
              ❌ Erreur: {error?.message?.slice(0, 100)}
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
