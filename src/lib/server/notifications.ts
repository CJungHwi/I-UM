import "server-only"

import { callProcedure } from "@/lib/db"
import type {
    AcademyNotificationAudience,
    NotificationAudience,
    NotificationItem,
    NotificationScope,
    NotificationTemplateRow,
    SystemNotificationAudience,
} from "@/types/notification"

function mapTemplateRow(r: Record<string, unknown>): NotificationTemplateRow {
    return {
        id: Number(r.id ?? r.f0 ?? 0),
        templateKey: String(r.templateKey ?? r.template_key ?? ""),
        title: String(r.title ?? ""),
        body: String(r.body ?? ""),
        isActive: String(r.isActive ?? r.is_active ?? "Y"),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    }
}

function mapNotificationItem(r: Record<string, unknown>): NotificationItem {
    const rawAid = r.academyId ?? r.academy_id
    const p = rawAid != null && rawAid !== "" ? Number(rawAid) : NaN
    const academyId = Number.isFinite(p) && p > 0 ? p : null
    return {
        id: Number(r.id ?? r.f0 ?? 0),
        scope: String(r.scope ?? "SYSTEM") as NotificationScope,
        academyId,
        academyName:
            r.academyName != null && r.academyName !== ""
                ? String(r.academyName ?? r.academy_name ?? "")
                : null,
        title: String(r.title ?? ""),
        body: String(r.body ?? ""),
        audience: String(r.audience ?? "ALL") as NotificationAudience,
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
        isRead: Number(r.isRead ?? r.is_read ?? 0) === 1,
    }
}

export type SendNotificationOptions = {
    targetUserId?: number
    senderUserId?: number | null
    templateId?: number | null
    /** scope=ACADEMY 일 때 필수 */
    academyId?: number | null
}

export async function sendNotificationFromTemplateKey(
    templateKey: string,
    scope: NotificationScope,
    audience: NotificationAudience,
    options?: SendNotificationOptions,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_notif_send_from_template_key",
            templateKey,
            scope,
            options?.academyId ?? null,
            audience,
            options?.targetUserId ?? null,
            options?.senderUserId ?? null,
        )
        const id = Number(rows[0]?.id ?? rows[0]?.f0 ?? 0)
        if (!id) return { ok: false, error: "알림 생성에 실패했습니다." }
        return { ok: true, id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("USER_AUDIENCE_REQUIRES_TARGET")) {
            return { ok: false, error: "특정 사용자 발송에는 대상 사용자가 필요합니다." }
        }
        if (msg.includes("TEMPLATE_NOT_FOUND")) {
            return { ok: false, error: "알림 템플릿을 찾을 수 없습니다." }
        }
        if (msg.includes("TARGET_NOT_IN_ACADEMY")) {
            return { ok: false, error: "선택한 사용자가 해당 학원 소속이 아닙니다." }
        }
        if (msg.includes("INVALID_SCOPE") || msg.includes("ACADEMY_REQUIRES_ID")) {
            return { ok: false, error: "학원 알림에는 소속 학원이 필요합니다." }
        }
        console.error("sendNotificationFromTemplateKey:", e)
        return { ok: false, error: "알림 발송 중 오류가 발생했습니다." }
    }
}

export async function sendNotificationRaw(
    title: string,
    body: string,
    scope: NotificationScope,
    audience: NotificationAudience,
    options?: SendNotificationOptions,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
    try {
        const rows = await callProcedure<Record<string, unknown>>(
            "sp_notif_send",
            scope,
            options?.academyId ?? null,
            title,
            body,
            audience,
            options?.targetUserId ?? null,
            options?.senderUserId ?? null,
            options?.templateId ?? null,
        )
        const id = Number(rows[0]?.id ?? rows[0]?.f0 ?? 0)
        if (!id) return { ok: false, error: "알림 생성에 실패했습니다." }
        return { ok: true, id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("USER_AUDIENCE_REQUIRES_TARGET")) {
            return { ok: false, error: "특정 사용자 발송에는 대상 사용자가 필요합니다." }
        }
        if (msg.includes("TARGET_NOT_IN_ACADEMY")) {
            return { ok: false, error: "선택한 사용자가 해당 학원 소속이 아닙니다." }
        }
        if (msg.includes("INVALID_SCOPE") || msg.includes("ACADEMY_REQUIRES_ID")) {
            return { ok: false, error: "학원 알림에는 소속 학원이 필요합니다." }
        }
        console.error("sendNotificationRaw:", e)
        return { ok: false, error: "알림 발송 중 오류가 발생했습니다." }
    }
}

export async function listTemplates(): Promise<NotificationTemplateRow[]> {
    const rows = await callProcedure<Record<string, unknown>>("sp_notif_template_list")
    return rows.map(mapTemplateRow)
}

export async function listNotificationsForUser(
    userId: number,
    userGrade: string,
    userLevel: string,
    userAcademyId: number | null,
    limit = 40,
): Promise<NotificationItem[]> {
    const rows = await callProcedure<Record<string, unknown>>(
        "sp_notif_list_for_user",
        userId,
        userGrade,
        userLevel,
        userAcademyId,
        limit,
    )
    return rows.map(mapNotificationItem)
}

export async function getUnreadCountForUser(
    userId: number,
    userGrade: string,
    userLevel: string,
    userAcademyId: number | null,
): Promise<number> {
    const rows = await callProcedure<Record<string, unknown>>(
        "sp_notif_unread_count",
        userId,
        userGrade,
        userLevel,
        userAcademyId,
    )
    return Number(rows[0]?.cnt ?? rows[0]?.f0 ?? 0)
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
    await callProcedure("sp_notif_mark_read", notificationId, userId)
}

export async function markAllNotificationsRead(
    userId: number,
    userGrade: string,
    userLevel: string,
    userAcademyId: number | null,
): Promise<void> {
    await callProcedure("sp_notif_mark_all_read", userId, userGrade, userLevel, userAcademyId)
}

export async function saveTemplate(
    templateKey: string,
    title: string,
    body: string,
): Promise<NotificationTemplateRow | null> {
    const rows = await callProcedure<Record<string, unknown>>(
        "sp_notif_template_save",
        templateKey.trim(),
        title,
        body,
    )
    if (!rows.length) return null
    return mapTemplateRow(rows[0])
}

export function isSystemAudience(a: string): a is SystemNotificationAudience {
    return a === "ALL" || a === "ALL_ADMINS" || a === "USER"
}

export function isAcademyAudience(a: string): a is AcademyNotificationAudience {
    return a === "ALL" || a === "ADMINS" || a === "DIRECTORS" || a === "TEACHERS" || a === "USER"
}
