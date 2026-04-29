import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CurriculumPageClient } from "./components/curriculum-page-client"

export const metadata: Metadata = {
    title: "수업 / 진도 관리 | 이음(I-UM)",
    description: "반 단위 커리큘럼 · 진도 · 과제 관리",
}

export default async function CurriculumPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const isAdmin = session.user.role === "SYSTEM_ADMIN" || session.user.role === "ACADEMY_ADMIN"
    const userAcademyId =
        session.user.academyId != null && session.user.academyId > 0
            ? Number(session.user.academyId)
            : null

    return (
        <TooltipProvider>
            <CurriculumPageClient
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
            />
        </TooltipProvider>
    )
}
