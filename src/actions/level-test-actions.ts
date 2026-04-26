"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade } from "@/types/ium-user"
import type { LevelTestRow, LevelTestSaveInput } from "@/types/level-test"

type SessionCtx =
    | ServerActionResult<never>
    | {
          userId: number
          userGrade: IumUserGrade
          userAcademyId: number | null
      }

async function requireSession(): Promise<SessionCtx> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "로그인이 필요합니다." }
    }
    const rawAid = session.user.academyId
    const userAcademyId = rawAid != null && rawAid > 0 ? Number(rawAid) : null
    return {
        userId: Number(session.user.id),
        userGrade: session.user.userGrade ?? "USER",
        userAcademyId,
    }
}

async function requireAdmin(): Promise<SessionCtx> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (s.userGrade !== "ADMIN") {
        return { success: false, error: "관리자만 접근할 수 있습니다." }
    }
    return s
}

function toInt(v: unknown): number {
    const n = typeof v === "number" ? v : Number(v ?? 0)
    return Number.isFinite(n) ? n : 0
}

function toIntOrNull(v: unknown): number | null {
    if (v == null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
}

function toStrOrNull(v: unknown): string | null {
    if (v == null) return null
    const s = String(v)
    return s === "" ? null : s
}

function mapRow(r: Record<string, unknown>): LevelTestRow {
    const rawScore = r.score
    return {
        id: toInt(r.id),
        academyId: toInt(r.academyId ?? r.academy_id),
        subject: String(r.subject ?? ""),
        score:
            rawScore == null || rawScore === ""
                ? null
                : Number(rawScore) || 0,
        levelResult: toStrOrNull(r.levelResult ?? r.level_result),
        memo: toStrOrNull(r.memo),
        testedAt: String(r.testedAt ?? r.tested_at ?? ""),
        testerUserId: toIntOrNull(r.testerUserId ?? r.tester_user_id),
        testerName: toStrOrNull(r.testerName ?? r.tester_name),
    }
}

export async function saveLevelTest(
    input: LevelTestSaveInput,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    if (!input.academyId) return { success: false, error: "소속 학원이 없습니다." }
    if (!input.subject?.trim()) return { success: false, error: "과목을 입력하세요." }
    if (
        !isSystemAdmin(gate.userGrade, gate.userAcademyId) &&
        gate.userAcademyId != null &&
        input.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "자신의 학원에만 저장할 수 있습니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_level_test_save",
            input.consultationId ?? 0,
            input.studentId ?? 0,
            input.academyId,
            input.subject.trim(),
            input.score,
            toStrOrNull(input.levelResult),
            toStrOrNull(input.memo),
            gate.userId,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("SUBJECT_REQUIRED")) return { success: false, error: "과목을 입력하세요." }
        if (msg.includes("ACADEMY_REQUIRED")) return { success: false, error: "소속 학원이 없습니다." }
        if (msg.includes("INVALID_ACADEMY")) return { success: false, error: "유효한 학원이 아닙니다." }
        console.error("saveLevelTest:", e)
        return { success: false, error: "레벨 테스트 저장에 실패했습니다." }
    }
}

export async function listLevelTestsByConsult(
    consultId: number,
): Promise<ServerActionResult<LevelTestRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_level_test_list_by_consult",
            consultId,
        )
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listLevelTestsByConsult:", e)
        return { success: false, error: "레벨 테스트를 불러올 수 없습니다." }
    }
}

export async function listLevelTestsByStudent(
    studentId: number,
): Promise<ServerActionResult<LevelTestRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_level_test_list_by_student",
            studentId,
        )
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listLevelTestsByStudent:", e)
        return { success: false, error: "레벨 테스트를 불러올 수 없습니다." }
    }
}

export async function deleteLevelTest(id: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>("sp_ium_level_test_delete", id)
        return { success: true }
    } catch (e) {
        console.error("deleteLevelTest:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}
