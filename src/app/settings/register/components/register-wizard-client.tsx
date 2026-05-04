"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, KeyRound, Loader2, Sparkles, UserCircle2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { AUTH_FIELD_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "@/lib/auth-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    registerIumUserByInviteCode,
    registerNewAcademyWithAdmin,
    resolveInviteCodePreview,
} from "@/actions/ium-user-actions"

type RegisterStep = "choose" | "admin" | "staff"

export function RegisterWizardClient({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const [step, setStep] = React.useState<RegisterStep>("choose")
    const [isLoading, setIsLoading] = React.useState(false)
    const [inviteLookupLoading, setInviteLookupLoading] = React.useState(false)
    const [resolvedAcademy, setResolvedAcademy] = React.useState<{ name: string } | null>(null)
    const router = useRouter()

    const handleResetStep = () => {
        setStep("choose")
        setResolvedAcademy(null)
    }

    const handleLookupInvite = async (inviteCode: string) => {
        const c = inviteCode.trim()
        if (!c) {
            toast.error("초대 코드를 입력하세요.")
            return
        }
        setInviteLookupLoading(true)
        try {
            const res = await resolveInviteCodePreview(c)
            if (res.success && res.data) {
                setResolvedAcademy({ name: res.data.academyName })
                toast.success(`「${res.data.academyName}」에 가입합니다.`)
            } else {
                setResolvedAcademy(null)
                toast.error(res.error ?? "코드를 확인할 수 없습니다.")
            }
        } finally {
            setInviteLookupLoading(false)
        }
    }

    const handleSubmitAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        const form = event.currentTarget
        const academyName = (form.elements.namedItem("academyName") as HTMLInputElement).value.trim()
        const loginId = (form.elements.namedItem("loginId") as HTMLInputElement).value.trim()
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        const password2 = (form.elements.namedItem("password2") as HTMLInputElement).value
        const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim()
        const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim()

        if (password !== password2) {
            toast.error("비밀번호가 일치하지 않습니다.")
            setIsLoading(false)
            return
        }

        try {
            const res = await registerNewAcademyWithAdmin(academyName, loginId, password, name, email || null)
            if (res.success && res.data) {
                toast.success(
                    `가입 신청이 완료되었습니다.\n학원 초대 코드: ${res.data.inviteCode}\n담당자분께 이 코드를 전달하세요.\n시스템(Super) 관리자가 승인하면 로그인할 수 있습니다.`,
                    { duration: 5000 },
                )
                setTimeout(() => router.replace("/login"), 500)
                return
            }
            toast.error(res.error ?? "가입에 실패했습니다.")
        } catch {
            toast.error("오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        const form = event.currentTarget
        const inviteCode = (form.elements.namedItem("inviteCode") as HTMLInputElement).value.trim()
        const loginId = (form.elements.namedItem("loginId") as HTMLInputElement).value.trim()
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        const password2 = (form.elements.namedItem("password2") as HTMLInputElement).value
        const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim()
        const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim()

        if (password !== password2) {
            toast.error("비밀번호가 일치하지 않습니다.")
            setIsLoading(false)
            return
        }

        try {
            const res = await registerIumUserByInviteCode(loginId, password, name, email || null, inviteCode)
            if (res.success) {
                toast.success(
                    "가입 신청이 완료되었습니다.\n해당 학원 원장(학원 Admin)이 승인하면 로그인할 수 있습니다.",
                    {
                        duration: 3500,
                    },
                )
                setTimeout(() => router.replace("/login"), 400)
                return
            }
            toast.error(res.error ?? "가입에 실패했습니다.")
        } catch {
            toast.error("오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    if (step === "choose") {
        return (
            <div className={cn("grid gap-6", className)} {...props}>
                <div className="space-y-1 text-center">
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                        회원가입
                    </h1>
                    <p className="text-sm text-muted-foreground">가입 방식을 선택해 주세요.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                    <button
                        type="button"
                        onClick={() => setStep("admin")}
                        className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card/80 p-4 text-left transition-all hover:border-[#82AAE3]/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82AAE3] focus-visible:ring-offset-2"
                    >
                        <Building2 className="h-8 w-8 text-[#82AAE3] transition-transform group-hover:scale-105" />
                        <span className="text-sm font-bold text-foreground">신규 학원 생성 (Admin)</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                            새 학원을 등록하고 학원 관리자로 신청합니다. 시스템(Super) 관리자 승인 후 초대 코드로
                            담당자를 초대할 수 있습니다.
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep("staff")}
                        className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card/80 p-4 text-left transition-all hover:border-[#82AAE3]/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82AAE3] focus-visible:ring-offset-2"
                    >
                        <KeyRound className="h-8 w-8 text-[#FFB4B4] transition-transform group-hover:scale-105" />
                        <span className="text-sm font-bold text-foreground">초대 코드로 가입 (Staff)</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                            학원 관리자가 알려준 초대 코드로 담당자·강사 계정을 신청합니다.
                        </span>
                    </button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="font-medium text-[#82AAE3] underline-offset-4 hover:underline">
                        로그인
                    </Link>
                </p>
            </div>
        )
    }

    if (step === "admin") {
        return (
            <div className={cn("grid gap-5", className)} {...props}>
                <div className="flex items-start gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-xl"
                        onClick={handleResetStep}
                        aria-label="이전 단계"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 shrink-0 text-[#82AAE3]" aria-hidden />
                            <h1 className="font-heading text-xl font-bold tracking-tight">신규 학원 · 관리자</h1>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            학원 정보와 관리자 계정을 입력하세요. 시스템(Super) 관리자가 승인하기 전까지는
                            로그인할 수 없습니다.
                        </p>
                    </div>
                </div>
                <form onSubmit={(e) => void handleSubmitAdmin(e)} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="academyName">학원 이름</Label>
                        <Input
                            id="academyName"
                            name="academyName"
                            placeholder="예: 이음 영어학원"
                            disabled={isLoading}
                            required
                            className={AUTH_FIELD_CLASS}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="loginId">아이디 (관리자)</Label>
                        <Input
                            id="loginId"
                            name="loginId"
                            placeholder="로그인 ID"
                            autoComplete="username"
                            disabled={isLoading}
                            required
                            className={AUTH_FIELD_CLASS}
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
                            className={AUTH_FIELD_CLASS}
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
                            className={AUTH_FIELD_CLASS}
                        />
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
                            className={AUTH_FIELD_CLASS}
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
                            className={AUTH_FIELD_CLASS}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn("w-full", AUTH_PRIMARY_BUTTON_CLASS)}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                        가입 신청
                    </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                    <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
                        로그인으로
                    </Link>
                </p>
            </div>
        )
    }

    return (
        <div className={cn("grid gap-5", className)} {...props}>
            <div className="flex items-start gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-xl"
                    onClick={handleResetStep}
                    aria-label="이전 단계"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <UserCircle2 className="h-5 w-5 shrink-0 text-[#82AAE3]" aria-hidden />
                        <h1 className="font-heading text-xl font-bold tracking-tight">초대 코드로 가입</h1>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        학원에서 받은 초대 코드를 입력한 뒤, 본인 정보를 입력하세요. 해당 학원 원장(학원 Admin)이
                        승인하면 로그인할 수 있습니다.
                    </p>
                </div>
            </div>
            <form onSubmit={(e) => void handleSubmitStaff(e)} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="inviteCode">초대 코드</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            id="inviteCode"
                            name="inviteCode"
                            placeholder="IUM-…"
                            autoCapitalize="characters"
                            disabled={isLoading}
                            required
                            className={cn(AUTH_FIELD_CLASS, "sm:flex-1")}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isLoading || inviteLookupLoading}
                            className="h-10 shrink-0 rounded-2xl sm:w-auto"
                            onClick={(e) => {
                                const form = e.currentTarget.closest("form")
                                const input = form?.querySelector<HTMLInputElement>("#inviteCode")
                                if (input) void handleLookupInvite(input.value)
                            }}
                        >
                            {inviteLookupLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                "학원 확인"
                            )}
                        </Button>
                    </div>
                    {resolvedAcademy ? (
                        <p className="text-[11px] font-medium text-[#82AAE3]">가입 학원: {resolvedAcademy.name}</p>
                    ) : null}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="loginId">아이디</Label>
                    <Input
                        id="loginId"
                        name="loginId"
                        placeholder="로그인 ID"
                        autoComplete="username"
                        disabled={isLoading}
                        required
                        className={AUTH_FIELD_CLASS}
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
                        className={AUTH_FIELD_CLASS}
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
                        className={AUTH_FIELD_CLASS}
                    />
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
                        className={AUTH_FIELD_CLASS}
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
                        className={AUTH_FIELD_CLASS}
                    />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    가입 후 로그인은 학원 원장(학원 Admin)의 승인이 필요합니다. 기본 신청 유형은 담당자(스태프)입니다.
                </p>
                <Button type="submit" disabled={isLoading} className={cn("w-full", AUTH_PRIMARY_BUTTON_CLASS)}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                    가입 신청
                </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
                    로그인으로
                </Link>
            </p>
        </div>
    )
}
