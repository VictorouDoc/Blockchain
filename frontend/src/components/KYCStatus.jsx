import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { isAddress } from 'viem'
import { useContracts } from '../hooks/useContracts'

export default function KYCStatus() {
  const { address: connectedAddress, isConnected, chain } = useAccount()
  const { kycRegistry } = useContracts()
  const [inputAddress, setInputAddress] = useState('')

  // Address to check: user input if valid, else connected wallet
  const targetAddress = useMemo(() => {
    if (isAddress(inputAddress || '')) return inputAddress
    return connectedAddress ?? '0x0000000000000000000000000000000000000000'
  }, [inputAddress, connectedAddress])

  const hasKycAddress = !!kycRegistry?.address && kycRegistry.address !== '0x0000000000000000000000000000000000000000'
  const hasKycAbi = Array.isArray(kycRegistry?.abi) && kycRegistry.abi.length > 0

  const canQuery = hasKycAddress && hasKycAbi && isAddress(targetAddress)

  const { data: approved, isLoading, error, refetch } = useReadContract({
    address: kycRegistry?.address,
    abi: kycRegistry?.abi,
    functionName: 'isAuthorized',
    args: [targetAddress],
    query: { enabled: canQuery },
  })

  // Auto refetch when targetAddress changes
  useEffect(() => {
    if (canQuery) refetch()
  }, [targetAddress, canQuery, refetch])

  return (
    <section className="section">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold mb-1">KYC</h2>
          <p className="text-xs text-neutral-400">Réseau: {chain?.name ?? '—'}</p>
        </div>
        {canQuery && (
          <span className={`badge ${approved ? 'border-emerald-700 text-emerald-300 bg-emerald-900/30' : 'border-amber-800 text-amber-300 bg-amber-900/20'}`}>
            {approved ? 'Whitelisted' : 'Non whitelisted'}
          </span>
        )}
      </div>

      {!hasKycAddress && (
        <div className="mt-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-800 rounded-md p-3">
          Adresse du contrat KYC manquante. Renseigne VITE_KYC_REGISTRY_ADDRESS dans votre fichier .env.
        </div>
      )}
      {!hasKycAbi && (
        <div className="mt-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-800 rounded-md p-3">
          ABI KYC manquante. Ajoute l’ABI dans <code className="font-mono">useContracts.js</code> (fonction <span className="font-semibold">isAuthorized(address)</span> attendue).
        </div>
      )}

      <form className="mt-4 flex flex-col md:flex-row gap-3 items-end" onSubmit={(e)=>{e.preventDefault(); if (canQuery) refetch()}}>
        <div className="flex-1">
          <label className="label">Adresse à vérifier</label>
          <input
            className="input"
            placeholder="0x... (laisser vide pour utiliser le wallet connecté)"
            value={inputAddress}
            onChange={(e)=>setInputAddress(e.target.value.trim())}
          />
          {isConnected && (
            <button
              type="button"
              className="mt-1 text-xs text-neutral-400 hover:text-neutral-200"
              onClick={() => setInputAddress(connectedAddress ?? '')}
            >
              Utiliser mon wallet ({connectedAddress?.slice(0,6)}...{connectedAddress?.slice(-4)})
            </button>
          )}
        </div>
        <button
          className="btn btn-secondary disabled:opacity-50"
          disabled={!canQuery}
        >
          Vérifier
        </button>
      </form>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="stat">
          <div>
            <div className="stat-title">Adresse</div>
            <div className="stat-value text-sm">{targetAddress?.slice(0,6)}...{targetAddress?.slice(-4)}</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Statut</div>
            <div className="stat-value text-sm">
              {!canQuery && '—'}
              {canQuery && isLoading && <span className="skeleton inline-block h-4 w-20" />}
              {canQuery && !isLoading && (error ? 'Erreur' : approved ? 'Validé' : 'Non validé')}
            </div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Action</div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" disabled>
                Request KYC (demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
