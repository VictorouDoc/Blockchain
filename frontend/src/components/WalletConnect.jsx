import { useAccount } from 'wagmi'

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount()

  return (
    <section className="section">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2>Wallet</h2>
          <p className="muted">
            {isConnected
              ? `Connecté: ${address?.slice(0, 6)}...${address?.slice(-4)} sur ${chain?.name ?? 'réseau inconnu'}`
              : 'Aucun wallet connecté'}
          </p>
        </div>
      </div>
    </section>
  )
}
