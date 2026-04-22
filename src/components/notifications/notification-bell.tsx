"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell } from "lucide-react"
import {
    actionMarkAllNotificationsRead,
    actionMarkNotificationRead,
    fetchMyNotifications,
    fetchMyUnreadNotificationCount,
} from "@/actions/notification-actions"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { NotificationItem } from "@/types/notification"
import { cn } from "@/lib/utils"

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<NotificationItem[]>([])
    const [unread, setUnread] = useState(0)
    const [loading, setLoading] = useState(false)

    const loadCount = useCallback(async () => {
        const res = await fetchMyUnreadNotificationCount()
        if (res.success && typeof res.data === "number") setUnread(res.data)
    }, [])

    const loadList = useCallback(async () => {
        setLoading(true)
        const res = await fetchMyNotifications()
        setLoading(false)
        if (res.success && res.data) {
            setItems(res.data)
            await loadCount()
        }
    }, [loadCount])

    useEffect(() => {
        void loadCount()
    }, [loadCount])

    useEffect(() => {
        if (open) void loadList()
    }, [open, loadList])

    const handleOpenChange = (next: boolean) => {
        setOpen(next)
    }

    const handleClickItem = async (n: NotificationItem) => {
        if (!n.isRead) {
            const res = await actionMarkNotificationRead(n.id)
            if (res.success) {
                setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
                void loadCount()
            }
        }
    }

    const handleMarkAll = async () => {
        const res = await actionMarkAllNotificationsRead()
        if (res.success) {
            setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
            setUnread(0)
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 shrink-0 text-sidebar-foreground"
                    aria-label={`알림${unread > 0 ? `, 읽지 않음 ${unread}건` : ""}`}
                >
                    <Bell className="h-4 w-4" aria-hidden />
                    {unread > 0 && (
                        <span
                            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
                            aria-hidden
                        />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 bg-popover border-[#343637] dark:border-[#6b7280]">
                <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold border-b border-[#343637] dark:border-[#6b7280]">
                    알림
                </DropdownMenuLabel>
                <div className="flex items-center justify-end gap-2 px-2 py-1 border-b border-[#343637] dark:border-[#6b7280]">
                    <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                        onClick={() => void handleMarkAll()}
                    >
                        모두 읽음
                    </button>
                </div>
                <ScrollArea className="h-[min(320px,50vh)]">
                    {loading ? (
                        <p className="p-4 text-xs text-muted-foreground">불러오는 중…</p>
                    ) : items.length === 0 ? (
                        <p className="p-4 text-xs text-muted-foreground">새 알림이 없습니다.</p>
                    ) : (
                        items.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className={cn(
                                    "flex cursor-pointer flex-col items-start gap-1 rounded-none px-3 py-2 focus:bg-muted/50",
                                    !n.isRead && "bg-primary/10",
                                )}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    void handleClickItem(n)
                                }}
                            >
                                <span className="text-[10px] text-muted-foreground">
                                    {n.scope === "SYSTEM"
                                        ? "[전역]"
                                        : n.academyName
                                          ? `[학원] ${n.academyName}`
                                          : "[학원]"}
                                </span>
                                <span className="text-xs font-semibold leading-tight">{n.title}</span>
                                <span className="whitespace-pre-wrap text-[11px] text-muted-foreground leading-snug">
                                    {n.body}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {formatNotifTime(n.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="m-0" />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function formatNotifTime(iso: string): string {
    if (!iso) return ""
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}
