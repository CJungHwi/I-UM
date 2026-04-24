"use server"

import { auth } from "@/auth"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import {
    getUnreadCountForUser,
    isAcademyAudience,
    isSystemAudience,
    listNotificationsForUser,
    listTemplates,
    markAllNotificationsRead,
    markNotificationRead,
    saveTemplate,
    sendNotificationFromTemplateKey,
    sendNotificationRaw,
} from "@/lib/server/notifications"
import type { ServerActionResult } from "@/types"
import type { IumUserGrade, IumUserLevel } from "@/types/ium-user"
import type {
    NotificationAudience,
    NotificationItem,
    NotificationScope,
    NotificationTemplateRow,
} from "@/types/notification"

type SessionCtx =
    | ServerActionResult<never>
    | {
          userId: number
          userGrade: IumUserGrade
          userLevel: IumUserLevel
          userAcademyId: number | null
      }

async function requireSessionContext(): Promise<SessionCtx> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "로그인이 필요합니다." }
    }
    const rawAid = session.user.academyId
    const userAcademyId = rawAid != null && rawAid > 0 ? Number(rawAid) : null
    return {
        userId: Number(session.user.id),
        userGrade: session.user.userGrade ?? "USER",
        userLevel: session.user.userLevel ?? "TEACHER",
        userAcademyId,
    }
}

async function requireAdminSender(): Promise<SessionCtx> {
    const s = await requireSessionContext()
    if (!("userId" in s)) return s
    if (s.userGrade !== "ADMIN") {
        return { success: false, error: "관리자만 접근할 수 있습니다." }
    }
    return s
}

export async function fetchMyNotifications(): Promise<ServerActionResult<NotificationItem[]>> {
    const s = await requireSessionContext()
    if (!("userId" in s)) return s
    try {
        const data = await listNotificationsForUser(
            s.userId,
            s.userGrade,
            s.userLevel,
            s.userAcademyId,
            40,
        )
        return { success: true, data }
    } catch (e) {
        console.error("fetchMyNotifications:", e)
        return { success: false, error: "알림을 불러올 수 없습니다." }
    }
}

export async function fetchMyUnreadNotificationCount(): Promise<ServerActionResult<number>> {
    const s = await requireSessionContext()
    if (!("userId" in s)) return s
    try {
        const n = await getUnreadCountForUser(
            s.userId,
            s.userGrade,
            s.userLevel,
            s.userAcademyId,
        )
        return { success: true, data: n }
    } catch (e) {
        console.error("fetchMyUnreadNotificationCount:", e)
        return { success: true, data: 0 }
    }
}

export async function actionMarkNotificationRead(
    notificationId: number,
): Promise<ServerActionResult> {
    const s = await requireSessionContext()
    if (!("userId" in s)) return s
    try {
        await markNotificationRead(notificationId, s.userId)
        return { success: true }
    } catch (e) {
        console.error("actionMarkNotificationRead:", e)
        return { success: false, error: "처리에 실패했습니다." }
    }
}

export async function actionMarkAllNotificationsRead(): Promise<ServerActionResult> {
    const s = await requireSessionContext()
    if (!("userId" in s)) return s
    try {
        await markAllNotificationsRead(s.userId, s.userGrade, s.userLevel, s.userAcademyId)
        return { success: true }
    } catch (e) {
        console.error("actionMarkAllNotificationsRead:", e)
        return { success: false, error: "처리에 실패했습니다." }
    }
}

export async function adminListNotificationTemplates(): Promise<ServerActionResult<NotificationTemplateRow[]>> {
    const gate = await requireAdminSender()
    if (!("userId" in gate)) return gate
    try {
        const data = await listTemplates()
        return { success: true, data }
    } catch (e) {
        console.error("adminListNotificationTemplates:", e)
        return { success: false, error: "템플릿을 불러올 수 없습니다." }
    }
}

