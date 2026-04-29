"use client"

import * as React from "react"
import { toast } from "sonner"
import { Users, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { IumAcademyOption } from "@/types/ium-user"
import type { StudentDetail, StudentRow, StudentStatus } from "@/types/student"
import { listStudents, getStudentDetail } from "@/actions/student-actions"
import { StudentListPanel } from "./student-list-panel"
import { StudentDetailPanel } from "./student-detail-panel"
import { StudentFormDialog } from "./student-form-dialog"

interface StudentsPageClientProps {
    academies: IumAcademyOption[]
    isAdmin: boolean
    userAcademyId: number | null
}

export function StudentsPageClient({
    academies,
    isAdmin,
    userAcademyId,
}: StudentsPageClientProps) {
    const [statusFilter, setStatusFilter] = React.useState<StudentStatus | "ALL">("ACTIVE")
    const [keyword, setKeyword] = React.useState("")
    const [rows, setRows] = React.useState<StudentRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selectedId, setSelectedId] = React.useState<number | null>(null)
    const [detail, setDetail] = React.useState<StudentDetail | null>(null)
    const [detailLoading, setDetailLoading] = React.useState(false)
    const [formOpen, setFormOpen] = React.useState(false)
    const [formMode, setFormMode] = React.useState<"create" | "edit">("create")

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listStudents(
            statusFilter === "ALL" ? null : statusFilter,
            keyword.trim() || null,
        )
        if (res.success && res.data) {
            setRows(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setRows([])
        }
        setLoading(false)
    }, [statusFilter, keyword])

    React.useEffect(() => {
        load()
    }, [load])

    const loadDetail = React.useCallback(async (id: number) => {
        setDetailLoading(true)
        const res = await getStudentDetail(id)
        if (res.success && res.data) {
            setDetail(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setDetail(null)
        }
        setDetailLoading(false)
    }, [])

    React.useEffect(() => {
        if (selectedId == null) {
            setDetail(null)
            return
        }
        loadDetail(selectedId)
    }, [selectedId, loadDetail])

    const handleCreate = () => {
        setFormMode("create")
        setFormOpen(true)
    }

    const handleEdit = () => {
        setFormMode("edit")
        setFormOpen(true)
    }

    const handleFormSaved = async (savedId?: number) => {
        setFormOpen(false)
        await load()
        if (savedId) {
            setSelectedId(savedId)
            await loadDetail(savedId)
        } else if (selectedId) {
            await loadDetail(selectedId)
        }
    }

    const handleRowsRefresh = async () => {
        await load()
        if (selectedId) {
            await loadDetail(selectedId)
        }
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Users className="h-5 w-5 text-primary" />
                        재원생 명부
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="이름·학교·연락처"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="h-9 text-xs bg-card pl-7 pr-7 w-[180px] border-border"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") load()
                                }}
                            />
                            {keyword && (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setKeyword("")}
                                    aria-label="검색어 지우기"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as StudentStatus | "ALL")}
                        >
                            <SelectTrigger className="h-9 text-xs w-[110px] bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">재원</SelectItem>
                                <SelectItem value="WITHDRAWN">퇴원</SelectItem>
                                <SelectItem value="ALL">전체</SelectItem>
                            </SelectContent>
                        </Select>
                        {isAdmin && (
                            <Button
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={handleCreate}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                학생 등록
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-[3px] flex flex-col md:flex-row gap-[3px]">
                    <Card className="w-full md:w-[340px] md:shrink-0 flex flex-col rounded-2xl border border-border overflow-hidden max-h-[45vh] md:max-h-none">
                        <StudentListPanel
                            rows={rows}
                            loading={loading}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </Card>
                    <Card className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border overflow-hidden">
                        <StudentDetailPanel
                            student={detail}
                            loading={detailLoading}
                            isAdmin={isAdmin}
                            rows={rows}
                            onEdit={handleEdit}
                            onRefresh={handleRowsRefresh}
                        />
                    </Card>
                </CardContent>
            </Card>

            <StudentFormDialog
                open={formOpen}
                mode={formMode}
                initial={formMode === "edit" ? detail : null}
                academies={academies}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
                onOpenChange={setFormOpen}
                onSaved={handleFormSaved}
            />
        </div>
    )
}
