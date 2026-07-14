<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MarkPOS — Agent Instructions

## Project Context
MarkPOS is a commercial-grade cloud Point of Sale platform built with Next.js App Router, Supabase, and Tailwind CSS v4.

## Build Validation
After making changes, always run these commands in order:
1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

## Code Style
- Strict TypeScript — no `any`, no `@ts-ignore`
- Feature-based architecture under `src/features/`
- Pure domain logic under `src/domain/` — no framework imports
- `cn()` utility for class merging (clsx + tailwind-merge)
- `"use client"` only when interactivity/browser APIs are needed
- Server Components by default

## Known Patterns
- Supabase client is lazy-initialized via `createClient()` singleton
- Theme uses `next-themes` with class strategy
- Auth handled by middleware at `src/middleware.ts`
- Responsive breakpoints: mobile < 768px, tablet 768–1023px, desktop >= 1024px
- Touch targets minimum 44×44px for interactive elements

## Database Migrations
- Supabase CLI linked to project: `jngclpncrbawhnhujhsn`
- After creating a new migration file, run `npm run db:push` to apply it
- Create new migrations with `npm run migration:new <name>`
- Check migration status with `npm run db:status`
- All catalog DB writes go through SECURITY DEFINER RPCs — direct INSERT/UPDATE/DELETE on products/items/barcodes is blocked by RLS
