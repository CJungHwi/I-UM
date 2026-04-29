"use client"

import {
    Award, Star, Trophy, Crown, BookOpen,
    Footprints, Calendar, Target, Gift,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import dayjs from "dayjs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Badge } from "@/types/gamification"
import { BADGE_COLOR_MAP } from "@/types/gamification"

const ICON_MAP: Record<string, LucideIcon> = {
    Award, Star, Trophy, Crown, BookOpen,
    Footprints, Calendar, Target, Gift,
}

interface BadgeGridProps {
    earned: Badge[]
    allBadges: Badge[]
}

export function BadgeGrid({ earned, allBadges }: BadgeGridProps) {
    const earnedIds = new Set(earned.map((b) => b.badgeId))

    return (
        <Card className="rounded-3xl border border-border shadow-card">
            <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 leading-none">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    배지 컬렉션
                    <span className="text-xs text-muted-foreground font-normal">
                        ({earned.length}/{allBadges.length})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {allBadges.map((badge) => {
                        const isEarned = earnedIds.has(badge.badgeId)
                        const earnedBadge = earned.find((e) => e.badgeId === badge.badgeId)
                        const Icon = ICON_MAP[badge.badgeIcon] || Award
                        const colors = BADGE_COLOR_MAP[badge.badgeColor] || BADGE_COLOR_MAP.amber

                        return (
                            <Tooltip key={badge.badgeId}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all cursor-default ${
                                            isEarned
                                                ? `${colors.bg} ring-1 ${colors.ring}`
                                                : "bg-muted/20 opacity-40 grayscale"
                                        }`}
                                    >
                                        <div
                                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                                isEarned ? colors.bg : "bg-muted/40"
                                            }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${
                                                    isEarned ? colors.text : "text-muted-foreground"
                                                }`}
                                            />
                                        </div>
                                        <span className="text-[10px] font-semibold text-center leading-tight">
                                            {badge.badgeName}
                                        </span>
                                        {isEarned && (
                                            <div className="absolute inset-0 rounded-2xl animate-badge-shine pointer-events-none" />
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-semibold text-sm">{badge.badgeName}</p>
                                    <p className="text-xs text-muted-foreground">{badge.badgeDesc}</p>
                                    {badge.reqPoint && (
                                        <p className="text-xs text-amber-500 mt-1">{badge.reqPoint}P 달성 시 자동 부여</p>
                                    )}
                                    {isEarned && earnedBadge?.earnedAt && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            획득: {dayjs(earnedBadge.earnedAt).format("YYYY-MM-DD")}
                                        </p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
