import {
    Users,
    AlertTriangle,
    Calendar,
    Bus,
    TrendingUp,
    CreditCard,
    GraduationCap,
    Clock,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {/* 상단 요약 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={<Users className="h-5 w-5 text-primary" />}
                        title="재원생 수"
                        value="--"
                        description="현재 등록 학생"
                    />
                    <SummaryCard
                        icon={<CreditCard className="h-5 w-5 text-amber-500" />}
                        title="미납 현황"
                        value="--"
                        description="이번 달 미납 건수"
                    />
                    <SummaryCard
                        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                        title="퇴원 위험"
                        value="--"
                        description="주의 필요 학생"
                    />
                    <SummaryCard
                        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                        title="이번 달 매출"
                        value="--"
                        description="전월 대비"
                    />
                </div>

                {/* 오늘의 스케줄 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="flex flex-col rounded-3xl border border-border shadow-card">
                        <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                오늘의 수업
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            <p className="text-sm text-muted-foreground">등록된 수업이 없습니다.</p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col rounded-3xl border border-border shadow-card">
                        <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                                <Clock className="h-5 w-5 text-primary" />
                                오늘의 상담
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            <p className="text-sm text-muted-foreground">예정된 상담이 없습니다.</p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col rounded-3xl border border-border shadow-card">
                        <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                                <Bus className="h-5 w-5 text-primary" />
                                오늘의 차량
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            <p className="text-sm text-muted-foreground">등록된 차량 운행이 없습니다.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 최근 알림 & 캘린더 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="flex flex-col rounded-3xl border border-border shadow-card">
                        <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                최근 알림
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            <p className="text-sm text-muted-foreground">새로운 알림이 없습니다.</p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col rounded-3xl border border-border shadow-card">
                        <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                                <Calendar className="h-5 w-5 text-primary" />
                                이번 주 일정
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            <p className="text-sm text-muted-foreground">등록된 일정이 없습니다.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function SummaryCard({
    icon,
    title,
    value,
    description,
}: {
    icon: React.ReactNode
    title: string
    value: string
    description: string
}) {
    return (
        <Card className="rounded-3xl border border-border shadow-card">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
