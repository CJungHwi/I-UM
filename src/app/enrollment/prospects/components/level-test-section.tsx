"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { Plus, Trash2, Trophy, Target, Sparkles, UserCheck } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ConsultDetail } from "@/types/consultation"
import type { ClassMatchRow } from "@/types/class"
import type { LevelTestRow } from "@/types/level-test"
import {
    deleteLevelTest,
    listLevelTestsByConsult,
    saveLevelTest,
} from "@/actions/level-test-actions"
import { enrollStudent, matchClasses } from "@/actions/class-actions"

interface LevelTestSectionProps {
    consult: ConsultDetail
    isAdmin: boolean
    onRefresh: () => Promise<void>
}

export function LevelTestSection({
    consult,
    isAdmin,
    onRefresh,
}: LevelTestSectionProps) {
    const [tests, setTests] = React.useState<LevelTestRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [formOpen, setFormOpen] = React.useState(false)
    const [matches, setMatches] = React.useState<ClassMatchRow[]>([])
    const [matchLoading, setMatchLoading] = React.useState(false)
    const [matchKey, setMatchKey] = React.useState<string>("")

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listLevelTestsByConsult(consult.id)
        if (res.success && res.data) {
            setTests(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setTests([])
        }
        setLoading(false)
    }, [consult.id])

    React.useEffect(() => {
        load()
    }, [load])

    // 상담의 과목·최근 테스트 레벨 기준으로 반 매칭 자동 조회
    const loadMatches = React.useCallback(async () => {
        const subject = consult.subject || tests[0]?.subject || null
        const level = tests[0]?.levelResult ?? null
        const key = `${subject ?? ""}|${level ?? ""}`
        if (!subject) {
            setMatches([])
            setMatchKey(key)
            return
        }
        if (key === matchKey) return
        setMatchLoading(true)
        const res = await matchClasses(consult.academyId, subject, level, 5)
        setMatchLoading(false)
        if (res.success && res.data) {
            setMatches(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setMatches([])
        }
        setMatchKey(key)
    }, [consult.academyId, consult.subject, tests, matchKey])

    React.useEffect(() => {
        loadMatches()
    }, [loadMatches])

    const handleDelete = async (id: number) => {
        if (!window.confirm("이 테스트 기록을 삭제할까요?")) return
        const res = await deleteLevelTest(id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await load()
        } else {
            toast.error(res.error)
        }
    }

    const handleEnroll = async (cls: ClassMatchRow) => {
        if (!consult.convertedStudentId) {
            toast.warning(
                "반에 배정하려면 먼저 ‘학생 등록 전환’ 으로 학생을 생성하세요.",
            )
            return
        }
        const res = await enrollStudent(cls.id, consult.convertedStudentId)
        if (res.success) {
            toast.success(`${cls.name} 반에 배정되었습니다.`, {
                icon: <UserCheck className="h-4 w-4 text-emerald-500" />,
            })
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col gap-3 p-1">
            <Card className="flex flex-col rounded-2xl border border-border overflow-hidden">
                <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        레벨 테스트
                    </CardTitle>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => setFormOpen(true)}
                        >
                            <Plus className="h-3 w-3 mr-0.5" />
                            결과 등록
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-2">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : tests.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">
                            등록된 테스트 결과가 없습니다.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {tests.map((t) => (
                                <li
                                    key={t.id}
                                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg border border-border bg-card"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1 py-0"
                                            >
                                                {t.subject}
                                            </Badge>
                                            {t.score != null && (
                                                <span className="text-xs font-semibold">
                                                    {t.score}점
                                                </span>
                                            )}
                                            {t.levelResult && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-1 py-0"
                                                >
                                                    {t.levelResult}
                                                </Badge>
                                            )}
                                            <span className="text-[10px] text-muted-foreground ml-auto">
                                                {dayjs(t.testedAt).isValid()
                                                    ? dayjs(t.testedAt).format("YY-MM-DD HH:mm")
                                                    : "—"}
                                            </span>
                                        </div>
                                        {t.memo && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line">
                                                {t.memo}
                                            </p>
                                        )}
                                        {t.testerName && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                기록: {t.testerName}
                                            </p>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive shrink-0"
                                            onClick={() => handleDelete(t.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card className="flex flex-col rounded-2xl border border-border overflow-hidden">
                <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        추천 반
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground">
                        {matchKey.split("|")[0] || "과목 미지정"}
                        {matchKey.split("|")[1] ? ` · ${matchKey.split("|")[1]}` : ""}
                    </span>
                </CardHeader>
                <CardContent className="p-2">
                    {matchLoading ? (
                        <div className="flex justify-center py-4">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : matches.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">
                            {consult.subject
                                ? "조건에 맞는 반이 없습니다."
                                : "상담의 희망 과목을 입력하면 자동으로 매칭됩니다."}
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {matches.map((c) => {
                                const remaining = c.capacity - c.enrolledCount
                                return (
                                    <li
                                        key={c.id}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-card"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-semibold truncate">
                                                    {c.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-1 py-0"
                                                >
                                                    {c.subject}
                                                </Badge>
                                                {c.level && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] px-1 py-0"
                                                    >
                                                        {c.level}
                                                    </Badge>
                                                )}
                                                <span
                                                    className={cn(
                                                        "text-[10px] px-1 rounded",
                                                        remaining <= 2
                                                            ? "text-amber-600"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {c.enrolledCount}/{c.capacity}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {c.teacherName ?? "강사 미지정"}
                                                {c.scheduleNote ? ` · ${c.scheduleNote}` : ""}
                                            </p>
                                        </div>
                                        {isAdmin && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-[11px] px-2 rounded-lg shrink-0"
                                                        onClick={() => handleEnroll(c)}
                                                        disabled={
                                                            !consult.convertedStudentId
                                                        }
                                                    >
                                                        <Sparkles className="h-3 w-3 mr-0.5" />
                                                        배정
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {consult.convertedStudentId
                                                        ? "이 반에 학생 배정"
                                                        : "학생 등록 전환 필요"}
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {isAdmin && (
                <LevelTestFormDialog
                    open={formOpen}
                    consult={consult}
                    onOpenChange={setFormOpen}
                    onSaved={async () => {
                        setFormOpen(false)
                        await load()
                        setMatchKey("") // 매칭 강제 재조회
                    }}
                />
            )}
        </div>
    )
}

interface LevelTestFormDialogProps {
    open: boolean
    consult: ConsultDetail
    onOpenChange: (v: boolean) => void
    onSaved: () => void | Promise<void>
}

function LevelTestFormDialog({
    open,
    consult,
    onOpenChange,
    onSaved,
}: LevelTestFormDialogProps) {
    const [subject, setSubject] = React.useState("")
    const [score, setScore] = React.useState("")
    const [levelResult, setLevelResult] = React.useState("")
    const [memo, setMemo] = React.useState("")
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        setSubject(consult.subject ?? "")
        setScore("")
        setLevelResult("")
        setMemo("")
    }, [open, consult.subject])

    const handleSave = async () => {
        if (!subject.trim()) {
            toast.warning("과목을 입력하세요.")
            return
        }
        const scoreNum = score.trim() === "" ? null : Number(score)
        if (scoreNum != null && (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100)) {
            toast.warning("점수는 0~100 사이로 입력하세요.")
            return
        }

        setBusy(true)
        const res = await saveLevelTest({
            consultationId: consult.id,
            studentId: consult.convertedStudentId,
            academyId: consult.academyId,
            subject: subject.trim(),
            score: scoreNum,
            levelResult: levelResult.trim() || null,
            memo: memo.trim() || null,
        })
        setBusy(false)
        if (res.success) {
            toast.success("레벨 테스트 결과가 저장되었습니다.")
            await onSaved()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        레벨 테스트 결과 등록
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">과목 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">점수(0~100)</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                type="number"
                                min={0}
                                max={100}
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">레벨 결과</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            placeholder="예: 초급, 중급, A반"
                            value={levelResult}
                            onChange={(e) => setLevelResult(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">메모</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={3}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
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
                    <Button onClick={handleSave} disabled={busy}>
                        {busy ? "저장 중..." : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
