'use client'
import { PIPELINE_STAGES } from '../lib/constants'

export default function Pipeline({ pipelineStage }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.15em', marginBottom: 12 }}>orchestration pipeline</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: i < PIPELINE_STAGES.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `1px solid ${pipelineStage > stage.id ? 'var(--green)' : pipelineStage === stage.id ? 'var(--amber)' : 'var(--border2)'}`,
                background: pipelineStage > stage.id ? 'var(--green-dim)' : pipelineStage === stage.id ? 'var(--amber-dim)' : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, transition: 'all .3s'
              }}>
                {stage.emoji}
              </div>
              <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.08em' }}>{stage.label}</div>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 4px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
                {pipelineStage === stage.id + 1 && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, var(--red), transparent)', animation: 'lineflow .8s linear infinite' }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted2)' }}>
        {pipelineStage === 0 && '4 agents standing by'}
        {pipelineStage === 1 && 'parallel analysis running'}
        {pipelineStage === 2 && 'generating verdict'}
        {pipelineStage === 3 && 'analysis complete'}
      </div>
      <style>{`@keyframes lineflow { from{left:-60%} to{left:100%} }`}</style>
    </div>
  )
}
