'use client'

const dotColor = { r: 'var(--red)', g: 'var(--green)', a: 'var(--amber)', n: 'var(--muted)' }

export default function ActivityLog({ logs }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.15em', marginBottom: 10 }}>activity log</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'hidden' }}>
        {logs.length === 0 && (
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted)' }}>No events yet</div>
        )}
        {logs.map((log, i) => (
          <div key={`${log.time}-${i}`} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted2)' }}>
            <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{log.time}</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor[log.type] || dotColor.n, marginTop: 4, flexShrink: 0 }} />
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
