"use client"

import { useState, useCallback, useEffect } from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { GamiStudent, PointBalance, PointHistory, Badge } from "@/types/gamification"
import {
    getPointBalance,
    getPointHistory,
    getStudentBadges,
    getAllBadges,
} from "@/actions/gamification-actions"

import { StudentSelectPanel } from "./student-select-panel"
import { PointDashboardCard } from "./point-dashboard-card"
import { BadgeGrid } from "./badge-grid"
import { PointHistoryList } from "./point-history-list"
import { PointGrantBar } from "./point-grant-bar"
import { ConfettiEffect } from "./confetti-effect"

interface GamificationClientProps {
    students: GamiStudent[]
}

export function GamificationClient({ students }: GamificationClientProps) {
    const [selected, setSelected] = useState<GamiStudent | null>(null)
    const [balance, setBalance] = useState<PointBalance | null>(null)
    const [history, setHistory] = useState<PointHistory[]>([])
    const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
    const [allBadges, setAllBadges] = useState<Badge[]>([])
    const [loading, setLoading] = useState(false)
    const [confettiTrigger, setConfettiTrigger] = useState(0)
    const [animateKey, setAnimateKey] = useState(0)
    const [floatingPoints, setFloatingPoints] = useState<{ id: number; amount: number }[]>([])

    const loadStudentData = useCallback(async (studentId: number) => {
        setLoading(true)
        try {
            const [balRes, histRes, badgeRes, allBadgeRes] = await Promise.all([
                getPointBalance(studentId),
                getPointHistory(studentId),
                getStudentBadges(studentId),
                getAllBadges(),
            ])
            if (balRes.success && balRes.data) setBalance(balRes.data)
            if (histRes.success && histRes.data) setHistory(histRes.data)
            if (badgeRes.success && badgeRes.data) setEarnedBadges(badgeRes.data)
            if (allBadgeRes.success && allBadgeRes.data) setAllBadges(allBadgeRes.data)
        } catch {
            toast.error("데이터를 불러올 수 없습니다.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (selected) {
            loadStudentData(selected.id)
        } else {
            setBalance(null)
            setHistory([])
            setEarnedBadges([])
        }
    }, [selected, loadStudentData])

    const handlePointEarned = useCallback(async (earned: number, _total: number) => {
        setConfettiTrigger((p) => p + 1)
        setAnimateKey((p) => p + 1)

        const id = Date.now()
        setFloatingPoints((prev) => [...prev, { id, amount: earned }])
        setTimeout(() => setFloatingPoints((prev) => prev.filter((f) => f.id !== id)), 1200)

        if (selected) {
            await loadStudentData(selected.id)
        }
    }, [selected, loadStudentData])

    const handleSelect = (student: GamiStudent) => {
        setSelected(student)
    }

    return (
        <TooltipProvider>
            <ConfettiEffect trigger={confettiTrigger} />

            {/* 플로팅 포인트 팝업 */}
            {floatingPoints.map((fp) => (
                <div
                    key={fp.id}
                    className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float-up"
                >
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-2xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
                        <Star className="h-6 w-6 fill-white" />
                        +{fp.amount}P
                    </div>
                </div>
            ))}

            <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
                <div className="flex-1 min-h-0 flex flex-col gap-[3px] md:flex-row">
                    {/* 왼쪽: 학생 목록 */}
                    <Card className="w-full min-h-0 md:w-64 md:shrink-0 flex flex-col rounded-3xl border border-border shadow-card overflow-hidden max-h-[42vh] md:max-h-none">
                        <StudentSelectPanel
                            students={students}
                            selectedId={selected?.id ?? null}
                            onSelect={handleSelect}
                        />
                    </Card>

                    {/* 오른쪽: 대시보드 */}
                    <Card className="flex-1 min-h-0 flex flex-col rounded-3xl border border-border shadow-card overflow-hidden">
                        {!selected ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <div className="h-16 w-16 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                                    <Star className="h-8 w-8 text-amber-500 opacity-40" />
                                </div>
                                <p className="text-sm">왼쪽에서 학생을 선택하면</p>
                                <p className="text-sm">포인트와 배지 현황이 표시됩니다.</p>
                            </div>
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-4 space-y-4">
                                    {/* 포인트 요약 카드 */}
                                    <PointDashboardCard
                                        balance={balance}
                                        studentName={selected.name}
                                        animateKey={animateKey}
                                    />

                                    {/* 포인트 지급 바 */}
                                    <PointGrantBar
                                        studentId={selected.id}
                                        studentName={selected.name}
                                        onPointEarned={handlePointEarned}
                                    />

                                    {/* 배지 그리드 */}
                                    <BadgeGrid
                                        earned={earnedBadges}
                                        allBadges={allBadges}
                                    />

                                    {/* 포인트 히스토리 */}
                                    <PointHistoryList history={history} />
                                </div>
                            </ScrollArea>
                        )}
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    )
}
