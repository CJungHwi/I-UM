"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { GuardianUpsertInput, StudentGuardian } from "@/types/student"
import {
    deleteGuardian,
    listGuardians,
    upsertGuardian,
} from "@/actions/student-actions"

interface GuardianSectionProps {
    studentId: number
    isAdmin: boolean
}

const RELATIONS = ["부", "모", "조부", "조모", "기타"] as const

export function GuardianSection({ studentId, isAdmin }: GuardianSectionProps) {
    const [guardians, setGuardians] = React.useState<StudentGuardian[]>([])
    const [loading, setLoading] = React.useState(true)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<StudentGuardian | null>(null)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listGuardians(studentId)
        if (res.success && res.data) {
            setGuardians(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setGuardians([])
        }
        setLoading(false)
    }, [studentId])

    React.useEffect(() => {
        load()
    }, [load])

    const handleAdd = () => {
        setEditing(null)
        setDialogOpen(true)
    }

    const handleEdit = (g: StudentGuardian) => {
        setEditing(g)
        setDialogOpen(true)
    }

    const handleDelete = async (g: StudentGuardian) => {
        if (!window.confirm(`${g.name} 보호자를 삭제할까요?`)) return
        const res = await deleteGuardian(g.id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await load()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Card className="flex flex-col rounded-2xl border border-border overflow-hidden">
            <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold">보호자</CardTitle>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={handleAdd}
                    >
                        <Plus className="h-3 w-3 mr-0.5" />
                        추가
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-2">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : guardians.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                        등록된 보호자가 없습니다.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {guardians.map((g) => (
                            <li
                                key={g.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-card"
                            >
                                {g.isPrimary && (
                                    <Star className="h-3 w-3 text-amber-500 shrink-0 fill-amber-400" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-semibold truncate">
                                            {g.name}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] px-1 py-0"
                                        >
                                            {g.relation}
                                        </Badge>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                        {g.phone ?? "—"}
                                        {g.email ? ` · ${g.email}` : ""}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleEdit(g)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive"
                                            onClick={() => handleDelete(g)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>

            {isAdmin && (
                <GuardianDialog
                    open={dialogOpen}
                    studentId={studentId}
                    initial={editing}
                    onOpenChange={setDialogOpen}
                    onSaved={async () => {
                        setDialogOpen(false)
                        await load()
                    }}
                />
            )}
        </Card>
    )
}

interface GuardianDialogProps {
    open: boolean
    studentId: number
    initial: StudentGuardian | null
    onOpenChange: (open: boolean) => void
    onSaved: () => void | Promise<void>
}

function GuardianDialog({
    open,
    studentId,
    initial,
    onOpenChange,
    onSaved,
}: GuardianDialogProps) {
    const [form, setForm] = React.useState<GuardianUpsertInput>({
        id: 0,
        studentId,
        name: "",
        relation: "부모",
        phone: "",
        email: "",
        isPrimary: false,
    })
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (initial) {
            setForm({
                id: initial.id,
                studentId,
                name: initial.name,
                relation: initial.relation,
                phone: initial.phone ?? "",
                email: initial.email ?? "",
                isPrimary: initial.isPrimary,
            })
        } else {
            setForm({
                id: 0,
                studentId,
                name: "",
                relation: "부모",
                phone: "",
                email: "",
                isPrimary: false,
            })
        }
    }, [initial, open, studentId])

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.warning("보호자 이름을 입력하세요.")
            return
        }
        setBusy(true)
        const res = await upsertGuardian(form)
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
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        {initial ? "보호자 수정" : "보호자 추가"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">이름 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">관계</Label>
                            <Select
                                value={form.relation}
                                onValueChange={(v) =>
                                    setForm({ ...form, relation: v })
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONS.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">연락처</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            placeholder="010-0000-0000"
                            value={form.phone ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">이메일</Label>
                        <Input
                            className="h-9 text-xs bg-card"
                            type="email"
                            value={form.email ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={form.isPrimary}
                            onCheckedChange={(v) =>
                                setForm({ ...form, isPrimary: Boolean(v) })
                            }
                        />
                        <span className="text-xs">
                            대표 보호자로 설정 (알림 기본 수신자)
                        </span>
                    </label>
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
