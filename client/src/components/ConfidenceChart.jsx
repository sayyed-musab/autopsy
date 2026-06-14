'use client'
import { useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale)

export default function ConfidenceChart({ agents, agentsState }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const tickRef = useRef(0)

  useEffect(() => {
    if (!ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    const styles = getComputedStyle(document.documentElement)
    const muted = styles.getPropertyValue('--muted').trim()
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: [],
        datasets: agents.map(a => ({
          label: a.name,
          data: [],
          borderColor: a.color,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: .4
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: true, min: 0, max: 100, ticks: { color: muted, font: { size: 9, family: 'JetBrains Mono' }, stepSize: 50 }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    })
    return () => chartRef.current?.destroy()
  }, [agents])

  useEffect(() => {
    if (!chartRef.current) return
    const chart = chartRef.current
    const t = tickRef.current++
    chart.data.labels.push(t)
    agents.forEach((a, i) => {
      chart.data.datasets[i].data.push(agentsState[a.id].confidence)
    })
    if (chart.data.labels.length > 40) {
      chart.data.labels.shift()
      chart.data.datasets.forEach(ds => ds.data.shift())
    }
    chart.update('none')
  }, [agentsState, agents])

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.15em', marginBottom: 10 }}>confidence timeline</div>
      <div style={{ position: 'relative', height: 160 }}>
        <canvas ref={ref} />
      </div>
    </div>
  )
}
