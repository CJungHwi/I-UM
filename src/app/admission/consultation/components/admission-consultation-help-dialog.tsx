"use client"

import { Button } from "@/components/ui/button"
import { HelpDialog } from "@/components/help-dialog"

export function AdmissionConsultationHelpDialog() {
    return (
        <HelpDialog
            title="상담 관리 화면 사용법"
            description="입학 상담 접수·상태 관리·등록 전환 방법"
            triggerLabel="상담 관리 화면 사용법 열기"
            trigger={
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full border-border text-sm font-bold"
                    aria-label="상담 관리 화면 사용법 열기"
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
                    <strong className="text-foreground">시스템·학원 관리자</strong>는 상단에서{" "}
                    <strong className="text-foreground">학원</strong>을 바꿔 해당 학원의 상담 건만 볼 수 있습니다.
                    일반 담당자는 소속 학원 데이터만 표시됩니다.
                </p>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    목록과 상세
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>
                        <strong className="text-foreground">좌측</strong>에서 상담 행을 선택하면{" "}
                        <strong className="text-foreground">우측</strong>에 상세가 열립니다. 연락처·메모·상태 등을
                        확인·수정할 수 있습니다.
                    </li>
                    <li>
                        상단 <strong className="text-foreground">통계 카드</strong>로 신규·상담중·등록 등 건수를
                        한눈에 볼 수 있습니다.
                    </li>
                </ul>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    검색·추가·상태
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>검색어와 상태 필터로 목록을 좁힙니다.</li>
                    <li>
                        <strong className="text-foreground">추가</strong>로 신규 상담을 등록합니다. (권한에 따라
                        버튼이 보이지 않을 수 있습니다.)
                    </li>
                    <li>
                        <strong className="text-foreground">학년</strong>은 공통 코드(초·중·고)에서 선택하며, DB에는
                        코드값이 저장됩니다. 재원생 명부의 학년 코드와 동일합니다.
                    </li>
                </ul>
            </section>
        </HelpDialog>
    )
}
