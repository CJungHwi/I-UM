"use client"

import { useState } from "react"
import { Pin, PinOff, Trash2, MoreVertical, Pencil } from "lucide-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/ko"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ThreadPost, ThreadTag } from "@/types/thread"
import { TagBadge } from "./tag-badge"
import { THREAD_TAGS } from "@/types/thread"

dayjs.extend(relativeTime)
dayjs.locale("ko")

interface ThreadPostItemProps {
    post: ThreadPost
    currentUserId?: string
    onTogglePin: (id: number) => void
    onDelete: (id: number) => void
    onUpdate: (id: number, content: string, tag: ThreadTag) => void
}

export function ThreadPostItem({
    post,
    currentUserId,
    onTogglePin,
    onDelete,
    onUpdate,
}: ThreadPostItemProps) {
    const [editing, setEditing] = useState(false)
    const [editContent, setEditContent] = useState(post.content)
    const [editTag, setEditTag] = useState<ThreadTag>(post.tag)

    const isOwner = currentUserId === post.writerId
    const timeAgo = dayjs(post.createdAt).fromNow()
    const fullDate = dayjs(post.createdAt).format("YYYY-MM-DD HH:mm")

    const handleSaveEdit = () => {
        if (!editContent.trim()) return
        onUpdate(post.id, editContent.trim(), editTag)
        setEditing(false)
    }

    const handleCancelEdit = () => {
        setEditContent(post.content)
        setEditTag(post.tag)
        setEditing(false)
    }

    return (
        <div
            className={`group relative flex gap-2.5 px-4 py-3 transition-colors hover:bg-muted/20 ${
                post.isPinned ? "bg-primary/5 border-l-2 border-primary" : ""
            }`}
        >
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {post.writerName.slice(0, 1)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{post.writerName}</span>
                    <TagBadge tag={post.tag} />
                    {post.isPinned && (
                        <Pin className="h-3 w-3 text-primary shrink-0" />
                    )}
                    <span
                        className="text-[11px] text-muted-foreground ml-auto shrink-0"
                        title={fullDate}
                    >
                        {timeAgo}
                    </span>
                </div>

                {editing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {THREAD_TAGS.map((t) => (
                                <TagBadge
                                    key={t}
                                    tag={t}
                                    size="sm"
                                    active={editTag === t}
                                    onClick={() => setEditTag(t)}
                                />
                            ))}
                            <div className="ml-auto flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancelEdit}>
                                    취소
                                </Button>
                                <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>
                                    저장
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {post.content}
                        </p>
                        {post.imageUrl && (
                            <div className="mt-2">
                                <img
                                    src={post.imageUrl}
                                    alt="첨부 이미지"
                                    className="rounded-xl max-h-48 object-cover border border-border"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {!editing && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => onTogglePin(post.id)}>
                                {post.isPinned ? (
                                    <>
                                        <PinOff className="h-3.5 w-3.5 mr-2" />
                                        고정 해제
                                    </>
                                ) : (
                                    <>
                                        <Pin className="h-3.5 w-3.5 mr-2" />
                                        상단 고정
                                    </>
                                )}
                            </DropdownMenuItem>
                            {isOwner && (
                                <>
                                    <DropdownMenuItem onClick={() => setEditing(true)}>
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onDelete(post.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        삭제
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}
