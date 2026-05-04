"use client"

import * as React from "react"
import dayjs from "dayjs"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { labelForStudentCode } from "@/lib/student-code-labels"
import type { ConsultRow, ConsultStatus } from "@/types/consultation"
import {
    CONSULT_SOURCE_LABEL,
} from "@/types/consultation"

interface ConsultListPanelProps {
    rows: ConsultRow[]
    loading: boolean
    selectedId: number | null
    onSelect: (id: number) => void
    gradeLabelByCode: Record<string, string>
    statusLabelByCode: Record<string, string>
}

const STATUS_BADGE: Record<ConsultStatus, string> = {
    NEW: "bg-primary/15 text-primary",
    IN_PROGRESS: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    WAIT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    CONVERTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    LOST: "bg-muted text-muted-foreground",
}

export function ConsultListPanel({
    rows,
    loading,
    selectedId,
    onSelect,
    gradeLabelByCode,
    statusLabelByCode,
}: ConsultListPanelProps) {
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
                등록된 상담이 없습니다.
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1">
            <ul className="p-1">
                {rows.map((row) => {
                    const active = row.id === selectedId
                    return (
                        <li key={row.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(row.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl transition-colors",
                                    "hover:bg-muted/50",
                                    active && "bg-primary/15 hover:bg-primary/20",
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-sm font-semibold truncate">
                                            {row.studentName}
                                        </span>
                                        {labelForStudentCode(row.grade, gradeLabelByCode) && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1 py-0 shrink-0"
                                            >
                                                {labelForStudentCode(row.grade, gradeLabelByCode)}
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] px-1.5 py-0 shrink-0 border-transparent",
                                            STATUS_BADGE[row.status],
                                        )}
                                    >
                                        {statusLabelByCode[row.status] ?? row.status}
                                    </Badge>
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                    <span className="shrink-0">
                                        {CONSULT_SOURCE_LABEL[row.source]}
                                    </span>
                                    <span className="shrink-0">·</span>
                                    <span className="truncate">
                                        {row.contactName}
                                        {row.contactPhone ? ` (${row.contactPhone})` : ""}
                                    </span>
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                    <span>
                                        {dayjs(row.requestedAt).isValid()
                                            ? dayjs(row.requestedAt).format("MM-DD HH:mm")
                                            : "—"}
                                    </span>
                                    {row.subject && (
                                        <>
                                            <span>·</span>
                                            <span className="truncate">{row.subject}</span>
                                        </>
                                    )}
                                    {row.academyName && (
                                        <>
                                            <span>·</span>
                                            <span className="truncate">
                                                {row.academyName}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </ScrollArea>
    )
}
