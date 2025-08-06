import { NextResponse } from 'next/server'
import { getHistory }   from '@/lib/stores/priceStoreRedis'

export const GET = async () => {
  const hist = await getHistory()
  return NextResponse.json(hist)
}