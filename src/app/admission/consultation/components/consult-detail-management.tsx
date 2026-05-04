"use client"

import * as React from "react"

import type { ConsultDetail } from "@/types/consultation"

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-xs whitespace-pre-line">{children}</span>
        </div>
    )
}

interface ConsultDetailManagementProps {
    consult: ConsultDetail
}

export const ConsultDetailManagement = ({
    consult,
}: ConsultDetailManagementProps) => {
    return (
        <div className="rounded-xl border border-border bg-muted/15 p-3 flex flex-col gap-3">
            <p className="text-xs font-bold text-foreground">학생 진단 · 상담 일지 · 사후 관리</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="기존 학원 이력">{consult.priorAcademyNote ?? "—"}</Field>
                <Field label="퇴원 사유">{consult.withdrawReason ?? "—"}</Field>
                <Field label="과목별 흥미도">{consult.subjectInterestNote ?? "—"}</Field>
                <Field label="학부모 교육관">{consult.parentEducationView ?? "—"}</Field>
                <Field label="아이 성격">{consult.childPersonalityNote ?? "—"}</Field>
                <Field label="특이 요청">{consult.specialRequests ?? "—"}</Field>
                <Field label="미등록 사유">{consult.notRegisteredReason ?? "—"}</Field>
            </div>
        </div>
    )
}
