'use client'

import { useEffect, useRef } from 'react'

export function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GRID_SIZE = 40
    const DOT_RADIUS = 1.5
    const INFLUENCE_RADIUS = 120

    const draw = () => {
      // Handle resize internally instead of window event for simplicity, though resizing logic is usually better separate
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cols = Math.ceil(canvas.width / GRID_SIZE)
      const rows = Math.ceil(canvas.height / GRID_SIZE)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID_SIZE
          const y = j * GRID_SIZE
          const dx = x - mouseRef.current.x
          const dy = y - mouseRef.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influence = Math.max(0, 1 - dist / INFLUENCE_RADIUS)
          
          const alpha = 0.15 + influence * 0.7
          const radius = DOT_RADIUS + influence * 2

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})` // violet-500
          ctx.fill()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 hidden sm:block"
      aria-hidden="true"
    />
  )
}
