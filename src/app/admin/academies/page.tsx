import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AcademiesAdminClient } from "./components/academies-admin-client"

export const metadata: Metadata = {
    title: "학원(소속) 관리 | 이음(I-UM)",
    description: "회원가입에 노출되는 소속 학원 마스터 관리",
}

export default async function AdminAcademiesPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
        redirect("/")
    }

    return (
        <TooltipProvider>
            <AcademiesAdminClient />
        </TooltipProvider>
    )
}
