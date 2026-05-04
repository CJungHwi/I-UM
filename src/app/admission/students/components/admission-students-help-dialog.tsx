"use client"

import { Button } from "@/components/ui/button"
import { HelpDialog } from "@/components/help-dialog"

export function AdmissionStudentsHelpDialog() {
    return (
        <HelpDialog
            title="재원생 명부 화면 사용법"
            description="학생 목록·상세·카드·테이블 뷰 사용 방법"
            triggerLabel="재원생 명부 화면 사용법 열기"
            trigger={
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full border-border text-sm font-bold"
                    aria-label="재원생 명부 화면 사용법 열기"
                >
                    <span aria-hidden>?</span>
                </Button>
            }
        >
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    학원·권한
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">시스템·학원 관리자</strong>는 상단에서 학원을 선택해 해당
                    학원 재원생만 조회합니다. <strong className="text-foreground">학생 추가</strong>는 관리자 권한이
                    있을 때만 표시됩니다.
                </p>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    목록·뷰 전환
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>
                        <strong className="text-foreground">카드</strong> / <strong className="text-foreground">표</strong>{" "}
                        전환으로 같은 데이터를 다른 형태로 볼 수 있습니다.
                    </li>
                    <li>
                        재학 상태·이름 등 검색, <strong className="text-foreground">관심 태그</strong>로 필터링할 수
                        있습니다.
                    </li>
                    <li>
                        <strong className="text-foreground">학년·접수 경로</strong>는 공통 코드에서 선택합니다. (코드
                        기준으로 향후 학년 자동 승급 등에 활용할 수 있습니다.)
                    </li>
                </ul>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    상세·타임라인
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>
                        <strong className="text-foreground">좌측</strong>에서 학생을 선택하면{" "}
                        <strong className="text-foreground">우측</strong>에 상세가 열립니다. 보호자·형제 관계·메모
                        등을 확인·수정합니다.
                    </li>
                    <li>
                        탭에서 <strong className="text-foreground">타임라인</strong>으로 등록·상담·상태 변경 이력을
                        볼 수 있습니다.
                    </li>
                </ul>
            </section>
        </HelpDialog>
    )
}
