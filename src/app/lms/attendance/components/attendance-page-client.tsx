"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    BarChart3,
    UserCheck,
    AlertTriangle,
    Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type {
    AttendanceDailyStats,
    AttendanceRow,
    AttendanceStatus,
} from "@/types/attendance"
import {
    checkInAttendance,
    checkOutAttendance,
    deleteAttendance,
    getAttendanceDailyStats,
    listAttendanceByDate,
    upsertAttendance,
} from "@/actions/attendance-actions"
import { AttendanceTable } from "./attendance-table"

interface AttendancePageClientProps {
    isAdmin: boolean
}

function todayKst(): string {
    return dayjs().format("YYYY-MM-DD")
}

function shiftDate(dateStr: string, deltaDays: number): string {
    return dayjs(dateStr).add(deltaDays, "day").format("YYYY-MM-DD")
}

export function AttendancePageClient({ isAdmin }: AttendancePageClientProps) {
    const [date, setDate] = React.useState<string>(todayKst())
    const [rows, setRows] = React.useState<AttendanceRow[]>([])
    const [stats, setStats] = React.useState<AttendanceDailyStats | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [keyword, setKeyword] = React.useState("")

    const load = React.useCallback(async () => {
        setLoading(true)
        const [listRes, statsRes] = await Promise.all([
            listAttendanceByDate(date),
            getAttendanceDailyStats(date),
        ])
        if (listRes.success && listRes.data) {
            setRows(listRes.data)
        } else if (!listRes.success) {
            toast.error(listRes.error)
            setRows([])
        }
        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data)
        }
        setLoading(false)
    }, [date])

    React.useEffect(() => {
        load()
    }, [load])

    const applyRowUpdate = (studentId: number, next: Partial<AttendanceRow>) => {
        setRows((prev) =>
            prev.map((r) => (r.studentId === studentId ? { ...r, ...next } : r)),
        )
    }

    const handleStatusChange = async (
        row: AttendanceRow,
        status: AttendanceStatus,
    ) => {
        if (!isAdmin) return
        const res = await upsertAttendance(row.studentId, date, status, row.memo)
        if (res.success && res.data) {
            applyRowUpdate(row.studentId, {
                attendanceId: res.data.id,
                status,
                checkInAt:
                    status === "PRESENT" || status === "LATE"
                        ? row.checkInAt ?? new Date().toISOString()
                        : row.checkInAt,
            })
            // 통계는 백그라운드 재조회
            getAttendanceDailyStats(date).then((r) => {
                if (r.success && r.data) setStats(r.data)
            })
            if (res.data.earned) {
                toast.success(`${row.name} 출석 포인트 +10 적립`, {
                    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
                })
            } else {
                toast.success(`${row.name} — ${ATTENDANCE_LABEL[status]} 저장됨`)
            }
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    const handleCheckIn = async (row: AttendanceRow) => {
        if (!isAdmin) return
        const wasEmpty = row.status == null
        const res = await checkInAttendance(row.studentId, date)
        if (res.success && res.data) {
            applyRowUpdate(row.studentId, res.data)
            getAttendanceDailyStats(date).then((r) => {
                if (r.success && r.data) setStats(r.data)
            })
            if (wasEmpty) {
                toast.success(`${row.name} 등원 완료 (+10p)`, {
                    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
                })
            } else {
                toast.success(`${row.name} 등원 완료`)
            }
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    const handleCheckOut = async (row: AttendanceRow) => {
        if (!isAdmin) return
        const res = await checkOutAttendance(row.studentId, date)
        if (res.success && res.data) {
            applyRowUpdate(row.studentId, res.data)
            toast.success(`${row.name} 하원 완료`)
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    const handleDelete = async (row: AttendanceRow) => {
        if (!isAdmin) return
        if (!window.confirm(`${row.name} 학생의 ${date} 출결 기록을 삭제할까요?`)) {
            return
        }
        const res = await deleteAttendance(row.studentId, date)
        if (res.success) {
            applyRowUpdate(row.studentId, {
                attendanceId: null,
                status: null,
                checkInAt: null,
                checkOutAt: null,
                memo: null,
            })
            getAttendanceDailyStats(date).then((r) => {
                if (r.success && r.data) setStats(r.data)
            })
            toast.success("삭제되었습니다.")
        } else {
            toast.error(res.error)
        }
    }

    const filteredRows = React.useMemo(() => {
        if (!keyword.trim()) return rows
        const kw = keyword.trim().toLowerCase()
        return rows.filter(
            (r) =>
                r.name.toLowerCase().includes(kw) ||
                (r.school ?? "").toLowerCase().includes(kw) ||
                (r.grade ?? "").toLowerCase().includes(kw) ||
                (r.academyName ?? "").toLowerCase().includes(kw),
        )
    }, [rows, keyword])

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        출결 관리
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl"
                            onClick={() => setDate(shiftDate(date, -1))}
                            aria-label="전날"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            className="h-9 text-xs w-[150px] bg-card"
                            value={date}
                            max={todayKst()}
                            onChange={(e) => setDate(e.target.value || todayKst())}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-xl"
                            onClick={() => setDate(shiftDate(date, 1))}
                            disabled={date >= todayKst()}
                            aria-label="다음날"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant={date === todayKst() ? "default" : "outline"}
                            className="h-9 text-xs rounded-xl"
                            onClick={() => setDate(todayKst())}
                        >
                            오늘
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                        <StatCard
                            icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
                            title="출석 + 지각"
                            value={
                                stats
                                    ? `${stats.present + stats.late}명`
                                    : "--"
                            }
                            description={
                                stats
                                    ? `전체 ${stats.activeStudents}명 중`
                                    : ""
                            }
                        />
                        <StatCard
                            icon={<Clock className="h-5 w-5 text-amber-500" />}
                            title="지각 / 조퇴"
                            value={
                                stats
                                    ? `${stats.late} / ${stats.earlyLeave}`
                                    : "--"
                            }
                        />
                        <StatCard
                            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                            title="결석 (사유 포함)"
                            value={
                                stats
                                    ? `${stats.absent + stats.excused}명`
                                    : "--"
                            }
                            description={
                                stats
                                    ? `결석 ${stats.absent} · 사유 ${stats.excused}`
                                    : ""
                            }
                        />
                        <StatCard
                            icon={<BarChart3 className="h-5 w-5 text-primary" />}
                            title="출석률"
                            value={
                                stats?.attendanceRate != null
                                    ? `${stats.attendanceRate}%`
                                    : "--%"
                            }
                            description={
                                stats
                                    ? `기록 ${stats.recorded} / ${stats.activeStudents}`
                                    : ""
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2 shrink-0">
                        <Input
                            placeholder="이름·학교·학년·학원 검색"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="h-9 text-xs bg-card w-[240px]"
                        />
                        <span className="text-[11px] text-muted-foreground">
                            {filteredRows.length}명 표시됨
                        </span>
                    </div>

                    <Card className="flex-1 min-h-0 rounded-2xl border border-border overflow-hidden">
                        <AttendanceTable
                            rows={filteredRows}
                            loading={loading}
                            isAdmin={isAdmin}
                            onStatusChange={handleStatusChange}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                            onDelete={handleDelete}
                        />
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
    PRESENT: "출석",
    LATE: "지각",
    EARLY_LEAVE: "조퇴",
    ABSENT: "결석",
    EXCUSED: "사유결석",
}

function StatCard({
    icon,
    title,
    value,
    description,
}: {
    icon: React.ReactNode
    title: string
    value: string
    description?: string
}) {
    return (
        <Card className="rounded-2xl border border-border shadow-card">
            <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">
                        {title}
                    </p>
                    <p className="text-lg font-bold">{value}</p>
                    {description && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
