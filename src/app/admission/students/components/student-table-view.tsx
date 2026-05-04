"use client"

import * as React from "react"
import { Heart, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { labelForStudentCode } from "@/lib/student-code-labels"
import type { StudentRow } from "@/types/student"

const TH =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-r border-b border-[#343637] dark:border-[#6b7280]"
const TH_LAST =
    "h-[45px] px-1 py-0 text-center text-xs font-bold text-white bg-[#b9adb5] dark:bg-[#303653] dark:text-[#E0E0E0] border-b border-[#343637] dark:border-[#6b7280]"
const TD =
    "h-[35px] px-2 py-0 text-center text-xs align-middle border-r border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const TD_LAST =
    "h-[35px] px-2 py-0 text-center text-xs align-middle border-b border-[#343637]/25 dark:border-[#6b7280]/25 text-[#1d1d1d] dark:text-foreground"
const TR =
    "transition-colors bg-white hover:bg-muted/40 dark:bg-[#252841] dark:hover:bg-primary/15 cursor-pointer"

interface StudentTableViewProps {
    rows: StudentRow[]
    loading: boolean
    selectedId: number | null
    onSelect: (id: number) => void
    gradeLabelByCode: Record<string, string>
    routeLabelByCode: Record<string, string>
}

export const StudentTableView = ({
    rows,
    loading,
    selectedId,
    onSelect,
    gradeLabelByCode,
    routeLabelByCode,
}: StudentTableViewProps) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center flex-1 py-10">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground">
                표시할 학생이 없습니다.
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1 min-h-0">
            <table className="w-full min-w-[720px] table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th className={TH}>이름</th>
                        <th className={TH}>학교</th>
                        <th className={TH}>학년</th>
                        <th className={TH}>접수 경로</th>
                        <th className={TH}>수강 반</th>
                        <th className={TH}>관심 키워드</th>
                        <th className={TH_LAST}>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const active = row.id === selectedId
                        const withdrawn = row.status === "WITHDRAWN"
                        return (
                            <tr
                                key={row.id}
                                className={cn(TR, active && "bg-primary/20")}
                                onClick={() => onSelect(row.id)}
                            >
                                <td className={TD}>
                                    <div className="flex items-center justify-center gap-1 truncate">
                                        <span
                                            className={cn(
                                                "truncate font-semibold",
                                                withdrawn && "line-through text-muted-foreground",
                                            )}
                                        >
                                            {row.name}
                                        </span>
                                        {row.siblingCount > 0 && (
                                            <Heart className="h-3 w-3 text-rose-500 shrink-0" aria-hidden />
                                        )}
                                        {withdrawn && (
                                            <UserX className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
                                        )}
                                    </div>
                                </td>
                                <td className={TD}>
                                    <span className="truncate block">{row.school ?? "—"}</span>
                                </td>
                                <td className={TD}>
                                    <span className="truncate block">
                                        {labelForStudentCode(row.grade, gradeLabelByCode) || "—"}
                                    </span>
                                </td>
                                <td className={TD}>
                                    <span className="truncate block text-[10px]">
                                        {labelForStudentCode(
                                            row.admissionRouteCode,
                                            routeLabelByCode,
                                        ) || "—"}
                                    </span>
                                </td>
                                <td className={TD}>
                                    <span className="truncate block">{row.currentClassNames ?? "—"}</span>
                                </td>
                                <td className={TD}>
                                    <span className="truncate block text-[10px] text-muted-foreground">
                                        {row.interestTags
                                            ? row.interestTags
                                                  .split(",")
                                                  .map((t) => t.trim())
                                                  .filter(Boolean)
                                                  .slice(0, 3)
                                                  .map((t) => (t.startsWith("#") ? t : `#${t}`))
                                                  .join(" ")
                                            : "—"}
                                    </span>
                                </td>
                                <td className={TD_LAST}>
                                    {withdrawn ? (
                                        <Badge variant="outline" className="text-[10px]">
                                            퇴원
                                        </Badge>
                                    ) : (
                                        <Badge className="text-[10px]">재원</Badge>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </ScrollArea>
    )
}
