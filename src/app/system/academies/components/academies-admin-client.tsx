"use client"

import * as React from "react"
import { toast } from "sonner"
import { List, Pencil, Plus, School, Trash2 } from "lucide-react"

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    createIumAcademy,
    deleteIumAcademy,
    listIumAcademiesAdmin,
    updateIumAcademy,
} from "@/actions/ium-academy-actions"
import type { IumAcademyMasterRow } from "@/types/ium-academy"

/** sample.tsx 공사목록 테이블과 동일 계열 (헤더: 라벤더 톤 + 라이트에서 흰색 라벨) */
const TH_CLASS =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-r border-b border-[#343637] dark:border-[#6b7280]"
const TH_LAST_CLASS =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-b border-[#343637] dark:border-[#6b7280]"
const TD_CLASS =
    "h-[35px] px-2 py-0 text-center text-xs align-middle border-r border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const TD_LAST_CLASS =
    "h-[35px] px-2 py-0 text-center text-xs align-middle border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const ROW_CLASS =
    "transition-colors bg-white hover:bg-muted/40 dark:bg-[#252841] dark:hover:bg-primary/15"

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
        const name = formName.trim()
        if (!name) {
            toast.error("학원명을 입력하세요.")
            return
        }

        const parsedOrder = Number.parseInt(formOrder, 10)
        const displayOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0
        setSaving(true)

        try {
            const res = editing
                ? await updateIumAcademy(editing.id, name, displayOrder, formActive)
                : await createIumAcademy(name, displayOrder, formActive)

            if (res.success) {
                toast.success(editing ? "저장되었습니다." : "등록되었습니다.")
                setDialogOpen(false)
                await load()
                return
            }
            toast.error(res.error)
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
            return
        }
        toast.error(res.error)
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#343637] bg-card shadow-md dark:border-[#6b7280] dark:shadow-none">
                <CardHeader className="h-12 shrink-0 space-y-0 border-b border-[#343637] bg-[#f9fafb] px-4 py-0 dark:border-[#6b7280] dark:bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold leading-none text-[#1d1d1d] dark:text-white">
                        <School className="h-5 w-5 text-primary" />
                        학원 등록·관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
                    <div className="flex min-h-0 flex-1 flex-col border-b border-[#343637] dark:border-[#6b7280]">
                        <div className="flex h-10 shrink-0 flex-row items-center justify-between space-y-0 border-b border-[#343637] bg-muted/30 px-3 py-0 dark:border-[#6b7280]">
                            <span className="flex items-center gap-1 text-sm font-bold">
                                <List className="h-4 w-4 text-primary" aria-hidden />
                                학원목록
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                className="h-7 rounded-md text-sm"
                                onClick={handleOpenAdd}
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                학원 추가
                            </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto scrollbar-hide">
                            {loading ? (
                                <div className="flex h-[200px] items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            ) : (
                                <AcademiesTable
                                    rows={rows}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                />
                            )}
                        </div>
                        <div className="flex h-8 shrink-0 items-center border-t border-[#343637] bg-muted/30 px-4 dark:border-[#6b7280]">
                            <span className="text-sm text-muted-foreground">총 {rows.length}건</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-md rounded-3xl border border-border bg-background">
                    <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 leading-none">
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
                                onChange={(event) => setFormName(event.target.value)}
                                placeholder="예: ○○학원"
                                disabled={saving}
                                className="bg-card h-10 rounded-md border border-border"
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
                                onChange={(event) => setFormOrder(event.target.value)}
                                disabled={saving}
                                className="bg-card h-10 rounded-md border border-border"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="academy-active"
                                checked={formActive}
                                onCheckedChange={(value) => setFormActive(value === true)}
                                disabled={saving}
                            />
                            <Label htmlFor="academy-active" className="text-sm font-normal cursor-pointer">
                                회원가입 목록에 표시
                            </Label>
                        </div>
                    </div>
                    <DialogFooter className="p-4 pt-0 border-t-0 sm:justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-md"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            className="rounded-md"
                            onClick={() => void handleSave()}
                            disabled={saving}
                        >
                            {saving ? "저장 중..." : "저장"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AcademiesTable({
    rows,
    onEdit,
    onDelete,
}: {
    rows: IumAcademyMasterRow[]
    onEdit: (row: IumAcademyMasterRow) => void
    onDelete: (row: IumAcademyMasterRow) => void
}) {
    return (
        <table className="w-full min-w-[640px] table-fixed border-collapse">
            <thead className="sticky top-0 z-10">
                <tr>
                    <th className={`w-[40%] ${TH_CLASS}`}>학원명</th>
                    <th className={`w-[88px] ${TH_CLASS}`}>정렬</th>
                    <th className={`w-[72px] ${TH_CLASS}`}>활성</th>
                    <th className={`w-[100px] ${TH_CLASS}`}>소속 사용자</th>
                    <th className={`w-[120px] ${TH_LAST_CLASS}`}>작업</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="h-[120px] text-center text-sm text-muted-foreground">
                            등록된 학원이 없습니다. 상단에서 추가하세요.
                        </td>
                    </tr>
                ) : (
                    rows.map((row) => (
                        <tr key={row.id} className={ROW_CLASS}>
                            <td className={TD_CLASS}>
                                <TooltipText text={row.name} className="font-medium" />
                            </td>
                            <td className={`${TD_CLASS} tabular-nums`}>
                                <TooltipText text={String(row.displayOrder)} />
                            </td>
                            <td className={TD_CLASS}>
                                <TooltipText
                                    text={row.isActive ? "Y" : "N"}
                                    className={row.isActive ? "text-emerald-600" : "text-muted-foreground"}
                                />
                            </td>
                            <td className={`${TD_CLASS} tabular-nums`}>
                                <TooltipText text={String(row.userCount)} />
                            </td>
                            <td className={TD_LAST_CLASS}>
                                <div className="flex justify-center gap-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 rounded-md px-2 text-[10px]"
                                        onClick={() => onEdit(row)}
                                        aria-label={`${row.name} 수정`}
                                    >
                                        <Pencil className="mr-0.5 h-3 w-3" />
                                        수정
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 rounded-md border-destructive/30 px-2 text-[10px] text-destructive disabled:opacity-40"
                                        disabled={row.userCount > 0}
                                        onClick={() => onDelete(row)}
                                        aria-label={`${row.name} 삭제`}
                                    >
                                        <Trash2 className="mr-0.5 h-3 w-3" />
                                        삭제
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    )
}

function TooltipText({ text, className = "" }: { text: string; className?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`block w-full truncate ${className}`}>{text}</span>
            </TooltipTrigger>
            <TooltipContent>
                <p className="max-w-xs whitespace-pre-wrap">{text}</p>
            </TooltipContent>
        </Tooltip>
    )
}
