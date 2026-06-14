'use client'

export default function VerdictPanel({ verdictState, rootCause }) {
  const isActive = verdictState.status === 'thinking'
  const isSealed = verdictState.status === 'done'
  const borderColor = isActive || isSealed ? 'var(--red)' : 'var(--border)'

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color .3s' }}>
      <div style={{ height: 2, background: isActive || isSealed ? 'var(--red)' : 'var(--border)', animation: isActive ? 'pulse 1.2s ease-in-out infinite' : 'none' }} />
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--red)', border: '1px solid var(--red-glow)', padding: '2px 7px', borderRadius: 2, letterSpacing: '.12em' }}>FINAL VERDICT</div>
        <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Synthesis · The Verdict Agent</div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--amber)' : isSealed ? 'var(--green)' : 'var(--muted)', animation: isActive ? 'pulse 1s infinite' : 'none' }} />
      </div>
      <div style={{ padding: '14px 16px', fontSize: 12.5, lineHeight: 1.85, color: isSealed ? 'var(--text)' : 'var(--muted2)', overflowWrap: 'anywhere' }}>
        {verdictState.output || 'Verdict assembles after all agents complete dissection.'}
        {isActive && <span style={{ display: 'inline-block', width: 5, height: 12, background: 'var(--red)', verticalAlign: 'text-bottom', marginLeft: 1, animation: 'blink .7s step-end infinite' }} />}

        {rootCause && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid var(--red-glow)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--red)', letterSpacing: '.18em', marginBottom: 5 }}>ROOT CAUSE IDENTIFIED</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{rootCause}</div>
          </div>
        )}
      </div>
    </div>
  )
}
