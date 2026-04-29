import Link from "next/link"
import { Metadata } from "next"

import { RegisterForm } from "./components/register-form"

export const metadata: Metadata = {
    title: "회원가입 | 이음(I-UM)",
    description: "이음 학원 관리 시스템 회원가입",
}

export default function AdminRegisterPage() {
    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 md:grid-cols-1 lg:px-0 bg-background">
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight font-heading">
                            이음(I-UM) 회원가입
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            신청 후 관리자 승인이 완료되면 로그인할 수 있습니다.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                        <RegisterForm />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        이미 계정이 있으신가요?{" "}
                        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
