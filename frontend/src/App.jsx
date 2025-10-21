import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import './App.css'

import WalletConnect from './components/WalletConnect.jsx'
import TokenCreation from './components/TokenCreation.jsx'
import TradingInterface from './components/TradingInterface.jsx'
import Portfolio from './components/Portfolio.jsx'
import KYCStatus from './components/KYCStatus.jsx'

function App() {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="min-h-screen">
      <header className="border border-purple-500/40 rounded-xl sticky top-2 mx-2 bg-[rgba(88,28,135,0.15)] backdrop-blur-xl z-10 text-white shadow-[0_8px_32px_0_rgba(139,92,246,0.2)]">
        <div className="container-app py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200 bg-clip-text text-transparent">RealEstate dApp</span>
            <nav className="hidden md:flex items-center gap-2 ml-6 text-sm">
              {['portfolio','token','trade','kyc'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-pill ${activeTab===tab ? 'tab-active' : 'tab-inactive'}`}
                >
                  {tab === 'portfolio' && 'Portfolio'}
                  {tab === 'token' && 'Tokenisation'}
                  {tab === 'trade' && 'Trading'}
                  {tab === 'kyc' && 'KYC'}
                </button>
              ))}
            </nav>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container-app py-6 space-y-6">
        <WalletConnect />
  {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'token' && <TokenCreation />}
        {activeTab === 'trade' && <TradingInterface />}
        {activeTab === 'kyc' && <KYCStatus />}
      </main>

      <footer className="text-center text-neutral-500 text-xs py-6">
        {(import.meta.env.VITE_NETWORK || 'sepolia')} • Uniswap/QuickSwap integration • Built with Wagmi/RainbowKit
      </footer>
    </div>
  )
}

export default App
