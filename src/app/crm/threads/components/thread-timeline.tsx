"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { MessageSquare, Filter } from "lucide-react"
import { toast } from "sonner"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { ThreadPost, ThreadStudent, ThreadTag } from "@/types/thread"
import { THREAD_TAGS } from "@/types/thread"
import {
    getThreadList,
    createThread,
    updateThread,
    deleteThread,
    toggleThreadPin,
} from "@/actions/thread-actions"

import { TagBadge } from "./tag-badge"
import { ThreadComposer } from "./thread-composer"
import { ThreadPostItem } from "./thread-post-item"

interface ThreadTimelineProps {
    student: ThreadStudent | null
    currentUserId?: string
}

export function ThreadTimeline({ student, currentUserId }: ThreadTimelineProps) {
    const [posts, setPosts] = useState<ThreadPost[]>([])
    const [loading, setLoading] = useState(false)
    const [activeTag, setActiveTag] = useState<ThreadTag | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchPosts = useCallback(async () => {
        if (!student) return
        setLoading(true)
        try {
            const res = await getThreadList(student.id, activeTag)
            if (res.success && res.data) {
                setPosts(res.data)
            } else if (!res.success) {
                toast.error(res.error)
            }
        } finally {
            setLoading(false)
        }
    }, [student, activeTag])

    useEffect(() => {
        setPosts([])
        if (student) {
            fetchPosts()
        }
    }, [student, fetchPosts])

    const handleCreate = async (content: string, tag: ThreadTag, imageUrl?: string) => {
        if (!student) return
        const res = await createThread(student.id, content, tag, imageUrl)
        if (res.success) {
            toast.success("스레드가 등록되었습니다.")
            await fetchPosts()
        } else {
            toast.error(res.error)
        }
    }

    const handleTogglePin = async (id: number) => {
        const res = await toggleThreadPin(id)
        if (res.success) {
            setPosts((prev) =>
                prev
                    .map((p) =>
                        p.id === id ? { ...p, isPinned: res.data!.isPinned } : p,
                    )
                    .sort((a, b) => {
                        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    }),
            )
        } else {
            toast.error(res.error)
        }
    }

    const handleDelete = async (id: number) => {
        const res = await deleteThread(id)
        if (res.success) {
            setPosts((prev) => prev.filter((p) => p.id !== id))
            toast.success("삭제되었습니다.")
        } else {
            toast.error(res.error)
        }
    }

    const handleUpdate = async (id: number, content: string, tag: ThreadTag) => {
        const res = await updateThread(id, content, tag)
        if (res.success) {
            setPosts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, content, tag } : p)),
            )
            toast.success("수정되었습니다.")
        } else {
            toast.error(res.error)
        }
    }

    const handleTagFilter = (tag: ThreadTag) => {
        setActiveTag((prev) => (prev === tag ? null : tag))
    }

    if (!student) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <MessageSquare className="h-12 w-12 opacity-30" />
                <p className="text-sm">왼쪽에서 학생을 선택하면</p>
                <p className="text-sm">이음 스레드가 표시됩니다.</p>
            </div>
        )
    }

    const pinnedCount = posts.filter((p) => p.isPinned).length

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* 헤더 */}
            <div className="h-12 px-4 border-b border-border bg-muted/30 flex items-center gap-3 shrink-0">
                <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                    <span className="text-sm font-bold">{student.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">스레드</span>
                </div>
                {pinnedCount > 0 && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        고정 {pinnedCount}
                    </span>
                )}
            </div>

            {/* 태그 필터 */}
            <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0 bg-card/50">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground">필터:</span>
                {THREAD_TAGS.map((t) => (
                    <TagBadge
                        key={t}
                        tag={t}
                        size="sm"
                        active={activeTag === t}
                        onClick={() => handleTagFilter(t)}
                    />
                ))}
                {activeTag && (
                    <button
                        className="text-[10px] text-muted-foreground hover:text-foreground ml-1 underline"
                        onClick={() => setActiveTag(null)}
                    >
                        초기화
                    </button>
                )}
            </div>

            {/* 타임라인 포스트 목록 */}
            <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                        <MessageSquare className="h-8 w-8 opacity-30" />
                        <p className="text-sm">
                            {activeTag
                                ? `'${activeTag}' 태그의 스레드가 없습니다.`
                                : "아직 작성된 스레드가 없습니다."}
                        </p>
                        <p className="text-xs">아래에서 첫 스레드를 작성해보세요.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {posts.map((post) => (
                            <ThreadPostItem
                                key={post.id}
                                post={post}
                                currentUserId={currentUserId}
                                onTogglePin={handleTogglePin}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* 작성 영역 */}
            <ThreadComposer onSubmit={handleCreate} />
        </div>
    )
}
