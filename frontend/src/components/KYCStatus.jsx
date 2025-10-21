import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { isAddress } from 'viem'
import { useContracts } from '../hooks/useContracts'

export default function KYCStatus() {
  const { address: connectedAddress, isConnected, chain } = useAccount()
  const { kycRegistry } = useContracts()
  const [inputAddress, setInputAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Address to check: user input if valid, else connected wallet
  const targetAddress = useMemo(() => {
    if (inputAddress && !isAddress(inputAddress)) {
      setAddressError('Adresse invalide : doit être une adresse Ethereum valide')
      return null
    }
    setAddressError('')
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

  // État pour tracker si une vérification a été effectuée
  const [hasChecked, setHasChecked] = useState(false)

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

      <form className="mt-4 flex flex-col md:flex-row gap-3 items-end" onSubmit={async (e) => {
          e.preventDefault();
          if (!canQuery) return;
          setIsVerifying(true);
          setHasChecked(true);
          try {
            console.log('Checking KYC status for:', targetAddress);
            const result = await refetch();
            console.log('KYC check result:', result);
          } catch (err) {
            console.error('KYC check error:', err);
          } finally {
            setIsVerifying(false);
          }
        }}>
        <div className="flex-1">
          <label className="label">Adresse à vérifier</label>
          <input
            className={`input ${addressError ? 'border-red-500' : ''}`}
            placeholder="0x... (laisser vide pour utiliser le wallet connecté)"
            value={inputAddress}
            onChange={(e)=>setInputAddress(e.target.value.trim())}
          />
          {addressError && (
            <p className="mt-1 text-xs text-red-400">{addressError}</p>
          )}
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
          disabled={!canQuery || !!addressError}
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Vérification...
            </span>
          ) : (
            'Vérifier'
          )}
        </button>
      </form>

      {hasChecked && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="stat">
            <div>
              <div className="stat-title">Adresse vérifiée</div>
              <div className="stat-value text-sm">
                {targetAddress ? (
                  <span className="font-mono">{targetAddress?.slice(0,6)}...{targetAddress?.slice(-4)}</span>
                ) : (
                  <span className="text-amber-400">Adresse invalide</span>
                )}
              </div>
            </div>
          </div>
          <div className="stat">
            <div>
              <div className="stat-title">Statut KYC</div>
              <div className="stat-value text-sm">
                {!canQuery && (
                  <span className="text-neutral-500">En attente de vérification</span>
                )}
                {canQuery && isLoading && (
                  <div className="flex items-center gap-2">
                    <span className="skeleton inline-block h-4 w-4 rounded-full" />
                    <span className="text-neutral-400">Vérification...</span>
                  </div>
                )}
                {canQuery && !isLoading && !error && (
                  <div className={`flex items-center gap-2 ${approved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span>{approved ? '✓' : '✗'}</span>
                    <span>{approved ? 'Whitelisté' : 'Non whitelisté'}</span>
                  </div>
                )}
                {canQuery && !isLoading && error && (
                  <div className="flex items-center gap-2 text-red-400">
                    <span>⚠️</span>
                    <span>Erreur lors de la vérification</span>
                  </div>
                )}
              </div>
              {canQuery && !isLoading && error && (
                <div className="stat-desc text-red-400 mt-1">
                  {error.message || 'Impossible de vérifier le statut KYC'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Notification après vérification réussie */}
      {hasChecked && canQuery && !isLoading && !error && (
        <div className={`mt-4 text-sm rounded-md p-3 border ${
          approved 
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-800'
            : 'text-amber-400 bg-amber-500/10 border-amber-800'
        }`}>
          {approved 
            ? '✅ Cette adresse est whitelistée et peut effectuer des transactions.' 
            : '⚠️ Cette adresse n\'est pas whitelistée. Les transactions seront bloquées.'}
        </div>
      )}
    </section>
  )
}
