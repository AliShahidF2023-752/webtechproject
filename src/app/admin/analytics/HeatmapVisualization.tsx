'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './Heatmap.module.css'

interface ClickEvent {
    x: number
    y: number
    viewport_width: number
    viewport_height: number
}

export default function HeatmapVisualization() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [page, setPage] = useState('/')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchAndDraw = async () => {
            setLoading(true)
            const supabase = createClient()

            // Fetch click events for this page
            const { data } = await supabase
                .from('interaction_events')
                .select('x, y, viewport_width, viewport_height')
                .eq('event_type', 'click')
                .eq('page', page)
                .limit(1000)

            if (!data || !canvasRef.current) {
                setLoading(false)
                return
            }

            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Reset canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Simple heatmap logic
            data.forEach((event: any) => {
                const x = (event.x / event.viewport_width) * canvas.width
                const y = (event.y / event.viewport_height) * canvas.height

                ctx.beginPath()
                ctx.arc(x, y, 20, 0, 2 * Math.PI)
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
                ctx.fill()
            })

            setLoading(false)
        }

        fetchAndDraw()
    }, [page])

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <label>Page URL: </label>
                <select value={page} onChange={(e) => setPage(e.target.value)} className={styles.select}>
                    <option value="/">Home</option>
                    <option value="/auth/login">Login</option>
                    <option value="/matchmaking">Matchmaking</option>
                </select>
                {loading && <span className={styles.loading}>Loading data...</span>}
            </div>

            <div className={styles.heatmapWrapper}>
                <div className={styles.overlay}>
                    <canvas
                        ref={canvasRef}
                        width={1200}
                        height={800}
                        className={styles.canvas}
                    />
                </div>
                <div className={styles.placeholder}>
                    <p>Select a page to view click density. (Requires user data)</p>
                </div>
            </div>
        </div>
    )
}
