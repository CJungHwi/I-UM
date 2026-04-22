import { Bus, MapPin, Navigation, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ShuttlePage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Bus className="h-5 w-5 text-primary" />
                        셔틀버스 관리
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">노선 설정</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        셔틀버스 노선과 정류장을 설정합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Navigation className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">실시간 위치</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        셔틀버스 현재 위치를 실시간으로 확인합니다.
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
                                    <p className="text-sm font-semibold">운행 시간표</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        노선별 운행 시간을 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            셔틀버스 데이터를 연결하면 이곳에 운행 현황이 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
