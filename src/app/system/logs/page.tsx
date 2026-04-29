import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { FileSearch, KeyRound, ListChecks, UserRoundSearch } from "lucide-react"

import { auth } from "@/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
    title: "사용 로그 | 이음(I-UM)",
    description: "시스템 접근과 주요 작업 이력을 확인합니다.",
}

const logScopes = [
    {
        title: "로그인 이력",
        description: "계정별 로그인 성공·실패, 접속 학원, 접속 시간을 확인합니다.",
        icon: KeyRound,
    },
    {
        title: "주요 작업 로그",
        description: "학원 등록, 사용자 승인, 역할 변경 같은 관리자 작업을 추적합니다.",
        icon: ListChecks,
    },
    {
        title: "사용자 추적",
        description: "특정 사용자 기준의 메뉴 접근과 변경 이력을 조회합니다.",
        icon: UserRoundSearch,
    },
]

export default async function SystemLogsPage() {
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
                        <FileSearch className="h-5 w-5 text-primary" />
                        사용 로그
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-auto">
                    {logScopes.map((item) => {
                        const Icon = item.icon
                        return (
                            <Card
                                key={item.title}
                                className="rounded-3xl border border-border shadow-card dark:border-[#343A50] dark:shadow-none"
                            >
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{item.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.description}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-3">
                                            감사 로그 저장소 연결 후 조회 테이블로 확장됩니다.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
