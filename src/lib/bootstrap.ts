// src/lib/bootstrap.ts
if (!global.__epilotBootstrapInitialized) {
  global.__epilotBootstrapInitialized = true
  import('@/server/binanceCurrencyStream')
  import('@/lib/guessResolutionWorker')
  console.log('☁️  Bootstrap: workers started')
}
