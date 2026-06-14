'use client'
import { useEffect, useRef } from 'react'
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { RADAR_LABELS } from '../lib/constants'
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler)

export default function RadarChart({ faultScores }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const initialScoresRef = useRef(faultScores)

  useEffect(() => {
    if (!ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    const styles = getComputedStyle(document.documentElement)
    const red = styles.getPropertyValue('--red').trim()
    const muted = styles.getPropertyValue('--muted').trim()
    chartRef.current = new Chart(ref.current, {
      type: 'radar',
      data: {
        labels: RADAR_LABELS,
        datasets: [{
          label: 'Failure Weight',
          data: initialScoresRef.current,
          borderColor: red,
          backgroundColor: 'rgba(200,57,26,0.15)',
          borderWidth: 1.5,
          pointRadius: 3,
          pointBackgroundColor: red
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 800 },
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 10,
            ticks: { display: false, stepSize: 2 },
            grid: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: muted, font: { size: 10, family: 'JetBrains Mono' } },
            angleLines: { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    })
    return () => chartRef.current?.destroy()
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.data.datasets[0].data = faultScores
    chartRef.current.update()
  }, [faultScores])

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--muted)', letterSpacing: '.15em', marginBottom: 10 }}>fault distribution</div>
      <div style={{ position: 'relative', height: 160 }}>
        <canvas ref={ref} />
      </div>
    </div>
  )
}
