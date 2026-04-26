"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade } from "@/types/ium-user"
import type {
    ClassProgressRow,
    ClassProgressStats,
    CurriculumUnit,
    CurriculumUpsertInput,
} from "@/types/curriculum"

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

function mapUnit(r: Record<string, unknown>): CurriculumUnit {
    return {
        id: toInt(r.id),
        academyId: toInt(r.academyId ?? r.academy_id),
        subject: String(r.subject ?? ""),
        level: toStrOrNull(r.level),
        unitNo: toInt(r.unitNo ?? r.unit_no),
        unitTitle: String(r.unitTitle ?? r.unit_title ?? ""),
        planMemo: toStrOrNull(r.planMemo ?? r.plan_memo),
        estWeek:
            r.estWeek == null && r.est_week == null
                ? null
                : Number(r.estWeek ?? r.est_week) || 0,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

function mapProgress(r: Record<string, unknown>): ClassProgressRow {
    return {
        curriculumId: toInt(r.curriculumId ?? r.curriculum_id),
        subject: String(r.subject ?? ""),
        level: toStrOrNull(r.level),
        unitNo: toInt(r.unitNo ?? r.unit_no),
        unitTitle: String(r.unitTitle ?? r.unit_title ?? ""),
        planMemo: toStrOrNull(r.planMemo ?? r.plan_memo),
        estWeek:
            r.estWeek == null && r.est_week == null
                ? null
                : Number(r.estWeek ?? r.est_week) || 0,
        progressId: toIntOrNull(r.progressId ?? r.progress_id),
        completedAt: toStrOrNull(r.completedAt ?? r.completed_at),
        progressNote: toStrOrNull(r.progressNote ?? r.progress_note),
        teacherUserId: toIntOrNull(r.teacherUserId ?? r.teacher_user_id),
        teacherName: toStrOrNull(r.teacherName ?? r.teacher_name),
    }
}

function mapProgressStats(
    r: Record<string, unknown> | undefined,
): ClassProgressStats {
    if (!r)
        return { totalUnits: 0, completedUnits: 0, progressRate: null }
    const rate = r.progressRate ?? r.progress_rate
    return {
        totalUnits: toInt(r.totalUnits ?? r.total_units),
        completedUnits: toInt(r.completedUnits ?? r.completed_units),
        progressRate: rate == null ? null : Number(rate),
    }
}

export async function listCurriculumUnits(
    academyId: number,
    subject?: string | null,
    level?: string | null,
): Promise<ServerActionResult<CurriculumUnit[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (
        !isSystemAdmin(s.userGrade, s.userAcademyId) &&
        s.userAcademyId != null &&
        academyId !== s.userAcademyId
    ) {
        return { success: false, error: "열람 권한이 없습니다." }
    }
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_curriculum_list",
            academyId,
            toStrOrNull(subject),
            toStrOrNull(level),
        )
        return { success: true, data: rows.map(mapUnit) }
    } catch (e) {
        console.error("listCurriculumUnits:", e)
        return { success: false, error: "커리큘럼을 불러올 수 없습니다." }
    }
}

export async function upsertCurriculumUnit(
    input: CurriculumUpsertInput,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    if (
        !isSystemAdmin(gate.userGrade, gate.userAcademyId) &&
        gate.userAcademyId != null &&
        input.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "자신의 학원에만 저장할 수 있습니다." }
    }

    if (!input.subject?.trim()) return { success: false, error: "과목을 입력하세요." }
    if (!input.unitTitle?.trim()) return { success: false, error: "단원 제목을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_curriculum_upsert",
            input.id || 0,
            input.academyId,
            input.subject.trim(),
            toStrOrNull(input.level),
            input.unitNo ?? 0,
            input.unitTitle.trim(),
            toStrOrNull(input.planMemo),
            input.estWeek,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("SUBJECT_REQUIRED")) return { success: false, error: "과목을 입력하세요." }
        if (msg.includes("UNIT_TITLE_REQUIRED")) return { success: false, error: "단원 제목을 입력하세요." }
        if (msg.includes("Duplicate")) return { success: false, error: "이미 존재하는 단원 번호입니다." }
        console.error("upsertCurriculumUnit:", e)
        return { success: false, error: "커리큘럼 저장에 실패했습니다." }
    }
}

export async function deleteCurriculumUnit(
    id: number,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_curriculum_delete",
            id,
        )
        return { success: true }
    } catch (e) {
        console.error("deleteCurriculumUnit:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}

export async function getClassProgress(
    classId: number,
): Promise<ServerActionResult<ClassProgressRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_progress_get",
            classId,
        )
        return { success: true, data: rows.map(mapProgress) }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("CLASS_NOT_FOUND")) return { success: false, error: "반을 찾을 수 없습니다." }
        console.error("getClassProgress:", e)
        return { success: false, error: "진도를 불러올 수 없습니다." }
    }
}

export async function getClassProgressStats(
    classId: number,
): Promise<ServerActionResult<ClassProgressStats>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_progress_stats",
            classId,
        )
        return { success: true, data: mapProgressStats(rows[0]) }
    } catch (e) {
        console.error("getClassProgressStats:", e)
        return { success: false, error: "진도 통계를 불러올 수 없습니다." }
    }
}

export async function markClassProgress(
    classId: number,
    curriculumId: number,
    completed: boolean,
    note?: string | null,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_class_progress_mark",
            classId,
            curriculumId,
            completed ? 1 : 0,
            toStrOrNull(note),
            gate.userId,
        )
        return { success: true }
    } catch (e) {
        console.error("markClassProgress:", e)
        return { success: false, error: "진도 저장에 실패했습니다." }
    }
}
