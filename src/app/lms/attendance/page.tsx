import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AttendancePageClient } from "./components/attendance-page-client"

export const metadata: Metadata = {
    title: "출결 관리 | 이음(I-UM)",
    description: "학생 등·하원 체크 및 출결 통계",
}

export default async function AttendancePage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const isAdmin = session.user.userGrade === "ADMIN"

    return (
        <TooltipProvider>
            <AttendancePageClient isAdmin={isAdmin} />
        </TooltipProvider>
    )
}
