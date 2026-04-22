import type { MenuItem, NavItem } from "@/types/menu"
import * as Icons from "lucide-react"

// 메뉴 아이템을 계층 구조로 변환
export function buildMenuHierarchy(items: MenuItem[]): NavItem[] {
    const menuMap = new Map<number, NavItem>()
    const itemMap = new Map<number, MenuItem>() // sortOrder를 찾기 위한 맵
    const rootItems: NavItem[] = []

    // 모든 메뉴를 맵에 추가
    items.forEach((item) => {
        itemMap.set(item.id, item)
        menuMap.set(item.id, {
            id: item.menuId,
            title: item.title,
            href: item.href,
            icon: item.icon,
            isFolder: item.isFolder === "Y",
            children: [],
        })
    })

    // 계층 구조 구성
    items.forEach((item) => {
        const navItem = menuMap.get(item.id)!
        if (item.parentId === null) {
            rootItems.push(navItem)
        } else {
            const parent = menuMap.get(item.parentId)
            if (parent) {
                if (!parent.children) {
                    parent.children = []
                }
                parent.children.push(navItem)
            }
        }
    })

    // 정렬 함수 (재귀적으로 정렬)
    const sortMenu = (navItems: NavItem[]): NavItem[] => {
        return navItems
            .map((navItem) => {
                // 해당 NavItem의 원본 MenuItem 찾기
                const originalItem = Array.from(itemMap.values()).find(
                    (item) => item.menuId === navItem.id
                )
                return { navItem, sortOrder: originalItem?.sortOrder ?? 0 }
            })
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(({ navItem }) => ({
                ...navItem,
                children: navItem.children ? sortMenu(navItem.children) : undefined,
            }))
    }

    return sortMenu(rootItems)
}

// 아이콘 이름 문자열을 실제 아이콘 컴포넌트로 변환
export function getIconComponent(iconName: string | null) {
    if (!iconName) return null
    
    // lucide-react에서 아이콘 가져오기
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || null
}
