"use client"

import { useEffect, useState, useCallback } from "react"

interface Particle {
    id: number
    x: number
    color: string
    size: number
    duration: number
    delay: number
    shape: "circle" | "square" | "star"
}

const COLORS = [
    "#82AAE3", "#F9F54B", "#FF6B6B", "#51CF66",
    "#845EF7", "#FF922B", "#22B8CF", "#FF85C0",
]

const SHAPES: Particle["shape"][] = ["circle", "square", "star"]

interface ConfettiEffectProps {
    trigger: number
}

export function ConfettiEffect({ trigger }: ConfettiEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([])

    const createBurst = useCallback(() => {
        const burst: Particle[] = Array.from({ length: 40 }, (_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4,
            duration: Math.random() * 1.5 + 1.5,
            delay: Math.random() * 0.6,
            shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        }))
        setParticles(burst)
        setTimeout(() => setParticles([]), 3500)
    }, [])

    useEffect(() => {
        if (trigger > 0) createBurst()
    }, [trigger, createBurst])

    if (!particles.length) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-0 animate-confetti"
                    style={{
                        left: `${p.x}%`,
                        ["--duration" as string]: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                >
                    {p.shape === "star" ? (
                        <svg width={p.size * 2} height={p.size * 2} viewBox="0 0 24 24">
                            <polygon
                                points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9"
                                fill={p.color}
                            />
                        </svg>
                    ) : (
                        <div
                            style={{
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: p.shape === "circle" ? "50%" : "2px",
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
