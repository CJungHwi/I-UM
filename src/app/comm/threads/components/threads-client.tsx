"use client"

import { useState } from "react"

import { Card } from "@/components/ui/card"
import type { ThreadStudent } from "@/types/thread"
import { StudentListPanel } from "./student-list-panel"
import { ThreadTimeline } from "./thread-timeline"

interface ThreadsClientProps {
    students: ThreadStudent[]
    currentUserId?: string
}

export function ThreadsClient({ students, currentUserId }: ThreadsClientProps) {
    const [selected, setSelected] = useState<ThreadStudent | null>(null)

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <div className="flex-1 min-h-0 flex flex-col gap-[3px] md:flex-row">
                {/* 왼쪽: 학생 목록 */}
                <Card className="w-full min-h-0 md:w-64 md:shrink-0 flex flex-col rounded-3xl border border-border shadow-card overflow-hidden max-h-[42vh] md:max-h-none">
                    <StudentListPanel
                        students={students}
                        selectedId={selected?.id ?? null}
                        onSelect={setSelected}
                    />
                </Card>

                {/* 오른쪽: 타임라인 */}
                <Card className="flex-1 min-h-0 flex flex-col rounded-3xl border border-border shadow-card overflow-hidden">
                    <ThreadTimeline
                        student={selected}
                        currentUserId={currentUserId}
                    />
                </Card>
            </div>
        </div>
    )
}
