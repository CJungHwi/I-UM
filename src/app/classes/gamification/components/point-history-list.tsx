"use client"

import { Clock, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/ko"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PointHistory } from "@/types/gamification"
import { REASON_LABELS } from "@/types/gamification"

dayjs.extend(relativeTime)
dayjs.locale("ko")

interface PointHistoryListProps {
    history: PointHistory[]
}

export function PointHistoryList({ history }: PointHistoryListProps) {
    return (
        <Card className="rounded-3xl border border-border shadow-card flex flex-col">
            <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0 shrink-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 leading-none">
                    <Clock className="h-4 w-4 text-primary" />
                    포인트 히스토리
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full max-h-[320px]">
                    {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                            포인트 기록이 없습니다.
                        </p>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {history.map((item) => {
                                const isPositive = item.pointAmount > 0
                                return (
                                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            isPositive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                                        }`}>
                                            {isPositive ? (
                                                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{item.reasonText}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {REASON_LABELS[item.reasonCode] || item.reasonCode}
                                                {" · "}
                                                {dayjs(item.createdAt).fromNow()}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold shrink-0 ${
                                            isPositive ? "text-emerald-500" : "text-red-500"
                                        }`}>
                                            {isPositive ? "+" : ""}{item.pointAmount}P
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
