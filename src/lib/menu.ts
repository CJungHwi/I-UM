import "server-only"
import { callProcedure } from "@/lib/db"
import { cache } from "react"
import type { MenuItem } from "@/types/menu"

// 순수 유틸리티 함수는 menu-utils.ts에서 re-export
export { buildMenuHierarchy, getIconComponent } from "@/lib/menu-utils"

// React.cache()로 동일 요청 내 중복 쿼리 방지
export const getMenuItems = cache(async (
    userLevel?: number | null
): Promise<MenuItem[]> => {
    console.log("[getMenuItems] 시작 - 사용자 레벨:", userLevel)

    try {
        // 프로시저 호출
        const results = await callProcedure<any>(
            "get_menu",
            userLevel !== null && userLevel !== undefined ? userLevel : null
        )

        console.log("[getMenuItems] 프로시저 호출 성공 - 결과 개수:", results?.length || 0)

        // 프로시저 결과를 MenuItem 타입으로 변환
        const mappedResults = results.map((item: any) => ({
            id: item.id ?? item.f0 ?? 0,
            menuId: item.menu_id ?? item.f1 ?? "",
            title: item.title ?? item.f2 ?? "",
            href: item.href ?? item.f3 ?? null,
            icon: item.icon ?? item.f4 ?? null,
            parentId: item.parent_id ?? item.f5 ?? null,
            sortOrder: item.sort_order ?? item.f6 ?? 0,
            isFolder: item.is_folder ?? item.f7 ?? "N",
            isActive: item.is_active ?? item.f8 ?? "Y",
            requiredLevel: item.required_level ?? item.f9 ?? 0,
            createdAt: item.created_at ? new Date(item.created_at) : (item.f10 ? new Date(item.f10) : null),
            updatedAt: item.updated_at ? new Date(item.updated_at) : (item.f11 ? new Date(item.f11) : null),
        }))

        return mappedResults
    } catch (error) {
        console.error("[getMenuItems] 프로시저 호출 실패:", error)
        throw error
    }
})
