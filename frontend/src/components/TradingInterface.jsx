import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, isAddress } from 'viem'
import { UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_PAIR_ABI } from '../config/dex-abis'
import { useContracts } from '../hooks/useContracts'

export default function TradingInterface() {
  const { address, isConnected } = useAccount()
  const { realEstateToken } = useContracts()

  const routerAddress = import.meta.env.VITE_UNISWAP_ROUTER
  const wethAddress = import.meta.env.VITE_WETH
  const pairAddress = import.meta.env.VITE_RES_WETH_PAIR // Will be created after liquidity

  // State for swap form
  const [fromToken, setFromToken] = useState('ETH')
  const [toToken, setToToken] = useState('RES')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [needsApproval, setNeedsApproval] = useState(false)

  // Get addresses based on token selection
  const fromAddress = fromToken === 'ETH' ? wethAddress : realEstateToken.address
  const toAddress = toToken === 'RES' ? realEstateToken.address : wethAddress

  // Check RES allowance for Router (when swapping RES -> ETH)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: realEstateToken.address,
    abi: realEstateToken.abi,
    functionName: 'allowance',
    args: [address, routerAddress],
    query: { enabled: isConnected && fromToken === 'RES' },
  })

  // Update needsApproval when allowance or amount changes
  useEffect(() => {
    if (fromToken === 'RES' && amount && allowance !== undefined) {
      const amountBigInt = parseUnits(amount, 18)
      const needsApprove = allowance < amountBigInt
      setNeedsApproval(needsApprove)

      // Debug log
      console.log('🔍 Approve check:', {
        fromToken,
        amount,
        allowance: allowance.toString(),
        amountBigInt: amountBigInt.toString(),
        needsApproval: needsApprove
      })
    } else {
      setNeedsApproval(false)
    }
  }, [fromToken, amount, allowance])

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

  // Swap/Approve functions
  const { writeContract, data: txHash, isPending, isError } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (isTxSuccess && needsApproval) {
      refetchAllowance()
    }
  }, [isTxSuccess, needsApproval, refetchAllowance])

  const onApprove = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Montant invalide')
      return
    }

    // Approve MAX amount to avoid having to re-approve each time
    // MaxUint256 = 2^256 - 1 (unlimited approval)
    const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    const amountToApprove = MAX_UINT256

    console.log('📝 Approving unlimited amount for Router:', routerAddress)

    try {
      writeContract({
        address: realEstateToken.address,
        abi: realEstateToken.abi,
        functionName: 'approve',
        args: [routerAddress, amountToApprove],
      })
    } catch (err) {
      console.error('Approve error:', err)
      alert('Erreur approve: ' + err.message)
    }
  }

  const onSwap = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Montant invalide')
      return
    }

    // Check if approval needed first
    if (fromToken === 'RES' && needsApproval) {
      alert('⚠️ Tu dois d\'abord approuver le Router à dépenser tes RES tokens')
      return
    }

    const amountIn = parseUnits(amount, 18)
    const amountOutMin = quoteData && quoteData.length > 1 ? (quoteData[1] * 98n) / 100n : 0n // 2% slippage (plus tolérant)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600) // 10 min

    console.log('Swap params:', {
      fromToken,
      toToken,
      amountIn: amountIn.toString(),
      amountOutMin: amountOutMin.toString(),
      path: [fromAddress, toAddress],
      deadline: deadline.toString()
    })

    try {
      if (fromToken === 'ETH') {
        // Swap ETH for RES (using WETH under the hood)
        writeContract({
          address: routerAddress,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [amountOutMin, [wethAddress, realEstateToken.address], address, deadline],
          value: amountIn,
          gas: 300000n, // Force gas limit raisonnable
        })
      } else {
        // Swap RES for ETH (approval already checked above)
        writeContract({
          address: routerAddress,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [amountIn, amountOutMin, [realEstateToken.address, wethAddress], address, deadline],
          gas: 300000n, // Force gas limit raisonnable
        })
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
        <span className="badge">Uniswap V2</span>
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
              <option value="ETH">ETH</option>
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
              <option value="ETH">ETH</option>
            </select>
            <input
              className="input"
              placeholder="0.0"
              type="text"
              value={quote || ''}
              readOnly
            />
          </div>
        </div>

        {/* Debug info for allowance (dev mode) */}
        {fromToken === 'RES' && amount && allowance !== undefined && (
          <div className="text-xs text-gray-400 bg-gray-800/50 border border-gray-700 rounded-md p-2 mb-2">
            🔍 Debug: Allowance = {formatUnits(allowance, 18)} RES | Besoin approve: {needsApproval ? 'OUI' : 'NON'}
          </div>
        )}

        {/* Approve button (shown when swapping RES -> ETH and needs approval) */}
        {fromToken === 'RES' && needsApproval && (
          <button
            type="button"
            onClick={onApprove}
            className="btn btn-secondary w-full"
            disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isPending || isTxPending}
          >
            {isPending || isTxPending ? '⏳ Approve en cours...' : '✅ Approve RES'}
          </button>
        )}

        {/* Swap button */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={
            !isConnected || 
            !amount || 
            parseFloat(amount) <= 0 || 
            isPending || 
            isTxPending ||
            (fromToken === 'RES' && needsApproval)
          }
        >
          {isPending || isTxPending ? 'Swap en cours...' : 
           fromToken === 'RES' && needsApproval ? '⚠️ Approve d\'abord' : 
           'Swap'}
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
            <div className="stat-desc">WETH / RES</div>
          </div>
        </div>
      </div>
    </section>
  )
}
