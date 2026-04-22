import { CheckCircle, Clock, BarChart3, UserCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AttendancePage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        출결 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard
                            icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
                            title="오늘 출석"
                            value="--"
                        />
                        <SummaryCard
                            icon={<Clock className="h-5 w-5 text-amber-500" />}
                            title="지각/조퇴"
                            value="--"
                        />
                        <SummaryCard
                            icon={<BarChart3 className="h-5 w-5 text-primary" />}
                            title="출석률"
                            value="--%"
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            실시간 등하원 체크 및 출결 통계가 이곳에 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SummaryCard({
    icon,
    title,
    value,
}: {
    icon: React.ReactNode
    title: string
    value: string
}) {
    return (
        <Card className="rounded-3xl border border-border shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
