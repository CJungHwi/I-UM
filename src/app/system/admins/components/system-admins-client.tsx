"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { UsersManagementClient } from "@/app/settings/users/components/users-management-client"

export function SystemAdminsClient() {
    return (
        <TooltipProvider>
            <UsersManagementClient
                title="학원관리자 지정 · 전역 사용자 관리"
                layoutVariant="management-list"
            />
        </TooltipProvider>
    )
}
