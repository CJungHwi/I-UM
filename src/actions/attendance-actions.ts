"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade } from "@/types/ium-user"
import type {
    AttendanceDailyStats,
    AttendanceRow,
    AttendanceStatus,
    AttendanceSummary,
    AttendanceUpsertResult,
} from "@/types/attendance"

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
    return Number.isFinite(n) ? n : null
}

function toStrOrNull(v: unknown): string | null {
    if (v == null) return null
    const s = String(v)
    return s === "" ? null : s
}

function isValidDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function mapRow(r: Record<string, unknown>): AttendanceRow {
    const rawStatus = toStrOrNull(r.status)
    return {
        studentId: toInt(r.studentId ?? r.student_id),
        academyId: toInt(r.academyId ?? r.academy_id),
        academyName: toStrOrNull(r.academyName ?? r.academy_name),
        name: String(r.name ?? ""),
        grade: toStrOrNull(r.grade),
        school: toStrOrNull(r.school),
        attendanceId: toIntOrNull(r.attendanceId ?? r.attendance_id),
        status: (rawStatus as AttendanceStatus | null) ?? null,
        checkInAt: toStrOrNull(r.checkInAt ?? r.check_in_at),
        checkOutAt: toStrOrNull(r.checkOutAt ?? r.check_out_at),
        memo: toStrOrNull(r.memo),
        updatedAt: toStrOrNull(r.updatedAt ?? r.updated_at),
    }
}

function mapStats(r: Record<string, unknown> | undefined): AttendanceDailyStats {
    if (!r) {
        return {
            activeStudents: 0,
            present: 0,
            late: 0,
            earlyLeave: 0,
            absent: 0,
            excused: 0,
            recorded: 0,
            attendanceRate: null,
        }
    }
    const rate = r.attendanceRate ?? r.attendance_rate
    return {
        activeStudents: toInt(r.activeStudents ?? r.active_students),
        present: toInt(r.present),
        late: toInt(r.late),
        earlyLeave: toInt(r.earlyLeave ?? r.early_leave),
        absent: toInt(r.absent),
        excused: toInt(r.excused),
        recorded: toInt(r.recorded),
        attendanceRate: rate == null ? null : Number(rate),
    }
}

function mapSummary(r: Record<string, unknown> | undefined): AttendanceSummary {
    if (!r) {
        return {
            present: 0,
            late: 0,
            earlyLeave: 0,
            absent: 0,
            excused: 0,
            total: 0,
            attendanceRate: null,
        }
    }
    const rate = r.attendanceRate ?? r.attendance_rate
    return {
        present: toInt(r.present),
        late: toInt(r.late),
        earlyLeave: toInt(r.earlyLeave ?? r.early_leave),
        absent: toInt(r.absent),
        excused: toInt(r.excused),
        total: toInt(r.total),
        attendanceRate: rate == null ? null : Number(rate),
    }
}

