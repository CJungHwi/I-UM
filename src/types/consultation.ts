export type ConsultSource =
    | "PHONE"
    | "WEB"
    | "VISIT"
    | "SNS"
    | "REFERRAL"
    | "OTHER"

export type ConsultStatus =
    | "NEW"
    | "IN_PROGRESS"
    | "WAIT"
    | "CONVERTED"
    | "LOST"

export const CONSULT_SOURCE_LABEL: Record<ConsultSource, string> = {
    PHONE: "전화",
    WEB: "홈페이지",
    VISIT: "방문",
    SNS: "SNS",
    REFERRAL: "소개",
    OTHER: "기타",
}

export const CONSULT_STATUS_LABEL: Record<ConsultStatus, string> = {
    NEW: "신규",
    IN_PROGRESS: "상담중",
    WAIT: "대기",
    CONVERTED: "등록",
    LOST: "이탈",
}

/** 상담 상태 진행 순서 (스테퍼 표시용) */
export const CONSULT_STATUS_FLOW: ConsultStatus[] = [
    "NEW",
    "IN_PROGRESS",
    "WAIT",
    "CONVERTED",
]

export interface ConsultRow {
    id: number
    academyId: number
    academyName: string | null
    source: ConsultSource
    contactName: string
    contactPhone: string | null
    studentName: string
    grade: string | null
    subject: string | null
    preferSchedule: string | null
    status: ConsultStatus
    counselorUserId: number | null
    counselorName: string | null
    convertedStudentId: number | null
    requestedAt: string
    resolvedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface ConsultDetail extends ConsultRow {
    memo: string | null
}

export interface ConsultLog {
    id: number
    consultationId: number
    oldStatus: ConsultStatus | null
    newStatus: ConsultStatus
    note: string | null
    userId: number | null
    userName: string | null
    createdAt: string
}

export interface ConsultStats {
    newCount: number
    inProgress: number
    waiting: number
    converted: number
    lost: number
    total: number
    conversionRate: number | null
}

export interface ConsultCreateInput {
    academyId: number
    source: ConsultSource
    contactName: string
    contactPhone: string | null
    studentName: string
    grade: string | null
    subject: string | null
    preferSchedule: string | null
    memo: string | null
    counselorUserId: number | null
    requestedAt: string | null
}

export type ConsultUpdateInput = Omit<ConsultCreateInput, "academyId">
