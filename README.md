# Interactive Wall Calendar (Frontend Challenge)

Polished interactive calendar component inspired by a physical wall calendar design.

## Submission Links

- Source Code (GitHub/GitLab): `ADD_YOUR_REPO_LINK`
- Video Demonstration (Required): `ADD_YOUR_VIDEO_LINK`
- Live Demo (Optional): `ADD_YOUR_DEPLOYED_LINK`

## Challenge Coverage

### 1) Wall Calendar Aesthetic

- Spiral binder and center hook rendered in SVG.
- Hero media area at the top with calendar-style paper transition into the grid.
- Month and year anchored over the hero artwork.

### 2) Day Range Selector

- Click first day to set range start.
- Click second day to set range end.
- Start/end are visually distinct.
- In-between days are highlighted.
- Pointer drag selection is supported (desktop/touch pointer devices).
- "Clear Selection" action resets the range.
- Month navigation controls (`Prev`, `Today`, `Next`) are available.

### 3) Integrated Notes Section

- Month notes area with lined-paper styling.
- Notes persist in `localStorage`.
- Date range also persists in `localStorage`.
- Range-specific note input appears when a range is selected and persists separately.

### 4) Fully Responsive Design

- Desktop: notes and calendar grid are side by side.
- Mobile: layout stacks into notes first, then calendar for better touch use.
- Day cells and typography scale down on small screens.

### 5) Creative Extras

- Hero supports video (`public/climber.mp4`) with image fallback.
- Holiday markers are shown on selected static dates.
- Selection status text updates live (start or full range).
- Selected calendar month is persisted in `localStorage`.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- `next/font` for typography

## No Backend

This project is strictly frontend. Persistence uses browser `localStorage` only.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and Lint

```bash
npm run lint
npm run build
```

## GitHub Pages Deployment

- Workflow file is included at `.github/workflows/deploy-pages.yml`.
- It runs on pushes to `main` and publishes the static `out/` build to GitHub Pages.
- The workflow automatically sets `NEXT_PUBLIC_BASE_PATH` to the repository name so assets work on project pages.

## File Guide

- `src/app/page.tsx`: complete interactive wall calendar UI and state logic.
- `public/calendar-hero.svg`: fallback hero image.
- `public/climber.mp4`: hero video source.
- `src/app/layout.tsx`: app metadata and font setup.
- `src/app/globals.css`: global styles.

## Video Demo Checklist

Capture a short walkthrough showing:

1. Initial wall calendar view.
2. Start date and end date selection.
3. Highlighted in-range days.
4. Notes entry and refresh persistence.
5. Desktop vs mobile responsive behavior.
