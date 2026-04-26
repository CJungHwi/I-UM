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
import type {
    ConsultDetail,
    ConsultRow,
    ConsultStats,
    ConsultStatus,
} from "@/types/consultation"
import {
    getConsultationDetail,
    getConsultationStats,
    listConsultations,
} from "@/actions/consultation-actions"
import { ConsultListPanel } from "./consult-list-panel"
import { ConsultDetailPanel } from "./consult-detail-panel"
import { ConsultFormDialog } from "./consult-form-dialog"

interface ProspectsPageClientProps {
    academies: IumAcademyOption[]
    isAdmin: boolean
    userAcademyId: number | null
}

export function ProspectsPageClient({
    academies,
    isAdmin,
    userAcademyId,
}: ProspectsPageClientProps) {
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
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <UserPlus className="h-5 w-5 text-primary" />
                        가망 고객 / 상담 관리
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="학생명·신청자·전화·과목"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="h-9 text-xs bg-card pl-7 pr-7 w-[220px] border-border"
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
                            onValueChange={(v) =>
                                setStatusFilter(v as ConsultStatus | "ALL")
                            }
                        >
                            <SelectTrigger className="h-9 text-xs w-[110px] bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체</SelectItem>
                                <SelectItem value="NEW">신규</SelectItem>
                                <SelectItem value="IN_PROGRESS">상담중</SelectItem>
                                <SelectItem value="WAIT">대기</SelectItem>
                                <SelectItem value="CONVERTED">등록</SelectItem>
                                <SelectItem value="LOST">이탈</SelectItem>
                            </SelectContent>
                        </Select>
                        {isAdmin && (
                            <Button
                                size="sm"
                                className="h-9 text-xs rounded-xl"
                                onClick={handleCreate}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                상담 접수
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
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
                            title="대기"
                            value={stats ? `${stats.waiting}건` : "--"}
                        />
                        <StatCard
                            icon={<Users className="h-5 w-5 text-emerald-500" />}
                            title="등록 전환"
                            value={stats ? `${stats.converted}명` : "--"}
                            description={
                                stats
                                    ? `이탈 ${stats.lost}명`
                                    : ""
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

                    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-[3px]">
                        <Card className="w-full md:w-[360px] md:shrink-0 flex flex-col rounded-2xl border border-border overflow-hidden max-h-[45vh] md:max-h-none">
                            <ConsultListPanel
                                rows={rows}
                                loading={loading}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                            />
                        </Card>
                        <Card className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border overflow-hidden">
                            <ConsultDetailPanel
                                consult={detail}
                                loading={detailLoading}
                                isAdmin={isAdmin}
                                onEdit={handleEdit}
                                onRefresh={handleRefresh}
                            />
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <ConsultFormDialog
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
        <Card className="rounded-2xl border border-border shadow-card">
            <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">
                        {title}
                    </p>
                    <p className="text-lg font-bold">{value}</p>
                    {description && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function formatConsultRequestedAt(raw: string): string {
    const d = dayjs(raw)
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "—"
}
