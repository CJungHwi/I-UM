export interface PointBalance {
    totalPoint: number
    usedPoint: number
    currentPoint: number
}

export interface PointHistory {
    id: number
    pointAmount: number
    reasonCode: string
    reasonText: string
    createdAt: string
}

export interface Badge {
    badgeId: number
    badgeCode: string
    badgeName: string
    badgeDesc: string
    badgeIcon: string
    badgeColor: string
    earnedAt?: string
    reqPoint?: number | null
    sortOrder?: number
}

export interface GamiStudent {
    id: number
    mbId: string
    name: string
    totalPoint: number
    badgeCount: number
}

export const REASON_LABELS: Record<string, string> = {
    ATTENDANCE: "출결 완료",
    ASSIGNMENT_A: "과제 A등급",
    MANUAL: "수동 지급",
}

export const BADGE_COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-300 dark:ring-emerald-700" },
    blue:    { bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-600 dark:text-blue-400",       ring: "ring-blue-300 dark:ring-blue-700" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-600 dark:text-amber-400",     ring: "ring-amber-300 dark:ring-amber-700" },
    orange:  { bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-600 dark:text-orange-400",   ring: "ring-orange-300 dark:ring-orange-700" },
    purple:  { bg: "bg-purple-100 dark:bg-purple-900/30",   text: "text-purple-600 dark:text-purple-400",   ring: "ring-purple-300 dark:ring-purple-700" },
    rose:    { bg: "bg-rose-100 dark:bg-rose-900/30",       text: "text-rose-600 dark:text-rose-400",       ring: "ring-rose-300 dark:ring-rose-700" },
    red:     { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-600 dark:text-red-400",         ring: "ring-red-300 dark:ring-red-700" },
}
