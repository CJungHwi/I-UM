import type { Session } from "next-auth"
import type { IumUserGrade, IumUserLevel } from "@/types/ium-user"
import type { PermissionCode } from "@/types/rbac"

/** ium_users.user_level + user_grade → rbac_role.role_code */
export function buildRoleCode(
    userLevel: IumUserLevel,
    userGrade: IumUserGrade,
): string {
    return `${userLevel}_${userGrade}`
}

export function sessionPermissions(session: Session | null | undefined): string[] {
    return session?.user?.permissions ?? []
}

export function hasPermission(
    session: Session | null | undefined,
    code: PermissionCode,
): boolean {
    return sessionPermissions(session).includes(code)
}

export function hasAnyPermission(
    session: Session | null | undefined,
    codes: readonly PermissionCode[],
): boolean {
    const set = sessionPermissions(session)
    return codes.some((c) => set.includes(c))
}

export function hasAllPermissions(
    session: Session | null | undefined,
    codes: readonly PermissionCode[],
): boolean {
    const set = sessionPermissions(session)
    return codes.every((c) => set.includes(c))
}
