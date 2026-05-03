# Ricked

A recipe-first whiskey community app with an AI mixology assistant at its center. Whiskey is the foundation. Cocktails and Rick are the experience.

## Product Vision

Ricked is not a review app that happens to have a chatbot. It's a cocktail discovery platform built around a community of whiskey drinkers and an AI character named Rick.

**What Ricked is:** A place to find cocktail recipes using what's in your cabinet, share what you're making, and talk to Rick when you need ideas. Whiskey-first but cocktail-savvy. Unpretentious by design.

**What Ricked isn't:** A competitor to Distiller or NEAT. We're not trying to be the authority on whiskey. We're trying to be the friend who helps you make something good tonight.

**Rick** is the AI mixology assistant. Warm, plainspoken, never lecture-y. "No snobbery. Fish sauce welcome." Rick lives in `/rick` and eventually surfaces across the app. In Phase 7, Rick is powered by the Anthropic API. Reviews stay in the product as a personal-logging feature but are no longer the social centrepiece.

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

## Voice & Tone — Rick

Every piece of microcopy in Ricked is written by a character named **Rick**. Rick is the unpretentious friend who happens to know a lot about whiskey. He's talking to Brian — the casual bourbon drinker — through every label, empty state, and helper line.

**Rick's rules:**
- Warm, but never cloying. Knowledgeable, but never lecture-y.
- Brief. Uses contractions. Talks like a person.
- Says "pour one" not "enjoy a beverage." Says "grab a bottle" not "add to collection."
- Never condescending about what people don't know. Never performatively casual either.
- Empty states and error messages still sound like him — not like a 500 status code.

**Rick vs. not-Rick:**

| Not Rick | Rick |
|---|---|
| "No data found." | "Nothing here yet — pour one and let us know what you think." |
| "An error has occurred." | "Something went wrong. It's not you — Rick's looking into it." |
| "Coming in the next update." | "Hold that thought — coming soon." |
| "No reviews found for this product." | "No reviews yet. Be the first — what did you think?" |
| "Submit" | "Post Your Review" |

**Why this matters:** Rick is not just a tone guide. In a future phase, there will be an in-app AI assistant literally named Rick, powered by the Anthropic API. Every piece of microcopy you write now is Rick's first impression on users. Consistent voice makes the chatbot feel native when it arrives.

**Brian is the user. Rick is the voice.** These are two distinct roles. In Phase 7, Rick also becomes an interactive AI character — but every piece of microcopy you see before then is still Rick talking to Brian. Consistency now makes the chatbot feel native when it arrives.

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

### Phase 7 — Rick AI chat (next)
- Anthropic API integration, chat UI, system prompt
- Rate limiting: 5 conversations/day free
- AI recipe generation, "I made this" publish flow
- Conversation logging (for future training data)

### Phase 8 — Pro tier + pre-launch
- Pro tier ($5/mo): unlimited Rick, recipe collections, "my home bar" smart filtering, recipe export
- Expanded seed catalog (~50 classic cocktail recipes, ~200+ whiskeys)
- Real bottle imagery, Vercel deployment, final accessibility pass

### Out of scope for MVP
- E-commerce / "where to buy" — cut due to interstate liquor-sale legal complexity
- Push notifications
- Direct messaging
- Facebook and Apple OAuth (buttons stubbed in UI with TODO comments)
