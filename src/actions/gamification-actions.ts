"use server"

import { callProcedure } from "@/lib/db"
import type { ServerActionResult } from "@/types"
import type {
    PointBalance,
    PointHistory,
    Badge,
    GamiStudent,
} from "@/types/gamification"

export async function getGamiStudents(): Promise<ServerActionResult<GamiStudent[]>> {
    try {
        const rows = await callProcedure<any>("sp_gami_get_students")
        const data: GamiStudent[] = rows.map((r: any) => ({
            id: r.id ?? r.f0 ?? 0,
            mbId: r.mbId ?? r.mb_id ?? r.f1 ?? "",
            name: r.name ?? r.mb_name ?? r.f2 ?? "",
            totalPoint: r.totalPoint ?? r.total_point ?? r.f3 ?? 0,
            badgeCount: r.badgeCount ?? r.badge_count ?? r.f4 ?? 0,
        }))
        return { success: true, data }
    } catch (error) {
        console.error("getGamiStudents error:", error)
        return { success: false, error: "학생 목록을 불러올 수 없습니다." }
    }
}

export async function getPointBalance(studentId: number): Promise<ServerActionResult<PointBalance>> {
    try {
        const rows = await callProcedure<any>("sp_gami_get_balance", studentId)
        if (!rows.length) {
            return { success: true, data: { totalPoint: 0, usedPoint: 0, currentPoint: 0 } }
        }
        const r = rows[0]
        return {
            success: true,
            data: {
                totalPoint: r.totalPoint ?? r.total_point ?? r.f0 ?? 0,
                usedPoint: r.usedPoint ?? r.used_point ?? r.f1 ?? 0,
                currentPoint: r.currentPoint ?? r.current_point ?? r.f2 ?? 0,
            },
        }
    } catch (error) {
        console.error("getPointBalance error:", error)
        return { success: false, error: "포인트 조회에 실패했습니다." }
    }
}

export async function getPointHistory(studentId: number): Promise<ServerActionResult<PointHistory[]>> {
    try {
        const rows = await callProcedure<any>("sp_gami_get_history", studentId)
        const data: PointHistory[] = rows.map((r: any) => ({
            id: r.id ?? r.f0 ?? 0,
            pointAmount: r.pointAmount ?? r.point_amount ?? r.f1 ?? 0,
            reasonCode: r.reasonCode ?? r.reason_code ?? r.f2 ?? "",
            reasonText: r.reasonText ?? r.reason_text ?? r.f3 ?? "",
            createdAt: r.createdAt ?? r.created_at ?? r.f4 ?? "",
        }))
        return { success: true, data }
    } catch (error) {
        console.error("getPointHistory error:", error)
        return { success: false, error: "히스토리 조회에 실패했습니다." }
    }
}

export async function getStudentBadges(studentId: number): Promise<ServerActionResult<Badge[]>> {
    try {
        const rows = await callProcedure<any>("sp_gami_get_student_badges", studentId)
        const data: Badge[] = rows.map((r: any) => ({
            badgeId: r.badgeId ?? r.badge_id ?? r.f0 ?? 0,
            badgeCode: r.badgeCode ?? r.badge_code ?? r.f1 ?? "",
            badgeName: r.badgeName ?? r.badge_name ?? r.f2 ?? "",
            badgeDesc: r.badgeDesc ?? r.badge_desc ?? r.f3 ?? "",
            badgeIcon: r.badgeIcon ?? r.badge_icon ?? r.f4 ?? "Award",
            badgeColor: r.badgeColor ?? r.badge_color ?? r.f5 ?? "amber",
            earnedAt: r.earnedAt ?? r.earned_at ?? r.f6 ?? "",
        }))
        return { success: true, data }
    } catch (error) {
        console.error("getStudentBadges error:", error)
        return { success: false, error: "배지 조회에 실패했습니다." }
    }
}

export async function getAllBadges(): Promise<ServerActionResult<Badge[]>> {
    try {
        const rows = await callProcedure<any>("sp_gami_get_all_badges")
        const data: Badge[] = rows.map((r: any) => ({
            badgeId: r.badgeId ?? r.badge_id ?? r.f0 ?? 0,
            badgeCode: r.badgeCode ?? r.badge_code ?? r.f1 ?? "",
            badgeName: r.badgeName ?? r.badge_name ?? r.f2 ?? "",
            badgeDesc: r.badgeDesc ?? r.badge_desc ?? r.f3 ?? "",
            badgeIcon: r.badgeIcon ?? r.badge_icon ?? r.f4 ?? "Award",
            badgeColor: r.badgeColor ?? r.badge_color ?? r.f5 ?? "amber",
            reqPoint: r.reqPoint ?? r.req_point ?? r.f6 ?? null,
            sortOrder: r.sortOrder ?? r.sort_order ?? r.f7 ?? 0,
        }))
        return { success: true, data }
    } catch (error) {
        console.error("getAllBadges error:", error)
        return { success: false, error: "배지 목록 조회에 실패했습니다." }
    }
}

export async function triggerAttendancePoint(
    studentId: number,
): Promise<ServerActionResult<{ totalPoint: number; earned: number }>> {
    try {
        const rows = await callProcedure<any>("sp_gami_trigger_attendance", studentId)
        const r = rows[0] ?? {}
        return {
            success: true,
            data: {
                totalPoint: r.totalPoint ?? r.total_point ?? r.f0 ?? 0,
                earned: r.earned ?? r.f1 ?? 10,
            },
        }
    } catch (error) {
        console.error("triggerAttendancePoint error:", error)
        return { success: false, error: "출결 포인트 적립에 실패했습니다." }
    }
}

export async function triggerAssignmentAPoint(
    studentId: number,
): Promise<ServerActionResult<{ totalPoint: number; earned: number }>> {
    try {
        const rows = await callProcedure<any>("sp_gami_trigger_assignment_a", studentId)
        const r = rows[0] ?? {}
        return {
            success: true,
            data: {
                totalPoint: r.totalPoint ?? r.total_point ?? r.f0 ?? 0,
                earned: r.earned ?? r.f1 ?? 50,
            },
        }
    } catch (error) {
        console.error("triggerAssignmentAPoint error:", error)
        return { success: false, error: "과제 포인트 적립에 실패했습니다." }
    }
}

export async function grantManualPoint(
    studentId: number,
    amount: number,
    reason: string,
): Promise<ServerActionResult<{ totalPoint: number }>> {
    try {
        const rows = await callProcedure<any>("sp_gami_manual_point", studentId, amount, reason)
        const r = rows[0] ?? {}
        return {
            success: true,
            data: { totalPoint: r.totalPoint ?? r.total_point ?? r.f0 ?? 0 },
        }
    } catch (error) {
        console.error("grantManualPoint error:", error)
        return { success: false, error: "포인트 지급에 실패했습니다." }
    }
}
