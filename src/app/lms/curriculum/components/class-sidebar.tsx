"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ClassRow, ClassUpsertInput } from "@/types/class"
import { deleteClass, upsertClass } from "@/actions/class-actions"

interface ClassSidebarProps {
    classes: ClassRow[]
    loading: boolean
    selectedId: number | null
    isAdmin: boolean
    userAcademyId: number | null
    onSelect: (row: ClassRow) => void
    onChanged: () => Promise<void>
}

export function ClassSidebar({
    classes,
    loading,
    selectedId,
    isAdmin,
    userAcademyId,
    onSelect,
    onChanged,
}: ClassSidebarProps) {
    const [formOpen, setFormOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<ClassRow | null>(null)

    const handleAdd = () => {
        setEditing(null)
        setFormOpen(true)
    }

    const handleEdit = (row: ClassRow, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditing(row)
        setFormOpen(true)
    }

    const handleDelete = async (row: ClassRow, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm(`‘${row.name}’ 반을 삭제할까요?`)) return
        const res = await deleteClass(row.id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await onChanged()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <>
            <div className="h-10 px-3 py-0 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold">반 목록</span>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={handleAdd}
                    >
                        <Plus className="h-3 w-3 mr-0.5" />
                        반 등록
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center flex-1 py-10">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : classes.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground text-center">
                    등록된 반이 없습니다.
                    {isAdmin && (
                        <>
                            <br />
                            상단의 반 등록 버튼으로 시작하세요.
                        </>
                    )}
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <ul className="p-1">
                        {classes.map((row) => {
                            const active = row.id === selectedId
                            const inactive = row.isActive !== "Y"
                            return (
                                <li key={row.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(row)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-xl transition-colors group",
                                            "hover:bg-muted/50",
                                            active && "bg-primary/15 hover:bg-primary/20",
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className={cn(
                                                        "text-sm font-semibold truncate",
                                                        inactive &&
                                                            "text-muted-foreground line-through",
                                                    )}
                                                >
                                                    {row.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-1 py-0 shrink-0"
                                                >
                                                    {row.subject}
                                                </Badge>
                                            </div>
                                            {isAdmin && (
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => handleEdit(row, e)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-destructive"
                                                        onClick={(e) => handleDelete(row, e)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <span className="truncate">
                                                {row.level ?? "—"}
                                            </span>
                                            <span className="shrink-0">·</span>
                                            <span className="shrink-0 flex items-center gap-0.5">
                                                <Users className="h-2.5 w-2.5" />
                                                {row.enrolledCount}/{row.capacity}
                                            </span>
                                            {row.teacherName && (
                                                <>
                                                    <span className="shrink-0">·</span>
                                                    <span className="truncate">
                                                        {row.teacherName}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {row.academyName && (
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {row.academyName}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </ScrollArea>
            )}

            {isAdmin && (
                <ClassFormDialog
                    open={formOpen}
                    initial={editing}
                    userAcademyId={userAcademyId}
                    onOpenChange={setFormOpen}
                    onSaved={async () => {
                        setFormOpen(false)
                        await onChanged()
                    }}
                />
            )}
        </>
    )
}

interface ClassFormDialogProps {
    open: boolean
    initial: ClassRow | null
    userAcademyId: number | null
    onOpenChange: (v: boolean) => void
    onSaved: () => void | Promise<void>
}

function ClassFormDialog({
    open,
    initial,
    userAcademyId,
    onOpenChange,
    onSaved,
}: ClassFormDialogProps) {
    const [form, setForm] = React.useState<ClassUpsertInput>({
        id: 0,
        academyId: userAcademyId ?? 0,
        name: "",
        subject: "",
        level: "",
        teacherUserId: null,
        capacity: 20,
        scheduleNote: "",
        isActive: "Y",
    })
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (initial) {
            setForm({
                id: initial.id,
                academyId: initial.academyId,
                name: initial.name,
                subject: initial.subject,
                level: initial.level ?? "",
                teacherUserId: initial.teacherUserId,
                capacity: initial.capacity,
                scheduleNote: initial.scheduleNote ?? "",
                isActive: (initial.isActive as "Y" | "N") ?? "Y",
            })
        } else {
            setForm({
                id: 0,
                academyId: userAcademyId ?? 0,
                name: "",
                subject: "",
                level: "",
                teacherUserId: null,
                capacity: 20,
                scheduleNote: "",
                isActive: "Y",
            })
        }
    }, [open, initial, userAcademyId])

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.warning("반 이름을 입력하세요.")
            return
        }
        if (!form.subject.trim()) {
            toast.warning("과목을 입력하세요.")
            return
        }
        if (!form.academyId) {
            toast.warning("소속 학원이 필요합니다.")
            return
        }
        setBusy(true)
        const res = await upsertClass(form)
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
                        {initial ? "반 수정" : "반 등록"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1 col-span-2">
                            <Label className="text-[11px]">반 이름 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">과목 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="예: 영어, 수학"
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
                                placeholder="예: 초급, 중급, A반"
                                value={form.level ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, level: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">정원</Label>
                            <Input
                                type="number"
                                min={1}
                                className="h-9 text-xs bg-card"
                                value={form.capacity}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        capacity: Math.max(1, Number(e.target.value) || 1),
                                    })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">상태</Label>
                            <Select
                                value={form.isActive}
                                onValueChange={(v) =>
                                    setForm({ ...form, isActive: v as "Y" | "N" })
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Y">활성</SelectItem>
                                    <SelectItem value="N">비활성</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">시간표 메모</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            placeholder="예: 월수금 17:00-18:30"
                            value={form.scheduleNote ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, scheduleNote: e.target.value })
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
