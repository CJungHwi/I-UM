export type EnrollmentStatus = "ACTIVE" | "DROPPED"

export interface ClassRow {
    id: number
    academyId: number
    academyName: string | null
    name: string
    subject: string
    level: string | null
    teacherUserId: number | null
    teacherName: string | null
    capacity: number
    scheduleNote: string | null
    isActive: string // 'Y' | 'N'
    enrolledCount: number
    createdAt: string
    updatedAt: string
}

export interface ClassMatchRow {
    id: number
    name: string
    subject: string
    level: string | null
    capacity: number
    enrolledCount: number
    teacherName: string | null
    scheduleNote: string | null
    matchScore: number
}

export interface EnrollmentRow {
    id: number
    classId: number
    studentId: number
    studentName: string
    grade: string | null
    school: string | null
    status: EnrollmentStatus
    enrolledAt: string
    leftAt: string | null
}

export interface StudentEnrollment {
    id: number
    classId: number
    className: string
    subject: string
    level: string | null
    teacherName: string | null
    status: EnrollmentStatus
    enrolledAt: string
    leftAt: string | null
}

export interface ClassUpsertInput {
    id: number
    academyId: number
    name: string
    subject: string
    level: string | null
    teacherUserId: number | null
    capacity: number
    scheduleNote: string | null
    isActive: "Y" | "N"
}
