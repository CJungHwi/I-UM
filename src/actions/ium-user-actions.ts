"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import { getAcademyIdForIumUser } from "@/lib/server/ium-user-repo"
import { sendNotificationRaw } from "@/lib/server/notifications"
import { hashPassword } from "@/lib/password"
import type { ServerActionResult } from "@/types"
import type {
    IumAcademyOption,
    IumUserRow,
    IumUserRole,
    IumApprovalStatus,
} from "@/types/ium-user"

function mapUserRow(r: any): IumUserRow {
    const rawAcademyId = r.academyId ?? r.academy_id
    const parsedAcademy =
        rawAcademyId != null && rawAcademyId !== "" ? Number(rawAcademyId) : NaN
    const academyId = Number.isFinite(parsedAcademy) && parsedAcademy > 0 ? parsedAcademy : null
    const rawAcademyName = r.academyName ?? r.academy_name
    return {
        id: Number(r.id ?? 0),
        loginId: String(r.loginId ?? r.login_id ?? ""),
        name: String(r.name ?? ""),
        email: r.email != null && r.email !== "" ? String(r.email) : null,
        academyId,
        academyName: rawAcademyName != null && rawAcademyName !== "" ? String(rawAcademyName) : null,
        role: (r.role ?? "ACADEMY_MEMBER") as IumUserRole,
        approvalStatus: (r.approvalStatus ?? r.approval_status ?? "PENDING") as IumApprovalStatus,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

async function getManageGate(): Promise<
    | { userId: number; role: IumUserRole; academyId: number | null }
    | ServerActionResult<never>
> {
    const session = await auth()
    if (!session?.user?.mbId || !session.user.role) {
        return { success: false, error: "로그인이 필요합니다." }
    }
    if (!isSystemAdmin(session.user.role) && !isAcademyAdmin(session.user.role)) {
        return { success: false, error: "관리자만 접근할 수 있습니다." }
    }
    return {
        userId: Number(session.user.id),
        role: session.user.role,
        academyId: session.user.academyId,
    }
}

function mapAcademyOption(r: any): IumAcademyOption {
    return {
        id: Number(r.id ?? r.f0 ?? 0),
        academyName: String(r.academyName ?? r.academy_name ?? r.f1 ?? ""),
    }
}

/** 회원가입 화면용: 활성 학원 목록 (인증 불필요) */
export async function listIumAcademiesForRegister(): Promise<ServerActionResult<IumAcademyOption[]>> {
    try {
        const rows = await callProcedure<any>("sp_ium_list_academies_for_register")
        const list = (rows ?? []).map(mapAcademyOption).filter((a) => a.id > 0 && a.academyName)
        return { success: true, data: list }
    } catch (e) {
        console.error("listIumAcademiesForRegister:", e)
        return { success: false, error: "소속 학원 목록을 불러올 수 없습니다." }
    }
}

export async function registerIumUser(
    loginId: string,
    plainPassword: string,
    name: string,
    email: string | null,
    academyId: number,
): Promise<ServerActionResult<{ id: number }>> {
    const id = loginId.trim()
    const nm = name.trim()
    if (!id || !plainPassword || plainPassword.length < 8) {
        return { success: false, error: "비밀번호는 8자 이상이어야 합니다." }
    }
    if (!nm) {
        return { success: false, error: "이름을 입력하세요." }
    }
    if (!academyId || academyId <= 0) {
        return { success: false, error: "소속 학원을 선택하세요." }
    }
    try {
        const passwordHash = await hashPassword(plainPassword)
        const results = await callProcedure<any>(
            "sp_ium_register",
            id,
            passwordHash,
            nm,
            email?.trim() ?? "",
            academyId,
        )
        const newId = results?.[0]?.id ?? results?.[0]?.f0 ?? 0
        if (!newId) {
            return { success: false, error: "회원가입 처리에 실패했습니다." }
        }
        return { success: true, data: { id: newId } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("DUPLICATE") || msg.includes("Duplicate")) {
            return { success: false, error: "이미 사용 중인 아이디입니다." }
        }
        if (msg.includes("ACADEMY_REQUIRED") || msg.includes("INVALID_ACADEMY")) {
            return { success: false, error: "유효한 소속 학원을 선택하세요." }
        }
        console.error("registerIumUser:", e)
        return { success: false, error: "회원가입 중 오류가 발생했습니다." }
    }
}

export async function listIumUsers(
    status?: IumApprovalStatus | null,
): Promise<ServerActionResult<IumUserRow[]>> {
    const gate = await getManageGate()
    if (!("userId" in gate)) return gate

    try {
        const rows = isSystemAdmin(gate.role)
            ? await callProcedure<any>("sp_ium_list_users", status ?? null)
            : gate.academyId != null
              ? await callProcedure<any>("sp_ium_list_users_for_academy", gate.academyId, status ?? null)
              : []
        return { success: true, data: rows.map(mapUserRow) }
    } catch (e) {
        console.error("listIumUsers:", e)
        return { success: false, error: "목록을 불러올 수 없습니다." }
    }
}

/** 알림 발송 시 대상 선택용 — 전역 관리자는 전체, 학원 관리자는 해당 학원만 */
export async function listIumUsersForNotificationTargets(): Promise<ServerActionResult<IumUserRow[]>> {
    const gate = await getManageGate()
    if (!("userId" in gate)) return gate
    try {
        if (isSystemAdmin(gate.role)) {
            const rows = await callProcedure<any>("sp_ium_list_users", "APPROVED")
            return { success: true, data: rows.map(mapUserRow) }
        }
        if (isAcademyAdmin(gate.role) && gate.academyId != null && gate.academyId > 0) {
            const rows = await callProcedure<any>("sp_ium_list_users_for_academy", gate.academyId, "APPROVED")
            return { success: true, data: rows.map(mapUserRow) }
        }
        return { success: false, error: "대상 목록을 불러올 수 없습니다." }
    } catch (e) {
        console.error("listIumUsersForNotificationTargets:", e)
        return { success: false, error: "목록을 불러올 수 없습니다." }
    }
}

export async function approveIumUser(userId: number): Promise<ServerActionResult> {
    const gate = await getManageGate()
    if (!("userId" in gate)) return gate
    try {
        const targetAcademyId = await getAcademyIdForIumUser(userId)
        if (
            !isSystemAdmin(gate.role) &&
            gate.academyId != null &&
            targetAcademyId !== gate.academyId
        ) {
            return { success: false, error: "소속 학원 사용자만 처리할 수 있습니다." }
        }
        await callProcedure<any>("sp_ium_approve_user", userId)
        const n =
            targetAcademyId != null
                ? await sendNotificationRaw(
                      "가입이 승인되었습니다",
                      "관리자가 귀하의 회원가입을 승인했습니다. 로그인 후 서비스를 이용해 주세요.",
                      "ACADEMY",
                      "USER",
                      {
                          targetUserId: userId,
                          senderUserId: gate.userId,
                          templateId: null,
                          academyId: targetAcademyId,
                      },
                  )
                : await sendNotificationRaw(
                      "가입이 승인되었습니다",
                      "관리자가 귀하의 회원가입을 승인했습니다. 로그인 후 서비스를 이용해 주세요.",
                      "SYSTEM",
                      "USER",
                      {
                          targetUserId: userId,
                          senderUserId: gate.userId,
                          templateId: null,
                          academyId: null,
                      },
                  )
        if (!n.ok) {
            console.warn("approveIumUser: 알림 발송 실패", n.error)
        }
        return { success: true }
    } catch (e) {
        console.error("approveIumUser:", e)
        return { success: false, error: "승인 처리에 실패했습니다." }
    }
}

export async function rejectIumUser(userId: number): Promise<ServerActionResult> {
    const gate = await getManageGate()
    if (!("userId" in gate)) return gate
    try {
        const targetAcademyId = await getAcademyIdForIumUser(userId)
        if (
            !isSystemAdmin(gate.role) &&
            gate.academyId != null &&
            targetAcademyId !== gate.academyId
        ) {
            return { success: false, error: "소속 학원 사용자만 처리할 수 있습니다." }
        }
        await callProcedure<any>("sp_ium_reject_user", userId)
        return { success: true }
    } catch (e) {
        console.error("rejectIumUser:", e)
        return { success: false, error: "반려 처리에 실패했습니다." }
    }
}

export async function setIumUserRole(
    userId: number,
    role: IumUserRole,
): Promise<ServerActionResult> {
    const gate = await getManageGate()
    if (!("userId" in gate)) return gate
    if (role === "SYSTEM_ADMIN" && !isSystemAdmin(gate.role)) {
        return { success: false, error: "시스템 관리자는 전역 관리자만 지정할 수 있습니다." }
    }
    try {
        const targetAcademyId = await getAcademyIdForIumUser(userId)
        if (
            !isSystemAdmin(gate.role) &&
            gate.academyId != null &&
            targetAcademyId !== gate.academyId
        ) {
            return { success: false, error: "소속 학원 사용자만 변경할 수 있습니다." }
        }
        await callProcedure<any>("sp_ium_set_user_role", userId, role)
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("INVALID_ROLE")) {
            return { success: false, error: "유효하지 않은 사용자 레벨입니다." }
        }
        console.error("setIumUserRole:", e)
        return { success: false, error: "사용자 레벨 변경에 실패했습니다." }
    }
}
