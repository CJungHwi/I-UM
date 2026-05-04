"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import {
    UserPlus,
    Plus,
    Search,
    X,
    Users,
    Clock,
    TrendingUp,
    CircleDashed,
    List,
} from "lucide-react"

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
import type {
    ConsultDetail,
    ConsultRow,
    ConsultStats,
    ConsultStatus,
} from "@/types/consultation"
import {
    CONSULT_STATUS_FILTER_ORDER,
    CONSULT_STATUS_LABEL,
} from "@/types/consultation"
import {
    getConsultationDetail,
    getConsultationStats,
    listConsultations,
} from "@/actions/consultation-actions"
import { ConsultListPanel } from "./consult-list-panel"
import { ConsultDetailPanel } from "./consult-detail-panel"
import { ConsultFormDialog } from "./consult-form-dialog"
import { AdmissionConsultationHelpDialog } from "./admission-consultation-help-dialog"

interface ProspectsPageClientProps {
    academies: IumAcademyOption[]
    gradeCodes: IumCodeRow[]
    consultStatusCodes: IumCodeRow[]
    isAdmin: boolean
    userAcademyId: number | null
}

export function ProspectsPageClient({
    academies,
    gradeCodes,
    consultStatusCodes,
    isAdmin,
    userAcademyId,
}: ProspectsPageClientProps) {
    const gradeLabelByCode = React.useMemo(
        () => Object.fromEntries(gradeCodes.map((c) => [c.code, c.label])),
        [gradeCodes],
    )
    const statusLabelByCode = React.useMemo(
        () => ({
            ...CONSULT_STATUS_LABEL,
            ...Object.fromEntries(consultStatusCodes.map((c) => [c.code, c.label])),
        }),
        [consultStatusCodes],
    )
    const [statusFilter, setStatusFilter] = React.useState<ConsultStatus | "ALL">("ALL")
    const [keyword, setKeyword] = React.useState("")
    const [rows, setRows] = React.useState<ConsultRow[]>([])
    const [stats, setStats] = React.useState<ConsultStats | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [selectedId, setSelectedId] = React.useState<number | null>(null)
    const [detail, setDetail] = React.useState<ConsultDetail | null>(null)
    const [detailLoading, setDetailLoading] = React.useState(false)
    const [formOpen, setFormOpen] = React.useState(false)
    const [formMode, setFormMode] = React.useState<"create" | "edit">("create")

    const load = React.useCallback(async () => {
        setLoading(true)
        const [listRes, statsRes] = await Promise.all([
            listConsultations(
                statusFilter === "ALL" ? null : statusFilter,
                keyword.trim() || null,
            ),
            getConsultationStats(),
        ])
        if (listRes.success && listRes.data) {
            setRows(listRes.data)
        } else if (!listRes.success) {
            toast.error(listRes.error)
            setRows([])
        }
        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data)
        }
        setLoading(false)
    }, [statusFilter, keyword])

    React.useEffect(() => {
        load()
    }, [load])

    const loadDetail = React.useCallback(async (id: number) => {
        setDetailLoading(true)
        const res = await getConsultationDetail(id)
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

    const handleRefresh = async () => {
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
                        <UserPlus className="h-5 w-5 text-primary" />
                        상담 관리
                    </CardTitle>
                    <AdmissionConsultationHelpDialog />
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
                    <div className="shrink-0 border-b border-border bg-muted/20 p-3">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatCard
                                icon={<CircleDashed className="h-5 w-5 text-primary" />}
                                title="신규 / 상담중"
                                value={
                                    stats
                                        ? `${stats.newCount + stats.inProgress}건`
                                        : "--"
                                }
                                description={
                                    stats
                                        ? `신규 ${stats.newCount} · 상담중 ${stats.inProgress}`
                                        : ""
                                }
                            />
                            <StatCard
                                icon={<Clock className="h-5 w-5 text-amber-500" />}
                                title="보류"
                                value={stats ? `${stats.waiting}건` : "--"}
                            />
                            <StatCard
                                icon={<Users className="h-5 w-5 text-emerald-500" />}
                                title="등록 전환"
                                value={stats ? `${stats.converted}명` : "--"}
                                description={
                                    stats ? `이탈 ${stats.lost}명` : ""
                                }
                            />
                            <StatCard
                                icon={<TrendingUp className="h-5 w-5 text-rose-500" />}
                                title="전환율"
                                value={
                                    stats?.conversionRate != null
                                        ? `${stats.conversionRate}%`
                                        : "--%"
                                }
                                description={
                                    stats
                                        ? `종결 ${stats.converted + stats.lost}건 중`
                                        : ""
                                }
                            />
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                        <div className="flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden border-border lg:min-h-0 lg:w-[55%] lg:border-r">
                            <div className="flex h-10 shrink-0 flex-row items-center justify-between space-y-0 border-b border-border bg-muted/30 px-3 py-0">
                                <div className="flex items-center gap-2">
                                    <List className="h-4 w-4 text-primary" aria-hidden />
                                    <span className="text-sm font-bold">상담 목록</span>
                                </div>
                                {isAdmin && (
                                    <Button
                                        size="sm"
                                        className="h-7 rounded-md text-sm"
                                        onClick={handleCreate}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        상담 접수
                                    </Button>
                                )}
                            </div>
                            <div className="shrink-0 border-b border-border bg-muted/20 p-3 dark:bg-muted/20">
                                <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_2fr_1fr]">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-muted-foreground leading-none">
                                            상태
                                        </span>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={(v) =>
                                                setStatusFilter(v as ConsultStatus | "ALL")
                                            }
                                        >
                                            <SelectTrigger className="h-9 border-border bg-card text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">전체</SelectItem>
                                                {CONSULT_STATUS_FILTER_ORDER.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {statusLabelByCode[s] ?? s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-muted-foreground leading-none">
                                            검색
                                        </span>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="학생명·신청자·전화·과목"
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
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-muted-foreground leading-none sm:invisible">
                                            &nbsp;
                                        </span>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-9 text-xs"
                                            onClick={() => load()}
                                        >
                                            조회
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="scrollbar-hide min-h-0 flex-1 overflow-auto">
                                <ConsultListPanel
                                    rows={rows}
                                    loading={loading}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    gradeLabelByCode={gradeLabelByCode}
                                    statusLabelByCode={statusLabelByCode}
                                />
                            </div>
                            <div className="flex h-8 shrink-0 items-center border-t border-border bg-muted/30 px-4">
                                <span className="text-sm text-muted-foreground">
                                    총 {rows.length}건
                                </span>
                            </div>
                        </div>

                        <div
                            className="hidden w-1 shrink-0 border-l border-border lg:block"
                            aria-hidden
                        />

                        <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
                            <div className="flex min-h-0 flex-1 flex-col overflow-auto p-0">
                                <ConsultDetailPanel
                                    consult={detail}
                                    loading={detailLoading}
                                    isAdmin={isAdmin}
                                    gradeLabelByCode={gradeLabelByCode}
                                    statusLabelByCode={statusLabelByCode}
                                    onEdit={handleEdit}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ConsultFormDialog
                open={formOpen}
                mode={formMode}
                initial={formMode === "edit" ? detail : null}
                academies={academies}
                gradeCodes={gradeCodes}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
                onOpenChange={setFormOpen}
                onSaved={handleFormSaved}
            />
        </div>
    )
}

function StatCard({
    icon,
    title,
    value,
    description,
}: {
    icon: React.ReactNode
    title: string
    value: string
    description?: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground">{title}</p>
                <p className="text-lg font-bold">{value}</p>
                {description && (
                    <p className="truncate text-[10px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}

export function formatConsultRequestedAt(raw: string): string {
    const d = dayjs(raw)
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "—"
}
