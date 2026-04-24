"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade } from "@/types/ium-user"
import type {
    ConsultCreateInput,
    ConsultDetail,
    ConsultLog,
    ConsultRow,
    ConsultSource,
    ConsultStats,
    ConsultStatus,
    ConsultUpdateInput,
} from "@/types/consultation"

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

function isValidDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function toMySQLDateTime(v: unknown): string | null {
    if (v == null || v === "") return null
    const s = String(v)
    // datetime-local 은 "YYYY-MM-DDTHH:mm" — 공백 치환
    if (s.includes("T")) return s.replace("T", " ").slice(0, 19)
    return s.slice(0, 19)
}

function mapRow(r: Record<string, unknown>): ConsultRow {
    return {
        id: toInt(r.id),
        academyId: toInt(r.academyId ?? r.academy_id),
        academyName: toStrOrNull(r.academyName ?? r.academy_name),
        source: (String(r.source ?? "PHONE") as ConsultSource),
        contactName: String(r.contactName ?? r.contact_name ?? ""),
        contactPhone: toStrOrNull(r.contactPhone ?? r.contact_phone),
        studentName: String(r.studentName ?? r.student_name ?? ""),
        grade: toStrOrNull(r.grade),
        subject: toStrOrNull(r.subject),
        preferSchedule: toStrOrNull(r.preferSchedule ?? r.prefer_schedule),
        status: (String(r.status ?? "NEW") as ConsultStatus),
        counselorUserId: toIntOrNull(r.counselorUserId ?? r.counselor_user_id),
        counselorName: toStrOrNull(r.counselorName ?? r.counselor_name),
        convertedStudentId: toIntOrNull(r.convertedStudentId ?? r.converted_student_id),
        requestedAt: String(r.requestedAt ?? r.requested_at ?? ""),
        resolvedAt: toStrOrNull(r.resolvedAt ?? r.resolved_at),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

function mapDetail(r: Record<string, unknown>): ConsultDetail {
    return {
        ...mapRow(r),
        memo: toStrOrNull(r.memo),
    }
}

function mapLog(r: Record<string, unknown>): ConsultLog {
    return {
        id: toInt(r.id),
        consultationId: toInt(r.consultationId ?? r.consultation_id),
        oldStatus: (toStrOrNull(r.oldStatus ?? r.old_status) as ConsultStatus | null) ?? null,
        newStatus: (String(r.newStatus ?? r.new_status ?? "NEW") as ConsultStatus),
        note: toStrOrNull(r.note),
        userId: toIntOrNull(r.userId ?? r.user_id),
        userName: toStrOrNull(r.userName ?? r.user_name),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
    }
}

function mapStats(r: Record<string, unknown> | undefined): ConsultStats {
    if (!r) {
        return {
            newCount: 0,
            inProgress: 0,
            waiting: 0,
            converted: 0,
            lost: 0,
            total: 0,
            conversionRate: null,
        }
    }
    const rate = r.conversionRate ?? r.conversion_rate
    return {
        newCount: toInt(r.newCount ?? r.new_count ?? r.f0),
        inProgress: toInt(r.inProgress ?? r.in_progress),
        waiting: toInt(r.waiting),
        converted: toInt(r.converted),
        lost: toInt(r.lost),
        total: toInt(r.total),
        conversionRate: rate == null ? null : Number(rate),
    }
}

// -------------------------------------------------------------------
// 목록 — RBAC 분기
// -------------------------------------------------------------------
export async function listConsultations(
    status?: ConsultStatus | null,
    keyword?: string | null,
): Promise<ServerActionResult<ConsultRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s

    try {
        const kw = (keyword ?? "").trim() || null
        const st = status ?? null
        let rows: Record<string, unknown>[]
        if (isSystemAdmin(s.userGrade, s.userAcademyId)) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_consult_list",
                st,
                kw,
            )
        } else if (
            isAcademyAdmin(s.userGrade, s.userAcademyId) ||
            (s.userGrade === "USER" && s.userAcademyId != null)
        ) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_consult_list_for_academy",
                s.userAcademyId,
                st,
                kw,
            )
        } else {
            return { success: false, error: "소속 학원이 없어 상담 목록을 불러올 수 없습니다." }
        }
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listConsultations:", e)
        return { success: false, error: "상담 목록을 불러올 수 없습니다." }
    }
}

export async function getConsultationDetail(
    id: number,
): Promise<ServerActionResult<ConsultDetail>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_get",
            id,
        )
        if (!rows.length) {
            return { success: false, error: "상담을 찾을 수 없습니다." }
        }
        const d = mapDetail(rows[0])
        if (
            !isSystemAdmin(s.userGrade, s.userAcademyId) &&
            s.userAcademyId != null &&
            d.academyId !== s.userAcademyId
        ) {
            return { success: false, error: "열람 권한이 없습니다." }
        }
        return { success: true, data: d }
    } catch (e) {
        console.error("getConsultationDetail:", e)
        return { success: false, error: "상담 정보를 불러올 수 없습니다." }
    }
}

