"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserRole } from "@/types/ium-user"
import type {
    AssignmentDetail,
    AssignmentRow,
    AssignmentSubmissionRow,
    AssignmentSubmissionStatus,
    AssignmentSubmissionUpsertInput,
    AssignmentUpsertInput,
} from "@/types/assignment"

type SessionCtx =
    | ServerActionResult<never>
    | {
          userId: number
          role: IumUserRole
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
        role: session.user.role ?? "ACADEMY_MEMBER",
        userAcademyId,
    }
}

async function requireAdmin(): Promise<SessionCtx> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (!isSystemAdmin(s.role) && !isAcademyAdmin(s.role)) {
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

function toMySQLDateTime(v: unknown): string | null {
    if (v == null || v === "") return null
    const s = String(v)
    if (s.includes("T")) return s.replace("T", " ").slice(0, 19)
    return s.slice(0, 19)
}

function mapRow(r: Record<string, unknown>): AssignmentRow {
    return {
        id: toInt(r.id),
        classId: toInt(r.classId ?? r.class_id),
        curriculumId: toIntOrNull(r.curriculumId ?? r.curriculum_id),
        unitTitle: toStrOrNull(r.unitTitle ?? r.unit_title),
        title: String(r.title ?? ""),
        body: toStrOrNull(r.body),
        dueAt: toStrOrNull(r.dueAt ?? r.due_at),
        createdByUserId: toIntOrNull(r.createdByUserId ?? r.created_by_user_id),
        createdByName: toStrOrNull(r.createdByName ?? r.created_by_name),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
        doneCount: toInt(r.doneCount ?? r.done_count),
        lateCount: toInt(r.lateCount ?? r.late_count),
        missingCount: toInt(r.missingCount ?? r.missing_count),
        pendingCount: toInt(r.pendingCount ?? r.pending_count),
        totalStudents: toInt(r.totalStudents ?? r.total_students),
    }
}

function mapDetail(r: Record<string, unknown>): AssignmentDetail {
    return {
        id: toInt(r.id),
        classId: toInt(r.classId ?? r.class_id),
        className: String(r.className ?? r.class_name ?? ""),
        academyId: toInt(r.academyId ?? r.academy_id),
        curriculumId: toIntOrNull(r.curriculumId ?? r.curriculum_id),
        unitTitle: toStrOrNull(r.unitTitle ?? r.unit_title),
        title: String(r.title ?? ""),
        body: toStrOrNull(r.body),
        dueAt: toStrOrNull(r.dueAt ?? r.due_at),
        createdByUserId: toIntOrNull(r.createdByUserId ?? r.created_by_user_id),
        createdByName: toStrOrNull(r.createdByName ?? r.created_by_name),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

function mapSubmission(r: Record<string, unknown>): AssignmentSubmissionRow {
    const rawScore = r.score
    return {
        studentId: toInt(r.studentId ?? r.student_id),
        studentName: String(r.studentName ?? r.student_name ?? ""),
        grade: toStrOrNull(r.grade),
        submissionId: toIntOrNull(r.submissionId ?? r.submission_id),
        status: (String(r.status ?? "PENDING") as AssignmentSubmissionStatus),
        submittedAt: toStrOrNull(r.submittedAt ?? r.submitted_at),
        score:
            rawScore == null || rawScore === ""
                ? null
                : Number(rawScore) || 0,
        feedback: toStrOrNull(r.feedback),
        gradedAt: toStrOrNull(r.gradedAt ?? r.graded_at),
        aPointEarned: Boolean(toInt(r.aPointEarned ?? r.a_point_earned)),
    }
}

// -------------------------------------------------------------------
// 반의 과제 목록 + 생성/수정/삭제
// -------------------------------------------------------------------
export async function listAssignmentsByClass(
    classId: number,
): Promise<ServerActionResult<AssignmentRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_list_by_class",
            classId,
        )
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listAssignmentsByClass:", e)
        return { success: false, error: "과제 목록을 불러올 수 없습니다." }
    }
}

