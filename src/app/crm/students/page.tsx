import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { listIumAcademiesForRegister } from "@/actions/ium-user-actions"
import { StudentsPageClient } from "./components/students-page-client"

export const metadata: Metadata = {
    title: "재원생 명부 | 이음(I-UM)",
    description: "학생 마스터 · 보호자 · 형제 관계 관리",
}

export default async function StudentsPage() {
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
            <StudentsPageClient
                academies={academies}
                isAdmin={isAdmin}
                userAcademyId={userAcademyId}
            />
        </TooltipProvider>
    )
}
