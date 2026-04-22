"use client"

import { useSession } from "next-auth/react"
import type { ReactNode } from "react"
import type { PermissionCode } from "@/types/rbac"
import { hasPermission } from "@/lib/rbac"

type Props = {
    permission: PermissionCode
    children: ReactNode
    fallback?: ReactNode
}

/** 클라이언트에서 버튼·메뉴 노출 여부 (서버 검증은 별도 필수) */
export function Can({ permission, children, fallback = null }: Props) {
    const { data: session, status } = useSession()
    if (status === "loading") return null
    if (!hasPermission(session, permission)) return <>{fallback}</>
    return <>{children}</>
}
