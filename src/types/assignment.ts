export type AssignmentSubmissionStatus =
    | "PENDING"
    | "DONE"
    | "LATE"
    | "MISSING"

export const ASSIGNMENT_SUBMISSION_STATUS_LABEL: Record<
    AssignmentSubmissionStatus,
    string
> = {
    PENDING: "미제출",
    DONE: "완료",
    LATE: "지연",
    MISSING: "미완",
}

export interface AssignmentRow {
    id: number
    classId: number
    curriculumId: number | null
    unitTitle: string | null
    title: string
    body: string | null
    dueAt: string | null
    createdByUserId: number | null
    createdByName: string | null
    createdAt: string
    updatedAt: string
    doneCount: number
    lateCount: number
    missingCount: number
    pendingCount: number
    totalStudents: number
}

export interface AssignmentDetail {
    id: number
    classId: number
    className: string
    academyId: number
    curriculumId: number | null
    unitTitle: string | null
    title: string
    body: string | null
    dueAt: string | null
    createdByUserId: number | null
    createdByName: string | null
    createdAt: string
    updatedAt: string
}

export interface AssignmentSubmissionRow {
    studentId: number
    studentName: string
    grade: string | null
    submissionId: number | null
    status: AssignmentSubmissionStatus
    submittedAt: string | null
    score: number | null
    feedback: string | null
    gradedAt: string | null
    aPointEarned: boolean
}

export interface AssignmentUpsertInput {
    id: number
    classId: number
    curriculumId: number | null
    title: string
    body: string | null
    dueAt: string | null
}

export interface AssignmentSubmissionUpsertInput {
    assignmentId: number
    studentId: number
    status: AssignmentSubmissionStatus
    score: number | null
    feedback: string | null
}
