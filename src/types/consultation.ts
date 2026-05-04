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

/** TS·폴백용 라벨 (`ium_code` CONSULT_STATUS와 동기 유지) */
export const CONSULT_STATUS_LABEL: Record<ConsultStatus, string> = {
    NEW: "신규",
    IN_PROGRESS: "진행중",
    WAIT: "보류",
    CONVERTED: "등록완료",
    LOST: "이탈",
}

/** 상담 상태 진행 순서 (스테퍼 표시용) */
export const CONSULT_STATUS_FLOW: ConsultStatus[] = [
    "NEW",
    "IN_PROGRESS",
    "WAIT",
    "CONVERTED",
]

/** 목록 필터 등 전체 상태 나열 순서 */
export const CONSULT_STATUS_FILTER_ORDER: ConsultStatus[] = [
    "NEW",
    "IN_PROGRESS",
    "WAIT",
    "CONVERTED",
    "LOST",
]

export interface ConsultRow {
    id: number
    academyId: number
    academyName: string | null
    source: ConsultSource
    channelDetail: string | null
    contactName: string
    contactPhone: string | null
    studentName: string
    /** `ium_code` STUDENT_GRADE 코드 (예: MS2) */
    grade: string | null
    consultSchool: string | null
    subject: string | null
    /** 수강 희망 요일·시간대(자유 입력) */
    preferSchedule: string | null
    priorAcademyNote: string | null
    withdrawReason: string | null
    subjectInterestNote: string | null
    parentEducationView: string | null
    childPersonalityNote: string | null
    specialRequests: string | null
    notRegisteredReason: string | null
    /** `ium_code` CONSULT_STATUS 코드 */
    status: ConsultStatus
    counselorUserId: number | null
    counselorName: string | null
    convertedStudentId: number | null
    requestedAt: string
    resolvedAt: string | null
    nextContactAt: string | null
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
    channelDetail: string | null
    contactName: string
    contactPhone: string | null
    studentName: string
    /** `ium_code` STUDENT_GRADE 코드 (예: MS2) */
    grade: string | null
    consultSchool: string | null
    subject: string | null
    /** 수강 희망 요일·시간대 */
    preferSchedule: string | null
    priorAcademyNote: string | null
    withdrawReason: string | null
    subjectInterestNote: string | null
    parentEducationView: string | null
    childPersonalityNote: string | null
    specialRequests: string | null
    notRegisteredReason: string | null
    nextContactAt: string | null
    counselorUserId: number | null
    requestedAt: string | null
}

export type ConsultUpdateInput = Omit<ConsultCreateInput, "academyId">
