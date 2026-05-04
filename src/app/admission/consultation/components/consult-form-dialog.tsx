"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { IumAcademyOption } from "@/types/ium-user"
import type { IumCodeRow } from "@/types/ium-code"
import type {
    ConsultDetail,
    ConsultSource,
    ConsultUpdateInput,
} from "@/types/consultation"
import { CONSULT_SOURCE_LABEL } from "@/types/consultation"
import {
    createConsultation,
    updateConsultation,
} from "@/actions/consultation-actions"
import { ConsultFormExtendedSection } from "./consult-form-extended-section"

interface ConsultFormDialogProps {
    open: boolean
    mode: "create" | "edit"
    initial: ConsultDetail | null
    academies: IumAcademyOption[]
    gradeCodes: IumCodeRow[]
    isAdmin: boolean
    userAcademyId: number | null
    onOpenChange: (open: boolean) => void
    onSaved: (savedId?: number) => void | Promise<void>
}

interface FormState extends ConsultUpdateInput {
    academyId: number | null
}

const SOURCES: ConsultSource[] = [
    "PHONE",
    "WEB",
    "VISIT",
    "SNS",
    "REFERRAL",
    "OTHER",
]

const SELECT_GRADE_EMPTY = "__none__"

function nowLocal(): string {
    return dayjs().format("YYYY-MM-DDTHH:mm")
}

const INIT_FORM: FormState = {
    academyId: null,
    source: "PHONE",
    channelDetail: "",
    contactName: "",
    contactPhone: "",
    studentName: "",
    grade: "",
    consultSchool: "",
    subject: "",
    preferSchedule: "",
    memo: "",
    priorAcademyNote: "",
    withdrawReason: "",
    subjectInterestNote: "",
    parentEducationView: "",
    childPersonalityNote: "",
    specialRequests: "",
    notRegisteredReason: "",
    nextContactAt: null,
    counselorUserId: null,
    requestedAt: nowLocal(),
}

