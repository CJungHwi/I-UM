"use client"

import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context"
import type { DashboardChromeRole } from "@/lib/ium-user"
import type { NavItem } from "@/types/menu"

interface DashboardContentProps {
    children: React.ReactNode
    menuItems: NavItem[]
    dashboardRole: DashboardChromeRole
}

function DashboardContent({ children, menuItems, dashboardRole }: DashboardContentProps) {
    const { isCollapsed } = useSidebar()

    return (
        <div className="flex h-dvh min-h-dvh overflow-hidden bg-background">
            {/* 사이드바 - 데스크탑에서만 표시 */}
            <div className="hidden md:block shrink-0">
                <Sidebar menuItems={menuItems} dashboardRole={dashboardRole} />
            </div>

            {/* 메인 영역 */}
            <div
                className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
                style={{
                    marginLeft: 0,
                }}
            >
                {/* 헤더 */}
                <Header menuItems={menuItems} dashboardRole={dashboardRole} />

                {/* 메인 컨텐츠 */}
                <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-[5px]">
                    {children}
                </main>

                {/* 푸터 */}
                <Footer />
            </div>
        </div>
    )
}

interface DashboardLayoutProps {
    children: React.ReactNode
    menuItems: NavItem[]
    dashboardRole: DashboardChromeRole
}

export function DashboardLayout({
    children,
    menuItems,
    dashboardRole,
}: DashboardLayoutProps) {
    return (
        <SidebarProvider defaultCollapsed={false}>
            <DashboardContent menuItems={menuItems} dashboardRole={dashboardRole}>
                {children}
            </DashboardContent>
        </SidebarProvider>
    )
}
