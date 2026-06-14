# AUTOPSY Client

Next.js 14 frontend for AUTOPSY.

## Stack

- Next.js 14 App Router
- React 18
- JavaScript only
- Tailwind CSS package available
- Chart.js
- react-chartjs-2 installed, though current chart components use Chart.js directly

## Run

```powershell
cd "D:\Codex Pune\client"
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

```powershell
npm run dev
npm run lint
npm run build
npm run start
```

## Source Map

- `src/app/page.jsx` - main AUTOPSY interface.
- `src/app/layout.jsx` - app metadata and root layout.
- `src/app/globals.css` - design tokens and global CSS.
- `src/hooks/useAutopsy.js` - full frontend orchestration state machine.
- `src/lib/api.js` - backend API and EventSource helpers.
- `src/lib/constants.js` - agents, labels, examples, pipeline stages.
- `src/components` - reusable UI panels and charts.

## Backend URL

Default:

```text
http://localhost:8000
```

Override:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Restart the dev server after changing environment variables.

## Verification

```powershell
npm run lint
npm run build
```
