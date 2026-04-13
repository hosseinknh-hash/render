# Kitchen Render AI — CLAUDE.md

## Project Overview

A single-page Next.js web app for a premium German kitchen showroom. Users upload a kitchen design screenshot (from Winner Design software or a photo), and the app uses OpenAI's GPT-4o (vision) to analyse the design, then DALL-E 3 to generate a photorealistic interior-photography-style render. The user can download the result.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI API — GPT-4o (vision analysis) + DALL-E 3 (image generation)

## Project Structure

```
/app
  layout.tsx          # Root layout with metadata
  page.tsx            # Single main page — upload, result, download
  /api
    /render
      route.ts        # POST endpoint: accepts image, calls GPT-4o then DALL-E 3
/components
  DropZone.tsx        # Drag-and-drop file upload component
  ResultView.tsx      # Side-by-side original + rendered image with download
.env.local            # OPENAI_API_KEY (not committed)
.env.example          # Template showing required env vars
```

## Environment Variables

```
OPENAI_API_KEY=sk-...
```

Create a `.env.local` file at the project root with the above. Never commit this file.

## API Flow

1. User drops/selects an image on the upload page
2. `POST /api/render` receives the image as `multipart/form-data`
3. The route handler:
   a. Sends the image to **GPT-4o** with a prompt asking it to describe the kitchen design in detail (materials, style, layout, colours, finishes)
   b. Takes that description and sends it to **DALL-E 3** with a photorealistic interior photography prompt
   c. Returns the generated image URL
4. The frontend displays the original + generated image side by side
5. User can click **Download** to save the generated image

## Key Design Decisions

- **No auth, no database, no payments** — pure stateless MVP
- **Single page** — everything on `app/page.tsx`
- **GPT-4o as intermediary** — vision analysis produces a rich text description that DALL-E 3 uses; this yields better results than passing the image directly to DALL-E
- **DALL-E 3 size**: 1024×1024 (default, most cost-effective for MVP)
- **File size limit**: 10 MB client-side, 4 MB Next.js body parser limit should be increased via `route.ts` config

## Design Language

- White background (`#ffffff`), dark text (`#111111`)
- Subtle box shadows, rounded corners
- Minimal — no unnecessary UI chrome
- Premium, clean aesthetic for a German kitchen brand

## Running Locally

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
```

## Out of Scope (V1)

- User authentication
- Storing images or history
- Payment / usage metering
- Multiple pages or routing
- Style presets or advanced options
