"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade } from "@/types/ium-user"
import type {
    ClassMatchRow,
    ClassRow,
    ClassUpsertInput,
    EnrollmentRow,
    StudentEnrollment,
} from "@/types/class"

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

function mapRow(r: Record<string, unknown>): ClassRow {
    return {
        id: toInt(r.id),
        academyId: toInt(r.academyId ?? r.academy_id),
        academyName: toStrOrNull(r.academyName ?? r.academy_name),
        name: String(r.name ?? ""),
        subject: String(r.subject ?? ""),
        level: toStrOrNull(r.level),
        teacherUserId: toIntOrNull(r.teacherUserId ?? r.teacher_user_id),
        teacherName: toStrOrNull(r.teacherName ?? r.teacher_name),
        capacity: toInt(r.capacity),
        scheduleNote: toStrOrNull(r.scheduleNote ?? r.schedule_note),
        isActive: String(r.isActive ?? r.is_active ?? "Y"),
        enrolledCount: toInt(r.enrolledCount ?? r.enrolled_count),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

function mapMatch(r: Record<string, unknown>): ClassMatchRow {
    return {
        id: toInt(r.id),
        name: String(r.name ?? ""),
        subject: String(r.subject ?? ""),
        level: toStrOrNull(r.level),
        capacity: toInt(r.capacity),
        enrolledCount: toInt(r.enrolledCount ?? r.enrolled_count),
        teacherName: toStrOrNull(r.teacherName ?? r.teacher_name),
        scheduleNote: toStrOrNull(r.scheduleNote ?? r.schedule_note),
        matchScore: toInt(r.matchScore ?? r.match_score),
    }
}

function mapEnrollment(r: Record<string, unknown>): EnrollmentRow {
    return {
        id: toInt(r.id),
        classId: toInt(r.classId ?? r.class_id),
        studentId: toInt(r.studentId ?? r.student_id),
        studentName: String(r.studentName ?? r.student_name ?? ""),
        grade: toStrOrNull(r.grade),
        school: toStrOrNull(r.school),
        status: (String(r.status ?? "ACTIVE") as "ACTIVE" | "DROPPED"),
        enrolledAt: String(r.enrolledAt ?? r.enrolled_at ?? ""),
        leftAt: toStrOrNull(r.leftAt ?? r.left_at),
    }
}

function mapStudentEnrollment(r: Record<string, unknown>): StudentEnrollment {
    return {
        id: toInt(r.id),
        classId: toInt(r.classId ?? r.class_id),
        className: String(r.className ?? r.class_name ?? ""),
        subject: String(r.subject ?? ""),
        level: toStrOrNull(r.level),
        teacherName: toStrOrNull(r.teacherName ?? r.teacher_name),
        status: (String(r.status ?? "ACTIVE") as "ACTIVE" | "DROPPED"),
        enrolledAt: String(r.enrolledAt ?? r.enrolled_at ?? ""),
        leftAt: toStrOrNull(r.leftAt ?? r.left_at),
    }
}

// -------------------------------------------------------------------
// 목록
// -------------------------------------------------------------------
export async function listClasses(
    subject?: string | null,
    keyword?: string | null,
): Promise<ServerActionResult<ClassRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const subj = (subject ?? "").trim() || null
        const kw = (keyword ?? "").trim() || null
        let rows: Record<string, unknown>[]
        if (isSystemAdmin(s.userGrade, s.userAcademyId)) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_class_list",
                subj,
                kw,
            )
        } else if (
            isAcademyAdmin(s.userGrade, s.userAcademyId) ||
            (s.userGrade === "USER" && s.userAcademyId != null)
        ) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_class_list_for_academy",
                s.userAcademyId,
                subj,
                kw,
            )
        } else {
            return { success: false, error: "소속 학원이 없어 반 목록을 불러올 수 없습니다." }
        }
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listClasses:", e)
        return { success: false, error: "반 목록을 불러올 수 없습니다." }
    }
}

export async function getClassDetail(
    id: number,
): Promise<ServerActionResult<ClassRow>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_get",
            id,
        )
        if (!rows.length) {
            return { success: false, error: "반을 찾을 수 없습니다." }
        }
        const r = mapRow(rows[0])
        if (
            !isSystemAdmin(s.userGrade, s.userAcademyId) &&
            s.userAcademyId != null &&
            r.academyId !== s.userAcademyId
        ) {
            return { success: false, error: "열람 권한이 없습니다." }
        }
        return { success: true, data: r }
    } catch (e) {
        console.error("getClassDetail:", e)
        return { success: false, error: "반 정보를 불러올 수 없습니다." }
    }
}

