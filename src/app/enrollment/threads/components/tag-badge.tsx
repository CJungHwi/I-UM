"use client"

import type { ThreadTag } from "@/types/thread"

const TAG_STYLES: Record<ThreadTag, string> = {
    학습: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    태도: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    상담: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    일반: "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400",
}

interface TagBadgeProps {
    tag: ThreadTag
    size?: "sm" | "md"
    onClick?: () => void
    active?: boolean
}

export function TagBadge({ tag, size = "sm", onClick, active }: TagBadgeProps) {
    const base = TAG_STYLES[tag] ?? TAG_STYLES["일반"]
    const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`rounded-full font-medium transition-all ${sizeClass} ${
                    active ? base + " ring-2 ring-primary/50" : "bg-muted/50 text-muted-foreground hover:opacity-80"
                }`}
            >
                {tag}
            </button>
        )
    }

    return (
        <span className={`rounded-full font-medium inline-block ${sizeClass} ${base}`}>
            {tag}
        </span>
    )
}
