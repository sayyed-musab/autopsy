'use client'
import SparkLine from './SparkLine'

export default function AgentCard({ agent, agentState }) {
  const isThinking = agentState.status === 'thinking'
  const isDone = agentState.status === 'done'

  const borderColor = isThinking ? 'var(--amber)' : isDone ? 'var(--green)' : 'var(--border)'
  const topBarColor = isThinking ? 'var(--amber)' : isDone ? 'var(--green)' : 'var(--border)'
  const dotColor = isThinking ? 'var(--amber)' : isDone ? 'var(--green)' : 'var(--muted)'

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 260, transition: 'border-color .3s', minWidth: 0 }}>
      <div style={{ height: 2, background: topBarColor, transition: 'background .3s', animation: isThinking ? 'pulse 1.2s ease-in-out infinite' : 'none' }} />

      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: agent.bgColor,
          border: `2px solid ${isThinking ? 'var(--amber)' : isDone ? 'var(--green)' : 'var(--border2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginBottom: 8,
          boxShadow: isThinking ? '0 0 0 3px var(--amber-dim)' : 'none',
          transition: 'all .3s'
        }}>
          {agent.emoji}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{agent.name}</div>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.tag}</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, marginLeft: 'auto', animation: isThinking ? 'pulse 1s infinite' : 'none', transition: 'background .3s', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ padding: '6px 12px 0', height: 44 }}>
        <SparkLine data={agentState.sparklineData} color={agent.color} />
      </div>

      <div style={{
        padding: '10px 12px', flex: 1,
        fontSize: 11, fontFamily: isDone ? 'Space Grotesk, sans-serif' : 'JetBrains Mono',
        color: isThinking ? 'var(--muted2)' : isDone ? 'var(--text)' : 'var(--muted2)',
        lineHeight: 1.7,
        overflowWrap: 'anywhere'
      }}>
        {agentState.output || 'Awaiting subject...'}
        {isThinking && <span style={{ display: 'inline-block', width: 5, height: 11, background: 'var(--amber)', verticalAlign: 'text-bottom', marginLeft: 1, animation: 'blink .7s step-end infinite' }} />}
      </div>
    </div>
  )
}
