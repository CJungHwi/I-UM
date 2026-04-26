"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { BarChart3, CheckCircle2, Circle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { ClassRow } from "@/types/class"
import type {
    ClassProgressRow,
    ClassProgressStats,
} from "@/types/curriculum"
import {
    getClassProgress,
    getClassProgressStats,
    markClassProgress,
} from "@/actions/curriculum-actions"

interface ProgressPanelProps {
    classRow: ClassRow
    isAdmin: boolean
}

export function ProgressPanel({ classRow, isAdmin }: ProgressPanelProps) {
    const [rows, setRows] = React.useState<ClassProgressRow[]>([])
    const [stats, setStats] = React.useState<ClassProgressStats | null>(null)
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback(async () => {
        setLoading(true)
        const [progRes, statsRes] = await Promise.all([
            getClassProgress(classRow.id),
            getClassProgressStats(classRow.id),
        ])
        if (progRes.success && progRes.data) {
            setRows(progRes.data)
        } else if (!progRes.success) {
            toast.error(progRes.error)
            setRows([])
        }
        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data)
        }
        setLoading(false)
    }, [classRow.id])

    React.useEffect(() => {
        load()
    }, [load])

    const handleToggle = async (row: ClassProgressRow, completed: boolean) => {
        if (!isAdmin) return
        const res = await markClassProgress(
            classRow.id,
            row.curriculumId,
            completed,
        )
        if (res.success) {
            // 낙관적 갱신
            setRows((prev) =>
                prev.map((r) =>
                    r.curriculumId === row.curriculumId
                        ? {
                              ...r,
                              completedAt: completed
                                  ? (r.completedAt ?? new Date().toISOString())
                                  : null,
                          }
                        : r,
                ),
            )
            getClassProgressStats(classRow.id).then((s) => {
                if (s.success && s.data) setStats(s.data)
            })
        } else {
            toast.error(res.error)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 gap-2 text-sm text-muted-foreground">
                <p>이 과목/레벨의 커리큘럼이 없습니다.</p>
                <p className="text-xs">
                    ‘커리큘럼’ 탭에서 단원을 먼저 등록하세요.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <Card className="rounded-2xl border border-border">
                <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground">
                            진도율
                        </p>
                        <p className="text-lg font-bold">
                            {stats?.progressRate != null
                                ? `${stats.progressRate}%`
                                : "—"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">
                            완료 / 전체
                        </p>
                        <p className="text-sm font-semibold">
                            {stats?.completedUnits ?? 0} / {stats?.totalUnits ?? 0}
                        </p>
                    </div>
                    {/* 얇은 진행 바 */}
                    <div className="w-36 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{
                                width: `${stats?.progressRate ?? 0}%`,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <ul className="flex flex-col gap-1">
                {rows.map((row) => {
                    const completed = row.completedAt != null
                    return (
                        <li
                            key={row.curriculumId}
                            className={cn(
                                "flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-card transition-colors",
                                completed && "bg-primary/5",
                            )}
                        >
                            {isAdmin ? (
                                <Checkbox
                                    checked={completed}
                                    onCheckedChange={(v) =>
                                        handleToggle(row, Boolean(v))
                                    }
                                    className="mt-0.5"
                                />
                            ) : completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                            ) : (
                                <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0"
                                    >
                                        단원 {row.unitNo}
                                    </Badge>
                                    <span
                                        className={cn(
                                            "text-xs font-semibold",
                                            completed &&
                                                "text-muted-foreground",
                                        )}
                                    >
                                        {row.unitTitle}
                                    </span>
                                    {row.estWeek && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1 py-0"
                                        >
                                            {row.estWeek}주
                                        </Badge>
                                    )}
                                </div>
                                {row.planMemo && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line">
                                        {row.planMemo}
                                    </p>
                                )}
                                {completed && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        완료:{" "}
                                        {row.completedAt
                                            ? dayjs(row.completedAt).format(
                                                  "YYYY-MM-DD HH:mm",
                                              )
                                            : "—"}
                                        {row.teacherName
                                            ? ` · ${row.teacherName}`
                                            : ""}
                                    </p>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
