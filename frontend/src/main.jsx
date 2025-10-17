import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { http } from 'viem'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App'

const projectId = import.meta.env.VITE_WC_PROJECT_ID

// If WalletConnect Project ID is missing, render a helpful message instead of crashing
if (!projectId) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: '#0a0a0a', color: '#e5e5e5', padding: 24
      }}>
        <div style={{ maxWidth: 640, lineHeight: 1.5 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>WalletConnect Project ID requis</h1>
          <ol style={{ paddingLeft: 16 }}>
            <li>1) Va sur https://cloud.walletconnect.com et connecte-toi</li>
            <li>2) Crée un Project et copie le <strong>Project ID</strong></li>
            <li>3) Dans <code>.env</code> à la racine du dossier frontend, ajoute :</li>
          </ol>
          <pre style={{ background: '#111', padding: 12, borderRadius: 8, overflow: 'auto' }}>
VITE_WC_PROJECT_ID=ton_project_id
          </pre>
          <div style={{ marginTop: 8 }}>4) Redémarre le serveur de dev: <code>npm run dev</code></div>
          <p style={{ marginTop: 12, color: '#a3a3a3' }}>
            Réf: https://www.rainbowkit.com/docs/installation#configure
          </p>
        </div>
      </div>
    </React.StrictMode>
  )
} else {
  const config = getDefaultConfig({
    appName: 'RealEstate DApp',
    projectId,
    chains: [sepolia],
    transports: { [sepolia.id]: http() },
    ssr: false,
  })

  const queryClient = new QueryClient()

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  )
}