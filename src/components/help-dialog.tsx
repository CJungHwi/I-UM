"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const defaultTriggerButtonClass =
    "h-9 w-9 rounded-full border border-white/40 bg-white/90 text-foreground shadow-md backdrop-blur-sm " +
    "dark:border-white/15 dark:bg-[#0c101c]/90 dark:text-foreground"

export type HelpDialogProps = {
    /** 다이얼로그 제목 */
    title: string
    /** 접근성용 짧은 요약(선택) */
    description?: string
    /** 본문 — 섹션·목록 등 자유 구성 */
    children: ReactNode
    /** 트리거 버튼 `aria-label` */
    triggerLabel: string
    /** 트리거에 보이는 내용 (기본: ?) */
    triggerContent?: ReactNode
    /** 트리거 `Button`에 합쳐지는 클래스 (배치·크기 등) */
    triggerClassName?: string
    /** `DialogContent` 추가 클래스 */
    contentClassName?: string
    /** 제어 모드 */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /**
     * 기본 `?` 버튼 대신 완전 커스텀 트리거.
     * 지정 시 `triggerContent`는 무시되고, `triggerClassName`은 트리거에 직접 붙이지 않음(루트에서 스타일).
     */
    trigger?: ReactNode
}

/**
 * 물음표(또는 커스텀) 트리거 + 도움말 다이얼로그.
 * 다른 화면에서는 `title`·`triggerLabel`·`children`과 필요 시 `triggerClassName`만 넘기면 됩니다.
 */
export function HelpDialog({
    title,
    description,
    children,
    triggerLabel,
    triggerContent,
    triggerClassName,
    contentClassName,
    open,
    onOpenChange,
    trigger,
}: HelpDialogProps) {
    const triggerNode =
        trigger ??
        (
            <Button
                type="button"
                variant="secondary"
                size="icon"
                className={cn(defaultTriggerButtonClass, triggerClassName)}
                aria-label={triggerLabel}
            >
                {triggerContent ?? (
                    <span className="text-lg font-bold leading-none" aria-hidden>
                        ?
                    </span>
                )}
            </Button>
        )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{triggerNode}</DialogTrigger>
            <DialogContent
                className={cn("max-h-[85vh] overflow-y-auto sm:max-w-lg", contentClassName)}
                showCloseButton
            >
                <DialogHeader className="space-y-0 border-b border-border pb-3 text-left">
                    <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
                    {description ? (
                        <DialogDescription className="sr-only">{description}</DialogDescription>
                    ) : null}
                </DialogHeader>
                <div className="space-y-4 text-sm text-foreground">{children}</div>
            </DialogContent>
        </Dialog>
    )
}
