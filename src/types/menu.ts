// 메뉴 타입 정의
export interface MenuItem {
    id: number
    menuId: string
    title: string
    href: string | null
    icon: string | null
    parentId: number | null
    sortOrder: number
    isFolder: string
    isActive: string
    requiredLevel: number
    createdAt: Date | null
    updatedAt: Date | null
}

// 네비게이션 아이템 타입 (컴포넌트에서 사용)
export interface NavItem {
    id: string
    title: string
    href: string | null
    icon: string | null
    isFolder: boolean
    children?: NavItem[]
}
