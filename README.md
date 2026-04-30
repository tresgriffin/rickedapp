# Ricked

A social app for bourbon and whiskey lovers. Discover, rate, review, and share your favorite spirits — no pretension, just good pours and good company.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| ORM | Prisma v7 |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| Auth | NextAuth v4 (Credentials + Google OAuth) |
| Testing | Vitest |
| Formatting | Prettier + ESLint |

## Brand Guide

**Colors**
- Navy `#0D3C54` — headers, nav bar, primary buttons
- Oak `#551904` — accents, secondary CTAs, links
- Cream `#FFFBFA` — main background, content surfaces

**Typography**
- **Abhaya Libre Bold** — display, headers, wordmark
- **Inter Regular/Bold** — body text

**Voice:** Welcoming, approachable, unpretentious. Like a friend who happens to know a lot about bourbon.

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd ricked
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with:
- `DATABASE_URL` — your Neon connection string (see below)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.developers.google.com)

### 3. Neon database setup

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **connection string** from your project dashboard
3. Paste it as `DATABASE_URL` in `.env.local`

**For Vercel deployments:** Use the **pooled** connection string (Neon provides both). The pooled string looks like `...pooler.xxx.aws.neon.tech...`. This is required for Vercel serverless functions which can't maintain persistent Postgres connections. Alternatively, use the `@neondatabase/serverless` Prisma adapter — see the [Neon + Vercel docs](https://neon.tech/docs/guides/nextjs) for setup.

### 4. Run migrations

```bash
pnpm db:migrate
```

This creates all tables in your Neon database.

### 5. Seed demo data

```bash
pnpm db:seed
```

Seeds 15 bourbons and two demo users (`tres` / `brian`) with sample reviews and posts.

> **Note:** The seed script is added in Phase 2. Run after Phase 2 is complete.

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The splash screen redirects to login automatically.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting (CI) |
| `pnpm test` | Run Vitest tests |
| `pnpm db:migrate` | Apply Prisma migrations to Neon |
| `pnpm db:push` | Push schema without migrations (quick iteration) |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |

## MVP Scope

### Phase 1 — shipped
- Project setup — Next.js, Tailwind, Prisma, NextAuth
- Brand colors, fonts, and visual identity
- Splash screen, Login, Signup
- Auth — email/password + Google OAuth
- Protected route middleware

### Phase 2 — data layer (next)
- Full Prisma schema (Bourbon, Review, Post, Recipe, Like, Comment, Follow)
- Neon migration + seed script (15 bourbons, demo users, sample content)
- Read-only API routes

### Phase 3 — core read screens (next)
- Home feed, Search, Brand/product page, Profile

### Phase 4 — write flows (next)
- Write review, Add post, Add recipe, Image uploads

### Phase 5 — social (next)
- Likes, comments, follow/unfollow

### Out of scope for MVP
- E-commerce / cart / checkout / "where to buy" — cut due to interstate liquor-sale legal complexity
- Expert/critic reviews — product phase 2
- Push notifications
- Direct messaging

### Future (not scaffolded)
- **Rick** — an in-app AI assistant powered by the Anthropic API, named to play on "Ricked." Will help users with bourbon recommendations, plain-language tasting note explanations, and recipe suggestions. Planned after the core social app is stable.
- Facebook and Apple OAuth (buttons stubbed in UI with TODO comments)
