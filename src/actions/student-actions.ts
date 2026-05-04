"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserRole } from "@/types/ium-user"
import type {
    GuardianUpsertInput,
    StudentCreateInput,
    StudentDetail,
    StudentGender,
    StudentGuardian,
    StudentRow,
    StudentSibling,
    StudentStatus,
    StudentUpsertInput,
} from "@/types/student"
import type { StudentTimelineEvent, StudentTimelineKind } from "@/types/student-timeline"

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

function toDateStrOrNull(v: unknown): string | null {
    if (v == null) return null
    if (v instanceof Date) {
        if (isNaN(v.getTime())) return null
        const y = v.getFullYear()
        const m = String(v.getMonth() + 1).padStart(2, "0")
        const d = String(v.getDate()).padStart(2, "0")
        return `${y}-${m}-${d}`
    }
    const s = String(v)
    if (!s) return null
    return s.slice(0, 10)
}

function mapRow(r: Record<string, unknown>): StudentRow {
    return {
        id: toInt(r.id),
        academyId: toInt(r.academyId ?? r.academy_id),
        academyName: toStrOrNull(r.academyName ?? r.academy_name),
        name: String(r.name ?? ""),
        birthdate: toDateStrOrNull(r.birthdate),
        gender: (toStrOrNull(r.gender) as StudentGender | null) ?? null,
        school: toStrOrNull(r.school),
        grade: toStrOrNull(r.grade),
        admissionRouteCode: toStrOrNull(r.admissionRouteCode ?? r.admission_route_code),
        phone: toStrOrNull(r.phone),
        parentPhone: toStrOrNull(r.parentPhone ?? r.parent_phone),
        photoUrl: toStrOrNull(r.photoUrl ?? r.photo_url),
        interestTags: toStrOrNull(r.interestTags ?? r.interest_tags),
        currentClassNames: toStrOrNull(r.currentClassNames ?? r.current_class_names),
        familyGroup: toIntOrNull(r.familyGroup ?? r.family_group),
        status: String(r.status ?? "ACTIVE") as StudentStatus,
        enrolledAt: toDateStrOrNull(r.enrolledAt ?? r.enrolled_at),
        withdrawnAt: toDateStrOrNull(r.withdrawnAt ?? r.withdrawn_at),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
        siblingCount: toInt(r.siblingCount ?? r.sibling_count),
    }
}

function mapDetail(r: Record<string, unknown>): StudentDetail {
    const base = mapRow({ ...r, siblingCount: 0 })
    return {
        ...base,
        allergy: toStrOrNull(r.allergy),
        personality: toStrOrNull(r.personality),
        memo: toStrOrNull(r.memo),
    }
}

function mapGuardian(r: Record<string, unknown>): StudentGuardian {
    return {
        id: toInt(r.id),
        studentId: toInt(r.studentId ?? r.student_id),
        name: String(r.name ?? ""),
        relation: String(r.relation ?? "부모"),
        phone: toStrOrNull(r.phone),
        email: toStrOrNull(r.email),
        isPrimary: Boolean(toInt(r.isPrimary ?? r.is_primary)),
        userId: toIntOrNull(r.userId ?? r.user_id),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
    }
}

function mapSibling(r: Record<string, unknown>): StudentSibling {
    return {
        id: toInt(r.id),
        name: String(r.name ?? ""),
        grade: toStrOrNull(r.grade),
        school: toStrOrNull(r.school),
        status: String(r.status ?? "ACTIVE") as StudentStatus,
    }
}

// -------------------------------------------------------------------
// 목록 조회 — 관리자(ADMIN): 자기 학원만. 전역 관리자(academyId 없음): 전체.
// -------------------------------------------------------------------
export async function listStudents(
    status?: StudentStatus | null,
    keyword?: string | null,
): Promise<ServerActionResult<StudentRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s

    try {
        const kw = (keyword ?? "").trim() || null
        const st = status ?? null
        let rows: Record<string, unknown>[]
        if (isSystemAdmin(s.role)) {
            rows = await callProcedure<Record<string, unknown>>("sp_ium_student_list", st, kw)
        } else if (
            isAcademyAdmin(s.role) ||
            (s.role === "ACADEMY_MEMBER" && s.userAcademyId != null)
        ) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_student_list_for_academy",
                s.userAcademyId,
                st,
                kw,
            )
        } else {
            return { success: false, error: "소속 학원이 없어 학생 목록을 불러올 수 없습니다." }
        }
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listStudents:", e)
        return { success: false, error: "학생 목록을 불러올 수 없습니다." }
    }
}

