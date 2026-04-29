"use client"

import { cn } from "@/lib/utils"
import type { DashboardChromeRole } from "@/lib/ium-user"
import { DashboardNavWithFolders } from "@/components/dashboard-nav-with-folders"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/layout/sidebar-context"
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import type { NavItem } from "@/types/menu"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isMobile?: boolean
    menuItems: NavItem[]
    dashboardRole?: DashboardChromeRole
}

export function Sidebar({ className, isMobile = false, menuItems, dashboardRole = "academy" }: SidebarProps) {
    const { isCollapsed, toggle } = useSidebar()

    // 모바일에서는 항상 펼쳐진 상태로 표시
    const collapsed = isMobile ? false : isCollapsed

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" })
    }

    return (
        <div
            className={cn(
                "relative flex flex-col h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
                dashboardRole === "system-admin" && "border-l-[3px] border-l-primary",
                collapsed ? "w-16" : "w-64",
                className
            )}
        >
            {/* 로고 영역 */}
            <div
                className={cn(
                    "h-14 flex items-center border-b border-sidebar-border shrink-0",
                    collapsed ? "justify-center px-2" : "px-4"
                )}
            >
                {collapsed ? (
                    <span className="text-xl font-bold font-heading">
                        {dashboardRole === "system-admin" ? "S" : "G"}
                    </span>
                ) : (
                    <h2 className="text-lg font-bold tracking-tight font-heading">
                        {dashboardRole === "system-admin" ? "Console" : "I-UM"}
                    </h2>
                )}
            </div>

            {/* 토글 버튼 (데스크탑에서만 표시) */}
            {!isMobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggle}
                    className="absolute -right-3 top-16 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-card hover:bg-muted"
                    aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            )}

            {/* 네비게이션 영역 */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
                    <DashboardNavWithFolders items={menuItems} isCollapsed={collapsed} />
                </div>
            </div>

            {/* 로그아웃 버튼 영역 */}
            <div
                className={cn(
                    "border-t border-sidebar-border py-4 shrink-0",
                    collapsed ? "px-2" : "px-3"
                )}
            >
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={cn(
                        "w-full text-muted-foreground hover:text-foreground hover:bg-accent",
                        collapsed
                            ? "justify-center px-0"
                            : "justify-start gap-2"
                    )}
                    aria-label="로그아웃"
                >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span>로그아웃</span>}
                </Button>
            </div>
        </div>
    )
}
