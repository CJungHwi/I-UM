export interface CurriculumUnit {
    id: number
    academyId: number
    subject: string
    level: string | null
    unitNo: number
    unitTitle: string
    planMemo: string | null
    estWeek: number | null
    createdAt: string
    updatedAt: string
}

export interface ClassProgressRow {
    curriculumId: number
    subject: string
    level: string | null
    unitNo: number
    unitTitle: string
    planMemo: string | null
    estWeek: number | null
    progressId: number | null
    completedAt: string | null
    progressNote: string | null
    teacherUserId: number | null
    teacherName: string | null
}

export interface ClassProgressStats {
    totalUnits: number
    completedUnits: number
    progressRate: number | null
}

export interface CurriculumUpsertInput {
    id: number
    academyId: number
    subject: string
    level: string | null
    unitNo: number
    unitTitle: string
    planMemo: string | null
    estWeek: number | null
}
