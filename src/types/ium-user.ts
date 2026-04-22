export type IumUserLevel = "DIRECTOR" | "TEACHER"
export type IumUserGrade = "ADMIN" | "USER"
export type IumApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface IumAcademyOption {
    id: number
    academyName: string
}

export interface IumUserRow {
    id: number
    loginId: string
    name: string
    email: string | null
    academyId: number | null
    academyName: string | null
    userLevel: IumUserLevel
    userGrade: IumUserGrade
    approvalStatus: IumApprovalStatus
    createdAt: string
    updatedAt: string
}
