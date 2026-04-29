"use client"

import * as React from "react"
import { Heart, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { StudentRow } from "@/types/student"

interface StudentListPanelProps {
    rows: StudentRow[]
    loading: boolean
    selectedId: number | null
    onSelect: (id: number) => void
}

export function StudentListPanel({
    rows,
    loading,
    selectedId,
    onSelect,
}: StudentListPanelProps) {
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
        <ScrollArea className="flex-1">
            <ul className="p-1">
                {rows.map((row) => {
                    const active = row.id === selectedId
                    const withdrawn = row.status === "WITHDRAWN"
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
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                            "text-sm font-semibold truncate",
                                            withdrawn && "text-muted-foreground line-through",
                                        )}>
                                            {row.name}
                                        </span>
                                        {row.siblingCount > 0 && (
                                            <Heart className="h-3 w-3 text-rose-500 shrink-0" />
                                        )}
                                        {withdrawn && (
                                            <UserX className="h-3 w-3 text-muted-foreground shrink-0" />
                                        )}
                                    </div>
                                    {row.grade && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0 shrink-0"
                                        >
                                            {row.grade}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                    <span className="truncate">
                                        {row.school ?? "—"}
                                    </span>
                                    <span className="shrink-0">·</span>
                                    <span className="truncate">
                                        {row.academyName ?? "—"}
                                    </span>
                                </div>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </ScrollArea>
    )
}
