"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import type { NavItem } from "@/types/menu"

interface HeaderProps {
    menuItems: NavItem[]
}

export default function Header({ menuItems }: HeaderProps) {
    return (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 md:px-6 backdrop-blur-md transition-colors duration-500">
            {/* 모바일 햄버거 메뉴 */}
            <MobileSidebar menuItems={menuItems} />

            {/* 로고 영역 (데스크탑에서만 표시 - md 이상) */}
            <div className="hidden md:flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <span className="text-lg font-bold font-heading">A</span>
                </div>
                <h1 className="text-lg font-bold font-heading text-sidebar-foreground">
                    I-UM System
                </h1>
            </div>

            {/* 모바일 로고 */}
            <div className="flex md:hidden items-center gap-2 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <span className="text-lg font-bold font-heading">R</span>
                </div>
                <h1 className="text-base font-bold font-heading text-sidebar-foreground">
                    I-UM
                </h1>
            </div>

            {/* 스페이서 (데스크탑) */}
            <div className="hidden md:block flex-1" />

            {/* 우측 액션 영역 */}
            <div className="flex items-center gap-2">
                <ModeToggle />
                <NotificationBell />
                <UserNav />
            </div>
        </header>
    )
}