// -------------------------------------------------------------------
// 일자별 학생 명단 + 출결 상태
// -------------------------------------------------------------------
export async function listAttendanceByDate(
    date: string,
): Promise<ServerActionResult<AttendanceRow[]>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        let rows: Record<string, unknown>[]
        if (isSystemAdmin(s.userGrade, s.userAcademyId)) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_attendance_list_by_date",
                date,
            )
        } else if (
            isAcademyAdmin(s.userGrade, s.userAcademyId) ||
            (s.userGrade === "USER" && s.userAcademyId != null)
        ) {
            rows = await callProcedure<Record<string, unknown>>(
                "sp_ium_attendance_list_by_date_for_academy",
                s.userAcademyId,
                date,
            )
        } else {
            return { success: false, error: "소속 학원이 없어 출결을 불러올 수 없습니다." }
        }
        return { success: true, data: rows.map(mapRow) }
    } catch (e) {
        console.error("listAttendanceByDate:", e)
        return { success: false, error: "출결 목록을 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 일자 요약 통계
// -------------------------------------------------------------------
export async function getAttendanceDailyStats(
    date: string,
): Promise<ServerActionResult<AttendanceDailyStats>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        const academyId = isSystemAdmin(s.userGrade, s.userAcademyId)
            ? null
            : s.userAcademyId

        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_daily_stats",
            academyId,
            date,
        )
        return { success: true, data: mapStats(rows[0]) }
    } catch (e) {
        console.error("getAttendanceDailyStats:", e)
        return { success: false, error: "출결 통계를 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 학생별 기간 요약
// -------------------------------------------------------------------
export async function getAttendanceSummary(
    studentId: number,
    from: string,
    to: string,
): Promise<ServerActionResult<AttendanceSummary>> {
    const s = await requireSession()
    if (!("userId" in s)) return s
    if (!isValidDate(from) || !isValidDate(to)) {
        return { success: false, error: "기간이 올바르지 않습니다." }
    }
    if (from > to) {
        return { success: false, error: "시작일이 종료일보다 클 수 없습니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_summary_by_student",
            studentId,
            from,
            to,
        )
        return { success: true, data: mapSummary(rows[0]) }
    } catch (e) {
        console.error("getAttendanceSummary:", e)
        return { success: false, error: "출석 요약을 불러올 수 없습니다." }
    }
}

// -------------------------------------------------------------------
// 출결 상태 저장 (드롭다운 변경 / 일괄 상태 변경)
// -------------------------------------------------------------------
export async function upsertAttendance(
    studentId: number,
    date: string,
    status: AttendanceStatus,
    memo?: string | null,
): Promise<ServerActionResult<AttendanceUpsertResult>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_upsert",
            studentId,
            date,
            status,
            toStrOrNull(memo),
            gate.userId,
        )
        const id = toInt(rows?.[0]?.id ?? rows?.[0]?.f0)
        const earned = Boolean(toInt(rows?.[0]?.earned ?? rows?.[0]?.f1))
        return { success: true, data: { id, earned } }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("INVALID_STATUS")) {
            return { success: false, error: "유효하지 않은 출결 상태입니다." }
        }
        if (msg.includes("STUDENT_NOT_FOUND")) {
            return { success: false, error: "학생 정보를 찾을 수 없습니다." }
        }
        console.error("upsertAttendance:", e)
        return { success: false, error: "출결 저장에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 등원 체크 — 원클릭 출석(PRESENT)
// -------------------------------------------------------------------
export async function checkInAttendance(
    studentId: number,
    date: string,
): Promise<ServerActionResult<AttendanceRow>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_check_in",
            studentId,
            date,
            gate.userId,
        )
        if (!rows.length) {
            return { success: false, error: "등원 처리에 실패했습니다." }
        }
        return { success: true, data: mapRow(rows[0]) }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("STUDENT_NOT_FOUND")) {
            return { success: false, error: "학생 정보를 찾을 수 없습니다." }
        }
        console.error("checkInAttendance:", e)
        return { success: false, error: "등원 처리에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 하원 체크 — check_out_at 기록
// -------------------------------------------------------------------
export async function checkOutAttendance(
    studentId: number,
    date: string,
): Promise<ServerActionResult<AttendanceRow>> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_check_out",
            studentId,
            date,
        )
        if (!rows.length) {
            return { success: false, error: "등원 기록이 없어 하원 처리할 수 없습니다." }
        }
        return { success: true, data: mapRow(rows[0]) }
    } catch (e) {
        console.error("checkOutAttendance:", e)
        return { success: false, error: "하원 처리에 실패했습니다." }
    }
}

// -------------------------------------------------------------------
// 출결 기록 삭제 — 오기록 복구
// -------------------------------------------------------------------
export async function deleteAttendance(
    studentId: number,
    date: string,
): Promise<ServerActionResult> {
    const gate = await requireAdmin()
    if (!("userId" in gate)) return gate
    if (!isValidDate(date)) {
        return { success: false, error: "올바른 날짜 형식이 아닙니다." }
    }

    try {
        await callProcedure<Record<string, unknown>>(
            "sp_ium_attendance_delete",
            studentId,
            date,
        )
        return { success: true }
    } catch (e) {
        console.error("deleteAttendance:", e)
        return { success: false, error: "삭제에 실패했습니다." }
    }
}
