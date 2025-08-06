# Bitcoin Guesser App

A real-time mini-game built with Next.js 15 (App Router), Prisma, Redis, and Server-Sent Events. Players guess whether Bitcoin’s price will go up or down over a short interval, seeing live price updates and real-time score changes.

---

## Features

- **Live Bitcoin price streaming** via Binance WebSocket → Redis Pub/Sub → SSE
- **10-minute price history** replay on page load
- **Game engine** with guessing, resolution scheduler, and per-user state in PostgreSQL
- **Server-Sent Events** multiplexed for price updates and per-game channels
- **NextAuth** for user sessions
- **Responsive UI** with a candle chart, controls, and bottom nav
- **Config and Game Management** to create different game modes and games.
- **Player Lobbies** to enable crossplay between users.

---

## Table of Contents

1. [Quickstart](#quickstart)
2. [Environment Variables](#environment-variables)
3. [Development](#development)
4. [Deployment](#deployment)
5. [Project Structure](#project-structure)
6. [Key Modules](#key-modules)
7. [License](#license)

---

## Quickstart

```bash
git clone https://github.com/Cascade-8/epilot-bitcoin-guess-app
cd bitcoin-guesser-app
npm install
```

Copy `.env.example` to `.env.local` and fill in your values (see below). Then:

```bash
# Generate Prisma client & apply migrations
npm run migrate:dev

# Start dev server (with background workers via instrumentation.ts)
npm run dev
```

Open <http://localhost:3000> in your browser.

---

## Environment Variables

Create a `.env.local` with the following:

```ini
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Redis (for price history & pub/sub)
REDIS_URL=redis://default:password@localhost:6379

# (Optional) override ports
# PORT=3000
```

In production (e.g. Railway), use the plugin-provided `REDIS_URL` and add ?family=0 to support internal connections 
Additionally set:

```ini
NEXTAUTH_URL=https://your-production-domain
NEXTAUTH_SECRET=<same as in dev>
```

---

## Development

- **Prisma Studio**: `npm run prisma:studio` to analyse the database in realtime
- **Database migrations**:  
    - Dev: `npm run migrate:dev`
    - Prod: `npm run migrate:prod`
- **Lint**: `npm run lint`

### Dev Server

```bash
npm run dev
```

- Runs Next.js with Turbopack

---

## Deployment

Railway, Vercel, or any Node host:

```bash
npm run build
npm run start
```

Make sure to set `runtime = 'nodejs'` at the top of any `app/api/**/route.ts` that uses Redis or your workers.

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (protected)/            # protected layout    
│   ├── api/                    # api endpoints    
│   └── generated/              # prisma generated code    
│
├── components/                 # Presentational UI
│   ├── atoms/                  # Buttons, inputs, spinners
│   ├── molecules/              # CandleChart, Game Elements
│   └── organisms/              # Forms, BottomNav
│
├── context/                    # App-wide React contexts
│   ├── BitcoinPriceContext.tsx # Store the current price across all Games
│   ├── GameContext.tsx         # Store game specific context
│   └── ToastContext.tsx        # Handle toast notifications
│
├── lib/                        # Low-level adapters
│   ├── auth                    # Next auth options
│   ├── services/               # Service clients
│   ├── stores/                 # Data stores
│   ├── streams/                # Data streams
│   ├── workers/                # Scheduled workers
│   └── bootstrap.ts            # Start singleton processes
│  
└── types/                      # Shared TypeScript types
```

---

## Key Modules

- **`src/lib/priceStoreRedis.ts`**  
  Manages Bitcoin price history in Redis (sorted set TTL + Pub/Sub).

- **`src/lib/gameStoreRedis.ts`**  
  Publishes/subscribes to per-user game events via Redis Pub/Sub.

- **`src/workers/binanceStreamer.ts`**  
  Connects to Binance WebSocket and pushes ticks into Redis.

- **`src/workers/guessResolutionWorker.ts`**  
  Periodically pops due guesses from Redis, resolves them via Prisma, and emits events.

- **`src/lib/bootstrap.ts`**  
  Guards against multiple instantiation and imports your workers on first load.

- **`app/api/game-engine/stream/route.ts`**  
  Server-Sent Events endpoint that multiplexes price updates and game events.

- **`src/context/BitcoinPriceContext.tsx`**  
  Fetches price history once and subscribes to live updates for React components.

---

## License

MIT © Cascade Solutions
