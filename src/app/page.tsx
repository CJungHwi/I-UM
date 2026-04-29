import {
    Activity,
    AlertTriangle,
    Building2,
    Calendar,
    Bus,
    CreditCard,
    FileSearch,
    GraduationCap,
    MonitorCog,
    Server,
    ShieldCheck,
    TrendingUp,
    Users,
    Clock,
} from "lucide-react"
import type { ReactNode } from "react"

import { auth } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
    const session = await auth()
    if (session?.user?.role === "SYSTEM_ADMIN") {
        return <SystemDashboard />
    }

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
    icon: ReactNode
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

function SystemDashboard() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                <Card className="rounded-3xl border border-border bg-card shadow-card dark:border-[#343A50] dark:shadow-none">
                    <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                            <MonitorCog className="h-5 w-5 text-primary" />
                            시스템 대시보드
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            전체 학원 서비스의 운영 상태, 사용량, 보안 이벤트를 확인하는 시스템 관리자 전용 화면입니다.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        icon={<Building2 className="h-5 w-5 text-primary" />}
                        title="등록 학원"
                        value="--"
                        description="전체/활성 학원"
                    />
                    <SummaryCard
                        icon={<Users className="h-5 w-5 text-emerald-500" />}
                        title="전체 사용자"
                        value="--"
                        description="승인/대기 계정"
                    />
                    <SummaryCard
                        icon={<Activity className="h-5 w-5 text-amber-500" />}
                        title="트래픽"
                        value="--"
                        description="오늘 요청량"
                    />
                    <SummaryCard
                        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                        title="시스템 경고"
                        value="--"
                        description="확인 필요 이벤트"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <SystemPanel
                        icon={<Server className="h-5 w-5 text-primary" />}
                        title="인프라 상태"
                        description="서버, DB, 외부 연동 서비스 상태를 실시간 지표로 연결할 예정입니다."
                    />
                    <SystemPanel
                        icon={<FileSearch className="h-5 w-5 text-primary" />}
                        title="최근 사용 로그"
                        description="로그인, 권한 변경, 학원 등록 같은 주요 이벤트를 감사 로그로 추적합니다."
                    />
                    <SystemPanel
                        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                        title="관리자 통제"
                        description="학원 등록과 학원관리자 지정 현황을 시스템 범위에서 관리합니다."
                    />
                </div>
            </div>
        </div>
    )
}

function SystemPanel({
    icon,
    title,
    description,
}: {
    icon: ReactNode
    title: string
    description: string
}) {
    return (
        <Card className="flex flex-col rounded-3xl border border-border bg-card shadow-card dark:border-[#343A50] dark:shadow-none">
            <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center space-y-0">
                <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
