// src/lib/bootstrap.ts
if (!global.__epilotBootstrapInitialized) {
  global.__epilotBootstrapInitialized = true
  import('@/lib/streams/binanceCurrencyStream')
  import('@/lib/workers/guessResolutionWorker')
  console.log('☁️  Bootstrap: workers started')
}
