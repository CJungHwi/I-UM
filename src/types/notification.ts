/** 전역(시스템 관리자) 알림 수신 범위 */
export type SystemNotificationAudience = "ALL" | "ALL_ADMINS" | "USER"

/** 학원(학원 관리자) 알림 수신 범위 — 역할·프로세스별 세그먼트 */
export type AcademyNotificationAudience = "ALL" | "ADMINS" | "DIRECTORS" | "TEACHERS" | "USER"

export type NotificationScope = "SYSTEM" | "ACADEMY"

export type NotificationAudience =
    | SystemNotificationAudience
    | AcademyNotificationAudience

export type NotificationTemplateRow = {
    id: number
    templateKey: string
    title: string
    body: string
    isActive: string
    createdAt: string
    updatedAt: string
}

export type NotificationItem = {
    id: number
    scope: NotificationScope
    academyId: number | null
    academyName: string | null
    title: string
    body: string
    audience: NotificationAudience
    createdAt: string
    isRead: boolean
}
