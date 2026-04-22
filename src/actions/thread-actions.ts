"use server"

import { callProcedure } from "@/lib/db"
import { auth } from "@/auth"
import type { ServerActionResult } from "@/types"
import type { ThreadPost, ThreadStudent, ThreadTag } from "@/types/thread"

function mapThread(row: any): ThreadPost {
    return {
        id: row.id ?? row.f0 ?? 0,
        studentId: row.studentId ?? row.student_id ?? row.f1 ?? 0,
        writerId: row.writerId ?? row.writer_id ?? row.f2 ?? "",
        writerName: row.writerName ?? row.writer_name ?? row.f3 ?? "",
        content: row.content ?? row.f4 ?? "",
        tag: (row.tag ?? row.f5 ?? "일반") as ThreadTag,
        isPinned: Boolean(row.isPinned ?? row.is_pinned ?? row.f6 ?? 0),
        imageUrl: row.imageUrl ?? row.image_url ?? row.f7 ?? null,
        createdAt: row.createdAt ?? row.created_at ?? row.f8 ?? "",
        updatedAt: row.updatedAt ?? row.updated_at ?? row.f9 ?? "",
    }
}

export async function getThreadStudents(): Promise<ServerActionResult<ThreadStudent[]>> {
    try {
        const results = await callProcedure<any>("sp_thread_get_students")
        const students: ThreadStudent[] = results.map((r: any) => ({
            id: r.id ?? r.f0 ?? 0,
            mbId: r.mbId ?? r.mb_id ?? r.f1 ?? "",
            name: r.name ?? r.mb_name ?? r.f2 ?? "",
            level: r.level ?? r.mb_level ?? r.f3 ?? 0,
        }))
        return { success: true, data: students }
    } catch (error) {
        console.error("getThreadStudents error:", error)
        return { success: false, error: "학생 목록을 불러올 수 없습니다." }
    }
}

export async function getThreadList(
    studentId: number,
    tag?: string | null,
): Promise<ServerActionResult<ThreadPost[]>> {
    try {
        const results = await callProcedure<any>(
            "sp_thread_list",
            studentId,
            tag || null,
        )
        return { success: true, data: results.map(mapThread) }
    } catch (error) {
        console.error("getThreadList error:", error)
        return { success: false, error: "스레드를 불러올 수 없습니다." }
    }
}

export async function createThread(
    studentId: number,
    content: string,
    tag: ThreadTag,
    imageUrl?: string | null,
): Promise<ServerActionResult<{ id: number }>> {
    try {
        const session = await auth()
        if (!session?.user?.mbId) {
            return { success: false, error: "로그인이 필요합니다." }
        }

        const results = await callProcedure<any>(
            "sp_thread_create",
            studentId,
            session.user.mbId,
            session.user.name ?? session.user.mbId,
            content,
            tag,
            imageUrl || null,
        )
        const insertId = results?.[0]?.id ?? results?.[0]?.f0 ?? 0
        return { success: true, data: { id: insertId } }
    } catch (error) {
        console.error("createThread error:", error)
        return { success: false, error: "스레드 작성에 실패했습니다." }
    }
}

export async function updateThread(
    id: number,
    content: string,
    tag: ThreadTag,
): Promise<ServerActionResult> {
    try {
        await callProcedure<any>("sp_thread_update", id, content, tag)
        return { success: true }
    } catch (error) {
        console.error("updateThread error:", error)
        return { success: false, error: "스레드 수정에 실패했습니다." }
    }
}

export async function deleteThread(id: number): Promise<ServerActionResult> {
    try {
        await callProcedure<any>("sp_thread_delete", id)
        return { success: true }
    } catch (error) {
        console.error("deleteThread error:", error)
        return { success: false, error: "스레드 삭제에 실패했습니다." }
    }
}

export async function toggleThreadPin(
    id: number,
): Promise<ServerActionResult<{ isPinned: boolean }>> {
    try {
        const results = await callProcedure<any>("sp_thread_toggle_pin", id)
        const isPinned = Boolean(results?.[0]?.isPinned ?? results?.[0]?.is_pinned ?? results?.[0]?.f0 ?? 0)
        return { success: true, data: { isPinned } }
    } catch (error) {
        console.error("toggleThreadPin error:", error)
        return { success: false, error: "고정 상태 변경에 실패했습니다." }
    }
}
