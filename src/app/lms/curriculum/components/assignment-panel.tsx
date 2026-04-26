"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import {
    Plus,
    Pencil,
    Trash2,
    Clock,
    Check,
    Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ClassRow } from "@/types/class"
import type {
    AssignmentRow,
    AssignmentSubmissionRow,
    AssignmentSubmissionStatus,
    AssignmentUpsertInput,
} from "@/types/assignment"
import { ASSIGNMENT_SUBMISSION_STATUS_LABEL } from "@/types/assignment"
import type { CurriculumUnit } from "@/types/curriculum"
import {
    createAssignment,
    deleteAssignment,
    listAssignmentSubmissions,
    listAssignmentsByClass,
    updateAssignment,
    upsertSubmission,
} from "@/actions/assignment-actions"
import { listCurriculumUnits } from "@/actions/curriculum-actions"

interface AssignmentPanelProps {
    classRow: ClassRow
    isAdmin: boolean
}

const STATUS_COLOR: Record<AssignmentSubmissionStatus, string> = {
    PENDING: "bg-muted text-muted-foreground",
    DONE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    LATE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    MISSING: "bg-destructive/15 text-destructive",
}

export function AssignmentPanel({ classRow, isAdmin }: AssignmentPanelProps) {
    const [rows, setRows] = React.useState<AssignmentRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selected, setSelected] = React.useState<AssignmentRow | null>(null)
    const [formOpen, setFormOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<AssignmentRow | null>(null)
    const [curriculumOptions, setCurriculumOptions] = React.useState<CurriculumUnit[]>([])

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listAssignmentsByClass(classRow.id)
        if (res.success && res.data) {
            setRows(res.data)
            setSelected((prev) => {
                if (prev && res.data!.some((r) => r.id === prev.id)) {
                    return res.data!.find((r) => r.id === prev.id) ?? null
                }
                return res.data![0] ?? null
            })
        } else if (!res.success) {
            toast.error(res.error)
            setRows([])
            setSelected(null)
        }
        setLoading(false)
    }, [classRow.id])

    React.useEffect(() => {
        load()
    }, [load])

    // 커리큘럼 옵션 (과제 생성 시 단원 연결용)
    React.useEffect(() => {
        listCurriculumUnits(classRow.academyId, classRow.subject, classRow.level).then(
            (res) => {
                if (res.success && res.data) setCurriculumOptions(res.data)
            },
        )
    }, [classRow.academyId, classRow.subject, classRow.level])

    const handleCreate = () => {
        setEditing(null)
        setFormOpen(true)
    }

    const handleEdit = (row: AssignmentRow) => {
        setEditing(row)
        setFormOpen(true)
    }

    const handleDelete = async (row: AssignmentRow) => {
        if (!window.confirm(`‘${row.title}’ 과제를 삭제할까요?`)) return
        const res = await deleteAssignment(row.id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await load()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-full min-h-0 gap-[3px] p-[3px]">
            <Card className="w-full md:w-[320px] md:shrink-0 flex flex-col rounded-2xl border border-border overflow-hidden max-h-[45vh] md:max-h-none">
                <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold">과제 목록</CardTitle>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={handleCreate}
                        >
                            <Plus className="h-3 w-3 mr-0.5" />
                            과제
                        </Button>
                    )}
                </CardHeader>
                <ScrollArea className="flex-1 min-h-0">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-6 text-center">
                            등록된 과제가 없습니다.
                        </p>
                    ) : (
                        <ul className="p-1">
                            {rows.map((row) => {
                                const active = row.id === selected?.id
                                const overdue =
                                    row.dueAt &&
                                    dayjs(row.dueAt).isValid() &&
                                    dayjs(row.dueAt).isBefore(dayjs())
                                return (
                                    <li key={row.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(row)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-xl transition-colors group",
                                                "hover:bg-muted/50",
                                                active &&
                                                    "bg-primary/15 hover:bg-primary/20",
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-xs font-semibold truncate">
                                                    {row.title}
                                                </span>
                                                {isAdmin && (
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEdit(row)
                                                            }}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(row)
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            {row.unitTitle && (
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {row.unitTitle}
                                                </p>
                                            )}
                                            <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                                                {row.dueAt ? (
                                                    <span
                                                        className={cn(
                                                            "flex items-center gap-0.5",
                                                            overdue
                                                                ? "text-amber-600"
                                                                : "text-muted-foreground",
                                                        )}
                                                    >
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {dayjs(row.dueAt).format(
                                                            "MM-DD HH:mm",
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        마감 없음
                                                    </span>
                                                )}
                                                <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                                                    <span className="text-emerald-600">
                                                        {row.doneCount}
                                                    </span>
                                                    /
                                                    <span>{row.totalStudents}</span>
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </ScrollArea>
            </Card>

            <Card className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border overflow-hidden">
                {selected ? (
                    <SubmissionMatrix
                        assignment={selected}
                        isAdmin={isAdmin}
                        onRefresh={load}
                    />
                ) : (
                    <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                        과제를 선택하면 제출 현황이 표시됩니다.
                    </div>
                )}
            </Card>

            {isAdmin && (
                <AssignmentFormDialog
                    open={formOpen}
                    classRow={classRow}
                    curriculumOptions={curriculumOptions}
                    initial={editing}
                    onOpenChange={setFormOpen}
                    onSaved={async () => {
                        setFormOpen(false)
                        await load()
                    }}
                />
            )}
        </div>
    )
}

function SubmissionMatrix({
    assignment,
    isAdmin,
    onRefresh,
}: {
    assignment: AssignmentRow
    isAdmin: boolean
    onRefresh: () => Promise<void>
}) {
    const [subs, setSubs] = React.useState<AssignmentSubmissionRow[]>([])
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listAssignmentSubmissions(assignment.id)
        if (res.success && res.data) {
            setSubs(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setSubs([])
        }
        setLoading(false)
    }, [assignment.id])

    React.useEffect(() => {
        load()
    }, [load])

    const handleStatusChange = async (
        row: AssignmentSubmissionRow,
        status: AssignmentSubmissionStatus,
    ) => {
        if (!isAdmin) return
        const res = await upsertSubmission({
            assignmentId: assignment.id,
            studentId: row.studentId,
            status,
            score: row.score,
            feedback: row.feedback,
        })
        if (res.success && res.data) {
            // 낙관적 갱신 + 전체 통계는 요약용 리로드
            setSubs((prev) =>
                prev.map((r) =>
                    r.studentId === row.studentId
                        ? {
                              ...r,
                              status: res.data!.status,
                              submittedAt:
                                  res.data!.status === "DONE" ||
                                  res.data!.status === "LATE"
                                      ? r.submittedAt ?? new Date().toISOString()
                                      : r.submittedAt,
                              aPointEarned: res.data!.aPointEarned,
                          }
                        : r,
                ),
            )
            if (res.data.earnedNow) {
                toast.success(`${row.studentName} A등급 포인트 +50 적립`, {
                    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
                })
            }
            await onRefresh()
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    const handleScoreChange = async (
        row: AssignmentSubmissionRow,
        scoreStr: string,
    ) => {
        if (!isAdmin) return
        const v = scoreStr.trim()
        const score = v === "" ? null : Number(v)
        if (score != null && (!Number.isFinite(score) || score < 0 || score > 100)) {
            toast.warning("점수는 0~100 사이로 입력하세요.")
            return
        }
        const effectiveStatus: AssignmentSubmissionStatus =
            row.status === "PENDING" || row.status === "MISSING"
                ? "DONE"
                : row.status
        const res = await upsertSubmission({
            assignmentId: assignment.id,
            studentId: row.studentId,
            status: effectiveStatus,
            score,
            feedback: row.feedback,
        })
        if (res.success && res.data) {
            setSubs((prev) =>
                prev.map((r) =>
                    r.studentId === row.studentId
                        ? {
                              ...r,
                              status: res.data!.status,
                              score,
                              aPointEarned: res.data!.aPointEarned,
                          }
                        : r,
                ),
            )
            if (res.data.earnedNow) {
                toast.success(`${row.studentName} A등급 포인트 +50 적립`, {
                    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
                })
            }
            await onRefresh()
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="h-10 px-3 py-0 border-b border-border bg-muted/20 flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold truncate">
                    {assignment.title}
                </span>
                {assignment.dueAt && (
                    <Badge variant="outline" className="text-[10px]">
                        마감 {dayjs(assignment.dueAt).format("MM-DD HH:mm")}
                    </Badge>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                        <Check className="h-3 w-3 text-emerald-500" />
                        {assignment.doneCount}
                    </span>
                    <span>
                        지연 {assignment.lateCount} · 미완{" "}
                        {assignment.missingCount} · 미제출{" "}
                        {assignment.pendingCount}
                    </span>
                </span>
            </div>
            {assignment.body && (
                <div className="px-3 py-2 border-b border-border bg-muted/10 text-[11px] whitespace-pre-line shrink-0">
                    {assignment.body}
                </div>
            )}
            <ScrollArea className="flex-1 min-h-0">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : subs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                        반 소속 학생이 없습니다.
                    </p>
                ) : (
                    <Table className="w-full table-fixed border-separate border-spacing-0">
                        <TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
                            <TableRow className="h-[40px] hover:bg-transparent">
                                <TableHead className="text-[11px] w-[120px]">
                                    학생
                                </TableHead>
                                <TableHead className="text-[11px] w-[120px] text-center">
                                    상태
                                </TableHead>
                                <TableHead className="text-[11px] w-[80px] text-center">
                                    점수
                                </TableHead>
                                <TableHead className="text-[11px] text-center hidden md:table-cell">
                                    제출 시각
                                </TableHead>
                                <TableHead className="text-[11px] w-[60px] text-center">
                                    A등급
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subs.map((row) => (
                                <TableRow
                                    key={row.studentId}
                                    className="h-[40px] hover:bg-muted/30"
                                >
                                    <TableCell className="text-xs font-semibold truncate max-w-[120px]">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="truncate block">
                                                    {row.studentName}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {row.studentName}
                                                {row.grade ? ` (${row.grade})` : ""}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="p-1">
                                        {isAdmin ? (
                                            <Select
                                                value={row.status}
                                                onValueChange={(v) =>
                                                    handleStatusChange(
                                                        row,
                                                        v as AssignmentSubmissionStatus,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-8 text-xs bg-card justify-center",
                                                        STATUS_COLOR[row.status],
                                                    )}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(
                                                        [
                                                            "PENDING",
                                                            "DONE",
                                                            "LATE",
                                                            "MISSING",
                                                        ] as AssignmentSubmissionStatus[]
                                                    ).map((s) => (
                                                        <SelectItem key={s} value={s}>
                                                            {
                                                                ASSIGNMENT_SUBMISSION_STATUS_LABEL[
                                                                    s
                                                                ]
                                                            }
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px]",
                                                    STATUS_COLOR[row.status],
                                                )}
                                            >
                                                {
                                                    ASSIGNMENT_SUBMISSION_STATUS_LABEL[
                                                        row.status
                                                    ]
                                                }
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-1 text-center">
                                        {isAdmin ? (
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                className="h-8 text-xs text-center bg-card"
                                                defaultValue={row.score ?? ""}
                                                onBlur={(e) => {
                                                    if (
                                                        String(row.score ?? "") !==
                                                        e.target.value.trim()
                                                    ) {
                                                        handleScoreChange(
                                                            row,
                                                            e.target.value,
                                                        )
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-xs">
                                                {row.score ?? "—"}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-center hidden md:table-cell tabular-nums">
                                        {row.submittedAt &&
                                        dayjs(row.submittedAt).isValid()
                                            ? dayjs(row.submittedAt).format(
                                                  "MM-DD HH:mm",
                                              )
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {row.aPointEarned && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Sparkles className="h-4 w-4 text-amber-500 inline" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    +50p 적립됨
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </ScrollArea>
        </div>
    )
}

function AssignmentFormDialog({
    open,
    classRow,
    curriculumOptions,
    initial,
    onOpenChange,
    onSaved,
}: {
    open: boolean
    classRow: ClassRow
    curriculumOptions: CurriculumUnit[]
    initial: AssignmentRow | null
    onOpenChange: (v: boolean) => void
    onSaved: () => void | Promise<void>
}) {
    const [form, setForm] = React.useState<AssignmentUpsertInput>({
        id: 0,
        classId: classRow.id,
        curriculumId: null,
        title: "",
        body: "",
        dueAt: null,
    })
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (initial) {
            setForm({
                id: initial.id,
                classId: classRow.id,
                curriculumId: initial.curriculumId,
                title: initial.title,
                body: initial.body ?? "",
                dueAt: initial.dueAt
                    ? dayjs(initial.dueAt).format("YYYY-MM-DDTHH:mm")
                    : null,
            })
        } else {
            setForm({
                id: 0,
                classId: classRow.id,
                curriculumId: null,
                title: "",
                body: "",
                dueAt: null,
            })
        }
    }, [open, initial, classRow.id])

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            toast.warning("과제 제목을 입력하세요.")
            return
        }
        setBusy(true)
        const res = initial
            ? await updateAssignment(form)
            : await createAssignment(form)
        setBusy(false)
        if (res.success) {
            toast.success(
                initial ? "수정되었습니다." : "과제가 생성되었습니다.",
            )
            await onSaved()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        {initial ? "과제 수정" : "과제 생성"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">제목 *</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">연결 단원</Label>
                            <Select
                                value={
                                    form.curriculumId
                                        ? String(form.curriculumId)
                                        : "__none__"
                                }
                                onValueChange={(v) =>
                                    setForm({
                                        ...form,
                                        curriculumId:
                                            v === "__none__" ? null : Number(v),
                                    })
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue placeholder="(없음)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">(연결 없음)</SelectItem>
                                    {curriculumOptions.map((u) => (
                                        <SelectItem
                                            key={u.id}
                                            value={String(u.id)}
                                        >
                                            단원 {u.unitNo}. {u.unitTitle}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">마감 일시</Label>
                            <Input
                                type="datetime-local"
                                className="h-9 text-xs bg-card"
                                value={form.dueAt ?? ""}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        dueAt: e.target.value || null,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">내용</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={5}
                            value={form.body ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, body: e.target.value })
                            }
                        />
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
                    <Button onClick={handleSubmit} disabled={busy}>
                        {busy
                            ? "저장 중..."
                            : initial
                              ? "수정"
                              : "생성"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
