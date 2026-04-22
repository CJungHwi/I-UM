"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { NavItem } from "@/types/menu"
import { getIconComponent } from "@/lib/menu-utils"

interface DashboardNavWithFoldersProps {
    items: NavItem[]
    isCollapsed?: boolean
}

export function DashboardNavWithFolders({ items, isCollapsed = false }: DashboardNavWithFoldersProps) {
    const pathname = usePathname()

    return (
        <TooltipProvider delayDuration={0}>
            <nav
                className={cn(
                    "grid items-start",
                    isCollapsed ? "gap-4 py-4" : "gap-2"
                )}
            >
                {items.map((item) => (
                    <NavItemComponent
                        key={item.id}
                        item={item}
                        pathname={pathname}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>
        </TooltipProvider>
    )
}

interface NavItemComponentProps {
    item: NavItem
    pathname: string
    isCollapsed: boolean
}

function NavItemComponent({ item, pathname, isCollapsed }: NavItemComponentProps) {
    const [isOpen, setIsOpen] = useState(false)
    const Icon = getIconComponent(item.icon)
    const isActive = item.href && pathname === item.href
    const hasChildren = item.children && item.children.length > 0

    // 폴더인 경우
    if (item.isFolder) {
        if (isCollapsed) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleTrigger asChild>
                                <button
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    aria-label={item.title}
                                    tabIndex={0}
                                >
                                    {Icon && <Icon className="h-5 w-5" />}
                                </button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-4">
                        {item.title}
                    </TooltipContent>
                </Tooltip>
            )
        }

        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <button
                        className={cn(
                            "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        tabIndex={0}
                        aria-label={item.title}
                    >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        <span className="flex-1 text-left">{item.title}</span>
                        {hasChildren && (
                            <ChevronRight
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-90"
                                )}
                            />
                        )}
                    </button>
                </CollapsibleTrigger>
                {hasChildren && (
                    <CollapsibleContent className="pl-4">
                        <div className="space-y-1 mt-1">
                            {item.children!.map((child) => (
                                <NavItemComponent
                                    key={child.id}
                                    item={child}
                                    pathname={pathname}
                                    isCollapsed={false}
                                />
                            ))}
                        </div>
                    </CollapsibleContent>
                )}
            </Collapsible>
        )
    }

    // 일반 메뉴 아이템인 경우
    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href || "#"}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                            isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        aria-label={item.title}
                        tabIndex={0}
                    >
                        {Icon && <Icon className="h-5 w-5" />}
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                    {item.title}
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Link
            href={item.href || "#"}
            className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
            )}
            tabIndex={0}
            aria-label={item.title}
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            <span>{item.title}</span>
        </Link>
    )
}