export async function getStudentDetail(
    studentId: number,
): Promise<ServerActionResult<StudentDetail>> {
    const s = await requireSession()
    if (!("userId" in s)) return s

    try {
        const rows = await callProcedure<Record<string, unknown>>("sp_ium_student_get", studentId)
        if (!rows.length) {
            return { success: false, error: "학생을 찾을 수 없습니다." }
        }
        const d = mapDetail(rows[0])
        // 학원 관리자는 자기 학원 학생만 열람
        if (
            !isSystemAdmin(s.role) &&
            s.userAcademyId != null &&
            d.academyId !== s.userAcademyId
        ) {
            return { success: false, error: "열람 권한이 없습니다." }
        }
        return { success: true, data: d }
    } catch (e) {
        console.error("getStudentDetail:", e)
        return { success: false, error: "학생 정보를 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 생성/수정/상태 변경 — 관리자(ADMIN)만
// -------------------------------------------------------------------
export async function createStudent(
    input: StudentCreateInput,
): Promise<ServerActionResult<{ id: number }>> {
    const s = await requireAdmin()
    if (!("userId" in s)) return s

    const academyId = toIntOrNull(input.academyId)
    if (!academyId) return { success: false, error: "소속 학원을 선택하세요." }

    // 학원 관리자는 자기 학원에만 등록 가능
    if (
        !isSystemAdmin(s.role) &&
        s.userAcademyId != null &&
        academyId !== s.userAcademyId
    ) {
        return { success: false, error: "자신의 학원에만 학생을 등록할 수 있습니다." }
    }

    const name = (input.name ?? "").trim()
    if (!name) return { success: false, error: "학생 이름을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_student_create",
            academyId,
            name,
            toDateStrOrNull(input.birthdate),
            input.gender ?? null,
            toStrOrNull(input.school),
            toStrOrNull(input.grade),
            toStrOrNull(input.admissionRouteCode),
            toStrOrNull(input.phone),
            toStrOrNull(input.parentPhone),
            toStrOrNull(input.allergy),
            toStrOrNull(input.personality),
            toStrOrNull(input.memo),
            toStrOrNull(input.photoUrl),
            toStrOrNull(input.interestTags),
            toDateStrOrNull(input.enrolledAt),
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        if (!id) return { success: false, error: "등록에 실패했습니다." }
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("NAME_REQUIRED")) return { success: false, error: "이름을 입력하세요." }
        if (msg.includes("ACADEMY_REQUIRED")) return { success: false, error: "소속 학원을 선택하세요." }
        if (msg.includes("INVALID_ACADEMY")) return { success: false, error: "유효한 학원을 선택하세요." }
        console.error("createStudent:", e)
        return { success: false, error: "학생 등록 중 오류가 발생했습니다." }
    }
}

export async function updateStudent(
    studentId: number,
    input: StudentUpsertInput,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    // 권한: 자기 학원 학생인지 확인
    const cur = await getStudentDetail(studentId)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(gate.role) &&
        gate.userAcademyId != null &&
        cur.data!.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "수정 권한이 없습니다." }
    }

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_student_update",
            studentId,
            (input.name ?? "").trim(),
            toDateStrOrNull(input.birthdate),
            input.gender ?? null,
            toStrOrNull(input.school),
            toStrOrNull(input.grade),
            toStrOrNull(input.admissionRouteCode),
            toStrOrNull(input.phone),
            toStrOrNull(input.parentPhone),
            toStrOrNull(input.allergy),
            toStrOrNull(input.personality),
            toStrOrNull(input.memo),
            toStrOrNull(input.photoUrl),
            toStrOrNull(input.interestTags),
            toDateStrOrNull(input.enrolledAt),
        )
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("NAME_REQUIRED")) return { success: false, error: "이름을 입력하세요." }
        console.error("updateStudent:", e)
        return { success: false, error: "학생 정보를 수정하지 못했습니다." }
    }
}

export async function setStudentStatus(
    studentId: number,
    status: StudentStatus,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const cur = await getStudentDetail(studentId)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(gate.role) &&
        gate.userAcademyId != null &&
        cur.data!.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "수정 권한이 없습니다." }
    }

    try {
        await callProcedure<Record<string, unknown>>("sp_ium_student_set_status", studentId, status)
        return { success: true }
    } catch (e) {
        console.error("setStudentStatus:", e)
        return { success: false, error: "상태 변경에 실패했습니다." }
    }
}

