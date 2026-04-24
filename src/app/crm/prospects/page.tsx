import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { listIumAcademiesForRegister } from "@/actions/ium-user-actions"
import { ProspectsPageClient } from "./components/prospects-page-client"

export const metadata: Metadata = {
    title: "가망 고객 / 상담 관리 | 이음(I-UM)",
    description: "입학 상담 접수 · 상담 상태 · 등록 전환",
}

export default async function ProspectsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const academiesRes = await listIumAcademiesForRegister()
    const academies = academiesRes.success && academiesRes.data ? academiesRes.data : []

    const isAdmin = session.user.userGrade === "ADMIN"
    const userAcademyId =
        session.user.academyId != null && session.user.academyId > 0
            ? Number(session.user.academyId)
            : null

    return (
        <TooltipProvider>
            <ProspectsPageClient
                academies={academies}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
            />
        </TooltipProvider>
    )
}
