import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { listIumAcademiesForRegister } from "@/actions/ium-user-actions"
import { listIumCodesByType } from "@/actions/ium-code-actions"
import { ProspectsPageClient } from "./components/prospects-page-client"

export const metadata: Metadata = {
    title: "상담 관리 | 이음(I-UM)",
    description: "입학 상담 접수 · 희망 과목·수업 가능 시간대 · 상담 상태 · 등록 전환",
}

export default async function ProspectsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const academiesRes = await listIumAcademiesForRegister()
    const academies = academiesRes.success && academiesRes.data ? academiesRes.data : []

    const [gradesRes, statusRes] = await Promise.all([
        listIumCodesByType("STUDENT_GRADE"),
        listIumCodesByType("CONSULT_STATUS"),
    ])
    const gradeCodes = gradesRes.success && gradesRes.data ? gradesRes.data : []
    const consultStatusCodes =
        statusRes.success && statusRes.data ? statusRes.data : []

    const isAdmin = session.user.role === "SYSTEM_ADMIN" || session.user.role === "ACADEMY_ADMIN"
    const userAcademyId =
        session.user.academyId != null && session.user.academyId > 0
            ? Number(session.user.academyId)
            : null

    return (
        <TooltipProvider>
            <ProspectsPageClient
                academies={academies}
                gradeCodes={gradeCodes}
                consultStatusCodes={consultStatusCodes}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
            />
        </TooltipProvider>
    )
}
