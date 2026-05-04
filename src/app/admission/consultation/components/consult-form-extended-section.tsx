"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ConsultUpdateInput } from "@/types/consultation"

type ExtendedKey = keyof Pick<
    ConsultUpdateInput,
    | "channelDetail"
    | "consultSchool"
    | "priorAcademyNote"
    | "withdrawReason"
    | "subjectInterestNote"
    | "parentEducationView"
    | "childPersonalityNote"
    | "specialRequests"
    | "notRegisteredReason"
    | "nextContactAt"
>

interface ConsultFormExtendedSectionProps {
    form: ConsultUpdateInput
    onChange: <K extends ExtendedKey>(key: K, value: ConsultUpdateInput[K]) => void
}

export const ConsultFormExtendedSection = ({
    form,
    onChange,
}: ConsultFormExtendedSectionProps) => {
    const nextLocal = React.useMemo(() => {
        const raw = form.nextContactAt
        if (!raw) return ""
        if (raw.includes("T")) return raw.slice(0, 16)
        return `${raw.slice(0, 10)}T09:00`
    }, [form.nextContactAt])

    const handleNextChange = (v: string) => {
        if (!v) {
            onChange("nextContactAt", null)
            return
        }
        onChange("nextContactAt", v.length >= 16 ? `${v}:00` : v)
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/10 p-3">
            <p className="text-xs font-bold text-foreground">관리 포인트 (상세)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">
                        유입 경로 상세 (당근·인스타·소개자명 등)
                    </Label>
                    <Input
                        className="h-9 text-xs bg-card"
                        value={form.channelDetail ?? ""}
                        onChange={(e) => onChange("channelDetail", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">학교</Label>
                    <Input
                        className="h-9 text-xs bg-card"
                        value={form.consultSchool ?? ""}
                        onChange={(e) => onChange("consultSchool", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">다음 연락 예정</Label>
                    <Input
                        type="datetime-local"
                        className="h-9 text-xs bg-card"
                        value={nextLocal}
                        onChange={(e) => handleNextChange(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">
                        기존 학원 수강 이력
                    </Label>
                    <Textarea
                        className="text-xs bg-card resize-none min-h-[56px]"
                        rows={2}
                        value={form.priorAcademyNote ?? ""}
                        onChange={(e) => onChange("priorAcademyNote", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">퇴원 사유</Label>
                    <Input
                        className="h-9 text-xs bg-card"
                        value={form.withdrawReason ?? ""}
                        onChange={(e) => onChange("withdrawReason", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">과목별 흥미도</Label>
                    <Textarea
                        className="text-xs bg-card resize-none min-h-[56px]"
                        rows={2}
                        value={form.subjectInterestNote ?? ""}
                        onChange={(e) => onChange("subjectInterestNote", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">학부모 교육관</Label>
                    <Textarea
                        className="text-xs bg-card resize-none min-h-[56px]"
                        rows={2}
                        value={form.parentEducationView ?? ""}
                        onChange={(e) => onChange("parentEducationView", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">아이 성격·기질</Label>
                    <Textarea
                        className="text-xs bg-card resize-none min-h-[56px]"
                        rows={2}
                        value={form.childPersonalityNote ?? ""}
                        onChange={(e) => onChange("childPersonalityNote", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">특이 요청사항</Label>
                    <Textarea
                        className="text-xs bg-card resize-none min-h-[56px]"
                        rows={2}
                        value={form.specialRequests ?? ""}
                        onChange={(e) => onChange("specialRequests", e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label className="text-[11px] text-muted-foreground">미등록 사유</Label>
                    <Input
                        className="h-9 text-xs bg-card"
                        value={form.notRegisteredReason ?? ""}
                        onChange={(e) => onChange("notRegisteredReason", e.target.value)}
                    />
                </div>
            </div>
        </div>
    )
}
