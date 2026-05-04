/** `ium_code` 한 행 (API·화면용) */
export interface IumCodeRow {
    code: string
    label: string
    sortNo: number
    nextGradeCode: string | null
}

export type IumCodeType = "STUDENT_GRADE" | "ADMISSION_ROUTE" | "CONSULT_STATUS"