export async function getConsultationStats(): Promise<ServerActionResult<ConsultStats>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const academyId = isSystemAdmin(s.userGrade, s.userAcademyId)
            ? null
            : s.userAcademyId
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_stats",
            academyId,
        )
        return { success: true, data: mapStats(rows[0]) }
    } catch (e) {
        console.error("getConsultationStats:", e)
        return { success: false, error: "상담 통계를 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 생성 / 수정 / 상태 전이 / 코멘트 / 삭제
// -------------------------------------------------------------------
export async function createConsultation(
    input: ConsultCreateInput,
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
        return { success: false, error: "자신의 학원에만 상담을 접수할 수 있습니다." }
    }

    const studentName = (input.studentName ?? "").trim()
    const contactName = (input.contactName ?? "").trim()
    if (!studentName) return { success: false, error: "학생 이름을 입력하세요." }
    if (!contactName) return { success: false, error: "신청자 이름을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_create",
            academyId,
            input.source || "PHONE",
            contactName,
            toStrOrNull(input.contactPhone),
            studentName,
            toStrOrNull(input.grade),
            toStrOrNull(input.subject),
            toStrOrNull(input.preferSchedule),
            toStrOrNull(input.memo),
            input.counselorUserId ?? 0,
            toMySQLDateTime(input.requestedAt),
            gate.userId,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        if (!id) return { success: false, error: "등록에 실패했습니다." }
        return { success: true, data: { id } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("STUDENT_NAME_REQUIRED")) return { success: false, error: "학생 이름을 입력하세요." }
        if (msg.includes("CONTACT_NAME_REQUIRED")) return { success: false, error: "신청자 이름을 입력하세요." }
        if (msg.includes("ACADEMY_REQUIRED")) return { success: false, error: "소속 학원을 선택하세요." }
        if (msg.includes("INVALID_ACADEMY")) return { success: false, error: "유효한 학원을 선택하세요." }
        console.error("createConsultation:", e)
        return { success: false, error: "상담 접수 중 오류가 발생했습니다." }
    }
}

async function ensureCanMutate(
    id: number,
    gate: { userGrade: IumUserGrade; userAcademyId: number | null },
): Promise<ServerActionResult<ConsultDetail>> {
    const cur = await getConsultationDetail(id)
    if (!cur.success) return cur
    if (
        !isSystemAdmin(gate.userGrade, gate.userAcademyId) &&
        gate.userAcademyId != null &&
        cur.data!.academyId !== gate.userAcademyId
    ) {
        return { success: false, error: "수정 권한이 없습니다." }
    }
    return cur
}

export async function updateConsultation(
    id: number,
    input: ConsultUpdateInput,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const guard = await ensureCanMutate(id, gate)
    if (!guard.success) return guard

    const studentName = (input.studentName ?? "").trim()
    if (!studentName) return { success: false, error: "학생 이름을 입력하세요." }

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_update",
            id,
            input.source || "PHONE",
            (input.contactName ?? "").trim(),
            toStrOrNull(input.contactPhone),
            studentName,
            toStrOrNull(input.grade),
            toStrOrNull(input.subject),
            toStrOrNull(input.preferSchedule),
            toStrOrNull(input.memo),
            input.counselorUserId ?? 0,
            toMySQLDateTime(input.requestedAt),
        )
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("STUDENT_NAME_REQUIRED")) return { success: false, error: "학생 이름을 입력하세요." }
        console.error("updateConsultation:", e)
        return { success: false, error: "상담 수정에 실패했습니다." }
    }
}

export async function setConsultationStatus(
    id: number,
    status: ConsultStatus,
    note?: string | null,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const guard = await ensureCanMutate(id, gate)
    if (!guard.success) return guard

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_set_status",
            id,
            status,
            toStrOrNull(note),
            gate.userId,
        )
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("INVALID_STATUS")) return { success: false, error: "유효하지 않은 상태입니다." }
        if (msg.includes("CONSULT_NOT_FOUND")) return { success: false, error: "상담을 찾을 수 없습니다." }
        console.error("setConsultationStatus:", e)
        return { success: false, error: "상태 변경에 실패했습니다." }
    }
}

export async function addConsultationLog(
    id: number,
    note: string,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const guard = await ensureCanMutate(id, gate)
    if (!guard.success) return guard

    if (!note?.trim()) return { success: false, error: "내용을 입력하세요." }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_add_log",
            id,
            note.trim(),
            gate.userId,
        )
        const newId = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        return { success: true, data: { id: newId } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("NOTE_REQUIRED")) return { success: false, error: "내용을 입력하세요." }
        if (msg.includes("CONSULT_NOT_FOUND")) return { success: false, error: "상담을 찾을 수 없습니다." }
        console.error("addConsultationLog:", e)
        return { success: false, error: "코멘트 저장에 실패했습니다." }
    }
}

export async function listConsultationLogs(
    id: number,
): Promise<ServerActionResult<ConsultLog[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_list_logs",
            id,
        )
        return { success: true, data: rows.map(mapLog) }
    } catch (e) {
        console.error("listConsultationLogs:", e)
        return { success: false, error: "상담 이력을 불러올 수 없습니다." }
    }
}

export async function convertConsultationToStudent(
    id: number,
    enrolledAt: string | null,
): Promise<ServerActionResult<{ studentId: number; created: boolean }>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const guard = await ensureCanMutate(id, gate)
    if (!guard.success) return guard

    const enrolledDate = enrolledAt && isValidDate(enrolledAt) ? enrolledAt : null

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_consult_convert_to_student",
            id,
            enrolledDate,
            gate.userId,
        )
        const studentId = toInt(rows?.[0]?.studentId ?? rows?.[0]?.student_id ?? rows?.[0]?.f0)
        const created = Boolean(toInt(rows?.[0]?.created ?? rows?.[0]?.f1))
        return { success: true, data: { studentId, created } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("CONSULT_NOT_FOUND")) return { success: false, error: "상담을 찾을 수 없습니다." }
        console.error("convertConsultationToStudent:", e)
        return { success: false, error: "학생 등록 전환에 실패했습니다." }
    }
}

export async function deleteConsultation(id: number): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate

    const guard = await ensureCanMutate(id, gate)
    if (!guard.success) return guard

    try {
        await callProcedure<Record<string, unknown>>("sp_ium_consult_delete", id)
        return { success: true }
    } catch (e) {
        console.error("deleteConsultation:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}
