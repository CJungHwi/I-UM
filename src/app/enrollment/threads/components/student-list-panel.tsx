"use client"

import { useState } from "react"
import { Search, Users } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ThreadStudent } from "@/types/thread"

interface StudentListPanelProps {
    students: ThreadStudent[]
    selectedId: number | null
    onSelect: (student: ThreadStudent) => void
}

export function StudentListPanel({
    students,
    selectedId,
    onSelect,
}: StudentListPanelProps) {
    const [search, setSearch] = useState("")

    const filtered = students.filter(
        (s) =>
            s.name.includes(search) ||
            s.mbId.toLowerCase().includes(search.toLowerCase()),
    )

    return (
        <div className="flex flex-col h-full">
            <div className="h-12 px-3 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-bold whitespace-nowrap">학생 목록</span>
                <span className="text-xs text-muted-foreground">({students.length})</span>
            </div>

            <div className="p-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="이름 / ID 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8 text-xs bg-card"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="px-2 pb-2 space-y-0.5">
                    {filtered.map((student) => {
                        const isActive = selectedId === student.id
                        return (
                            <button
                                key={student.id}
                                onClick={() => onSelect(student)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                                    isActive
                                        ? "bg-primary/15 text-foreground"
                                        : "hover:bg-muted/50 text-foreground"
                                }`}
                            >
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                        {student.name.slice(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {student.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {student.mbId}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                    {filtered.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">
                            검색 결과가 없습니다.
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
