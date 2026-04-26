"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { IUM_LOGIN_SYSTEM_ACADEMY_VALUE } from "@/lib/ium-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { listIumAcademiesForRegister } from "@/actions/ium-user-actions"
import type { IumAcademyOption } from "@/types/ium-user"

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [academies, setAcademies] = React.useState<IumAcademyOption[]>([])
    const [academyId, setAcademyId] = React.useState<string>("")
    const router = useRouter()

    React.useEffect(() => {
        let cancelled = false
        void (async () => {
            const res = await listIumAcademiesForRegister()
            if (!cancelled && res.success && res.data) {
                setAcademies(res.data)
            } else if (!cancelled && !res.success) {
                toast.error(res.error ?? "소속 학원 목록을 불러올 수 없습니다.")
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

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
                academyId,
                redirect: false,
                callbackUrl: "/",
            })

            if (result?.error) {
                toast.error("아이디, 비밀번호 또는 소속 학원이 올바르지 않습니다.")
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
            <form onSubmit={(e) => void handleSubmit(e)}>
                <div className="grid gap-2">
                    <div className="grid gap-1 space-y-2">
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
                                className="bg-card"
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
                                className="bg-card"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="login-academy">소속 학원</Label>
                            <Select
                                value={academyId}
                                onValueChange={setAcademyId}
                                disabled={isLoading}
                            >
                                <SelectTrigger
                                    id="login-academy"
                                    className="bg-card w-full border-[#343637] dark:border-[#6b7280] h-9 text-xs"
                                >
                                    <SelectValue placeholder="학원을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={IUM_LOGIN_SYSTEM_ACADEMY_VALUE}>
                                        전역 (시스템 관리자 전용)
                                    </SelectItem>
                                    {academies.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.academyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {academies.length === 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                    등록된 학원이 없습니다. 관리자에게 문의하세요.
                                </p>
                            )}
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                시스템 전체 관리자는 선택하지 않아도 로그인됩니다. 학원 사용자는 가입 시 선택한
                                소속 학원과 동일하게 선택하세요.
                            </p>
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="h-10">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                        로그인
                    </Button>
                </div>
            </form>
        </div>
    )
}
