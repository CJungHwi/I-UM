import { redirect } from "next/navigation"
import { Metadata } from "next"

import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UsersManagementClient } from "./components/users-management-client"

export const metadata: Metadata = {
    title: "학원 사용자 관리 | 이음(I-UM)",
    description: "학원 범위의 회원 승인 및 사용자 등급 관리",
}

export default async function SettingsUsersPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    if (session.user.role !== "SYSTEM_ADMIN" && session.user.role !== "ACADEMY_ADMIN") {
        redirect("/")
    }

    return (
        <TooltipProvider>
            <UsersManagementClient />
        </TooltipProvider>
    )
}
