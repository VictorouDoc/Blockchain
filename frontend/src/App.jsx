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
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/80 backdrop-blur z-10">
        <div className="container-app py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">RealEstate dApp</span>
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
