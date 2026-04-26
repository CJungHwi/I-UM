"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { ClassRow } from "@/types/class"
import type { CurriculumUnit, CurriculumUpsertInput } from "@/types/curriculum"
import {
    deleteCurriculumUnit,
    listCurriculumUnits,
    upsertCurriculumUnit,
} from "@/actions/curriculum-actions"

interface CurriculumMasterPanelProps {
    classRow: ClassRow
    isAdmin: boolean
}

export function CurriculumMasterPanel({
    classRow,
    isAdmin,
}: CurriculumMasterPanelProps) {
    const [units, setUnits] = React.useState<CurriculumUnit[]>([])
    const [loading, setLoading] = React.useState(true)
    const [formOpen, setFormOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<CurriculumUnit | null>(null)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listCurriculumUnits(
            classRow.academyId,
            classRow.subject,
            classRow.level,
        )
        if (res.success && res.data) {
            setUnits(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setUnits([])
        }
        setLoading(false)
    }, [classRow.academyId, classRow.subject, classRow.level])

    React.useEffect(() => {
        load()
    }, [load])

    const handleAdd = () => {
        setEditing(null)
        setFormOpen(true)
    }

    const handleEdit = (u: CurriculumUnit) => {
        setEditing(u)
        setFormOpen(true)
    }

    const handleDelete = async (u: CurriculumUnit) => {
        if (!window.confirm(`단원 ${u.unitNo}. ${u.unitTitle} 을 삭제할까요?`)) return
        const res = await deleteCurriculumUnit(u.id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await load()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                        {classRow.subject}
                    </Badge>
                    {classRow.level && (
                        <Badge variant="outline" className="text-[10px]">
                            {classRow.level}
                        </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                        학원별 과목/레벨 기준 공용 커리큘럼
                    </span>
                </div>
                {isAdmin && (
                    <Button
                        size="sm"
                        className="h-8 text-xs rounded-lg"
                        onClick={handleAdd}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        단원 추가
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : units.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">
                    등록된 단원이 없습니다.
                </p>
            ) : (
                <ul className="flex flex-col gap-1">
                    {units.map((u) => (
                        <li
                            key={u.id}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-card group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0"
                                    >
                                        단원 {u.unitNo}
                                    </Badge>
                                    <span className="text-xs font-semibold">
                                        {u.unitTitle}
                                    </span>
                                    {u.estWeek && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1 py-0"
                                        >
                                            {u.estWeek}주
                                        </Badge>
                                    )}
                                </div>
                                {u.planMemo && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line">
                                        {u.planMemo}
                                    </p>
                                )}
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleEdit(u)}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive"
                                        onClick={() => handleDelete(u)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {isAdmin && (
                <UnitFormDialog
                    open={formOpen}
                    classRow={classRow}
                    units={units}
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

function UnitFormDialog({
    open,
    classRow,
    units,
    initial,
    onOpenChange,
    onSaved,
}: {
    open: boolean
    classRow: ClassRow
    units: CurriculumUnit[]
    initial: CurriculumUnit | null
    onOpenChange: (v: boolean) => void
    onSaved: () => void | Promise<void>
}) {
    const [form, setForm] = React.useState<CurriculumUpsertInput>({
        id: 0,
        academyId: classRow.academyId,
        subject: classRow.subject,
        level: classRow.level ?? "",
        unitNo: 1,
        unitTitle: "",
        planMemo: "",
        estWeek: null,
    })
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (initial) {
            setForm({
                id: initial.id,
                academyId: initial.academyId,
                subject: initial.subject,
                level: initial.level ?? "",
                unitNo: initial.unitNo,
                unitTitle: initial.unitTitle,
                planMemo: initial.planMemo ?? "",
                estWeek: initial.estWeek,
            })
        } else {
            const nextUnitNo =
                units.length > 0
                    ? Math.max(...units.map((u) => u.unitNo)) + 1
                    : 1
            setForm({
                id: 0,
                academyId: classRow.academyId,
                subject: classRow.subject,
                level: classRow.level ?? "",
                unitNo: nextUnitNo,
                unitTitle: "",
                planMemo: "",
                estWeek: null,
            })
        }
    }, [open, initial, classRow, units])

    const handleSubmit = async () => {
        if (!form.unitTitle.trim()) {
            toast.warning("단원 제목을 입력하세요.")
            return
        }
        setBusy(true)
        const res = await upsertCurriculumUnit(form)
        setBusy(false)
        if (res.success) {
            toast.success("저장되었습니다.")
            await onSaved()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        {initial ? "단원 수정" : "단원 추가"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">과목</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.subject}
                                onChange={(e) =>
                                    setForm({ ...form, subject: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">레벨</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.level ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, level: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">단원 번호</Label>
                            <Input
                                type="number"
                                min={1}
                                className="h-9 text-xs bg-card"
                                value={form.unitNo}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        unitNo: Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        ),
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">단원 제목 *</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            value={form.unitTitle}
                            onChange={(e) =>
                                setForm({ ...form, unitTitle: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">예상 주차</Label>
                            <Input
                                type="number"
                                min={0}
                                className="h-9 text-xs bg-card"
                                value={form.estWeek ?? ""}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        estWeek:
                                            e.target.value === ""
                                                ? null
                                                : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">계획 메모</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={4}
                            value={form.planMemo ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, planMemo: e.target.value })
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
                        {busy ? "저장 중..." : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
