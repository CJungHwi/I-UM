"use client"

import * as React from "react"
import { toast } from "sonner"

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
import type {
    StudentDetail,
    StudentGender,
    StudentUpsertInput,
} from "@/types/student"
import { createStudent, updateStudent } from "@/actions/student-actions"

interface StudentFormDialogProps {
    open: boolean
    mode: "create" | "edit"
    initial: StudentDetail | null
    academies: IumAcademyOption[]
    isAdmin: boolean
    userAcademyId: number | null
    onOpenChange: (open: boolean) => void
    onSaved: (savedId?: number) => void | Promise<void>
}

interface FormState extends StudentUpsertInput {
    academyId: number | null
}

const INIT_FORM: FormState = {
    academyId: null,
    name: "",
    birthdate: null,
    gender: null,
    school: "",
    grade: "",
    phone: "",
    parentPhone: "",
    allergy: "",
    personality: "",
    memo: "",
    enrolledAt: null,
}

export function StudentFormDialog({
    open,
    mode,
    initial,
    academies,
    isAdmin,
    userAcademyId,
    onOpenChange,
    onSaved,
}: StudentFormDialogProps) {
    const [form, setForm] = React.useState<FormState>(INIT_FORM)
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        if (!open) return
        if (mode === "edit" && initial) {
            setForm({
                academyId: initial.academyId,
                name: initial.name,
                birthdate: initial.birthdate,
                gender: initial.gender,
                school: initial.school ?? "",
                grade: initial.grade ?? "",
                phone: initial.phone ?? "",
                parentPhone: initial.parentPhone ?? "",
                allergy: initial.allergy ?? "",
                personality: initial.personality ?? "",
                memo: initial.memo ?? "",
                enrolledAt: initial.enrolledAt,
            })
        } else {
            setForm({
                ...INIT_FORM,
                academyId:
                    userAcademyId ??
                    (academies.length === 1 ? academies[0].id : null),
            })
        }
    }, [open, mode, initial, userAcademyId, academies])

    if (!isAdmin) return null

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.warning("학생 이름을 입력하세요.")
            return
        }

        const normalized: StudentUpsertInput = {
            name: form.name.trim(),
            birthdate: form.birthdate || null,
            gender: form.gender,
            school: form.school?.trim() || null,
            grade: form.grade?.trim() || null,
            phone: form.phone?.trim() || null,
            parentPhone: form.parentPhone?.trim() || null,
            allergy: form.allergy?.trim() || null,
            personality: form.personality?.trim() || null,
            memo: form.memo?.trim() || null,
            enrolledAt: form.enrolledAt || null,
        }

        setBusy(true)
        if (mode === "edit" && initial) {
            const res = await updateStudent(initial.id, normalized)
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

        const res = await createStudent({
            ...normalized,
            academyId: form.academyId,
        })
        setBusy(false)
        if (res.success && res.data) {
            toast.success("등록되었습니다.")
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
                        {mode === "edit" ? "학생 정보 수정" : "학생 등록"}
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
                            <Label className="text-[11px]">이름 *</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">성별</Label>
                            <Select
                                value={form.gender ?? ""}
                                onValueChange={(v) =>
                                    update("gender", (v || null) as StudentGender | null)
                                }
                            >
                                <SelectTrigger className="h-9 text-xs bg-card">
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">남</SelectItem>
                                    <SelectItem value="F">여</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">생년월일</Label>
                            <Input
                                type="date"
                                className="h-9 text-xs bg-card"
                                value={form.birthdate ?? ""}
                                onChange={(e) =>
                                    update("birthdate", e.target.value || null)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">등록일</Label>
                            <Input
                                type="date"
                                className="h-9 text-xs bg-card"
                                value={form.enrolledAt ?? ""}
                                onChange={(e) =>
                                    update("enrolledAt", e.target.value || null)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">학교</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                value={form.school ?? ""}
                                onChange={(e) => update("school", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">학년</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="예: 중2, 고1"
                                value={form.grade ?? ""}
                                onChange={(e) => update("grade", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">본인 연락처</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="010-0000-0000"
                                value={form.phone ?? ""}
                                onChange={(e) => update("phone", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label className="text-[11px]">보호자 연락처(대표)</Label>
                            <Input
                                className="h-9 text-xs bg-card"
                                placeholder="010-0000-0000"
                                value={form.parentPhone ?? ""}
                                onChange={(e) =>
                                    update("parentPhone", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">알레르기·특이사항</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={2}
                            value={form.allergy ?? ""}
                            onChange={(e) => update("allergy", e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">성격 특징</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={2}
                            value={form.personality ?? ""}
                            onChange={(e) => update("personality", e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px]">메모</Label>
                        <Textarea
                            className="text-xs bg-card resize-none"
                            rows={3}
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
                        {busy ? "저장 중..." : mode === "edit" ? "수정" : "등록"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
