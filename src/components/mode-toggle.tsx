"use client"

import * as React from "react"
import { memo } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export const ModeToggle = memo(function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-border bg-card"
                disabled
                aria-hidden
            >
                <span className="h-4 w-4" />
            </Button>
        )
    }

    const isDark = resolvedTheme === "dark"

    const handleToggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환"

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-border bg-card"
            onClick={handleToggleTheme}
            aria-label={label}
            title={label}
        >
            {isDark ? (
                <Moon className="h-4 w-4" aria-hidden />
            ) : (
                <Sun className="h-4 w-4" aria-hidden />
            )}
        </Button>
    )
})
