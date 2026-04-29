"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Badge } from "@/components/ui/badge"
import type { DashboardChromeRole } from "@/lib/ium-user"
import type { NavItem } from "@/types/menu"

interface HeaderProps {
    menuItems: NavItem[]
    dashboardRole: DashboardChromeRole
}

export default function Header({ menuItems, dashboardRole }: HeaderProps) {
    const isSystemChrome = dashboardRole === "system-admin"

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 md:px-6 backdrop-blur-md transition-colors duration-500">
            {/* 모바일 햄버거 메뉴 */}
            <MobileSidebar menuItems={menuItems} dashboardRole={dashboardRole} />

            {/* 로고 영역 (데스크탑에서만 표시 - md 이상) */}
            <div className="hidden md:flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <span className="text-lg font-bold font-heading">
                        {isSystemChrome ? "S" : "A"}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold font-heading text-sidebar-foreground leading-none">
                            {isSystemChrome ? "I-UM Console" : "I-UM System"}
                        </h1>
                        {isSystemChrome ? (
                            <Badge
                                variant="secondary"
                                className="h-5 shrink-0 border border-primary/40 bg-primary/15 px-1.5 text-[10px] font-bold text-primary"
                            >
                                전역 관리
                            </Badge>
                        ) : null}
                    </div>
                    {isSystemChrome ? (
                        <p className="text-[10px] text-muted-foreground leading-none">
                            Super Admin · 모든 학원 범위
                        </p>
                    ) : null}
                </div>
            </div>

            {/* 모바일 로고 */}
            <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <span className="text-lg font-bold font-heading">
                        {isSystemChrome ? "S" : "R"}
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h1 className="text-base font-bold font-heading text-sidebar-foreground truncate leading-none">
                            {isSystemChrome ? "Console" : "I-UM"}
                        </h1>
                        {isSystemChrome ? (
                            <Badge
                                variant="secondary"
                                className="h-4 shrink-0 border border-primary/40 bg-primary/15 px-1 text-[9px] font-bold text-primary"
                            >
                                전역
                            </Badge>
                        ) : null}
                    </div>
                </div>
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
