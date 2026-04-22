import Link from "next/link"
import { Metadata } from "next"
import { UserAuthForm } from "@/components/user-auth-form"

export const metadata: Metadata = {
    title: "로그인 | 이음(I-UM)",
    description: "이음 학원 관리 시스템 로그인",
}

export default function AuthenticationPage() {
    return (
        <div className="container relative min-h-dvh flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 md:grid-cols-1 lg:px-0 bg-background">
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight font-heading">
                            이음(I-UM)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            아이디·비밀번호와 가입 시 선택한 소속 학원을 선택해 로그인하세요.
                        </p>
                    </div>
                    <UserAuthForm />
                    <p className="text-center text-sm text-muted-foreground">
                        계정이 없으신가요?{" "}
                        <Link
                            href="/admin/register"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            회원가입
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
