import { useQuery } from '@tanstack/react-query'

// In dev, use the Vite proxy (/oracle -> http://localhost:3001) to avoid CORS
// In prod, use the configured absolute base URL
const base = import.meta.env.DEV ? '/oracle' : (import.meta.env.VITE_ORACLE_BASE_URL || '/oracle')

async function fetchResPrice() {
  const url = `${base}/api/price/res`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Oracle error: ${res.status}`)
  const json = await res.json()
  return json.data
}

export function useResPrice() {
  return useQuery({
    queryKey: ['res-price'],
    queryFn: fetchResPrice,
    refetchInterval: 60_000,
  })
}
