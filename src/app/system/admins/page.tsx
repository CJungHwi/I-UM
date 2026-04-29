import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { auth } from "@/auth"

import { SystemAdminsClient } from "./components/system-admins-client"

export const metadata: Metadata = {
    title: "학원관리자 지정 | 이음(I-UM)",
    description: "학원별 관리자 지정과 전역 사용자 통제를 준비합니다.",
}

export default async function SystemAdminsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
        redirect("/")
    }

    return <SystemAdminsClient />
}
