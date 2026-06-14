const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function initiateAutopsy(subject) {
  const res = await fetch(`${BASE_URL}/api/autopsy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject })
  })
  if (!res.ok) throw new Error('Failed to initiate autopsy')
  return res.json()
}

export function createAgentStream(runId, agentId) {
  return new EventSource(`${BASE_URL}/api/stream/${runId}/${agentId}`)
}
