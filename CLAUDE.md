# Kitchen Render AI — CLAUDE.md

## Project Overview

A Next.js app for a premium German kitchen showroom, made of two modules:

1. **Render tool** (`/`) — users upload a kitchen design screenshot (from Winner Design software or a photo), and the app uses OpenAI's GPT-4o (vision) to analyse the design, then DALL-E 3 to generate a photorealistic interior-photography-style render. Stateless, no auth, no database — see "Render Tool" section below.
2. **Lead automation** (`/leads`) — instant AI-drafted email + SMS outreach to new inquiries, with AI parsing of SMS replies to auto-book a call on the designer/manager's Outlook calendar. Has its own database, staff-only dashboard, and third-party integrations — see "Lead Automation Module" section below.

These are independent: the render tool's "no auth, no database, single page" constraints apply only to the render tool, not to `/leads`.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI API — GPT-4o (vision) + DALL-E 3 (render tool); GPT-4o-mini (lead automation drafting/parsing)
- **Database**: Postgres via Prisma (lead automation only)
- **Integrations**: Resend (email), Twilio (SMS), Microsoft Graph API (Outlook calendar)

## Project Structure

```
/app
  layout.tsx          # Root layout with metadata
  page.tsx            # Render tool main page — upload, result, download
  /api
    /render
      route.ts        # POST endpoint: accepts image, calls GPT-4o then DALL-E 3
    /leads
      route.ts        # GET (list) / POST (manual entry) — staff-only, behind basic auth
      /[id]/route.ts  # GET single lead + thread + call tasks
      /intake/route.ts # POST — public webhook, website form / Meta Lead Ads bridge posts here
    /sms
      /inbound/route.ts # POST — public Twilio webhook for inbound SMS replies
  /leads
    page.tsx           # Staff dashboard — lead list + manual "log a phone inquiry" form
    /[id]/page.tsx      # Single lead's message thread + booked calls
/components
  DropZone.tsx        # Drag-and-drop file upload component (render tool)
  ResultView.tsx      # Side-by-side original + rendered image with download (render tool)
  AddLeadForm.tsx     # Manual lead-entry form (lead automation)
/lib
  prisma.ts           # Prisma client singleton
  ai.ts               # draftOutreach() + parseInboundReply() — GPT-4o-mini prompts
  email.ts            # sendEmail() via Resend
  sms.ts              # sendSms() + Twilio signature validation
  calendar.ts         # createOutlookEvent() via Microsoft Graph (client-credentials flow)
  leadPipeline.ts      # createLeadAndOutreach() — shared by intake + manual entry
/prisma
  schema.prisma       # Lead, Message, CallTask models
middleware.ts          # Basic auth gate for /leads and /api/leads/*
.env.local            # Secrets (not committed)
.env.example          # Template showing required env vars
```

## Environment Variables

See `.env.example` for the full list and where to get each value. `OPENAI_API_KEY` is required for both modules; the lead automation module additionally needs `DATABASE_URL`, `LEADS_INTAKE_KEY`, `ADMIN_USERNAME`/`ADMIN_PASSWORD`, Resend, Twilio, and Azure/Graph credentials.

Create a `.env.local` file at the project root. Never commit this file.

## API Flow — Render Tool

1. User drops/selects an image on the upload page
2. `POST /api/render` receives the image as `multipart/form-data`
3. The route handler:
   a. Sends the image to **GPT-4o** with a prompt asking it to describe the kitchen design in detail (materials, style, layout, colours, finishes)
   b. Takes that description and sends it to **DALL-E 3** with a photorealistic interior photography prompt
   c. Returns the generated image URL
4. The frontend displays the original + generated image side by side
5. User can click **Download** to save the generated image

## API Flow — Lead Automation

1. A new inquiry comes in from one of: the showroom's marketing website (posts to `/api/leads/intake`), Meta Lead Ads (via a Zapier/Make bridge calling the same endpoint), or a phone call logged manually by staff at `/leads`.
2. `createLeadAndOutreach()` (`lib/leadPipeline.ts`) creates the `Lead` row, calls `draftOutreach()` to generate a personalised email + SMS from whatever details the lead gave, and sends both via Resend/Twilio. Each send is logged as a `Message`.
3. When the lead replies by SMS, Twilio posts to `/api/sms/inbound`. `parseInboundReply()` checks whether the reply names a specific callback time.
   - If yes: creates a `CallTask`, books the event on Outlook via `createOutlookEvent()` (Microsoft Graph), sends a confirmation SMS, and marks the lead `booked`.
   - If no (and no clarifying question has been sent yet): sends one auto follow-up asking for a specific day/time.
4. Staff work the `/leads` dashboard (behind basic auth) to see status, thread history, and booked calls.

## Key Design Decisions

### Render tool
- **No auth, no database, no payments** — pure stateless MVP
- **Single page** — everything on `app/page.tsx`
- **GPT-4o as intermediary** — vision analysis produces a rich text description that DALL-E 3 uses; this yields better results than passing the image directly to DALL-E
- **DALL-E 3 size**: 1024×1024 (default, most cost-effective for MVP)
- **File size limit**: 10 MB client-side, 4 MB Next.js body parser limit should be increased via `route.ts` config

### Lead automation
- **GPT-4o-mini**, not GPT-4o — drafting outreach copy and parsing reply intent don't need vision-tier quality, and inquiry volume makes cost matter
- **Basic auth, not a full auth system** — one manager/designer team; `ADMIN_USERNAME`/`ADMIN_PASSWORD` via `middleware.ts` is enough
- **SMS is the two-way channel** — email is outbound-only in V1; booking replies are parsed from SMS, since that's the natural reply channel for "call me at 3pm"
- **Single assignee** — booked calls go to `DESIGNER_EMAIL`/`OUTLOOK_MAILBOX_USER`; multi-staff routing is a V2 concern, not V1
- **Graceful no-ops when integrations aren't configured** — `lib/email.ts`, `lib/sms.ts`, and `lib/calendar.ts` log and skip instead of throwing when their API keys are missing, so the app runs in dev before every third-party account exists

## Design Language

- White background (`#ffffff`), dark text (`#111111`)
- Subtle box shadows, rounded corners
- Minimal — no unnecessary UI chrome
- Premium, clean aesthetic for a German kitchen brand

## Running Locally

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local (required for both modules)
# For the lead automation module, also set DATABASE_URL and run:
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the render tool, [http://localhost:3000/leads](http://localhost:3000/leads) for the lead dashboard.

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
npm run db:push  # Push Prisma schema to DATABASE_URL (lead automation)
```

## Out of Scope (V1)

### Render tool
- User authentication
- Storing images or history
- Payment / usage metering
- Multiple pages or routing
- Style presets or advanced options

### Lead automation
- Multi-staff lead routing/assignment (single assignee via `DESIGNER_EMAIL` for now)
- Inbound email reply parsing (SMS only)
- Payment / usage metering
- A UI for editing the AI's message templates (edit the prompt in `lib/ai.ts` directly)
