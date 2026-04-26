export interface LevelTestRow {
    id: number
    academyId: number
    subject: string
    score: number | null
    levelResult: string | null
    memo: string | null
    testedAt: string
    testerUserId: number | null
    testerName: string | null
}

export interface LevelTestSaveInput {
    consultationId: number | null
    studentId: number | null
    academyId: number
    subject: string
    score: number | null
    levelResult: string | null
    memo: string | null
}
