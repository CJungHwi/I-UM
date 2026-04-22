"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil, Plus, School, Trash2 } from "lucide-react"

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { IumAcademyMasterRow } from "@/types/ium-academy"
import {
    createIumAcademy,
    deleteIumAcademy,
    listIumAcademiesAdmin,
    updateIumAcademy,
} from "@/actions/ium-academy-actions"

export function AcademiesAdminClient() {
    const [rows, setRows] = React.useState<IumAcademyMasterRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [editing, setEditing] = React.useState<IumAcademyMasterRow | null>(null)
    const [formName, setFormName] = React.useState("")
    const [formOrder, setFormOrder] = React.useState("0")
    const [formActive, setFormActive] = React.useState(true)
    const [saving, setSaving] = React.useState(false)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listIumAcademiesAdmin()
        if (res.success && res.data) {
            setRows(res.data)
        } else if (!res.success) {
            toast.error(res.error)
        }
        setLoading(false)
    }, [])

    React.useEffect(() => {
        void load()
    }, [load])

    const handleOpenAdd = () => {
        setEditing(null)
        setFormName("")
        setFormOrder("0")
        setFormActive(true)
        setDialogOpen(true)
    }

    const handleOpenEdit = (row: IumAcademyMasterRow) => {
        setEditing(row)
        setFormName(row.name)
        setFormOrder(String(row.displayOrder))
        setFormActive(row.isActive)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        const nm = formName.trim()
        if (!nm) {
            toast.error("학원명을 입력하세요.")
            return
        }
        const ord = Number.parseInt(formOrder, 10)
        const displayOrder = Number.isFinite(ord) ? ord : 0

        setSaving(true)
        try {
            if (editing) {
                const res = await updateIumAcademy(editing.id, nm, displayOrder, formActive)
                if (res.success) {
                    toast.success("저장되었습니다.")
                    setDialogOpen(false)
                    await load()
                } else toast.error(res.error)
            } else {
                const res = await createIumAcademy(nm, displayOrder, formActive)
                if (res.success) {
                    toast.success("등록되었습니다.")
                    setDialogOpen(false)
                    await load()
                } else toast.error(res.error)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (row: IumAcademyMasterRow) => {
        if (row.userCount > 0) {
            toast.error("소속 사용자가 있어 삭제할 수 없습니다.")
            return
        }
        if (!window.confirm(`「${row.name}」을(를) 삭제할까요?`)) {
            return
        }
        const res = await deleteIumAcademy(row.id)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await load()
        } else toast.error(res.error)
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <School className="h-5 w-5 text-primary" />
                        학원(소속) 마스터
                    </CardTitle>
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs rounded-xl"
                        onClick={handleOpenAdd}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        학원 추가
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="h-[45px] hover:bg-transparent">
                                        <TableHead className="text-xs">학원명</TableHead>
                                        <TableHead className="text-xs w-[88px] text-right">
                                            정렬
                                        </TableHead>
                                        <TableHead className="text-xs w-[72px] text-center">
                                            활성
                                        </TableHead>
                                        <TableHead className="text-xs w-[100px] text-right">
                                            소속 사용자
                                        </TableHead>
                                        <TableHead className="text-xs w-[120px] text-right">
                                            작업
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-10"
                                            >
                                                등록된 학원이 없습니다. 상단에서 추가하세요.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {rows.map((r) => (
                                        <TableRow key={r.id} className="h-[35px]">
                                            <TableCell className="text-xs font-medium">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="truncate block max-w-[240px] md:max-w-md">
                                                            {r.name}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        {r.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="text-xs text-right tabular-nums">
                                                {r.displayOrder}
                                            </TableCell>
                                            <TableCell className="text-xs text-center">
                                                <span
                                                    className={
                                                        r.isActive
                                                            ? "text-emerald-600"
                                                            : "text-muted-foreground"
                                                    }
                                                >
                                                    {r.isActive ? "Y" : "N"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-right tabular-nums">
                                                {r.userCount}
                                            </TableCell>
                                            <TableCell className="text-xs text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs rounded-lg"
                                                        onClick={() => handleOpenEdit(r)}
                                                        aria-label={`${r.name} 수정`}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs rounded-lg text-destructive border-destructive/30 disabled:opacity-40"
                                                        disabled={r.userCount > 0}
                                                        onClick={() => handleDelete(r)}
                                                        aria-label={`${r.name} 삭제`}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md rounded-3xl border border-border">
                    <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-lg font-bold leading-none">
                            {editing ? "학원 수정" : "학원 추가"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="academy-name" className="text-sm">
                                학원명
                            </Label>
                            <Input
                                id="academy-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="예: ○○학원"
                                disabled={saving}
                                className="bg-card h-10 rounded-md border-[#343637] dark:border-[#6b7280]"
                                maxLength={200}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="academy-order" className="text-sm">
                                정렬 순서
                            </Label>
                            <Input
                                id="academy-order"
                                type="number"
                                inputMode="numeric"
                                value={formOrder}
                                onChange={(e) => setFormOrder(e.target.value)}
                                disabled={saving}
                                className="bg-card h-10 rounded-md border-[#343637] dark:border-[#6b7280]"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                숫자가 작을수록 목록·가입 화면에서 위에 표시됩니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="academy-active"
                                checked={formActive}
                                onCheckedChange={(v) => setFormActive(v === true)}
                                disabled={saving}
                            />
                            <Label
                                htmlFor="academy-active"
                                className="text-sm font-normal cursor-pointer"
                            >
                                회원가입 목록에 표시 (활성)
                            </Label>
                        </div>
                    </div>
                    <DialogFooter className="p-4 pt-0 border-t-0 sm:justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl"
                            onClick={() => void handleSave()}
                            disabled={saving}
                        >
                            {saving ? "저장 중…" : "저장"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
