"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import type { ServerActionResult } from "@/types"
import type { IumAcademyMasterRow } from "@/types/ium-academy"

async function requireAdmin(): Promise<ServerActionResult<never> | null> {
    const session = await auth()
    if (!session?.user?.mbId) {
        return { success: false, error: "로그인이 필요합니다." }
    }
    if (session.user.userGrade !== "ADMIN") {
        return { success: false, error: "관리자만 접근할 수 있습니다." }
    }
    return null
}

function mapAcademyMasterRow(r: any): IumAcademyMasterRow {
    const active = r.isActive ?? r.is_active
    return {
        id: Number(r.id ?? 0),
        name: String(r.name ?? ""),
        isActive: active === "Y" || active === true || active === 1,
        displayOrder: Number(r.displayOrder ?? r.display_order ?? 0),
        userCount: Number(r.userCount ?? r.user_count ?? 0),
    }
}

export async function listIumAcademiesAdmin(): Promise<ServerActionResult<IumAcademyMasterRow[]>> {
    const denied = await requireAdmin()
    if (denied) return denied

    try {
        const rows = await callProcedure<any>("sp_ium_admin_list_academies")
        return { success: true, data: (rows ?? []).map(mapAcademyMasterRow) }
    } catch (e) {
        console.error("listIumAcademiesAdmin:", e)
        return { success: false, error: "학원 목록을 불러올 수 없습니다." }
    }
}

export async function createIumAcademy(
    name: string,
    displayOrder: number,
    isActive: boolean,
): Promise<ServerActionResult<{ id: number }>> {
    const denied = await requireAdmin()
    if (denied) return denied

    const nm = name.trim()
    if (!nm) {
        return { success: false, error: "학원명을 입력하세요." }
    }

    try {
        const results = await callProcedure<any>(
            "sp_ium_admin_create_academy",
            nm,
            displayOrder,
            isActive ? "Y" : "N",
        )
        const newId = results?.[0]?.id ?? results?.[0]?.f0 ?? 0
        if (!newId) {
            return { success: false, error: "등록에 실패했습니다." }
        }
        return { success: true, data: { id: newId } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("NAME_REQUIRED")) {
            return { success: false, error: "학원명을 입력하세요." }
        }
        console.error("createIumAcademy:", e)
        return { success: false, error: "등록 중 오류가 발생했습니다." }
    }
}

export async function updateIumAcademy(
    id: number,
    name: string,
    displayOrder: number,
    isActive: boolean,
): Promise<ServerActionResult> {
    const denied = await requireAdmin()
    if (denied) return denied

    const nm = name.trim()
    if (!id || !nm) {
        return { success: false, error: "학원명을 입력하세요." }
    }

    try {
        await callProcedure<any>(
            "sp_ium_admin_update_academy",
            id,
            nm,
            displayOrder,
            isActive ? "Y" : "N",
        )
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("NAME_REQUIRED")) {
            return { success: false, error: "학원명을 입력하세요." }
        }
        console.error("updateIumAcademy:", e)
        return { success: false, error: "수정 중 오류가 발생했습니다." }
    }
}

export async function deleteIumAcademy(id: number): Promise<ServerActionResult> {
    const denied = await requireAdmin()
    if (denied) return denied

    if (!id) {
        return { success: false, error: "잘못된 요청입니다." }
    }

    try {
        await callProcedure<any>("sp_ium_admin_delete_academy", id)
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("ACADEMY_IN_USE")) {
            return { success: false, error: "소속 사용자가 있어 삭제할 수 없습니다." }
        }
        console.error("deleteIumAcademy:", e)
        return { success: false, error: "삭제 중 오류가 발생했습니다." }
    }
}
