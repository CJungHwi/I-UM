"use client"

import * as React from "react"
import { toast } from "sonner"
import { LayoutGrid, Table2, Users, Plus, Search, X, Hash, List } from "lucide-react"

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
import type { IumCodeRow } from "@/types/ium-code"
import type { StudentDetail, StudentRow, StudentStatus } from "@/types/student"
import { listStudents, getStudentDetail } from "@/actions/student-actions"
import { StudentCardGrid } from "./student-card-grid"
import { StudentTableView } from "./student-table-view"
import { StudentDetailPanel } from "./student-detail-panel"
import { StudentFormDialog } from "./student-form-dialog"
import { AdmissionStudentsHelpDialog } from "./admission-students-help-dialog"

interface StudentsPageClientProps {
    academies: IumAcademyOption[]
    gradeCodes: IumCodeRow[]
    admissionRouteCodes: IumCodeRow[]
    isAdmin: boolean
    userAcademyId: number | null
}

type StudentListView = "cards" | "table"

export function StudentsPageClient({
    academies,
    gradeCodes,
    admissionRouteCodes,
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
    const [listView, setListView] = React.useState<StudentListView>("cards")
    const [tagFilter, setTagFilter] = React.useState("")

    const gradeLabelByCode = React.useMemo(
        () => Object.fromEntries(gradeCodes.map((c) => [c.code, c.label])),
        [gradeCodes],
    )
    const routeLabelByCode = React.useMemo(
        () => Object.fromEntries(admissionRouteCodes.map((c) => [c.code, c.label])),
        [admissionRouteCodes],
    )

    const filteredRows = React.useMemo(() => {
        const q = tagFilter.trim().toLowerCase().replace(/^#/, "")
        if (!q) return rows
        return rows.filter((r) => (r.interestTags ?? "").toLowerCase().includes(q))
    }, [rows, tagFilter])

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
            <Card className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-border bg-card shadow-md dark:shadow-none">
                <CardHeader className="h-12 shrink-0 space-y-0 border-b border-border bg-muted/30 px-4 py-0 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Users className="h-5 w-5 text-primary" />
                        재원생 명부
                    </CardTitle>
                    <AdmissionStudentsHelpDialog />
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                        <div className="flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden border-border lg:min-h-0 lg:w-[55%] lg:border-r">
                            <div className="flex h-10 shrink-0 flex-row items-center justify-between space-y-0 border-b border-border bg-muted/30 px-3 py-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <List className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                    <span className="text-sm font-bold truncate">학생 목록</span>
                                </div>
                                {isAdmin && (
                                    <Button
                                        size="sm"
                                        className="h-7 shrink-0 rounded-md text-sm"
                                        onClick={handleCreate}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        학생 등록
                                    </Button>
                                )}
                            </div>
                            <div className="shrink-0 border-b border-border bg-muted/20 p-3 dark:bg-muted/20">
                                <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_2fr_1fr]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-muted-foreground leading-none">
                                            태그
                                        </span>
                                        <div className="relative">
                                            <Hash className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="키워드"
                                                value={tagFilter}
                                                onChange={(e) => setTagFilter(e.target.value)}
                                                className="h-9 border-border bg-card pl-7 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-muted-foreground leading-none">
                                            검색
                                        </span>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="이름·학교·연락처"
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") load()
                                                }}
                                                className="h-9 border-border bg-card pl-7 pr-8 text-xs"
                                            />
                                            {keyword && (
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                                    onClick={() => setKeyword("")}
                                                    aria-label="검색어 지우기"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
                                        <div className="flex flex-col gap-1 sm:w-[110px]">
                                            <span className="text-[11px] text-muted-foreground leading-none">
                                                재원 상태
                                            </span>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={(v) =>
                                                    setStatusFilter(v as StudentStatus | "ALL")
                                                }
                                            >
                                                <SelectTrigger className="h-9 border-border bg-card text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">재원</SelectItem>
                                                    <SelectItem value="WITHDRAWN">퇴원</SelectItem>
                                                    <SelectItem value="ALL">전체</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5">
                                            <Button
                                                type="button"
                                                variant={listView === "cards" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => setListView("cards")}
                                                aria-label="카드 보기"
                                            >
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={listView === "table" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => setListView("table")}
                                                aria-label="테이블 보기"
                                            >
                                                <Table2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-9 text-xs sm:shrink-0"
                                            onClick={() => load()}
                                        >
                                            조회
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="scrollbar-hide min-h-0 flex-1 overflow-auto">
                                {listView === "cards" ? (
                                    <StudentCardGrid
                                        rows={filteredRows}
                                        loading={loading}
                                        selectedId={selectedId}
                                        onSelect={setSelectedId}
                                        gradeLabelByCode={gradeLabelByCode}
                                    />
                                ) : (
                                    <StudentTableView
                                        rows={filteredRows}
                                        loading={loading}
                                        selectedId={selectedId}
                                        onSelect={setSelectedId}
                                        gradeLabelByCode={gradeLabelByCode}
                                        routeLabelByCode={routeLabelByCode}
                                    />
                                )}
                            </div>
                            <div className="flex h-8 shrink-0 items-center border-t border-border bg-muted/30 px-4">
                                <span className="text-sm text-muted-foreground">
                                    총 {filteredRows.length}건
                                </span>
                            </div>
                        </div>

                        <div
                            className="hidden w-1 shrink-0 border-l border-border lg:block"
                            aria-hidden
                        />

                        <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
                            <div className="flex min-h-0 flex-1 flex-col overflow-auto p-0">
                                <StudentDetailPanel
                                    student={detail}
                                    loading={detailLoading}
                                    isAdmin={isAdmin}
                                    rows={rows}
                                    gradeLabelByCode={gradeLabelByCode}
                                    routeLabelByCode={routeLabelByCode}
                                    onEdit={handleEdit}
                                    onRefresh={handleRowsRefresh}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <StudentFormDialog
                open={formOpen}
                mode={formMode}
                initial={formMode === "edit" ? detail : null}
                academies={academies}
                gradeCodes={gradeCodes}
                admissionRouteCodes={admissionRouteCodes}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
                onOpenChange={setFormOpen}
                onSaved={handleFormSaved}
            />
        </div>
    )
}
