import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card - 메인 카드 컨테이너
 * 스타일 가이드: rounded-3xl, border-border, shadow-card
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn(
                "h-full flex flex-col bg-card text-card-foreground rounded-3xl border border-border shadow-card overflow-hidden",
                className
            )}
            {...props}
        />
    )
}

/**
 * CardHeader - 카드 헤더
 * 스타일 가이드: h-12 px-4 py-0 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between shrink-0",
                className
            )}
            {...props}
        />
    )
}

/**
 * CardTitle - 카드 제목
 * 스타일 가이드: text-lg font-bold flex items-center gap-2 leading-none
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn(
                "text-lg font-bold flex items-center gap-2 leading-none",
                className
            )}
            {...props}
        />
    )
}

/**
 * CardDescription - 카드 설명
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    )
}

/**
 * CardAction - 카드 헤더 액션 영역
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn("flex items-center gap-2", className)}
            {...props}
        />
    )
}

/**
 * CardContent - 카드 컨텐츠 영역
 * 스타일 가이드: flex-1 min-h-0 flex flex-col gap-[3px] p-4
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn(
                "flex-1 min-h-0 flex flex-col gap-[3px] p-4 overflow-auto",
                className
            )}
            {...props}
        />
    )
}

/**
 * CardFooter - 카드 푸터
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                "flex items-center px-4 py-3 border-t border-border bg-muted/30 shrink-0",
                className
            )}
            {...props}
        />
    )
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardAction,
    CardDescription,
    CardContent,
}
