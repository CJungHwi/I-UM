"use client"

import { type ChangeEvent, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, FileText, Send } from "lucide-react"
import { toast } from "sonner"
import {
    adminListNotificationTemplates,
    adminSaveNotificationTemplate,
    adminSendFromTemplate,
    adminSendNotification,
} from "@/actions/notification-actions"
import { listIumUsersForNotificationTargets } from "@/actions/ium-user-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isAcademyAdmin, isSystemAdmin } from "@/lib/ium-user"
import { cn } from "@/lib/utils"
import type { NotificationAudience, NotificationScope, NotificationTemplateRow } from "@/types/notification"
import type { IumUserRow } from "@/types/ium-user"

type AdminTab = "templates" | "send" | "fromtpl"

const tabBtn =
    "text-xs font-bold rounded-sm px-2 py-1 transition-colors hover:bg-muted/60 dark:hover:bg-gray-700/60"
const tabBtnActive = "bg-primary text-primary-foreground shadow-none"
const tabBtnIdle = "text-muted-foreground"

export function NotificationsAdminClient() {
    const { data: session } = useSession()
    const [tab, setTab] = useState<AdminTab>("templates")
    const [templates, setTemplates] = useState<NotificationTemplateRow[]>([])
    const [users, setUsers] = useState<IumUserRow[]>([])
    const [tplKey, setTplKey] = useState("")
    const [tplTitle, setTplTitle] = useState("")
    const [tplBody, setTplBody] = useState("")
    const [sendTitle, setSendTitle] = useState("")
    const [sendBody, setSendBody] = useState("")
    const [sendScope, setSendScope] = useState<NotificationScope>("SYSTEM")
    const [audience, setAudience] = useState<string>("ALL")
    const [targetUserId, setTargetUserId] = useState<string>("")
    const [fromTplKey, setFromTplKey] = useState<string>("")
    const [fromScope, setFromScope] = useState<NotificationScope>("SYSTEM")
    const [fromAudience, setFromAudience] = useState<string>("ALL")
    const [fromTarget, setFromTarget] = useState<string>("")

    const canSystem = isSystemAdmin(
        session?.user?.userGrade,
        session?.user?.academyId ?? null,
    )
    const canAcademy = isAcademyAdmin(
        session?.user?.userGrade,
        session?.user?.academyId ?? null,
    )

    const load = async () => {
        const t = await adminListNotificationTemplates()
        if (t.success && t.data) setTemplates(t.data)
        const u = await listIumUsersForNotificationTargets()
        if (u.success && u.data) setUsers(u.data)
    }

    useEffect(() => {
        void load()
    }, [])

    useEffect(() => {
        if (canAcademy && !canSystem) {
            setSendScope("ACADEMY")
            setFromScope("ACADEMY")
        } else if (canSystem && !canAcademy) {
            setSendScope("SYSTEM")
            setFromScope("SYSTEM")
        }
    }, [canAcademy, canSystem])

    const showSystemAudiences = canSystem && sendScope === "SYSTEM"
    const showAcademyAudiences =
        (canSystem && sendScope === "ACADEMY") || (!canSystem && canAcademy)

    const showFromSystemAudiences = canSystem && fromScope === "SYSTEM"
    const showFromAcademyAudiences =
        (canSystem && fromScope === "ACADEMY") || (!canSystem && canAcademy)

    useEffect(() => {
        setAudience("ALL")
    }, [sendScope])

    useEffect(() => {
        setFromAudience("ALL")
    }, [fromScope])

    const handleSaveTemplate = async () => {
        const res = await adminSaveNotificationTemplate(tplKey, tplTitle, tplBody)
        if (res.success && res.data) {
            toast.success("템플릿이 저장되었습니다.")
            setTemplates((prev) => {
                const ix = prev.findIndex((x) => x.templateKey === res.data!.templateKey)
                if (ix >= 0) {
                    const next = [...prev]
                    next[ix] = res.data!
                    return next
                }
                return [...prev, res.data!]
            })
            return
        }
        toast.error(!res.success ? res.error : "저장 실패")
    }

    const handleSendDirect = async () => {
        const tid =
            audience === "USER" && targetUserId ? Number(targetUserId) : null
        if (audience === "USER" && (!tid || Number.isNaN(tid))) {
            toast.error("특정 사용자를 선택하세요.")
            return
        }
        const res = await adminSendNotification(
            sendTitle,
            sendBody,
            sendScope,
            audience as NotificationAudience,
            tid,
        )
        if (res.success) {
            toast.success("알림을 발송했습니다.")
            setSendTitle("")
            setSendBody("")
        } else toast.error(res.error ?? "발송 실패")
    }

    const handleSendFromTpl = async () => {
        const tid =
            fromAudience === "USER" && fromTarget ? Number(fromTarget) : null
        if (fromAudience === "USER" && (!tid || Number.isNaN(tid))) {
            toast.error("특정 사용자를 선택하세요.")
            return
        }
        const res = await adminSendFromTemplate(
            fromTplKey,
            fromScope,
            fromAudience as NotificationAudience,
            tid,
        )
        if (res.success) toast.success("템플릿으로 알림을 발송했습니다.")
        else toast.error(res.error ?? "발송 실패")
    }

    const fillEdit = (row: NotificationTemplateRow) => {
        setTplKey(row.templateKey)
        setTplTitle(row.title)
        setTplBody(row.body)
    }

    return (
        <div className="relative h-[calc(100vh-140px)] p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border shadow-[0_8px_32px_rgba(130,170,227,0.18)] dark:border-[#343A50] dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Bell className="h-5 w-5" />
                        알림 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-[3px] p-4 overflow-auto">
                    <div
                        className="grid w-full max-w-md grid-cols-3 h-9 mb-[3px] bg-muted/40 dark:bg-gray-800/60 border border-[#343637] dark:border-[#6b7280] p-1 gap-1"
                        role="tablist"
                        aria-label="알림 관리 구역"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "templates"}
                            className={cn(tabBtn, tab === "templates" ? tabBtnActive : tabBtnIdle)}
                            onClick={() => setTab("templates")}
                        >
                            템플릿
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "send"}
                            className={cn(tabBtn, tab === "send" ? tabBtnActive : tabBtnIdle)}
                            onClick={() => setTab("send")}
                        >
                            직접 발송
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "fromtpl"}
                            className={cn(tabBtn, tab === "fromtpl" ? tabBtnActive : tabBtnIdle)}
                            onClick={() => setTab("fromtpl")}
                        >
                            템플릿 발송
                        </button>
                    </div>

                    {tab === "templates" && (
                        <div className="space-y-4 mt-0">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2 rounded-3xl border border-[#343637] dark:border-[#343A50] p-4 bg-card">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        템플릿 편집
                                    </h3>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">템플릿 키 (고유)</Label>
                                        <Input
                                            className="h-9 text-xs bg-card border-[#343637] dark:border-[#6b7280]"
                                            value={tplKey}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setTplKey(e.target.value)
                                            }
                                            placeholder="예: GENERAL_INFO"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">제목</Label>
                                        <Input
                                            className="h-9 text-xs bg-card border-[#343637] dark:border-[#6b7280]"
                                            value={tplTitle}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                setTplTitle(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground">본문</Label>
                                        <Textarea
                                            className="min-h-[100px] text-xs bg-card border-[#343637] dark:border-[#6b7280] resize-none"
                                            value={tplBody}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                                setTplBody(e.target.value)
                                            }
                                        />
                                    </div>
                                    <Button type="button" className="h-9" onClick={() => void handleSaveTemplate()}>
                                        저장
                                    </Button>
                                </div>
                                <div className="space-y-2 rounded-3xl border border-[#343637] dark:border-[#343A50] p-4 bg-card overflow-auto max-h-[360px]">
                                    <h3 className="text-sm font-bold">등록된 템플릿</h3>
                                    <ul className="space-y-2 text-xs">
                                        {templates.map((row) => (
                                            <li
                                                key={row.id}
                                                className="rounded-md border border-[#343637] dark:border-[#6b7280] p-2 flex flex-col gap-1"
                                            >
                                                <span className="font-mono font-semibold">{row.templateKey}</span>
                                                <span className="text-muted-foreground line-clamp-2">{row.title}</span>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 w-fit text-xs"
                                                    onClick={() => fillEdit(row)}
                                                >
                                                    불러오기
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "send" && (
                        <div className="space-y-3 max-w-xl mt-0">
                            <p className="text-xs text-muted-foreground leading-snug">
                                전역 관리자(DB에서 소속 학원 없음): 모든 학원에 공통 알림 · 학원 관리자: 본인 학원 내에서만 발송합니다.
                            </p>
                            {canSystem && canAcademy && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">알림 구분</Label>
                                    <Select
                                        value={sendScope}
                                        onValueChange={(v) => setSendScope(v as NotificationScope)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM">전역(모든 학원)</SelectItem>
                                            <SelectItem value="ACADEMY">학원(소속 학원만)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {canSystem && !canAcademy && (
                                <p className="text-xs font-semibold text-foreground">전역(시스템) 알림</p>
                            )}
                            {!canSystem && canAcademy && (
                                <p className="text-xs font-semibold text-foreground">학원 알림 (소속 학원만)</p>
                            )}
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">수신 대상</Label>
                                <Select value={audience} onValueChange={setAudience}>
                                    <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {showSystemAudiences ? (
                                            <>
                                                <SelectItem value="ALL">전체 사용자</SelectItem>
                                                <SelectItem value="ALL_ADMINS">모든 학원의 관리자</SelectItem>
                                                <SelectItem value="USER">특정 사용자 1명</SelectItem>
                                            </>
                                        ) : showAcademyAudiences ? (
                                            <>
                                                <SelectItem value="ALL">학원 전체</SelectItem>
                                                <SelectItem value="ADMINS">학원 관리자만</SelectItem>
                                                <SelectItem value="DIRECTORS">원장(디렉터)만</SelectItem>
                                                <SelectItem value="TEACHERS">교사만</SelectItem>
                                                <SelectItem value="USER">특정 사용자 1명</SelectItem>
                                            </>
                                        ) : null}
                                    </SelectContent>
                                </Select>
                            </div>
                            {audience === "USER" && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">사용자</Label>
                                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                                        <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                            <SelectValue placeholder="선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name} ({u.loginId})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">제목</Label>
                                <Input
                                    className="h-9 text-xs bg-card border-[#343637] dark:border-[#6b7280]"
                                    value={sendTitle}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setSendTitle(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">내용</Label>
                                <Textarea
                                    className="min-h-[120px] text-xs bg-card border-[#343637] dark:border-[#6b7280] resize-none"
                                    value={sendBody}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                        setSendBody(e.target.value)
                                    }
                                />
                            </div>
                            <Button
                                type="button"
                                className="h-9 gap-2"
                                onClick={() => void handleSendDirect()}
                            >
                                <Send className="h-4 w-4" />
                                발송
                            </Button>
                        </div>
                    )}

                    {tab === "fromtpl" && (
                        <div className="space-y-3 max-w-xl mt-0">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">템플릿</Label>
                                <Select value={fromTplKey} onValueChange={setFromTplKey}>
                                    <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                        <SelectValue placeholder="선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((row) => (
                                            <SelectItem key={row.id} value={row.templateKey}>
                                                {row.templateKey} — {row.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {canSystem && canAcademy && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">알림 구분</Label>
                                    <Select
                                        value={fromScope}
                                        onValueChange={(v) => setFromScope(v as NotificationScope)}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM">전역(모든 학원)</SelectItem>
                                            <SelectItem value="ACADEMY">학원(소속 학원만)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">수신 대상</Label>
                                <Select value={fromAudience} onValueChange={setFromAudience}>
                                    <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {showFromSystemAudiences ? (
                                            <>
                                                <SelectItem value="ALL">전체 사용자</SelectItem>
                                                <SelectItem value="ALL_ADMINS">모든 학원의 관리자</SelectItem>
                                                <SelectItem value="USER">특정 사용자 1명</SelectItem>
                                            </>
                                        ) : showFromAcademyAudiences ? (
                                            <>
                                                <SelectItem value="ALL">학원 전체</SelectItem>
                                                <SelectItem value="ADMINS">학원 관리자만</SelectItem>
                                                <SelectItem value="DIRECTORS">원장(디렉터)만</SelectItem>
                                                <SelectItem value="TEACHERS">교사만</SelectItem>
                                                <SelectItem value="USER">특정 사용자 1명</SelectItem>
                                            </>
                                        ) : null}
                                    </SelectContent>
                                </Select>
                            </div>
                            {fromAudience === "USER" && (
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">사용자</Label>
                                    <Select value={fromTarget} onValueChange={setFromTarget}>
                                        <SelectTrigger className="h-9 text-xs border-[#343637] dark:border-[#6b7280] bg-card">
                                            <SelectValue placeholder="선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name} ({u.loginId})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button type="button" className="h-9 gap-2" onClick={() => void handleSendFromTpl()}>
                                <Send className="h-4 w-4" />
                                템플릿으로 발송
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