export function ConsultFormDialog({
    open,
    mode,
    initial,
    academies,
    gradeCodes,
    isAdmin,
    userAcademyId,
    onOpenChange,
    onSaved,
}: ConsultFormDialogProps) {
    const [form, setForm] = React.useState<FormState>(INIT_FORM)
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (mode === "edit" && initial) {
            setForm({
                academyId: initial.academyId,
                source: initial.source,
                channelDetail: initial.channelDetail ?? "",
                contactName: initial.contactName,
                contactPhone: initial.contactPhone ?? "",
                studentName: initial.studentName,
                grade: initial.grade ?? "",
                consultSchool: initial.consultSchool ?? "",
                subject: initial.subject ?? "",
                preferSchedule: initial.preferSchedule ?? "",
                memo: initial.memo ?? "",
                priorAcademyNote: initial.priorAcademyNote ?? "",
                withdrawReason: initial.withdrawReason ?? "",
                subjectInterestNote: initial.subjectInterestNote ?? "",
                parentEducationView: initial.parentEducationView ?? "",
                childPersonalityNote: initial.childPersonalityNote ?? "",
                specialRequests: initial.specialRequests ?? "",
                notRegisteredReason: initial.notRegisteredReason ?? "",
                nextContactAt: initial.nextContactAt,
                counselorUserId: initial.counselorUserId,
                requestedAt: initial.requestedAt
                    ? dayjs(initial.requestedAt).format("YYYY-MM-DDTHH:mm")
                    : nowLocal(),
            })
        } else {
            setForm({
                ...INIT_FORM,
                academyId:
                    userAcademyId ??
                    (academies.length === 1 ? academies[0].id : null),
                requestedAt: nowLocal(),
            })
        }
    }, [open, mode, initial, userAcademyId, academies])

    if (!isAdmin) return null

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const legacyGradeOption =
        form.grade &&
        !gradeCodes.some((c) => c.code === form.grade) &&
        form.grade !== SELECT_GRADE_EMPTY
            ? form.grade
            : null

    const handleSubmit = async () => {
        if (!form.studentName.trim()) {
            toast.warning("학생 이름을 입력하세요.")
            return
        }
        if (!form.contactName.trim()) {
            toast.warning("신청자 이름을 입력하세요.")
            return
        }

        const t = (v: string | null | undefined) => {
            const s = (v ?? "").trim()
            return s === "" ? null : s
        }

        const normalized: ConsultUpdateInput = {
            source: form.source || "PHONE",
            channelDetail: t(form.channelDetail),
            contactName: form.contactName.trim(),
            contactPhone: form.contactPhone?.trim() || null,
            studentName: form.studentName.trim(),
            grade: t(form.grade),
            consultSchool: t(form.consultSchool),
            subject: t(form.subject),
            preferSchedule: t(form.preferSchedule),
            memo: t(form.memo),
            priorAcademyNote: t(form.priorAcademyNote),
            withdrawReason: t(form.withdrawReason),
            subjectInterestNote: t(form.subjectInterestNote),
            parentEducationView: t(form.parentEducationView),
            childPersonalityNote: t(form.childPersonalityNote),
            specialRequests: t(form.specialRequests),
            notRegisteredReason: t(form.notRegisteredReason),
            nextContactAt: form.nextContactAt?.trim() || null,
            counselorUserId: form.counselorUserId,
            requestedAt: form.requestedAt,
        }

        setBusy(true)
        if (mode === "edit" && initial) {
            const res = await updateConsultation(initial.id, normalized)
            setBusy(false)
            if (res.success) {
                toast.success("수정되었습니다.")
                await onSaved(initial.id)
            } else {
                toast.error(res.error)
            }
            return
        }

        if (!form.academyId) {
            setBusy(false)
            toast.warning("소속 학원을 선택하세요.")
            return
        }

        const res = await createConsultation({
            ...normalized,
            academyId: form.academyId,
        })
        setBusy(false)
        if (res.success && res.data) {
            toast.success("상담이 접수되었습니다.")
            await onSaved(res.data.id)
        } else if (!res.success) {
            toast.error(res.error)
        }
    }

    const academyDisabled = mode === "edit" || userAcademyId != null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-auto">
                <DialogHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 -mx-6 -mt-6 flex flex-row items-center space-y-0">
                    <DialogTitle className="text-lg font-bold leading-none">
                        {mode === "edit" ? "상담 수정" : "상담 접수"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 col-span-2">
                            <Label className="text-[11px]">소속 학원 *</Label>
                            <Select
                                value={form.academyId ? String(form.academyId) : ""}
                                onValueChange={(v) =>
                                    update("academyId", v ? Number(v) : null)
                                }
                                disabled={academyDisabled}
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue placeholder="학원 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academies.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.academyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">접수 경로</Label>
                            <Select
                                value={form.source}
                                onValueChange={(v) =>
                                    update("source", v as ConsultSource)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOURCES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {CONSULT_SOURCE_LABEL[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">접수 일시</Label>
                            <Input
                                type="datetime-local"
                                className="h-9 text-xs bg-card"
                                value={form.requestedAt ?? ""}
                                onChange={(e) =>
                                    update("requestedAt", e.target.value || null)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">신청자 이름 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.contactName}
                                onChange={(e) =>
                                    update("contactName", e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">연락처</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="010-0000-0000"
                                value={form.contactPhone ?? ""}
                                onChange={(e) =>
                                    update("contactPhone", e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">학생 이름 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.studentName}
                                onChange={(e) =>
                                    update("studentName", e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">학년</Label>
                            <Select
                                value={form.grade ? form.grade : SELECT_GRADE_EMPTY}
                                onValueChange={(v) =>
                                    update("grade", v === SELECT_GRADE_EMPTY ? "" : v)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SELECT_GRADE_EMPTY}>선택 안 함</SelectItem>
                                    {gradeCodes.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                    {legacyGradeOption ? (
                                        <SelectItem value={legacyGradeOption}>
                                            {legacyGradeOption} (기존 입력값)
                                        </SelectItem>
                                    ) : null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">희망 과목</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="예: 영어, 수학"
                                value={form.subject ?? ""}
                                onChange={(e) => update("subject", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1 col-span-2">
                            <Label className="text-[11px]">
                                희망 수업 요일·시간{" "}
                                <span className="font-normal text-muted-foreground">
                                    (수강 가능한 요일·시간대)
                                </span>
                            </Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="예: 월·목 저녁 7시 이후, 토요일 오전"
                                value={form.preferSchedule ?? ""}
                                onChange={(e) =>
                                    update("preferSchedule", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <ConsultFormExtendedSection
                        form={form}
                        onChange={(key, value) =>
                            update(key as keyof FormState, value as FormState[keyof FormState])
                        }
                    />

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">상담 내용</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={4}
                            placeholder="요청사항·가정 상황·현재 학원 등 자세히 기록"
                            value={form.memo ?? ""}
                            onChange={(e) => update("memo", e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={busy}
                    >
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={busy}>
                        {busy ? "저장 중..." : mode === "edit" ? "수정" : "접수"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
