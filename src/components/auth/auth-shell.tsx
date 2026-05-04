"use client"

import type { ReactNode } from "react"
import { ModeToggle } from "@/components/mode-toggle"

type AuthShellProps = {
    children: ReactNode
    /** 우측 카드 상단 (선택) */
    cardEyebrow?: ReactNode
}

/**
 * 로그인·회원가입 공통: 좌측 브랜드 / 우측 폼 카드.
 * 다크에서는 좌측에 별빛·글로우를 얹습니다.
 */
export function AuthShell({ children, cardEyebrow }: AuthShellProps) {
    return (
        <div className="relative flex min-h-dvh flex-col bg-background md:flex-row">
            <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
                <ModeToggle />
            </div>
            <div
                className="relative flex min-h-[220px] shrink-0 flex-col justify-center overflow-hidden px-8 py-10 md:min-h-dvh md:w-[46%] md:max-w-xl md:px-10 lg:px-14"
            >
                <div
                    className="absolute inset-0 bg-gradient-to-br from-[#82AAE3] to-[#FFB4B4] dark:from-[#3d5a8a] dark:to-[#7a4a62]"
                    aria-hidden
                />
                <div className="auth-shell-starfield pointer-events-none absolute inset-0" aria-hidden />
                <div className="auth-shell-night-glow pointer-events-none absolute inset-0 dark:opacity-100 opacity-0" aria-hidden />
                <div className="relative z-[1] flex flex-col gap-4 text-white drop-shadow-sm">
                    <p className="font-heading text-4xl font-bold tracking-tight md:text-5xl">이음</p>
                    <p className="font-heading text-xl font-semibold text-white/95 md:text-2xl">I-UM</p>
                    <p className="max-w-sm text-sm leading-relaxed text-white/90 md:text-base">
                        연결과 따뜻한 관리,
                        <br />
                        학원과 담임을 잇는 작은 울림.
                    </p>
                </div>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
                <div className="auth-shell-right-glow pointer-events-none absolute inset-0 dark:opacity-100 opacity-0" aria-hidden />
                <div className="relative z-[1] w-full max-w-md">
                    {cardEyebrow ? <div className="mb-3">{cardEyebrow}</div> : null}
                    <div className="rounded-3xl border border-border bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#0c101c] dark:shadow-none md:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
