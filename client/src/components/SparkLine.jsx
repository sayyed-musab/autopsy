'use client'
import { useEffect, useRef } from 'react'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js'
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler)

export default function SparkLine({ data, color }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  const initialDataRef = useRef(data)

  useEffect(() => {
    if (!ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: initialDataRef.current.map((_, i) => i),
        datasets: [{ data: initialDataRef.current, borderColor: color, borderWidth: 1.5, pointRadius: 0, tension: .4, fill: true, backgroundColor: color + '22' }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } } }
    })
    return () => chartRef.current?.destroy()
  }, [color])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.data.datasets[0].data = data
    chartRef.current.data.labels = data.map((_, i) => i)
    chartRef.current.update('none')
  }, [data])

  return <canvas ref={ref} style={{ width: '100%', height: 32 }} />
}
