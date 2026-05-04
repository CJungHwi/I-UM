"use client"

import * as React from "react"
import { User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { labelForStudentCode } from "@/lib/student-code-labels"
import type { StudentRow } from "@/types/student"

interface StudentCardGridProps {
    rows: StudentRow[]
    loading: boolean
    selectedId: number | null
    onSelect: (id: number) => void
    gradeLabelByCode: Record<string, string>
}

export const StudentCardGrid = ({
    rows,
    loading,
    selectedId,
    onSelect,
    gradeLabelByCode,
}: StudentCardGridProps) => {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                {rows.map((row) => {
                    const active = row.id === selectedId
                    const withdrawn = row.status === "WITHDRAWN"
                    return (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => onSelect(row.id)}
                            className={cn(
                                "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors",
                                "hover:bg-muted/30",
                                active && "ring-2 ring-ring border-primary/40 bg-primary/5",
                                withdrawn && "opacity-70",
                            )}
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                                    {row.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={row.photoUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                            <User className="h-7 w-7" aria-hidden />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                            className={cn(
                                                "text-sm font-bold truncate",
                                                withdrawn && "line-through text-muted-foreground",
                                            )}
                                        >
                                            {row.name}
                                        </span>
                                        {labelForStudentCode(row.grade, gradeLabelByCode) && (
                                            <Badge variant="secondary" className="text-[10px] shrink-0">
                                                {labelForStudentCode(row.grade, gradeLabelByCode)}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                        {row.school ?? "학교 미입력"}
                                    </p>
                                    <p className="text-[11px] text-foreground/90 truncate mt-0.5">
                                        <span className="text-muted-foreground">수강 반 </span>
                                        {row.currentClassNames ?? "—"}
                                    </p>
                                </div>
                            </div>
                            {row.interestTags && (
                                <div className="flex flex-wrap gap-1">
                                    {row.interestTags
                                        .split(",")
                                        .map((t) => t.trim())
                                        .filter(Boolean)
                                        .slice(0, 4)
                                        .map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="text-[10px] font-normal border-border"
                                            >
                                                {tag.startsWith("#") ? tag : `#${tag}`}
                                            </Badge>
                                        ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
