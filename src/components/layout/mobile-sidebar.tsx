"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import type { NavItem } from "@/types/menu"

interface MobileSidebarProps {
    menuItems: NavItem[]
}

export function MobileSidebar({ menuItems }: MobileSidebarProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // 경로 변경 시 사이드바 닫기
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="메뉴 열기"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">메뉴 열기</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="p-0 w-72 border-r border-sidebar-border"
            >
                <VisuallyHidden>
                    <SheetTitle>네비게이션 메뉴</SheetTitle>
                </VisuallyHidden>
                <Sidebar className="h-full border-r-0 w-full" isMobile menuItems={menuItems} />
            </SheetContent>
        </Sheet>
    )
}
