'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { initiateAutopsy, createAgentStream } from '../lib/api'
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
  const confidenceIntervals = useRef({})
  const sparklineIntervals = useRef({})

  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  useEffect(() => {
    const confidence = confidenceIntervals.current
    const sparklines = sparklineIntervals.current
    return () => {
      Object.values(confidence).forEach(clearInterval)
      Object.values(sparklines).forEach(clearInterval)
    }
  }, [])

  const addLog = useCallback((message, type = 'n') => {
    const now = new Date()
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => n.toString().padStart(2, '0')).join(':')
    setState(prev => ({
      ...prev,
      logs: [{ time, message, type }, ...prev.logs].slice(0, 12)
    }))
  }, [])

  const startConfidenceSim = useCallback((agentId) => {
    clearInterval(confidenceIntervals.current[agentId])
    let val = 20 + Math.random() * 20
    const iv = setInterval(() => {
      val = Math.min(95, val + Math.random() * 8 - 1)
      setState(prev => ({
        ...prev,
        agents: {
          ...prev.agents,
          [agentId]: { ...prev.agents[agentId], confidence: Math.round(val) }
        }
      }))
    }, 300)
    confidenceIntervals.current[agentId] = iv
  }, [])

  const stopConfidenceSim = useCallback((agentId, finalVal) => {
    clearInterval(confidenceIntervals.current[agentId])
    setState(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: { ...prev.agents[agentId], confidence: Math.round(finalVal) }
      }
    }))
  }, [])

  const startSparklineSim = useCallback((agentId) => {
    clearInterval(sparklineIntervals.current[agentId])
    const iv = setInterval(() => {
      const val = 3 + Math.random() * 6
      setState(prev => {
        const current = prev.agents[agentId].sparklineData
        const next = [...current.slice(1), val]
        return {
          ...prev,
          agents: {
            ...prev.agents,
            [agentId]: { ...prev.agents[agentId], sparklineData: next }
          }
        }
      })
    }, 300)
    sparklineIntervals.current[agentId] = iv
  }, [])

  const stopSparklineSim = useCallback((agentId) => {
    clearInterval(sparklineIntervals.current[agentId])
  }, [])

  const streamAgent = useCallback((runId, agentId) => {
    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        agents: {
          ...prev.agents,
          [agentId]: { ...prev.agents[agentId], status: 'thinking', output: '' }
        }
      }))
      startConfidenceSim(agentId)
      startSparklineSim(agentId)

      const source = createAgentStream(runId, agentId)
      let fullOutput = ''

      source.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.done) {
          source.close()
          stopConfidenceSim(agentId, 75 + Math.random() * 20)
          stopSparklineSim(agentId)
          setState(prev => ({
            ...prev,
            agents: {
              ...prev.agents,
              [agentId]: { ...prev.agents[agentId], status: 'done', output: fullOutput }
            }
          }))
          resolve(fullOutput)
        } else {
          fullOutput += data.token
          setState(prev => ({
            ...prev,
            agents: {
              ...prev.agents,
              [agentId]: { ...prev.agents[agentId], output: fullOutput }
            }
          }))
        }
      }

      source.onerror = () => {
        source.close()
        stopConfidenceSim(agentId, 60)
        stopSparklineSim(agentId)
        setState(prev => ({
          ...prev,
          agents: {
            ...prev.agents,
            [agentId]: { ...prev.agents[agentId], status: 'done', output: '[Analysis unavailable]' }
          }
        }))
        resolve('[Analysis unavailable]')
      }
    })
  }, [startConfidenceSim, stopConfidenceSim, startSparklineSim, stopSparklineSim])

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
    setState({ ...initialState, subject, status: 'running', pipelineStage: 1 })
    addLog(`Autopsy initiated: "${subject.slice(0, 35)}${subject.length > 35 ? '...' : ''}"`, 'r')

    try {
      const { run_id } = await initiateAutopsy(subject)
      setState(prev => ({ ...prev, runId: run_id }))
      addLog('Panel assembling - 4 agents standing by', 'a')

      await Promise.all(
        AGENT_IDS.map(id => {
          addLog(`${id.replace('_', ' ')} is analyzing`, 'a')
          return streamAgent(run_id, id)
        })
      )

      AGENT_IDS.forEach(id => addLog(`${id.replace('_', ' ')} sealed analysis`, 'g'))
      addLog('All agents complete - synthesizing verdict', 'r')
      setState(prev => ({ ...prev, pipelineStage: 2 }))

      const verdictOutput = await streamAgent(run_id, 'verdict')
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
          verdict: { ...prev.agents.verdict, output: cleanVerdict }
        }
      }))
      statusRef.current = 'complete'
      addLog('Verdict sealed', 'g')
    } catch (err) {
      addLog('Error during autopsy - check backend', 'r')
      setState(prev => ({ ...prev, status: 'idle' }))
      statusRef.current = 'idle'
    }
  }, [streamAgent, addLog])

  return { state, runAutopsy }
}
