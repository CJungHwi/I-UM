import { UserPlus, Search, Phone, FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProspectsPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <UserPlus className="h-5 w-5 text-primary" />
                        가망 고객 / 상담 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard
                            icon={<Phone className="h-5 w-5 text-primary" />}
                            title="입학 상담"
                            description="신규 상담 접수 및 상담 이력을 관리합니다."
                        />
                        <InfoCard
                            icon={<FileText className="h-5 w-5 text-primary" />}
                            title="레벨 테스트"
                            description="레벨 테스트 일정 및 결과를 기록합니다."
                        />
                        <InfoCard
                            icon={<Search className="h-5 w-5 text-primary" />}
                            title="상담 현황"
                            description="상담 진행 상태를 한눈에 확인합니다."
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            상담 데이터를 연결하면 이곳에 목록이 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function InfoCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <Card className="rounded-3xl border border-border shadow-card">
            <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
