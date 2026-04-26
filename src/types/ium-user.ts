export type IumUserRole = "SYSTEM_ADMIN" | "ACADEMY_ADMIN" | "ACADEMY_MEMBER"
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
    role: IumUserRole
    approvalStatus: IumApprovalStatus
    createdAt: string
    updatedAt: string
}
