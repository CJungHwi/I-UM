"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { BookOpen, GraduationCap, MessageCircle } from "lucide-react"

import { listStudentTimeline } from "@/actions/student-actions"
import type { StudentTimelineEvent, StudentTimelineKind } from "@/types/student-timeline"
import { cn } from "@/lib/utils"

const kindIcon = (k: StudentTimelineKind) => {
    if (k === "CONSULT") return MessageCircle
    if (k === "LEVEL_TEST") return GraduationCap
    return BookOpen
}

interface StudentTimelineTabProps {
    studentId: number
}

export const StudentTimelineTab = ({ studentId }: StudentTimelineTabProps) => {
    const [events, setEvents] = React.useState<StudentTimelineEvent[]>([])
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listStudentTimeline(studentId)
        if (res.success && res.data) {
            setEvents(res.data)
        } else if (!res.success) {
            toast.error(res.error)
            setEvents([])
        }
        setLoading(false)
    }, [studentId])

    React.useEffect(() => {
        load()
    }, [load])

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <p className="text-xs text-muted-foreground text-center py-8">
                아직 표시할 이력이 없습니다. 상담 전환·레벨 테스트·반 배정 후 자동으로 쌓입니다.
            </p>
        )
    }

    return (
        <ul className="relative mx-auto max-w-lg pl-6 border-l border-border py-2 space-y-4">
            {events.map((ev) => {
                const Icon = kindIcon(ev.kind)
                const at = dayjs(ev.evtAt)
                return (
                    <li key={`${ev.kind}-${ev.refId}-${ev.evtAt}`} className="relative">
                        <span className="absolute -left-[25px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary">
                            <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold">{ev.title}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {at.isValid() ? at.format("YYYY-MM-DD HH:mm") : "—"}
                                </span>
                            </div>
                            {ev.subtitle && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{ev.subtitle}</p>
                            )}
                            {ev.bodyText && (
                                <p
                                    className={cn(
                                        "text-[11px] mt-1 whitespace-pre-line text-foreground/90",
                                    )}
                                >
                                    {ev.bodyText}
                                </p>
                            )}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