export async function adminSaveNotificationTemplate(
    templateKey: string,
    title: string,
    body: string,
): Promise<ServerActionResult<NotificationTemplateRow>> {
    const gate = await requireAdminSender()
    if (!("userId" in gate)) return gate
    const key = templateKey.trim()
    if (!key || !title.trim()) {
        return { success: false, error: "템플릿 키와 제목을 입력하세요." }
    }
    try {
        const row = await saveTemplate(key, title.trim(), body)
        if (!row) return { success: false, error: "저장에 실패했습니다." }
        return { success: true, data: row }
    } catch (e) {
        console.error("adminSaveNotificationTemplate:", e)
        return { success: false, error: "저장 중 오류가 발생했습니다." }
    }
}

export async function adminSendNotification(
    title: string,
    body: string,
    scope: NotificationScope,
    audience: NotificationAudience,
    targetUserId: number | null,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdminSender()
    if (!("userId" in gate)) return gate
    const t = title.trim()
    const b = body.trim()
    if (!t || !b) {
        return { success: false, error: "제목과 내용을 입력하세요." }
    }

    const ug = gate.userGrade
    const aid = gate.userAcademyId

    if (scope === "SYSTEM") {
        if (!isSystemAdmin(ug, aid)) {
            return { success: false, error: "전역(시스템) 알림은 전역 관리자만 발송할 수 있습니다." }
        }
        if (!isSystemAudience(audience)) {
            return { success: false, error: "전역 알림 수신 범위가 올바르지 않습니다." }
        }
        const result = await sendNotificationRaw(t, b, "SYSTEM", audience, {
            targetUserId: targetUserId ?? undefined,
            senderUserId: gate.userId,
            templateId: null,
            academyId: null,
        })
        if (!result.ok) return { success: false, error: result.error }
        return { success: true, data: { id: result.id } }
    }

    if (scope === "ACADEMY") {
        if (!isAcademyAdmin(ug, aid)) {
            return { success: false, error: "학원 알림은 해당 학원 관리자만 발송할 수 있습니다." }
        }
        if (!isAcademyAudience(audience)) {
            return { success: false, error: "학원 알림 수신 범위가 올바르지 않습니다." }
        }
        const result = await sendNotificationRaw(t, b, "ACADEMY", audience, {
            targetUserId: targetUserId ?? undefined,
            senderUserId: gate.userId,
            templateId: null,
            academyId: aid ?? undefined,
        })
        if (!result.ok) return { success: false, error: result.error }
        return { success: true, data: { id: result.id } }
    }

    return { success: false, error: "알 수 없는 범위입니다." }
}

export async function adminSendFromTemplate(
    templateKey: string,
    scope: NotificationScope,
    audience: NotificationAudience,
    targetUserId: number | null,
): Promise<ServerActionResult<{ id: number }>> {
    const gate = await requireAdminSender()
    if (!("userId" in gate)) return gate
    const key = templateKey.trim()
    if (!key) return { success: false, error: "템플릿을 선택하세요." }

    const ug = gate.userGrade
    const aid = gate.userAcademyId

    if (scope === "SYSTEM") {
        if (!isSystemAdmin(ug, aid)) {
            return { success: false, error: "전역(시스템) 알림은 전역 관리자만 발송할 수 있습니다." }
        }
        if (!isSystemAudience(audience)) {
            return { success: false, error: "전역 알림 수신 범위가 올바르지 않습니다." }
        }
        const result = await sendNotificationFromTemplateKey(key, "SYSTEM", audience, {
            targetUserId: targetUserId ?? undefined,
            senderUserId: gate.userId,
            academyId: null,
        })
        if (!result.ok) return { success: false, error: result.error }
        return { success: true, data: { id: result.id } }
    }

    if (scope === "ACADEMY") {
        if (!isAcademyAdmin(ug, aid)) {
            return { success: false, error: "학원 알림은 해당 학원 관리자만 발송할 수 있습니다." }
        }
        if (!isAcademyAudience(audience)) {
            return { success: false, error: "학원 알림 수신 범위가 올바르지 않습니다." }
        }
        const result = await sendNotificationFromTemplateKey(key, "ACADEMY", audience, {
            targetUserId: targetUserId ?? undefined,
            senderUserId: gate.userId,
            academyId: aid ?? undefined,
        })
        if (!result.ok) return { success: false, error: result.error }
        return { success: true, data: { id: result.id } }
    }

    return { success: false, error: "알 수 없는 범위입니다." }
}
