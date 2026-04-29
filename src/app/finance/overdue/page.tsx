import { AlertTriangle, Bell, Send, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OverduePage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        미납자 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard
                            icon={<Users className="h-5 w-5 text-destructive" />}
                            title="미납 학생"
                            value="--명"
                        />
                        <SummaryCard
                            icon={<Bell className="h-5 w-5 text-amber-500" />}
                            title="알림 발송 대기"
                            value="--건"
                        />
                        <SummaryCard
                            icon={<Send className="h-5 w-5 text-primary" />}
                            title="이번 달 발송 완료"
                            value="--건"
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            미납 데이터를 연결하면 이곳에 미납자 목록과 자동 독촉 알림 설정이 표시됩니다.
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
