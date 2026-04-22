"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
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
import { listIumAcademiesForRegister, registerIumUser } from "@/actions/ium-user-actions"
import type { IumAcademyOption, IumUserLevel } from "@/types/ium-user"

export function RegisterForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [userLevel, setUserLevel] = React.useState<IumUserLevel>("TEACHER")
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

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const form = event.currentTarget
        const loginId = (form.elements.namedItem("loginId") as HTMLInputElement).value.trim()
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        const password2 = (form.elements.namedItem("password2") as HTMLInputElement).value
        const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim()
        const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim()
        const selectedAcademyId = Number(academyId)

        if (!selectedAcademyId || selectedAcademyId <= 0) {
            toast.error("소속 학원을 선택하세요.")
            setIsLoading(false)
            return
        }

        if (password !== password2) {
            toast.error("비밀번호가 일치하지 않습니다.")
            setIsLoading(false)
            return
        }

        try {
            const res = await registerIumUser(
                loginId,
                password,
                name,
                email || null,
                userLevel,
                selectedAcademyId,
            )
            if (res.success) {
                toast.success("가입 신청이 완료되었습니다.\n관리자 승인 후 로그인할 수 있습니다.", {
                    duration: 3500,
                })
                // 토스트가 보인 뒤 로그인 페이지로 이동 (히스토리에는 남기지 않음)
                setTimeout(() => {
                    router.replace("/login")
                }, 400)
                return
            } else {
                toast.error(res.error ?? "가입에 실패했습니다.")
            }
        } catch {
            toast.error("오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="loginId">아이디</Label>
                    <Input
                        id="loginId"
                        name="loginId"
                        placeholder="로그인 ID"
                        autoCapitalize="none"
                        autoComplete="username"
                        disabled={isLoading}
                        required
                        className="bg-card"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="이름"
                        disabled={isLoading}
                        required
                        className="bg-card"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">이메일 (선택)</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        disabled={isLoading}
                        className="bg-card"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="academy">소속 학원</Label>
                    <Select
                        value={academyId}
                        onValueChange={setAcademyId}
                        disabled={isLoading || academies.length === 0}
                        required
                    >
                        <SelectTrigger id="academy" className="bg-card w-full">
                            <SelectValue placeholder="학원을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
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
                </div>
                <div className="grid gap-2">
                    <Label>역할 (원장 / 교사)</Label>
                    <Select
                        value={userLevel}
                        onValueChange={(v) => setUserLevel(v as IumUserLevel)}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="bg-card w-full">
                            <SelectValue placeholder="역할 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DIRECTOR">원장</SelectItem>
                            <SelectItem value="TEACHER">교사</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                        가입 후 관리자 승인이 필요합니다. 승인 시 &quot;사용자&quot; 등급으로 시작합니다.
                    </p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">비밀번호 (8자 이상)</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                        minLength={8}
                        className="bg-card"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password2">비밀번호 확인</Label>
                    <Input
                        id="password2"
                        name="password2"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                        minLength={8}
                        className="bg-card"
                    />
                </div>
                <Button type="submit" disabled={isLoading} className="rounded-xl">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    가입 신청
                </Button>
            </form>
        </div>
    )
}
