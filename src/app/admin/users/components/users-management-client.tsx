"use client"

import * as React from "react"
import { toast } from "sonner"
import { Users, Check, X, Shield, UserCircle } from "lucide-react"
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
import type { IumUserRow, IumApprovalStatus, IumUserGrade, IumUserLevel } from "@/types/ium-user"
import {
    listIumUsers,
    approveIumUser,
    rejectIumUser,
    setIumUserGrade,
    setIumUserLevel,
} from "@/actions/ium-user-actions"

const STATUS_LABEL: Record<IumApprovalStatus, string> = {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려",
}

function levelLabel(l: IumUserLevel) {
    return l === "DIRECTOR" ? "원장" : "교사"
}

function gradeLabel(g: IumUserGrade) {
    return g === "ADMIN" ? "관리자" : "사용자"
}

export function UsersManagementClient() {
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

    const handleGradeChange = async (id: number, grade: IumUserGrade) => {
        const res = await setIumUserGrade(id, grade)
        if (res.success) {
            toast.success("등급이 변경되었습니다.")
            load()
        } else toast.error(res.error)
    }

    const handleLevelChange = async (id: number, level: IumUserLevel) => {
        const res = await setIumUserLevel(id, level)
        if (res.success) {
            toast.success("역할이 변경되었습니다.")
            load()
        } else toast.error(res.error)
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Users className="h-5 w-5 text-primary" />
                        사용자 관리 · 승인
                    </CardTitle>
                    <div className="flex gap-1">
                        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs rounded-xl"
                                onClick={() => setFilter(f)}
                            >
                                {f === "ALL" ? "전체" : STATUS_LABEL[f]}
                            </Button>
                        ))}
                    </div>
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
                                        <TableHead className="text-xs w-[120px]">역할</TableHead>
                                        <TableHead className="text-xs w-[120px]">등급</TableHead>
                                        <TableHead className="text-xs hidden lg:table-cell w-[140px]">신청일</TableHead>
                                        <TableHead className="text-xs w-[160px] text-right">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
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
                                                        value={u.userLevel}
                                                        onValueChange={(v) =>
                                                            handleLevelChange(u.id, v as IumUserLevel)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-card">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="DIRECTOR">
                                                                <span className="flex items-center gap-1">
                                                                    <UserCircle className="h-3 w-3" /> 원장
                                                                </span>
                                                            </SelectItem>
                                                            <SelectItem value="TEACHER">교사</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    levelLabel(u.userLevel)
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs p-1">
                                                {u.approvalStatus === "APPROVED" ? (
                                                    <Select
                                                        value={u.userGrade}
                                                        onValueChange={(v) =>
                                                            handleGradeChange(u.id, v as IumUserGrade)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs bg-card">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="USER">
                                                                <span className="flex items-center gap-1">
                                                                    <UserCircle className="h-3 w-3" /> 사용자
                                                                </span>
                                                            </SelectItem>
                                                            <SelectItem value="ADMIN">
                                                                <span className="flex items-center gap-1">
                                                                    <Shield className="h-3 w-3" /> 관리자
                                                                </span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    gradeLabel(u.userGrade)
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
