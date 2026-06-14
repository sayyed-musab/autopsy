'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { createAutopsyStream } from '../lib/api'
import { AGENT_IDS } from '../lib/constants'

const initialAgentState = () => ({
  status: 'idle',
  output: '',
  confidence: 0,
  sparklineData: Array(20).fill(0)
})

const initialState = {
  runId: null,
  subject: '',
  status: 'idle',
  agents: {
    strategist: initialAgentState(),
    operator: initialAgentState(),
    finance: initialAgentState(),
    devils_advocate: initialAgentState(),
    verdict: initialAgentState()
  },
  faultScores: [0, 0, 0, 0, 0, 0],
  rootCause: '',
  logs: [],
  pipelineStage: 0
}

export function useAutopsy() {
  const [state, setState] = useState(initialState)
  const statusRef = useRef(initialState.status)
  const streamMetrics = useRef({})

  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  const addLog = useCallback((message, type = 'n') => {
    const now = new Date()
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => n.toString().padStart(2, '0')).join(':')
    setState(prev => ({
      ...prev,
      logs: [{ time, message, type }, ...prev.logs].slice(0, 12)
    }))
  }, [])

  const getStreamConfidence = useCallback((metrics, done = false) => {
    if (!metrics || metrics.chars === 0) return 0
    const elapsedSeconds = Math.max(0.5, (Date.now() - metrics.startedAt) / 1000)
    const charsPerSecond = metrics.chars / elapsedSeconds
    const volumeScore = Math.min(50, metrics.chars / 10)
    const chunkScore = Math.min(25, metrics.chunks * 1.4)
    const throughputScore = Math.min(20, charsPerSecond / 5)
    const doneBonus = done ? 5 : 0
    return Math.min(100, Math.round(volumeScore + chunkScore + throughputScore + doneBonus))
  }, [])

  const resetStreamMetrics = useCallback(() => {
    streamMetrics.current = {}
    ;[...AGENT_IDS, 'verdict'].forEach(agentId => {
      streamMetrics.current[agentId] = {
        startedAt: Date.now(),
        chunks: 0,
        chars: 0,
        output: '',
        sparklineData: Array(20).fill(0)
      }
    })
  }, [])

  const applyStreamToken = useCallback((agentId, token) => {
    const metrics = streamMetrics.current[agentId]
    if (!metrics) return
    metrics.output += token
    metrics.chunks += 1
    metrics.chars += token.length
    metrics.sparklineData = [...metrics.sparklineData.slice(1), Math.max(1, Math.min(10, token.length))]
    const confidence = getStreamConfidence(metrics)

    setState(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: {
          ...prev.agents[agentId],
          status: 'thinking',
          output: metrics.output,
          confidence,
          sparklineData: metrics.sparklineData
        }
      }
    }))
  }, [getStreamConfidence])

  const finishStreamAgent = useCallback((agentId) => {
    const metrics = streamMetrics.current[agentId]
    const output = metrics?.output || ''
    const confidence = getStreamConfidence(metrics, true)

    setState(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: {
          ...prev.agents[agentId],
          status: 'done',
          output,
          confidence
        }
      }
    }))

    return output
  }, [getStreamConfidence])

  const parseFaultScores = (text) => {
    const match = text.match(/FAULT_SCORES:\s*strategy=(\d+(?:\.\d+)?),execution=(\d+(?:\.\d+)?),finance=(\d+(?:\.\d+)?),opportunity=(\d+(?:\.\d+)?),leadership=(\d+(?:\.\d+)?),market=(\d+(?:\.\d+)?)/)
    if (!match) return [6, 5, 7, 4, 5, 5]
    return match.slice(1).map(Number)
  }

  const parseRootCause = (text) => {
    const match = text.match(/ROOT_CAUSE:\s*(.+?)(?:\n|FAULT_SCORES:|$)/)
    return match ? match[1].trim() : ''
  }

  const runAutopsy = useCallback(async (subject) => {
    if (statusRef.current === 'running') return
    statusRef.current = 'running'
    resetStreamMetrics()
    setState({ ...initialState, subject, status: 'running', pipelineStage: 1 })
    addLog(`Autopsy initiated: "${subject.slice(0, 35)}${subject.length > 35 ? '...' : ''}"`, 'r')

    await new Promise((resolve) => {
      const runId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      const source = createAutopsyStream(subject)
      const completedAgents = new Set()

      setState(prev => ({ ...prev, runId }))
      addLog('Panel assembling - 4 agents standing by', 'a')

      AGENT_IDS.forEach(id => {
        addLog(`${id.replace('_', ' ')} is analyzing`, 'a')
        setState(prev => ({
          ...prev,
          agents: {
            ...prev.agents,
            [id]: { ...prev.agents[id], status: 'thinking', output: '', confidence: 0, sparklineData: Array(20).fill(0) }
          }
        }))
      })

      source.onmessage = (e) => {
        const data = JSON.parse(e.data)
        const agentId = data.agent_id

        if (agentId === '__run__' && data.done) {
          source.close()
          const verdictOutput = streamMetrics.current.verdict?.output || ''
          const faultScores = parseFaultScores(verdictOutput)
          const rootCause = parseRootCause(verdictOutput)
          const cleanVerdict = verdictOutput
            .replace(/ROOT_CAUSE:.*$/ms, '')
            .replace(/FAULT_SCORES:.*$/ms, '')
            .trim()

          setState(prev => ({
            ...prev,
            status: 'complete',
            pipelineStage: 3,
            faultScores,
            rootCause,
            agents: {
              ...prev.agents,
              verdict: { ...prev.agents.verdict, output: cleanVerdict, status: 'done' }
            }
          }))
          statusRef.current = 'complete'
          addLog('Verdict sealed', 'g')
          resolve()
          return
        }

        if (![...AGENT_IDS, 'verdict'].includes(agentId)) return

        if (data.done) {
          finishStreamAgent(agentId)
          completedAgents.add(agentId)
          if (AGENT_IDS.includes(agentId)) {
            addLog(`${agentId.replace('_', ' ')} sealed analysis`, 'g')
            if (AGENT_IDS.every(id => completedAgents.has(id))) {
              addLog('All agents complete - synthesizing verdict', 'r')
              setState(prev => ({
                ...prev,
                pipelineStage: 2,
                agents: {
                  ...prev.agents,
                  verdict: { ...prev.agents.verdict, status: 'thinking', output: '', confidence: 0, sparklineData: Array(20).fill(0) }
                }
              }))
            }
          }
          return
        }

        applyStreamToken(agentId, data.token || '')
      }

      source.onerror = () => {
        source.close()
        addLog('Error during autopsy - check backend', 'r')
        setState(prev => ({ ...prev, status: 'idle' }))
        statusRef.current = 'idle'
        resolve()
      }
    })
  }, [addLog, applyStreamToken, finishStreamAgent, resetStreamMetrics])

  return { state, runAutopsy }
}
