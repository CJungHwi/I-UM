import { Calculator, TrendingDown, FileBarChart } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AccountingPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Calculator className="h-5 w-5 text-primary" />
                        지출 / 결산
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <TrendingDown className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">지출 내역</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        카테고리별 지출을 기록하고 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileBarChart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">월간 손익 리포트</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        월별 수입/지출 대비 손익 현황을 분석합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            재무 데이터를 연결하면 이곳에 결산 리포트가 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
