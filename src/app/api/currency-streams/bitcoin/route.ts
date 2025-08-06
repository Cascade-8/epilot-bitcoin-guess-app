import { getHistory } from '@/lib/BitcoinPriceStore'
import '@/lib/BitcoinPriceStore'
import '@/lib/GameInfoSocket'
import { NextResponse } from 'next/server'   // ← this import causes the WS to start
export const GET = () => {
  return NextResponse.json(getHistory())
}