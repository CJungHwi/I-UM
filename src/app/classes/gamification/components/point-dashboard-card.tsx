"use client"

import { Star, TrendingUp, Coins } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { PointBalance } from "@/types/gamification"

interface PointDashboardCardProps {
    balance: PointBalance | null
    studentName: string
    animateKey: number
}

export function PointDashboardCard({ balance, studentName, animateKey }: PointDashboardCardProps) {
    const current = balance?.currentPoint ?? 0
    const total = balance?.totalPoint ?? 0

    return (
        <Card className="rounded-3xl border border-border shadow-card overflow-hidden relative">
            {/* 그라데이션 상단 데코 */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400" />

            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Star className="h-6 w-6 text-white fill-white" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{studentName} 님의 포인트</p>
                        <div className="flex items-baseline gap-1" key={animateKey}>
                            <span className="text-3xl font-bold text-foreground animate-point-pop">
                                {current.toLocaleString()}
                            </span>
                            <span className="text-sm text-amber-500 font-bold">P</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <div>
                            <p className="text-[10px] text-muted-foreground">누적 획득</p>
                            <p className="text-sm font-bold">{total.toLocaleString()}P</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-[10px] text-muted-foreground">사용 포인트</p>
                            <p className="text-sm font-bold">{(balance?.usedPoint ?? 0).toLocaleString()}P</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
