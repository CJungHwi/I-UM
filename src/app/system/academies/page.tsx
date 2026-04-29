import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AcademiesAdminClient } from "./components/academies-admin-client"

export const metadata: Metadata = {
    title: "학원 등록·관리 | 이음(I-UM)",
    description: "시스템 관리자가 학원 마스터를 등록하고 관리합니다.",
}

export default async function SystemAcademiesPage() {
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
