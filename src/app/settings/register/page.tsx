import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterHelpDialog } from "./components/register-help-dialog"
import { RegisterForm } from "./components/register-form"

export const metadata: Metadata = {
    title: "회원가입 | 이음(I-UM)",
    description: "이음 학원 관리 시스템 회원가입",
}

export default function AdminRegisterPage() {
    return (
        <>
            <RegisterHelpDialog />
            <AuthShell>
                <RegisterForm />
            </AuthShell>
        </>
    )
}