export async function deleteStudent(studentId: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const cur = await getStudentDetail(studentId)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(gate.role) &&
        gate.userAcademyId != null &&
        cur.data!.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "삭제 권한이 없습니다." }
    }

    try {
        await callProcedure<Record<string, unknown>>("sp_ium_student_delete", studentId)
        return { success: true }
    } catch (e) {
        console.error("deleteStudent:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 보호자
// -------------------------------------------------------------------
export async function listGuardians(
    studentId: number,
): Promise<ServerActionResult<StudentGuardian[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>("sp_ium_student_guardian_list", studentId)
        return { success: true, data: rows.map(mapGuardian) }
    } catch (e) {
        console.error("listGuardians:", e)
        return { success: false, error: "보호자 정보를 불러올 수 없습니다." }
    }
}

export async function upsertGuardian(
    input: GuardianUpsertInput,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    if (!input.studentId) return { success: false, error: "학생 정보가 없습니다." }
    if (!input.name?.trim()) return { success: false, error: "보호자 이름을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_student_guardian_upsert",
            input.id || 0,
            input.studentId,
            input.name.trim(),
            input.relation || "부모",
            toStrOrNull(input.phone),
            toStrOrNull(input.email),
            input.isPrimary ? 1 : 0,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("GUARDIAN_NAME_REQUIRED")) {
            return { success: false, error: "보호자 이름을 입력하세요." }
        }
        console.error("upsertGuardian:", e)
        return { success: false, error: "보호자 저장에 실패했습니다." }
    }
}

export async function deleteGuardian(id: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>("sp_ium_student_guardian_delete", id)
        return { success: true }
    } catch (e) {
        console.error("deleteGuardian:", e)
        return { success: false, error: "보호자 삭제에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 형제 관계
// -------------------------------------------------------------------
export async function listSiblings(
    studentId: number,
): Promise<ServerActionResult<StudentSibling[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>("sp_ium_student_sibling_list", studentId)
        return { success: true, data: rows.map(mapSibling) }
    } catch (e) {
        console.error("listSiblings:", e)
        return { success: false, error: "형제 정보를 불러올 수 없습니다." }
    }
}

export async function linkSibling(
    studentId: number,
    otherId: number,
): Promise<ServerActionResult<{ familyGroup: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    if (!studentId || !otherId || studentId === otherId) {
        return { success: false, error: "서로 다른 학생을 선택하세요." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>("sp_ium_student_sibling_link", studentId, otherId)
        const fg = toInt(rows?.[0]?.familyGroup ?? rows?.[0]?.family_group ?? rows?.[0]?.f0)
        return { success: true, data: { familyGroup: fg } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("SAME_STUDENT")) {
            return { success: false, error: "같은 학생끼리는 형제로 묶을 수 없습니다." }
        }
        console.error("linkSibling:", e)
        return { success: false, error: "형제 연결에 실패했습니다." }
    }
}

export async function unlinkSibling(studentId: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    try {
        await callProcedure<Record<string, unknown>>("sp_ium_student_sibling_unlink", studentId)
        return { success: true }
    } catch (e) {
        console.error("unlinkSibling:", e)
        return { success: false, error: "형제 관계 해제에 실패했습니다." }
    }
}

export async function patchStudentMeta(
    studentId: number,
    input: { photoUrl: string | null; interestTags: string | null },
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const cur = await getStudentDetail(studentId)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(gate.role) &&
        gate.userAcademyId != null &&
        cur.data!.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "수정 권한이 없습니다." }
    }

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_student_patch_meta",
            studentId,
            input.photoUrl ?? "",
            input.interestTags ?? "",
        )
        return { success: true }
    } catch (e) {
        console.error("patchStudentMeta:", e)
        return { success: false, error: "프로필 요약 정보를 저장하지 못했습니다." }
    }
}

function mapTimelineRow(r: Record<string, unknown>): StudentTimelineEvent {
    return {
        kind: String(r.kind ?? "CONSULT") as StudentTimelineKind,
        evtAt: String(r.evtAt ?? r.evt_at ?? ""),
        title: String(r.title ?? ""),
        subtitle: toStrOrNull(r.subtitle),
        bodyText: toStrOrNull(r.bodyText ?? r.body_text),
        refId: toInt(r.refId ?? r.ref_id),
    }
}

export async function listStudentTimeline(
    studentId: number,
): Promise<ServerActionResult<StudentTimelineEvent[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s

    const cur = await getStudentDetail(studentId)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(s.role) &&
        s.userAcademyId != null &&
        cur.data!.academyId !== s.userAcademyId
    ) {
        return { success: false, error: "열람 권한이 없습니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_student_timeline",
            studentId,
        )
        return { success: true, data: rows.map(mapTimelineRow) }
    } catch (e) {
        console.error("listStudentTimeline:", e)
        return { success: false, error: "타임라인을 불러올 수 없습니다." }
    }
}
