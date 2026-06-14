# Frontend Guide

The frontend lives in `client`.

It is a Next.js 14 App Router app written in JavaScript. Source files are `.jsx` and `.js`, not TypeScript.

## Files

```text
client/src
├── app
│   ├── layout.jsx
│   ├── page.jsx
│   └── globals.css
├── components
│   ├── ActivityLog.jsx
│   ├── AgentCard.jsx
│   ├── ConfidenceChart.jsx
│   ├── Pipeline.jsx
│   ├── RadarChart.jsx
│   ├── SparkLine.jsx
│   └── VerdictPanel.jsx
├── hooks
│   └── useAutopsy.js
└── lib
    ├── api.js
    └── constants.js
```

## Main Screen

`client/src/app/page.jsx` renders the complete product UI:

- Top status bar
- Subject input
- Example subject chips
- Four agent cards
- Fault radar chart
- Confidence timeline chart
- Verdict panel
- Pipeline panel
- Confidence bars
- Activity log

The page uses inline style objects for most component-level styling and CSS custom properties from `globals.css`.

## Global Styles

`client/src/app/globals.css` defines the design system:

- Background colors
- Surface/card/border colors
- Red, green, amber status colors
- Text and muted colors
- Font imports
- Global resets

Most UI colors should reference variables such as:

```css
var(--bg)
var(--card)
var(--red)
var(--green)
var(--muted)
```

Agent-specific accent colors come from `client/src/lib/constants.js`.

## API Wrapper

`client/src/lib/api.js` contains:

- `initiateAutopsy(subject)`
- `createAgentStream(runId, agentId)`

Default backend URL:

```javascript
http://localhost:8000
```

Override with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Constants

`client/src/lib/constants.js` contains:

- `AGENTS`
- `AGENT_IDS`
- `EXAMPLE_SUBJECTS`
- `PIPELINE_STAGES`
- `RADAR_LABELS`

To add or rename an agent, update constants and the backend orchestrator together.

## `useAutopsy.js`

This hook owns frontend runtime state.

State includes:

- `runId`
- `subject`
- global run `status`
- per-agent `status`, `output`, `confidence`, and `sparklineData`
- `faultScores`
- `rootCause`
- `logs`
- `pipelineStage`

Important functions:

- `addLog(message, type)` - prepends timestamped log entries.
- `startConfidenceSim(agentId)` - animates confidence while an agent streams.
- `startSparklineSim(agentId)` - animates sparkline data while an agent streams.
- `streamAgent(runId, agentId)` - opens `EventSource` and appends streamed tokens.
- `runAutopsy(subject)` - starts the whole frontend workflow.

Parallel panel streaming is done with:

```javascript
await Promise.all(
  AGENT_IDS.map(id => streamAgent(run_id, id))
)
```

## Verdict Parsing

The Verdict Agent emits structured lines:

```text
ROOT_CAUSE: ...
FAULT_SCORES: strategy=...,execution=...,finance=...,opportunity=...,leadership=...,market=...
```

The hook parses these with:

- `parseRootCause(text)`
- `parseFaultScores(text)`

Then it strips those structured tags from the displayed verdict text.

## Charts

Charts use Chart.js directly:

- `SparkLine.jsx` - tiny line chart per agent card.
- `RadarChart.jsx` - final fault distribution.
- `ConfidenceChart.jsx` - confidence over time.

Chart registration happens inside each chart component.

## Running

```powershell
cd "D:\Codex Pune\client"
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build Checks

```powershell
cd "D:\Codex Pune\client"
npm run lint
npm run build
```
