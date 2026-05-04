"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import type { ServerActionResult } from "@/types"
import type { IumCodeRow, IumCodeType } from "@/types/ium-code"

function toInt(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v ?? 0)
    return Number.isFinite(n) ? n : 0
}

function toStrOrNull(v: unknown): string | null {
    if (v == null) return null
    const s = String(v)
    return s === "" ? null : s
}

function mapCodeRow(r: Record<string, unknown>): IumCodeRow {
    return {
        code: String(r.code ?? ""),
        label: String(r.label ?? ""),
        sortNo: toInt(r.sortNo ?? r.sort_no),
        nextGradeCode: toStrOrNull(r.nextGradeCode ?? r.next_grade_code),
    }
}

export async function listIumCodesByType(
    codeType: IumCodeType,
): Promise<ServerActionResult<IumCodeRow[]>> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: "로그인이 필요합니다." }
    }
    try {
        const rows = await callProcedure<Record<string, unknown>>("sp_ium_code_list", codeType)
        return { success: true, data: rows.map(mapCodeRow).filter((x) => x.code) }
    } catch (e) {
        console.error("listIumCodesByType:", e)
        return { success: false, error: "코드 목록을 불러올 수 없습니다." }
    }
}
