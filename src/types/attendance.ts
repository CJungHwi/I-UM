export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "EARLY_LEAVE"
    | "ABSENT"
    | "EXCUSED"

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = [
    "PRESENT",
    "LATE",
    "EARLY_LEAVE",
    "ABSENT",
    "EXCUSED",
]

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
    PRESENT: "출석",
    LATE: "지각",
    EARLY_LEAVE: "조퇴",
    ABSENT: "결석",
    EXCUSED: "사유결석",
}

/** 목록 행: 학생 마스터 + 당일 출결 기록을 조인한 결과 */
export interface AttendanceRow {
    studentId: number
    academyId: number
    academyName: string | null
    name: string
    grade: string | null
    school: string | null
    attendanceId: number | null
    status: AttendanceStatus | null
    checkInAt: string | null
    checkOutAt: string | null
    memo: string | null
    updatedAt: string | null
}

export interface AttendanceDailyStats {
    activeStudents: number
    present: number
    late: number
    earlyLeave: number
    absent: number
    excused: number
    recorded: number
    attendanceRate: number | null
}

export interface AttendanceSummary {
    present: number
    late: number
    earlyLeave: number
    absent: number
    excused: number
    total: number
    attendanceRate: number | null
}

export interface AttendanceUpsertResult {
    id: number
    earned: boolean
}
