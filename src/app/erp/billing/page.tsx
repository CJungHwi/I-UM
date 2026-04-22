import { CreditCard, Receipt, Percent, RefreshCw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <CreditCard className="h-5 w-5 text-primary" />
                        청구 / 수납 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Receipt className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">청구서 발행</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        월별 수강료 청구서를 생성합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Percent className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">자동 할인 적용</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        형제 할인, 장기 수강 할인 등을 자동 적용합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">구독 결제 현황</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        정기 결제 상태를 모니터링합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            수납 데이터를 연결하면 이곳에 청구/수납 현황이 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
