import "server-only"

import { executeQuery } from "@/lib/db"
import type { IumApprovalStatus, IumUserRole } from "@/types/ium-user"

export async function getAcademyIdForIumUser(userId: number): Promise<number | null> {
    const rows = await executeQuery<{ academy_id: unknown }>(
        "SELECT academy_id FROM ium_users WHERE id = ? AND del_yn = 'N' LIMIT 1",
        [userId],
    )
    const raw = rows[0]?.academy_id
    const n = raw != null && raw !== "" ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
}

/** 가입 승인/반려 판단용 — 소속·역할·승인 상태 */
export async function getIumUserApprovalContext(userId: number): Promise<{
    academyId: number | null
    role: IumUserRole
    approvalStatus: IumApprovalStatus
} | null> {
    const rows = await executeQuery<{
        academy_id: unknown
        role: unknown
        approval_status: unknown
    }>(
        "SELECT academy_id, role, approval_status FROM ium_users WHERE id = ? AND del_yn = 'N' LIMIT 1",
        [userId],
    )
    const row = rows[0]
    if (!row) return null
    const rawAcademy = row.academy_id
    const parsed =
        rawAcademy != null && rawAcademy !== "" ? Number(rawAcademy) : NaN
    const academyId = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    return {
        academyId,
        role: (row.role ?? "ACADEMY_MEMBER") as IumUserRole,
        approvalStatus: (row.approval_status ?? "PENDING") as IumApprovalStatus,
    }
}
