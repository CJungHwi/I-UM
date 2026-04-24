export type StudentStatus = "ACTIVE" | "WITHDRAWN"
export type StudentGender = "M" | "F"

export interface StudentRow {
    id: number
    academyId: number
    academyName: string | null
    name: string
    birthdate: string | null
    gender: StudentGender | null
    school: string | null
    grade: string | null
    phone: string | null
    parentPhone: string | null
    familyGroup: number | null
    status: StudentStatus
    enrolledAt: string | null
    withdrawnAt: string | null
    createdAt: string
    updatedAt: string
    siblingCount: number
}

export interface StudentDetail extends Omit<StudentRow, "siblingCount"> {
    allergy: string | null
    personality: string | null
    memo: string | null
}

export interface StudentGuardian {
    id: number
    studentId: number
    name: string
    relation: string
    phone: string | null
    email: string | null
    isPrimary: boolean
    userId: number | null
    createdAt: string
}

export interface StudentSibling {
    id: number
    name: string
    grade: string | null
    school: string | null
    status: StudentStatus
}

export interface StudentUpsertInput {
    name: string
    birthdate: string | null
    gender: StudentGender | null
    school: string | null
    grade: string | null
    phone: string | null
    parentPhone: string | null
    allergy: string | null
    personality: string | null
    memo: string | null
    enrolledAt: string | null
}

export interface StudentCreateInput extends StudentUpsertInput {
    academyId: number
}

export interface GuardianUpsertInput {
    id: number
    studentId: number
    name: string
    relation: string
    phone: string | null
    email: string | null
    isPrimary: boolean
}
