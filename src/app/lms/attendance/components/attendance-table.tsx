"use client"

import * as React from "react"
import dayjs from "dayjs"
import { Check, LogIn, LogOut, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import type { AttendanceRow, AttendanceStatus } from "@/types/attendance"
import {
    ATTENDANCE_STATUS_LABEL,
    ATTENDANCE_STATUS_ORDER,
} from "@/types/attendance"

interface AttendanceTableProps {
    rows: AttendanceRow[]
    loading: boolean
    isAdmin: boolean
    onStatusChange: (row: AttendanceRow, status: AttendanceStatus) => void
    onCheckIn: (row: AttendanceRow) => void
    onCheckOut: (row: AttendanceRow) => void
    onDelete: (row: AttendanceRow) => void
}

const STATUS_COLOR: Record<AttendanceStatus, string> = {
    PRESENT: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    LATE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    EARLY_LEAVE: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    ABSENT: "bg-destructive/15 text-destructive",
    EXCUSED: "bg-muted text-muted-foreground",
}

function formatTime(iso: string | null): string {
    if (!iso) return "—"
    const d = dayjs(iso)
    return d.isValid() ? d.format("HH:mm") : "—"
}

export function AttendanceTable({
    rows,
    loading,
    isAdmin,
    onStatusChange,
    onCheckIn,
    onCheckOut,
    onDelete,
}: AttendanceTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center flex-1 py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                표시할 학생이 없습니다.
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <Table className="w-full table-fixed border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
                    <TableRow className="h-[40px] hover:bg-transparent">
                        <TableHead className="text-[11px] w-[140px] text-center">
                            학생
                        </TableHead>
                        <TableHead className="text-[11px] w-[80px] text-center">
                            학년
                        </TableHead>
                        <TableHead className="text-[11px] text-center hidden md:table-cell">
                            학교
                        </TableHead>
                        <TableHead className="text-[11px] text-center hidden lg:table-cell">
                            소속
                        </TableHead>
                        <TableHead className="text-[11px] w-[120px] text-center">
                            상태
                        </TableHead>
                        <TableHead className="text-[11px] w-[80px] text-center">
                            등원
                        </TableHead>
                        <TableHead className="text-[11px] w-[80px] text-center">
                            하원
                        </TableHead>
                        <TableHead className="text-[11px] w-[160px] text-right pr-3">
                            작업
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const recorded = row.status != null
                        return (
                            <TableRow
                                key={row.studentId}
                                className={cn(
                                    "h-[40px] transition-colors",
                                    "hover:bg-muted/30",
                                )}
                            >
                                <TableCell className="text-xs font-semibold truncate max-w-[140px]">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="truncate block">
                                                {row.name}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>{row.name}</TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                <TableCell className="text-[11px] text-center">
                                    {row.grade ?? "—"}
                                </TableCell>
                                <TableCell className="text-[11px] hidden md:table-cell truncate text-muted-foreground">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="truncate block">
                                                {row.school ?? "—"}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {row.school ?? "—"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                <TableCell className="text-[11px] hidden lg:table-cell truncate text-muted-foreground">
                                    {row.academyName ?? "—"}
                                </TableCell>
                                <TableCell className="text-[11px] p-1">
                                    {isAdmin ? (
                                        <Select
                                            value={row.status ?? ""}
                                            onValueChange={(v) =>
                                                v &&
                                                onStatusChange(row, v as AttendanceStatus)
                                            }
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-8 text-xs bg-card justify-center",
                                                    row.status &&
                                                        STATUS_COLOR[row.status],
                                                )}
                                            >
                                                <SelectValue placeholder="미기록" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ATTENDANCE_STATUS_ORDER.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {ATTENDANCE_STATUS_LABEL[s]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : row.status ? (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px]",
                                                STATUS_COLOR[row.status],
                                            )}
                                        >
                                            {ATTENDANCE_STATUS_LABEL[row.status]}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            미기록
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-[11px] text-center tabular-nums">
                                    {formatTime(row.checkInAt)}
                                </TableCell>
                                <TableCell className="text-[11px] text-center tabular-nums">
                                    {formatTime(row.checkOutAt)}
                                </TableCell>
                                <TableCell className="text-[11px] pr-2">
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 justify-end">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-[11px] rounded-lg"
                                                        onClick={() => onCheckIn(row)}
                                                    >
                                                        <LogIn className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>등원</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2 text-[11px] rounded-lg"
                                                        onClick={() => onCheckOut(row)}
                                                        disabled={!row.checkInAt}
                                                    >
                                                        <LogOut className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>하원</TooltipContent>
                                            </Tooltip>
                                            {recorded && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2 text-[11px] rounded-lg text-destructive"
                                                            onClick={() => onDelete(row)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        기록 삭제
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {recorded && row.status === "PRESENT" && (
                                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
    )
}
