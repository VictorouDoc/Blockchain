import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, isAddress } from 'viem'
import { UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_PAIR_ABI } from '../config/dex-abis'
import { useContracts } from '../hooks/useContracts'

export default function TradingInterface() {
  const { address, isConnected } = useAccount()
  const { realEstateToken } = useContracts()

  const routerAddress = import.meta.env.VITE_UNISWAP_ROUTER
  const wmaticAddress = import.meta.env.VITE_WMATIC_ADDRESS
  const pairAddress = import.meta.env.VITE_RES_WMATIC_PAIR

  // State for swap form
  const [fromToken, setFromToken] = useState('WMATIC')
  const [toToken, setToToken] = useState('RES')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState(null)

  // Get addresses based on token selection
  const fromAddress = fromToken === 'WMATIC' ? wmaticAddress : realEstateToken.address
  const toAddress = toToken === 'RES' ? realEstateToken.address : wmaticAddress

  // Fetch quote from DEX
  const { data: quoteData, isLoading: quoteLoading, refetch: refetchQuote } = useReadContract({
    address: routerAddress,
    abi: UNISWAP_V2_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amount && parseFloat(amount) > 0
      ? [parseUnits(amount, 18), [fromAddress, toAddress]]
      : undefined,
    query: { enabled: amount && parseFloat(amount) > 0 && isAddress(fromAddress) && isAddress(toAddress) },
  })

  // Fetch pair reserves for display
  const { data: reserves } = useReadContract({
    address: pairAddress,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'getReserves',
  })

  // Update quote when data changes
  useEffect(() => {
    if (quoteData && quoteData.length > 1) {
      setQuote(formatUnits(quoteData[1], 18))
    }
  }, [quoteData])

  // Swap function
  const { writeContract, data: txHash, isPending, isError } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const onSwap = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Montant invalide')
      return
    }

    const amountIn = parseUnits(amount, 18)
    const amountOutMin = quoteData ? (quoteData[1] * 995n) / 1000n : 0n // 0.5% slippage
    const deadline = Math.floor(Date.now() / 1000) + 600 // 10 min

    try {
      if (fromToken === 'WMATIC') {
        // Swap MATIC for RES
        writeContract({
          address: routerAddress,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [amountOutMin, [fromAddress, toAddress], address, BigInt(deadline)],
          value: amountIn,
        })
      } else {
        // Swap RES for WMATIC (need approve first)
        alert('⚠️ Swap token->ETH nécessite approve. Implémente approve flow!')
      }
    } catch (err) {
      console.error('Swap error:', err)
      alert('Erreur swap: ' + err.message)
    }
  }

  const switchTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')
    setQuote(null)
  }

  return (
    <section className="section">
      <div className="flex items-center justify-between">
        <h2 className="mb-3">Trading (Swap)</h2>
        <span className="badge">DonaSwap V2</span>
      </div>

      {!isConnected && (
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-800 rounded-md p-3 mb-4">
          Connecte ton wallet pour utiliser le swap
        </div>
      )}

      <form className="space-y-4" onSubmit={onSwap}>
        {/* From Token */}
        <div>
          <label className="label">De</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
            >
              <option value="WMATIC">WMATIC</option>
              <option value="RES">RES</option>
            </select>
            <input
              className="input"
              placeholder="0.0"
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (e.target.value) refetchQuote()
              }}
            />
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-outline px-6"
            onClick={switchTokens}
          >
            ⇅ Inverser
          </button>
        </div>

        {/* To Token */}
        <div>
          <label className="label">Vers</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
            >
              <option value="RES">RES</option>
              <option value="WMATIC">WMATIC</option>
            </select>
            <input
              className="input bg-neutral-900"
              placeholder="0.0"
              type="text"
              value={quote || ''}
              readOnly
            />
          </div>
        </div>

        <button
          className="btn btn-primary w-full"
          disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isPending || isTxPending}
        >
          {isPending || isTxPending ? 'Swap en cours...' : 'Swap'}
        </button>

        {isTxSuccess && (
          <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-800 rounded-md p-3">
            ✅ Swap réussi ! TX: {txHash?.slice(0, 10)}...
          </div>
        )}
        {isError && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-800 rounded-md p-3">
            ❌ Erreur lors du swap
          </div>
        )}
      </form>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="stat">
          <div>
            <div className="stat-title">Quote</div>
            <div className="stat-value text-lg">
              {quoteLoading && <span className="skeleton inline-block h-4 w-16" />}
              {!quoteLoading && quote && `${Number(quote).toFixed(6)}`}
              {!quoteLoading && !quote && '—'}
            </div>
            <div className="stat-desc">Tu reçois (estimé)</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Slippage</div>
            <div className="stat-value text-lg">0.5%</div>
            <div className="stat-desc">par défaut</div>
          </div>
        </div>
        <div className="stat">
          <div>
            <div className="stat-title">Réserves Pair</div>
            <div className="stat-value text-sm">
              {reserves ? `${formatUnits(reserves[0], 18).slice(0, 8)}` : '—'}
            </div>
            <div className="stat-desc">WMATIC / RES</div>
          </div>
        </div>
      </div>
    </section>
  )
}
