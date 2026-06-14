'use client'
import { useState } from 'react'
import { useAutopsy } from '../hooks/useAutopsy'
import { AGENTS, EXAMPLE_SUBJECTS } from '../lib/constants'
import AgentCard from '../components/AgentCard'
import RadarChart from '../components/RadarChart'
import ConfidenceChart from '../components/ConfidenceChart'
import VerdictPanel from '../components/VerdictPanel'
import ActivityLog from '../components/ActivityLog'
import Pipeline from '../components/Pipeline'

export default function Home() {
  const [subject, setSubject] = useState('')
  const { state, runAutopsy } = useAutopsy()

  const handleRun = () => {
    if (!subject.trim() || state.status === 'running') return
    runAutopsy(subject.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: 'var(--text)' }}>
            AUTO<span style={{ color: 'var(--red)' }}>PSY</span>
          </span>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '0.15em', marginTop: 2 }}>
            multi-agent failure intelligence
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={pillStyle}>{state.status === 'running' ? 'DISSECTING' : state.status === 'complete' ? 'VERDICT SEALED' : 'STANDBY'}</div>
          <div style={pillStyle}><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', marginRight: 5, animation: 'ldot 2s infinite' }}></span>LIVE</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name a failed startup, product, or business decision..."
            rows={2}
            style={textareaStyle}
          />
          <button
            onClick={handleRun}
            disabled={state.status === 'running' || !subject.trim()}
            style={btnStyle(state.status === 'running' || !subject.trim())}
          >
            {state.status === 'running' ? 'RUNNING...' : 'INITIATE\nAUTOPSY'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted)' }}>try {'->'}</span>
          {EXAMPLE_SUBJECTS.map(ex => (
            <button key={ex} onClick={() => setSubject(ex)} style={chipStyle}>{ex}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 10, padding: '12px 20px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {AGENTS.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                agentState={state.agents[agent.id]}
              />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <RadarChart faultScores={state.faultScores} />
            <ConfidenceChart agents={AGENTS} agentsState={state.agents} />
          </div>

          <VerdictPanel
            verdictState={state.agents.verdict}
            rootCause={state.rootCause}
            pipelineStage={state.pipelineStage}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <Pipeline pipelineStage={state.pipelineStage} />
          <ConfidenceBars agents={AGENTS} agentsState={state.agents} />
          <ActivityLog logs={state.logs} />
        </div>
      </div>

      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted)' }}>
        <span>AUTOPSY v2.0 · multi-agent failure intelligence</span>
        <span>{state.status === 'complete' ? 'verdict sealed' : state.status === 'running' ? 'analysis in progress' : 'session ready'}</span>
      </div>

      <style>{`
        @keyframes ldot { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width: 1100px) {
          div[style*="repeat(4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 860px) {
          div[style*="280px"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 620px) {
          div[style*="repeat(4"] { grid-template-columns: 1fr !important; }
          textarea { min-height: 92px; }
        }
      `}</style>
    </div>
  )
}

function ConfidenceBars({ agents, agentsState }) {
  return (
    <div style={panelStyle}>
      <div style={panelLabelStyle}>agent confidence</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {agents.map(agent => (
          <div key={agent.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted2)', marginBottom: 4 }}>
              <span>{agent.name}</span>
              <span>{agentsState[agent.id].confidence > 0 ? agentsState[agent.id].confidence + '%' : '-'}</span>
            </div>
            <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: agent.color,
                width: agentsState[agent.id].confidence + '%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const pillStyle = { fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted2)', border: '1px solid var(--border2)', padding: '3px 8px', borderRadius: 2, letterSpacing: '.1em' }
const textareaStyle = { flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderLeft: '2px solid var(--red)', borderRadius: '0 6px 6px 0', color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, padding: '11px 14px', resize: 'none', outline: 'none', lineHeight: 1.4, minWidth: 0 }
const btnStyle = (disabled) => ({ background: disabled ? 'rgba(200,57,26,0.3)' : 'var(--red)', border: 'none', borderRadius: 6, color: 'white', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500, letterSpacing: '.1em', padding: '0 18px', height: 64, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'pre', lineHeight: 1.6, flexShrink: 0 })
const chipStyle = { fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--muted)', background: 'transparent', border: '1px solid var(--border)', padding: '4px 9px', borderRadius: 3, cursor: 'pointer' }
const panelStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }
const panelLabelStyle = { fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.15em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }
