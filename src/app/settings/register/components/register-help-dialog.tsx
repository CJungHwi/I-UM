"use client"

import { HelpCircle } from "lucide-react"

import { HelpDialog } from "@/components/help-dialog"

export function RegisterHelpDialog() {
    return (
        <HelpDialog
            title="회원가입 화면 사용법"
            description="신규 학원 관리자 가입과 초대 코드로 담당자 가입하는 방법입니다."
            triggerLabel="회원가입 사용법 보기"
            triggerClassName="fixed left-4 top-4 z-30"
        >
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    1단계 · 가입 방식 선택
                </h3>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>
                        <strong className="text-foreground">신규 학원 생성 (Admin)</strong>: 새 학원을 만들고 그
                        학원의 관리자 계정으로 신청합니다. <strong className="text-foreground">시스템(Super)
                        관리자</strong>가 승인하면 로그인할 수 있고, 메시지에 표시되는{" "}
                        <strong className="text-foreground">초대 코드</strong>를 담당자에게 전달합니다.
                    </li>
                    <li>
                        <strong className="text-foreground">초대 코드로 가입 (Staff)</strong>: 이미 등록된 학원에서
                        받은 초대 코드로 담당자·강사 계정을 신청합니다.{" "}
                        <strong className="text-foreground">해당 학원 원장(학원 Admin)</strong>이 승인하면 로그인할
                        수 있습니다.
                    </li>
                </ul>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    신규 학원 (Admin) 입력
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                    학원 이름과 관리자 아이디·비밀번호 등을 입력한 뒤 가입 신청합니다.{" "}
                    <strong className="text-foreground">시스템(Super) 관리자</strong>가 승인하면 로그인할 수
                    있으며, 완료 메시지에 표시되는 <strong className="text-foreground">초대 코드</strong>를 학원
                    담당자에게 전달해 주세요.
                </p>
            </section>
            <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    초대 코드 (Staff) 입력
                </h3>
                <ol className="list-decimal space-y-1 pl-4 text-muted-foreground leading-relaxed">
                    <li>관리자에게 받은 초대 코드를 입력합니다.</li>
                    <li>
                        <strong className="text-foreground">학원 확인</strong>을 눌러 소속 학원 이름이 맞는지
                        확인합니다.
                    </li>
                    <li>아이디·이름·비밀번호를 입력하고 가입 신청합니다.</li>
                    <li>
                        <strong className="text-foreground">해당 학원 원장(학원 Admin)</strong>이 승인하면 로그인할
                        수 있습니다.
                    </li>
                </ol>
            </section>
            <section className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/15">
                <div className="flex gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <p>
                        가입이 되지 않으면 DB에 초대 코드 컬럼·가입용 프로시저가 적용되어 있는지 확인하세요.
                        저장소의{" "}
                        <code className="rounded bg-background px-1 py-0.5 text-[10px]">
                            prisma/migrations/add_ium_academy_invite_register_paths.sql
                        </code>{" "}
                        및{" "}
                        <code className="rounded bg-background px-1 py-0.5 text-[10px]">
                            prisma/procedures/ium_register_extensions.sql
                        </code>{" "}
                        안내를 참고하면 됩니다.
                    </p>
                </div>
            </section>
        </HelpDialog>
    )
}
