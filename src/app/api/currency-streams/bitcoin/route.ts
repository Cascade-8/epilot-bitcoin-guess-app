import { getHistory } from '@/lib/BitcoinPriceStore'
import '@/lib/BitcoinPriceStore'
import '@/lib/BitcoinPriceSocket'
import { NextResponse } from 'next/server'   // ← this import causes the WS to start
export const GET = () => {
  return NextResponse.json(getHistory())
}