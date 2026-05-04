"use client"

import * as React from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/auth-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        const form = event.currentTarget
        const id = (form.elements.namedItem("id") as HTMLInputElement).value.trim()
        const password = (form.elements.namedItem("password") as HTMLInputElement).value

        try {
            const result = await signIn("credentials", {
                id,
                password,
                redirect: false,
                callbackUrl: "/",
            })

            if (result?.error) {
                toast.error("아이디 또는 비밀번호가 올바르지 않거나, 아직 승인되지 않은 계정입니다.")
            } else if (result?.ok) {
                router.replace("/")
                router.refresh()
            }
        } catch (error) {
            toast.error("오류가 발생했습니다. 잠시 후 다시 시도하세요.")
            console.error("Sign in error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <div className="space-y-1 text-center">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">로그인</h1>
                <p className="text-sm text-muted-foreground">
                    소속 학원은 가입 시 확정되며, 로그인 후 세션에{" "}
                    <span className="font-medium text-foreground">역할(role)</span>·
                    <span className="font-medium text-foreground">소속 학원</span>이 반영됩니다.
                </p>
            </div>

            <div
                className="rounded-2xl border border-border bg-muted/20 p-3 text-left dark:bg-muted/10"
                role="note"
            >
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground">
                    <Shield className="h-4 w-4 text-[#82AAE3]" aria-hidden />
                    권한 3단계 (DB 기준)
                </div>
                <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    <li>
                        <span className="font-semibold text-foreground">Super Admin</span> — 전역 관리자
                        (소속 학원 없음)
                    </li>
                    <li>
                        <span className="font-semibold text-foreground">학원 Admin</span> — 해당 학원
                        관리(원장)
                    </li>
                    <li>
                        <span className="font-semibold text-foreground">학원 담당자</span> — 초대로 소속된
                        강사·스태프
                    </li>
                </ul>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="id">아이디</Label>
                        <Input
                            id="id"
                            name="id"
                            placeholder="로그인 ID"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                            className={AUTH_FIELD_CLASS}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">비밀번호</Label>
                        <Input
                            id="password"
                            name="password"
                            placeholder="비밀번호"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            disabled={isLoading}
                            required
                            className={AUTH_FIELD_CLASS}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn("h-11 w-full", AUTH_PRIMARY_BUTTON_CLASS)}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                        로그인
                    </Button>
                </div>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link
                    href="/settings/register"
                    className="font-medium text-[#82AAE3] underline-offset-4 hover:underline"
                >
                    회원가입
                </Link>
            </p>
        </div>
    )
}
