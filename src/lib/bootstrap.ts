/**
 * Bootstrap to load workers and streams on start
 * Singleton architecture to avoid multiple entities
 */
if (!global.__epilotBootstrapInitialized) {
  global.__epilotBootstrapInitialized = true
  import('@/lib/streams/binanceCurrencyStream')
  import('@/lib/workers/guessResolutionWorker')
  console.log('☁️  Bootstrap: workers started')
}
