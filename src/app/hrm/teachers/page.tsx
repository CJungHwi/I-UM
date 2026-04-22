import { User, ClipboardCheck, Clock, Award } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeachersPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <User className="h-5 w-5 text-primary" />
                        강사 프로필 및 근태
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">강사 프로필</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        강사별 전문 분야, 담당 과목을 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">근태 관리</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        출퇴근 기록 및 휴가/대체 강사를 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <ClipboardCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">업무 체크리스트</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        일일 업무 이행률을 추적합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            강사 데이터를 연결하면 이곳에 프로필과 근태 현황이 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
