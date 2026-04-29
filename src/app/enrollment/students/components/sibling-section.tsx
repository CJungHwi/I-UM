"use client"

import * as React from "react"
import { toast } from "sonner"
import { Link2, Link2Off, Plus, Search } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type {
    StudentDetail,
    StudentRow,
    StudentSibling,
} from "@/types/student"
import {
    linkSibling,
    listSiblings,
    unlinkSibling,
} from "@/actions/student-actions"

interface SiblingSectionProps {
    student: StudentDetail
    rows: StudentRow[]
    isAdmin: boolean
    onChanged: () => Promise<void>
}

export function SiblingSection({
    student,
    rows,
    isAdmin,
    onChanged,
}: SiblingSectionProps) {
    const [siblings, setSiblings] = React.useState<StudentSibling[]>([])
    const [loading, setLoading] = React.useState(true)
    const [pickerOpen, setPickerOpen] = React.useState(false)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listSiblings(student.id)
        if (res.success && res.data) {
            setSiblings(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setSiblings([])
        }
        setLoading(false)
    }, [student.id])

    React.useEffect(() => {
        load()
    }, [load])

    const handleLink = async (otherId: number) => {
        const res = await linkSibling(student.id, otherId)
        if (res.success) {
            toast.success("형제 관계가 연결되었습니다.")
            setPickerOpen(false)
            await load()
            await onChanged()
        } else {
            toast.error(res.error)
        }
    }

    const handleUnlink = async () => {
        if (!window.confirm(`${student.name} 학생을 형제 그룹에서 분리할까요?`)) return
        const res = await unlinkSibling(student.id)
        if (res.success) {
            toast.success("분리되었습니다.")
            await load()
            await onChanged()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Card className="flex flex-col rounded-2xl border border-border overflow-hidden">
            <CardHeader className="h-8 px-3 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold">형제 관계</CardTitle>
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => setPickerOpen(true)}
                        >
                            <Plus className="h-3 w-3 mr-0.5" />
                            연결
                        </Button>
                        {student.familyGroup != null && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2 text-destructive"
                                onClick={handleUnlink}
                            >
                                <Link2Off className="h-3 w-3 mr-0.5" />
                                분리
                            </Button>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-2">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : siblings.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                        연결된 형제가 없습니다.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {siblings.map((s) => (
                            <li
                                key={s.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-card"
                            >
                                <Link2 className="h-3 w-3 text-rose-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={cn(
                                                "text-xs font-semibold truncate",
                                                s.status === "WITHDRAWN" &&
                                                    "text-muted-foreground line-through",
                                            )}
                                        >
                                            {s.name}
                                        </span>
                                        {s.grade && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1 py-0"
                                            >
                                                {s.grade}
                                            </Badge>
                                        )}
                                        {s.status === "WITHDRAWN" && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1 py-0 text-muted-foreground"
                                            >
                                                퇴원
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                        {s.school ?? "—"}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>

            {isAdmin && (
                <SiblingPicker
                    open={pickerOpen}
                    student={student}
                    rows={rows}
                    existingSiblingIds={siblings.map((s) => s.id)}
                    onOpenChange={setPickerOpen}
                    onPick={handleLink}
                />
            )}
        </Card>
    )
}

interface SiblingPickerProps {
    open: boolean
    student: StudentDetail
    rows: StudentRow[]
    existingSiblingIds: number[]
    onOpenChange: (open: boolean) => void
    onPick: (id: number) => void | Promise<void>
}

function SiblingPicker({
    open,
    student,
    rows,
    existingSiblingIds,
    onOpenChange,
    onPick,
}: SiblingPickerProps) {
    const [keyword, setKeyword] = React.useState("")

    React.useEffect(() => {
        if (!open) setKeyword("")
    }, [open])

    const excluded = new Set<number>([student.id, ...existingSiblingIds])
    const filtered = rows
        .filter((r) => !excluded.has(r.id))
        .filter((r) => {
            if (!keyword.trim()) return true
            const kw = keyword.trim().toLowerCase()
            return (
                r.name.toLowerCase().includes(kw) ||
                (r.school ?? "").toLowerCase().includes(kw) ||
                (r.grade ?? "").toLowerCase().includes(kw)
            )
        })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        형제 학생 선택
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 pt-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            className="h-9 text-xs bg-card pl-7"
                            placeholder="이름·학교·학년 검색"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[320px] rounded-md border border-border">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-6 text-center">
                                선택할 수 있는 학생이 없습니다.
                            </p>
                        ) : (
                            <ul className="p-1">
                                {filtered.map((r) => (
                                    <li key={r.id}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(r.id)}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold truncate">
                                                    {r.name}
                                                </span>
                                                {r.grade && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] px-1 py-0"
                                                    >
                                                        {r.grade}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate">
                                                {r.school ?? "—"} · {r.academyName ?? "—"}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        닫기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
