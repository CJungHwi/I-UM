"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface SidebarContextType {
    isCollapsed: boolean
    toggle: () => void
    setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
    children: React.ReactNode
    defaultCollapsed?: boolean
}

export const SidebarProvider = ({
    children,
    defaultCollapsed = false,
}: SidebarProviderProps) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

    const toggle = useCallback(() => {
        setIsCollapsed((prev) => !prev)
    }, [])

    const setCollapsed = useCallback((collapsed: boolean) => {
        setIsCollapsed(collapsed)
    }, [])

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
