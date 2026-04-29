"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import {
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    ArrowRight,
    MessageSquarePlus,
    UserCheck,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type {
    ConsultDetail,
    ConsultLog,
    ConsultStatus,
} from "@/types/consultation"
import {
    CONSULT_SOURCE_LABEL,
    CONSULT_STATUS_FLOW,
    CONSULT_STATUS_LABEL,
} from "@/types/consultation"
import { cn } from "@/lib/utils"
import {
    addConsultationLog,
    convertConsultationToStudent,
    deleteConsultation,
    listConsultationLogs,
    setConsultationStatus,
} from "@/actions/consultation-actions"
import { LevelTestSection } from "./level-test-section"

interface ConsultDetailPanelProps {
    consult: ConsultDetail | null
    loading: boolean
    isAdmin: boolean
    onEdit: () => void
    onRefresh: () => Promise<void>
}

const STATUS_BADGE: Record<ConsultStatus, string> = {
    NEW: "bg-primary/15 text-primary",
    IN_PROGRESS: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    WAIT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    CONVERTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    LOST: "bg-muted text-muted-foreground",
}

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-xs">{children}</span>
        </div>
    )
}

export function ConsultDetailPanel({
    consult,
    loading,
    isAdmin,
    onEdit,
    onRefresh,
}: ConsultDetailPanelProps) {
    const [busy, setBusy] = React.useState(false)
    const [convertOpen, setConvertOpen] = React.useState(false)

    if (loading) {
        return (
            <div className="flex justify-center items-center flex-1 py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!consult) {
        return (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                상담을 선택하면 상세 정보가 표시됩니다.
            </div>
        )
    }

    const isResolved = consult.status === "CONVERTED" || consult.status === "LOST"

    const handleQuickStatus = async (next: ConsultStatus) => {
        if (!isAdmin) return
        setBusy(true)
        const res = await setConsultationStatus(consult.id, next)
        setBusy(false)
        if (res.success) {
            toast.success(`상태를 ‘${CONSULT_STATUS_LABEL[next]}’로 변경했습니다.`)
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    const handleMarkLost = async () => {
        if (!isAdmin) return
        if (!window.confirm(`${consult.studentName} 상담을 이탈 처리할까요?`)) return
        setBusy(true)
        const res = await setConsultationStatus(consult.id, "LOST", "이탈 처리")
        setBusy(false)
        if (res.success) {
            toast.success("이탈 처리되었습니다.")
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    const handleDelete = async () => {
        if (!isAdmin) return
        if (!window.confirm(`${consult.studentName} 상담을 삭제할까요?`)) return
        setBusy(true)
        const res = await deleteConsultation(consult.id)
        setBusy(false)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="h-12 px-4 py-0 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-bold truncate">
                        {consult.studentName}
                    </span>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] border-transparent",
                            STATUS_BADGE[consult.status],
                        )}
                    >
                        {CONSULT_STATUS_LABEL[consult.status]}
                    </Badge>
                    {consult.grade && (
                        <Badge variant="secondary" className="text-[10px]">
                            {consult.grade}
                        </Badge>
                    )}
                    {consult.convertedStudentId && (
                        <Link
                            href={`/admission/students`}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                            <UserCheck className="h-3 w-3" />
                            학생 등록됨
                        </Link>
                    )}
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg"
                            onClick={onEdit}
                            disabled={busy}
                        >
                            <Pencil className="h-3 w-3 mr-1" />
                            수정
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg text-destructive"
                            onClick={handleDelete}
                            disabled={busy}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                        </Button>
                    </div>
                )}
            </div>

            <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col p-3 gap-2">
                <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">개요</TabsTrigger>
                    <TabsTrigger value="levelTest" className="flex-1">
                        레벨/반
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">
                        이력
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="overflow-auto">
                    <div className="flex flex-col gap-3 p-1">
                        {isAdmin && !isResolved && (
                            <Card className="rounded-2xl border border-border bg-muted/20">
                                <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold">
                                        상담 진행
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 flex flex-wrap items-center gap-2">
                                    <StatusStepper
                                        current={consult.status}
                                        onClick={isAdmin ? handleQuickStatus : undefined}
                                        disabled={busy}
                                    />
                                    <div className="flex-1" />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs rounded-lg"
                                        onClick={handleMarkLost}
                                        disabled={busy}
                                    >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        이탈
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs rounded-lg"
                                        onClick={() => setConvertOpen(true)}
                                        disabled={busy || !!consult.convertedStudentId}
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        학생 등록 전환
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-1">
                            <Field label="접수 경로">
                                {CONSULT_SOURCE_LABEL[consult.source]}
                            </Field>
                            <Field label="접수 일시">
                                {dayjs(consult.requestedAt).isValid()
                                    ? dayjs(consult.requestedAt).format("YYYY-MM-DD HH:mm")
                                    : "—"}
                            </Field>
                            <Field label="소속 학원">
                                {consult.academyName ?? "—"}
                            </Field>
                            <Field label="신청자">
                                {consult.contactName}
                            </Field>
                            <Field label="연락처">
                                {consult.contactPhone ?? "—"}
                            </Field>
                            <Field label="담당자">
                                {consult.counselorName ?? "—"}
                            </Field>
                            <Field label="학년">
                                {consult.grade ?? "—"}
                            </Field>
                            <Field label="희망 과목">
                                {consult.subject ?? "—"}
                            </Field>
                            <Field label="희망 일정">
                                {consult.preferSchedule ?? "—"}
                            </Field>
                        </div>

                        <div className="flex flex-col gap-1 p-1">
                            <span className="text-[11px] text-muted-foreground">
                                상담 내용
                            </span>
                            <div className="text-xs whitespace-pre-line rounded-md border border-border bg-muted/20 p-3 min-h-[96px]">
                                {consult.memo ?? "—"}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="levelTest" className="overflow-auto">
                    <LevelTestSection
                        consult={consult}
                        isAdmin={isAdmin}
                        onRefresh={onRefresh}
                    />
                </TabsContent>

                <TabsContent value="history" className="overflow-hidden flex flex-col">
                    <HistoryTab
                        consultId={consult.id}
                        isAdmin={isAdmin}
                    />
                </TabsContent>
            </Tabs>

            <ConvertDialog
                open={convertOpen}
                consult={consult}
                onOpenChange={setConvertOpen}
                onDone={async () => {
                    setConvertOpen(false)
                    await onRefresh()
                }}
            />
        </div>
    )
}

function StatusStepper({
    current,
    onClick,
    disabled,
}: {
    current: ConsultStatus
    onClick?: (s: ConsultStatus) => void
    disabled?: boolean
}) {
    const currentIdx = Math.max(0, CONSULT_STATUS_FLOW.indexOf(current))

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {CONSULT_STATUS_FLOW.map((s, idx) => {
                const done = idx < currentIdx
                const active = idx === currentIdx
                const isConverted = s === "CONVERTED"
                return (
                    <React.Fragment key={s}>
                        <button
                            type="button"
                            onClick={() => {
                                if (!onClick || disabled || isConverted) return
                                onClick(s)
                            }}
                            disabled={disabled || isConverted}
                            className={cn(
                                "h-7 px-2.5 rounded-lg text-[11px] border transition-colors",
                                active &&
                                    "bg-primary/15 text-primary border-primary/30",
                                done &&
                                    "bg-muted text-muted-foreground border-border",
                                !active && !done &&
                                    "bg-card text-foreground border-border hover:bg-muted/40",
                                isConverted && "cursor-not-allowed",
                            )}
                        >
                            {CONSULT_STATUS_LABEL[s]}
                        </button>
                        {idx < CONSULT_STATUS_FLOW.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

function HistoryTab({
    consultId,
    isAdmin,
}: {
    consultId: number
    isAdmin: boolean
}) {
    const [logs, setLogs] = React.useState<ConsultLog[]>([])
    const [loading, setLoading] = React.useState(true)
    const [note, setNote] = React.useState("")
    const [saving, setSaving] = React.useState(false)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listConsultationLogs(consultId)
        if (res.success && res.data) {
            setLogs(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setLogs([])
        }
        setLoading(false)
    }, [consultId])

    React.useEffect(() => {
        load()
    }, [load])

    const handleAdd = async () => {
        if (!note.trim()) {
            toast.warning("코멘트 내용을 입력하세요.")
            return
        }
        setSaving(true)
        const res = await addConsultationLog(consultId, note.trim())
        setSaving(false)
        if (res.success) {
            setNote("")
            toast.success("저장되었습니다.")
            await load()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col gap-2 flex-1 min-h-0 p-1">
            {isAdmin && (
                <div className="flex items-start gap-2">
                    <Textarea
                        className="text-xs bg-card resize-none"
                        rows={2}
                        placeholder="상담 진행 메모·통화 요약 등을 기록"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <Button
                        size="sm"
                        className="h-9 text-xs rounded-lg shrink-0"
                        onClick={handleAdd}
                        disabled={saving}
                    >
                        <MessageSquarePlus className="h-3 w-3 mr-1" />
                        기록
                    </Button>
                </div>
            )}
            <ScrollArea className="flex-1 min-h-0 rounded-md border border-border">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                        기록이 없습니다.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {logs.map((log) => (
                            <li key={log.id} className="p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {log.oldStatus !== log.newStatus ? (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] border-transparent",
                                                    STATUS_BADGE[log.newStatus],
                                                )}
                                            >
                                                {log.oldStatus
                                                    ? `${CONSULT_STATUS_LABEL[log.oldStatus]} → `
                                                    : ""}
                                                {CONSULT_STATUS_LABEL[log.newStatus]}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                코멘트
                                            </Badge>
                                        )}
                                        <span className="text-[11px] text-muted-foreground truncate">
                                            {log.userName ?? "시스템"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {dayjs(log.createdAt).isValid()
                                            ? dayjs(log.createdAt).format("YY-MM-DD HH:mm")
                                            : "—"}
                                    </span>
                                </div>
                                {log.note && (
                                    <p className="mt-1 text-xs whitespace-pre-line">
                                        {log.note}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </ScrollArea>
        </div>
    )
}

function ConvertDialog({
    open,
    consult,
    onOpenChange,
    onDone,
}: {
    open: boolean
    consult: ConsultDetail
    onOpenChange: (v: boolean) => void
    onDone: () => void | Promise<void>
}) {
    const [enrolledAt, setEnrolledAt] = React.useState<string>(
        dayjs().format("YYYY-MM-DD"),
    )
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (open) setEnrolledAt(dayjs().format("YYYY-MM-DD"))
    }, [open])

    const handleConvert = async () => {
        setBusy(true)
        const res = await convertConsultationToStudent(consult.id, enrolledAt)
        setBusy(false)
        if (res.success && res.data) {
            if (res.data.created) {
                toast.success(
                    `‘${consult.studentName}’ 학생이 등록되었습니다.`,
                )
            } else {
                toast.info("이미 전환된 상담입니다.")
            }
            await onDone()
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        학생 등록 전환
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                        상담 내용을 바탕으로 학생 마스터(`재원생 명부`)에 자동 등록합니다.
                        보호자 연락처는 대표 보호자로 함께 등록됩니다.
                    </p>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">등록일(수강 시작일)</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs bg-card"
                            value={enrolledAt}
                            onChange={(e) => setEnrolledAt(e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 p-3 text-xs flex flex-col gap-0.5">
                        <div>
                            <span className="text-muted-foreground">학생: </span>
                            {consult.studentName}
                            {consult.grade ? ` (${consult.grade})` : ""}
                        </div>
                        <div>
                            <span className="text-muted-foreground">학원: </span>
                            {consult.academyName ?? "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">보호자: </span>
                            {consult.contactName}
                            {consult.contactPhone ? ` · ${consult.contactPhone}` : ""}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={busy}
                    >
                        취소
                    </Button>
                    <Button onClick={handleConvert} disabled={busy}>
                        {busy ? "전환 중..." : "등록"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
