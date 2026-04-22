import { Users, UserCheck, Heart } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentsPage() {
    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <Users className="h-5 w-5 text-primary" />
                        재원생 명부
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <UserCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">학생 상세 프로필</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        학생별 기본 정보, 연락처, 수강 이력을 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-border shadow-card">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Heart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">형제 관계</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        형제/자매 관계를 등록하여 가족 단위로 관리합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            학생 데이터를 연결하면 이곳에 명부가 표시됩니다.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
