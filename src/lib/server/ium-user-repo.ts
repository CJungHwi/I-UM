import "server-only"

import { executeQuery } from "@/lib/db"

export async function getAcademyIdForIumUser(userId: number): Promise<number | null> {
    const rows = await executeQuery<{ academy_id: unknown }>(
        "SELECT academy_id FROM ium_users WHERE id = ? AND del_yn = 'N' LIMIT 1",
        [userId],
    )
    const raw = rows[0]?.academy_id
    const n = raw != null && raw !== "" ? Number(raw) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
}
