"use client"

import { useState, useRef } from "react"
import { Send, ImagePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { THREAD_TAGS, type ThreadTag } from "@/types/thread"
import { TagBadge } from "./tag-badge"

interface ThreadComposerProps {
    onSubmit: (content: string, tag: ThreadTag, imageUrl?: string) => Promise<void>
    disabled?: boolean
}

export function ThreadComposer({ onSubmit, disabled }: ThreadComposerProps) {
    const [content, setContent] = useState("")
    const [tag, setTag] = useState<ThreadTag>("일반")
    const [sending, setSending] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = async () => {
        const trimmed = content.trim()
        if (!trimmed || sending) return

        setSending(true)
        try {
            await onSubmit(trimmed, tag)
            setContent("")
            setTag("일반")
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleInput = () => {
        const el = textareaRef.current
        if (el) {
            el.style.height = "auto"
            el.style.height = Math.min(el.scrollHeight, 120) + "px"
        }
    }

    return (
        <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 space-y-2">
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">태그:</span>
                {THREAD_TAGS.map((t) => (
                    <TagBadge
                        key={t}
                        tag={t}
                        size="sm"
                        active={tag === t}
                        onClick={() => setTag(t)}
                    />
                ))}
            </div>

            <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="스레드를 작성하세요... (Ctrl+Enter로 전송)"
                        disabled={disabled || sending}
                        rows={1}
                        className="w-full resize-none rounded-2xl border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
                    disabled={disabled}
                    title="이미지 첨부 (준비 중)"
                >
                    <ImagePlus className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!content.trim() || disabled || sending}
                    className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