export async function upsertClass(
    input: ClassUpsertInput,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const academyId = toIntOrNull(input.academyId)
    if (!academyId) return { success: false, error: "소속 학원을 선택하세요." }
    if (
        !isSystemAdmin(gate.userGrade, gate.userAcademyId) &&
        gate.userAcademyId != null &&
        academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "자신의 학원에만 반을 만들 수 있습니다." }
    }

    if (!input.name?.trim()) return { success: false, error: "반 이름을 입력하세요." }
    if (!input.subject?.trim()) return { success: false, error: "과목을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_upsert",
            input.id || 0,
            academyId,
            input.name.trim(),
            input.subject.trim(),
            toStrOrNull(input.level),
            input.teacherUserId ?? 0,
            input.capacity ?? 20,
            toStrOrNull(input.scheduleNote),
            input.isActive || "Y",
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("CLASS_NAME_REQUIRED")) return { success: false, error: "반 이름을 입력하세요." }
        if (msg.includes("SUBJECT_REQUIRED")) return { success: false, error: "과목을 입력하세요." }
        if (msg.includes("ACADEMY_REQUIRED")) return { success: false, error: "소속 학원을 선택하세요." }
        if (msg.includes("INVALID_ACADEMY")) return { success: false, error: "유효한 학원을 선택하세요." }
        console.error("upsertClass:", e)
        return { success: false, error: "반 저장에 실패했습니다." }
    }
}

export async function deleteClass(id: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>("sp_ium_class_delete", id)
        return { success: true }
    } catch (e) {
        console.error("deleteClass:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 매칭
// -------------------------------------------------------------------
export async function matchClasses(
    academyId: number,
    subject: string | null,
    level: string | null,
    limit = 5,
): Promise<ServerActionResult<ClassMatchRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_match",
            academyId,
            toStrOrNull(subject),
            toStrOrNull(level),
            Math.max(1, Math.min(limit, 20)),
        )
        return { success: true, data: rows.map(mapMatch) }
    } catch (e) {
        console.error("matchClasses:", e)
        return { success: false, error: "매칭 결과를 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 수강 등록
// -------------------------------------------------------------------
export async function listEnrollments(
    classId: number,
): Promise<ServerActionResult<EnrollmentRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_enrollment_list",
            classId,
        )
        return { success: true, data: rows.map(mapEnrollment) }
    } catch (e) {
        console.error("listEnrollments:", e)
        return { success: false, error: "수강 명단을 불러올 수 없습니다." }
    }
}

export async function listStudentEnrollments(
    studentId: number,
): Promise<ServerActionResult<StudentEnrollment[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_enrollments_by_student",
            studentId,
        )
        return { success: true, data: rows.map(mapStudentEnrollment) }
    } catch (e) {
        console.error("listStudentEnrollments:", e)
        return { success: false, error: "수강 이력을 불러올 수 없습니다." }
    }
}

export async function enrollStudent(
    classId: number,
    studentId: number,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_class_enroll",
            classId,
            studentId,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("CLASS_NOT_FOUND")) return { success: false, error: "반을 찾을 수 없습니다." }
        if (msg.includes("STUDENT_NOT_FOUND")) return { success: false, error: "학생을 찾을 수 없습니다." }
        if (msg.includes("ACADEMY_MISMATCH")) return { success: false, error: "같은 학원 반·학생만 등록할 수 있습니다." }
        if (msg.includes("CAPACITY_EXCEEDED")) return { success: false, error: "정원이 꽉 찼습니다." }
        if (msg.includes("Duplicate")) return { success: false, error: "이미 등록된 학생입니다." }
        console.error("enrollStudent:", e)
        return { success: false, error: "수강 등록에 실패했습니다." }
    }
}

export async function unenrollStudent(
    classId: number,
    studentId: number,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_class_unenroll",
            classId,
            studentId,
        )
        return { success: true }
    } catch (e) {
        console.error("unenrollStudent:", e)
        return { success: false, error: "탈반에 실패했습니다." }
    }
}