export async function getAssignmentDetail(
    id: number,
): Promise<ServerActionResult<AssignmentDetail>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_get",
            id,
        )
        if (!rows.length) return { success: false, error: "과제를 찾을 수 없습니다." }
        const d = mapDetail(rows[0])
        if (
            !isSystemAdmin(s.role) &&
            s.userAcademyId != null &&
            d.academyId !== s.userAcademyId
        ) {
            return { success: false, error: "열람 권한이 없습니다." }
        }
        return { success: true, data: d }
    } catch (e) {
        console.error("getAssignmentDetail:", e)
        return { success: false, error: "과제를 불러올 수 없습니다." }
    }
}

export async function createAssignment(
    input: AssignmentUpsertInput,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    if (!input.classId) return { success: false, error: "반을 선택하세요." }
    if (!input.title?.trim()) return { success: false, error: "과제 제목을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_create",
            input.classId,
            input.curriculumId ?? 0,
            input.title.trim(),
            toStrOrNull(input.body),
            toMySQLDateTime(input.dueAt),
            gate.userId,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("TITLE_REQUIRED")) return { success: false, error: "과제 제목을 입력하세요." }
        console.error("createAssignment:", e)
        return { success: false, error: "과제 생성에 실패했습니다." }
    }
}

export async function updateAssignment(
    input: AssignmentUpsertInput,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!input.id) return { success: false, error: "과제를 선택하세요." }
    if (!input.title?.trim()) return { success: false, error: "과제 제목을 입력하세요." }

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_update",
            input.id,
            input.curriculumId ?? 0,
            input.title.trim(),
            toStrOrNull(input.body),
            toMySQLDateTime(input.dueAt),
        )
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("TITLE_REQUIRED")) return { success: false, error: "과제 제목을 입력하세요." }
        console.error("updateAssignment:", e)
        return { success: false, error: "과제 수정에 실패했습니다." }
    }
}

export async function deleteAssignment(id: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_delete",
            id,
        )
        return { success: true }
    } catch (e) {
        console.error("deleteAssignment:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 제출 매트릭스 + upsert (A등급 자동 포인트)
// -------------------------------------------------------------------
export async function listAssignmentSubmissions(
    assignmentId: number,
): Promise<ServerActionResult<AssignmentSubmissionRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_submissions_get",
            assignmentId,
        )
        return { success: true, data: rows.map(mapSubmission) }
    } catch (e) {
        console.error("listAssignmentSubmissions:", e)
        return { success: false, error: "제출 현황을 불러올 수 없습니다." }
    }
}

export async function upsertSubmission(
    input: AssignmentSubmissionUpsertInput,
): Promise<
    ServerActionResult<{
        status: AssignmentSubmissionStatus
        earnedNow: boolean
        aPointEarned: boolean
    }>
> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!input.assignmentId || !input.studentId) {
        return { success: false, error: "과제/학생이 지정되지 않았습니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_submission_upsert",
            input.assignmentId,
            input.studentId,
            input.status,
            input.score,
            toStrOrNull(input.feedback),
            gate.userId,
        )
        const r = rows?.[0] ?? {}
        return {
            success: true,
            data: {
                status: (String(r.status ?? input.status) as AssignmentSubmissionStatus),
                earnedNow: Boolean(toInt(r.earnedNow ?? r.earned_now)),
                aPointEarned: Boolean(toInt(r.aPointEarned ?? r.a_point_earned)),
            },
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("INVALID_STATUS")) return { success: false, error: "유효하지 않은 상태입니다." }
        console.error("upsertSubmission:", e)
        return { success: false, error: "제출 저장에 실패했습니다." }
    }
}

export async function autoMarkMissing(): Promise<ServerActionResult<{ affected: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_assignment_auto_mark_missing",
        )
        return {
            success: true,
            data: { affected: toInt(rows?.[0]?.affected ?? rows?.[0]?.f0) },
        }
    } catch (e) {
        console.error("autoMarkMissing:", e)
        return { success: false, error: "미제출 자동 처리에 실패했습니다." }
    }
}
