import { redirect } from "next/navigation"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Activity, Gauge, Network, Server } from "lucide-react"

import { auth } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
    title: "트래픽 현황 | 이음(I-UM)",
    description: "시스템 트래픽과 인프라 상태를 확인합니다.",
}

export default async function SystemTrafficPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    if (session.user.role !== "SYSTEM_ADMIN") {
        redirect("/")
    }

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Activity className="h-5 w-5 text-primary" />
                        트래픽 현황
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto">
                    <StatusCard
                        icon={<Gauge className="h-5 w-5 text-primary" />}
                        title="요청량"
                        description="시간대별 요청 수와 응답 시간을 집계합니다."
                    />
                    <StatusCard
                        icon={<Server className="h-5 w-5 text-primary" />}
                        title="서버 상태"
                        description="서버 리소스, 오류율, 배포 상태를 표시합니다."
                    />
                    <StatusCard
                        icon={<Network className="h-5 w-5 text-primary" />}
                        title="외부 연동"
                        description="DB, 알림, 결제 등 외부 서비스 연결 상태를 확인합니다."
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function StatusCard({
    icon,
    title,
    description,
}: {
    icon: ReactNode
    title: string
    description: string
}) {
    return (
        <Card className="rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none">
            <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    <p className="text-[11px] text-muted-foreground mt-3">
                        수집 프로시저와 로그 테이블 연결 후 실측 값으로 대체됩니다.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
