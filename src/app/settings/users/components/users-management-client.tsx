"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { List, Users, Check, X, Shield, UserCircle } from "lucide-react"
import dayjs from "dayjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { IumUserRow, IumApprovalStatus, IumUserRole } from "@/types/ium-user"
import {
    listIumUsers,
    approveIumUser,
    rejectIumUser,
    setIumUserRole,
} from "@/actions/ium-user-actions"

/** 관리 목록 표준 테이블 (management-list-page.mdc / academies-admin-client 동일 계열) */
const TH_CLASS =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-r border-b border-[#343637] dark:border-[#6b7280]"
const TH_LAST_CLASS =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-b border-[#343637] dark:border-[#6b7280]"
const TD_CLASS =
    "h-[35px] px-2 py-0 text-center text-xs align-middle border-r border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const TD_LAST_CLASS =
    "h-[35px] px-2 py-0 text-xs align-middle border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const ROW_CLASS =
    "transition-colors bg-white hover:bg-muted/40 dark:bg-[#252841] dark:hover:bg-primary/15"

const STATUS_LABEL: Record<IumApprovalStatus, string> = {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려",
}

interface UsersManagementClientProps {
    title?: string
    /** `management-list`: 단일 카드 + List 서브헤더 + 네이티브 표 + 총 N건 (system/admins 등) */
    layoutVariant?: "settings" | "management-list"
}

function roleLabel(role: IumUserRole) {
    if (role === "SYSTEM_ADMIN") return "시스템 전체 관리자"
    if (role === "ACADEMY_ADMIN") return "학원관리자"
    return "학원강사/일반"
}

export function UsersManagementClient({
    title = "학원 사용자 관리 · 승인",
    layoutVariant = "settings",
}: UsersManagementClientProps) {
    const { data: session } = useSession()
    const canGrantSystemAdmin = session?.user?.role === "SYSTEM_ADMIN"
    const [filter, setFilter] = React.useState<IumApprovalStatus | "ALL">("PENDING")
    const [rows, setRows] = React.useState<IumUserRow[]>([])
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listIumUsers(filter === "ALL" ? null : filter)
        if (res.success && res.data) {
            setRows(res.data)
        } else if (!res.success) {
            toast.error(res.error)
        }
        setLoading(false)
    }, [filter])

    React.useEffect(() => {
        load()
    }, [load])

    const handleApprove = async (id: number) => {
        const res = await approveIumUser(id)
        if (res.success) {
            toast.success("승인되었습니다.")
            load()
        } else toast.error(res.error)
    }

    const handleReject = async (id: number) => {
        const res = await rejectIumUser(id)
        if (res.success) {
            toast.success("반려되었습니다.")
            load()
        } else toast.error(res.error)
    }

    const handleRoleChange = async (id: number, role: IumUserRole) => {
        const res = await setIumUserRole(id, role)
        if (res.success) {
            toast.success("사용자 레벨이 변경되었습니다.")
            load()
        } else toast.error(res.error)
    }

    const filterButtons = (
        <div className="flex flex-wrap items-center justify-end gap-1">
            {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
                <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    type="button"
                    className={
                        layoutVariant === "management-list"
                            ? "h-7 rounded-md px-2 text-xs"
                            : "h-8 text-xs rounded-xl"
                    }
                    onClick={() => setFilter(f)}
                >
                    {f === "ALL" ? "전체" : STATUS_LABEL[f]}
                </Button>
            ))}
        </div>
    )

    if (layoutVariant === "management-list") {
        return (
            <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
                <Card className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#343637] bg-card shadow-md dark:border-[#6b7280] dark:shadow-none">
                    <CardHeader className="h-12 shrink-0 space-y-0 border-b border-[#343637] bg-[#f9fafb] px-4 py-0 dark:border-[#6b7280] dark:bg-muted/30">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold leading-none text-[#1d1d1d] dark:text-white">
                            <Users className="h-5 w-5 text-primary" />
                            {title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
                        <div className="flex min-h-0 flex-1 flex-col border-b border-[#343637] dark:border-[#6b7280]">
                            <div className="flex h-10 shrink-0 flex-row items-center justify-between gap-2 space-y-0 border-b border-[#343637] bg-muted/30 px-3 py-0 dark:border-[#6b7280]">
                                <span className="flex min-w-0 items-center gap-1 text-sm font-bold">
                                    <List className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                    사용자목록
                                </span>
                                {filterButtons}
                            </div>
                            <div className="min-h-0 flex-1 overflow-auto scrollbar-hide">
                                {loading ? (
                                    <div className="flex h-[200px] items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : (
                                    <UsersManagementNativeTable
                                        rows={rows}
                                        canGrantSystemAdmin={canGrantSystemAdmin}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onRoleChange={handleRoleChange}
                                    />
                                )}
                            </div>
                            <div className="flex h-8 shrink-0 items-center border-t border-[#343637] bg-muted/30 px-4 dark:border-[#6b7280]">
                                <span className="text-sm text-muted-foreground">총 {rows.length}건</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Users className="h-5 w-5 text-primary" />
                        {title}
                    </CardTitle>
                    {filterButtons}
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
                                        <TableHead className="text-xs w-[100px]">아이디</TableHead>
                                        <TableHead className="text-xs">이름</TableHead>
                                        <TableHead className="text-xs hidden sm:table-cell min-w-[100px]">
                                            소속
                                        </TableHead>
                                        <TableHead className="text-xs hidden md:table-cell">이메일</TableHead>
                                        <TableHead className="text-xs w-[88px]">상태</TableHead>
                                        <TableHead className="text-xs w-[170px]">사용자 레벨</TableHead>
                                        <TableHead className="text-xs hidden lg:table-cell w-[140px]">신청일</TableHead>
                                        <TableHead className="text-xs w-[160px] text-right">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                                                표시할 사용자가 없습니다.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {rows.map((u) => (
                                        <TableRow key={u.id} className="h-[35px]">
                                            <TableCell className="text-xs font-medium truncate max-w-[100px]">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="truncate block">{u.loginId}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{u.loginId}</TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="text-xs">{u.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[120px]">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="truncate block">
                                                            {u.academyName ?? "—"}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{u.academyName ?? "—"}</TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell truncate max-w-[180px]">
                                                {u.email ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <span
                                                    className={
                                                        u.approvalStatus === "PENDING"
                                                            ? "text-amber-600"
                                                            : u.approvalStatus === "APPROVED"
                                                              ? "text-emerald-600"
                                                              : "text-muted-foreground"
                                                    }
                                                >
                                                    {STATUS_LABEL[u.approvalStatus]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs p-1">
                                                {u.approvalStatus === "APPROVED" ? (
                                                    <Select
                                                        value={u.role}
                                                        onValueChange={(v) =>
                                                            handleRoleChange(u.id, v as IumUserRole)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-card">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ACADEMY_MEMBER">
                                                                <span className="flex items-center gap-1">
                                                                    <UserCircle className="h-3 w-3" /> 학원강사/일반
                                                                </span>
                                                            </SelectItem>
                                                            <SelectItem value="ACADEMY_ADMIN">
                                                                <span className="flex items-center gap-1">
                                                                    <Shield className="h-3 w-3" /> 학원관리자
                                                                </span>
                                                            </SelectItem>
                                                            {canGrantSystemAdmin && (
                                                                <SelectItem value="SYSTEM_ADMIN">
                                                                    <span className="flex items-center gap-1">
                                                                        <Shield className="h-3 w-3" /> 시스템 전체 관리자
                                                                    </span>
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    roleLabel(u.role)
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                                                {u.createdAt
                                                    ? dayjs(u.createdAt).format("YYYY-MM-DD HH:mm")
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-right">
                                                {u.approvalStatus === "PENDING" && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs rounded-lg text-emerald-600 border-emerald-200"
                                                            onClick={() => handleApprove(u.id)}
                                                        >
                                                            <Check className="h-3 w-3 mr-0.5" />
                                                            승인
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs rounded-lg"
                                                            onClick={() => handleReject(u.id)}
                                                        >
                                                            <X className="h-3 w-3 mr-0.5" />
                                                            반려
                                                        </Button>
                                                    </div>
                                                )}
                                                {u.approvalStatus !== "PENDING" && "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

type UsersManagementNativeTableProps = {
    rows: IumUserRow[]
    canGrantSystemAdmin: boolean
    onApprove: (id: number) => void
    onReject: (id: number) => void
    onRoleChange: (id: number, role: IumUserRole) => void
}

const UsersManagementNativeTable = ({
    rows,
    canGrantSystemAdmin,
    onApprove,
    onReject,
    onRoleChange,
}: UsersManagementNativeTableProps) => {
    return (
        <table className="w-full min-w-[960px] table-fixed border-collapse">
            <thead className="sticky top-0 z-10">
                <tr>
                    <th className={`w-[100px] ${TH_CLASS}`}>아이디</th>
                    <th className={`min-w-0 ${TH_CLASS}`}>이름</th>
                    <th className={`hidden w-[120px] sm:table-cell ${TH_CLASS}`}>소속</th>
                    <th className={`hidden md:table-cell ${TH_CLASS}`}>이메일</th>
                    <th className={`w-[72px] ${TH_CLASS}`}>상태</th>
                    <th className={`w-[168px] ${TH_CLASS}`}>사용자 레벨</th>
                    <th className={`hidden w-[140px] lg:table-cell ${TH_CLASS}`}>신청일</th>
                    <th className={`w-[148px] text-right ${TH_LAST_CLASS}`}>작업</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="h-[120px] text-center text-sm text-muted-foreground">
                            표시할 사용자가 없습니다.
                        </td>
                    </tr>
                ) : (
                    rows.map((u) => (
                        <tr key={u.id} className={ROW_CLASS}>
                            <td className={`${TD_CLASS} text-left`}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="block w-full truncate font-medium">{u.loginId}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs whitespace-pre-wrap">{u.loginId}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </td>
                            <td className={TD_CLASS}>{u.name}</td>
                            <td className={`${TD_CLASS} hidden text-muted-foreground sm:table-cell`}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="block w-full truncate">{u.academyName ?? "—"}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs whitespace-pre-wrap">{u.academyName ?? "—"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </td>
                            <td className={`${TD_CLASS} hidden truncate text-muted-foreground md:table-cell`}>
                                {u.email ?? "—"}
                            </td>
                            <td className={TD_CLASS}>
                                <span
                                    className={
                                        u.approvalStatus === "PENDING"
                                            ? "text-amber-600"
                                            : u.approvalStatus === "APPROVED"
                                              ? "text-emerald-600"
                                              : "text-muted-foreground"
                                    }
                                >
                                    {STATUS_LABEL[u.approvalStatus]}
                                </span>
                            </td>
                            <td className={`${TD_CLASS} p-1`}>
                                {u.approvalStatus === "APPROVED" ? (
                                    <Select value={u.role} onValueChange={(v) => onRoleChange(u.id, v as IumUserRole)}>
                                        <SelectTrigger className="h-8 bg-card text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACADEMY_MEMBER">
                                                <span className="flex items-center gap-1">
                                                    <UserCircle className="h-3 w-3" /> 학원강사/일반
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="ACADEMY_ADMIN">
                                                <span className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" /> 학원관리자
                                                </span>
                                            </SelectItem>
                                            {canGrantSystemAdmin && (
                                                <SelectItem value="SYSTEM_ADMIN">
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> 시스템 전체 관리자
                                                    </span>
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    roleLabel(u.role)
                                )}
                            </td>
                            <td className={`${TD_CLASS} hidden text-muted-foreground lg:table-cell`}>
                                {u.createdAt ? dayjs(u.createdAt).format("YYYY-MM-DD HH:mm") : "—"}
                            </td>
                            <td className={`${TD_LAST_CLASS} text-right`}>
                                {u.approvalStatus === "PENDING" ? (
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-6 rounded-md border-emerald-200 px-2 text-[10px] text-emerald-600"
                                            onClick={() => onApprove(u.id)}
                                        >
                                            <Check className="mr-0.5 h-3 w-3" />
                                            승인
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-6 rounded-md px-2 text-[10px]"
                                            onClick={() => onReject(u.id)}
                                        >
                                            <X className="mr-0.5 h-3 w-3" />
                                            반려
                                        </Button>
                                    </div>
                                ) : (
                                    "—"
                                )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    )
}
