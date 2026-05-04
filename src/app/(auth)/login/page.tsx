import type { Metadata } from "next"
import { UserAuthForm } from "@/components/user-auth-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
    title: "로그인 | 이음(I-UM)",
    description: "이음 학원 관리 시스템 로그인",
}

export default function AuthenticationPage() {
    return (
        <AuthShell>
            <UserAuthForm />
        </AuthShell>
    )
}
