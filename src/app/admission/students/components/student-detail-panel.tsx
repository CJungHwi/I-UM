"use client"

import * as React from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { Pencil, Trash2, UserCheck, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StudentDetail, StudentRow } from "@/types/student"
import { deleteStudent, setStudentStatus } from "@/actions/student-actions"
import { labelForStudentCode } from "@/lib/student-code-labels"
import { GuardianSection } from "./guardian-section"
import { SiblingSection } from "./sibling-section"
import { StudentInterestTagsTab } from "./student-interest-tags-tab"
import { StudentTimelineTab } from "./student-timeline-tab"

interface StudentDetailPanelProps {
    student: StudentDetail | null
    loading: boolean
    isAdmin: boolean
    rows: StudentRow[]
    gradeLabelByCode: Record<string, string>
    routeLabelByCode: Record<string, string>
    onEdit: () => void
    onRefresh: () => Promise<void>
}

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
            <span className="text-xs">{children}</span>
        </div>
    )
}

export function StudentDetailPanel({
    student,
    loading,
    isAdmin,
    rows,
    gradeLabelByCode,
    routeLabelByCode,
    onEdit,
    onRefresh,
}: StudentDetailPanelProps) {
    const [busy, setBusy] = React.useState(false)

    if (loading) {
        return (
            <div className="flex justify-center items-center flex-1 py-10">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!student) {
        return (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                학생을 선택하면 상세 정보가 표시됩니다.
            </div>
        )
    }

    const gradeDisplay = labelForStudentCode(student.grade, gradeLabelByCode)
    const routeDisplay = labelForStudentCode(
        student.admissionRouteCode,
        routeLabelByCode,
    )

    const handleToggleStatus = async () => {
        if (!isAdmin) return
        const next = student.status === "ACTIVE" ? "WITHDRAWN" : "ACTIVE"
        if (
            next === "WITHDRAWN" &&
            !window.confirm(`${student.name} 학생을 퇴원 처리할까요?`)
        ) {
            return
        }
        setBusy(true)
        const res = await setStudentStatus(student.id, next)
        setBusy(false)
        if (res.success) {
            toast.success(next === "WITHDRAWN" ? "퇴원 처리되었습니다." : "재원 처리되었습니다.")
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    const handleDelete = async () => {
        if (!isAdmin) return
        if (!window.confirm(`${student.name} 학생 정보를 삭제할까요?\n(관련 기록은 유지되며, 명부에서만 제거됩니다)`)) {
            return
        }
        setBusy(true)
        const res = await deleteStudent(student.id)
        setBusy(false)
        if (res.success) {
            toast.success("삭제되었습니다.")
            await onRefresh()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="h-12 px-4 py-0 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-bold truncate">{student.name}</span>
                    {student.status === "WITHDRAWN" ? (
                        <Badge variant="outline" className="text-[10px]">
                            퇴원
                        </Badge>
                    ) : (
                        <Badge variant="default" className="text-[10px]">
                            재원
                        </Badge>
                    )}
                    {gradeDisplay && (
                        <Badge variant="secondary" className="text-[10px]">
                            {gradeDisplay}
                        </Badge>
                    )}
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg"
                            onClick={onEdit}
                            disabled={busy}
                        >
                            <Pencil className="h-3 w-3 mr-1" />
                            수정
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg"
                            onClick={handleToggleStatus}
                            disabled={busy}
                        >
                            {student.status === "ACTIVE" ? (
                                <>
                                    <UserX className="h-3 w-3 mr-1" /> 퇴원
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-3 w-3 mr-1" /> 재원
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg text-destructive"
                            onClick={handleDelete}
                            disabled={busy}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                        </Button>
                    </div>
                )}
            </div>

            <Tabs defaultValue="profile" className="flex-1 min-h-0 flex flex-col p-3 gap-2">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1">
                    <TabsTrigger value="profile" className="text-xs">
                        프로필
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="text-xs">
                        관심 키워드
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="text-xs">
                        성장 타임라인
                    </TabsTrigger>
                    <TabsTrigger value="family" className="text-xs">
                        가족·형제
                    </TabsTrigger>
                    <TabsTrigger value="memo" className="text-xs">
                        메모
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="overflow-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-1">
                        <Field label="소속 학원">{student.academyName ?? "—"}</Field>
                        <Field label="학년">{gradeDisplay || "—"}</Field>
                        <Field label="접수 경로">{routeDisplay || "—"}</Field>
                        <Field label="학교">{student.school ?? "—"}</Field>
                        <Field label="생년월일">
                            {student.birthdate
                                ? dayjs(student.birthdate).format("YYYY-MM-DD")
                                : "—"}
                        </Field>
                        <Field label="성별">
                            {student.gender === "M"
                                ? "남"
                                : student.gender === "F"
                                  ? "여"
                                  : "—"}
                        </Field>
                        <Field label="본인 연락처">{student.phone ?? "—"}</Field>
                        <Field label="보호자 연락처">{student.parentPhone ?? "—"}</Field>
                        <Field label="등록일">
                            {student.enrolledAt
                                ? dayjs(student.enrolledAt).format("YYYY-MM-DD")
                                : "—"}
                        </Field>
                        <Field label="현재 수강 반">
                            {student.currentClassNames ?? "—"}
                        </Field>
                        <Field label="프로필 사진 URL">
                            {student.photoUrl ? (
                                <a
                                    href={student.photoUrl}
                                    className="text-primary hover:underline truncate block"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    링크 열기
                                </a>
                            ) : (
                                "—"
                            )}
                        </Field>
                        <Field label="상태">
                            {student.status === "ACTIVE" ? "재원" : "퇴원"}
                            {student.withdrawnAt &&
                                ` (${dayjs(student.withdrawnAt).format("YYYY-MM-DD")})`}
                        </Field>
                    </div>
                </TabsContent>

                <TabsContent value="tags" className="overflow-auto">
                    <StudentInterestTagsTab
                        studentId={student.id}
                        photoUrl={student.photoUrl}
                        interestTags={student.interestTags}
                        isAdmin={isAdmin}
                        onSaved={onRefresh}
                    />
                </TabsContent>

                <TabsContent value="timeline" className="overflow-auto">
                    <StudentTimelineTab studentId={student.id} />
                </TabsContent>

                <TabsContent value="family" className="overflow-auto">
                    <div className="flex flex-col gap-3 p-1">
                        <GuardianSection
                            studentId={student.id}
                            isAdmin={isAdmin}
                        />
                        <SiblingSection
                            student={student}
                            rows={rows}
                            isAdmin={isAdmin}
                            gradeLabelByCode={gradeLabelByCode}
                            onChanged={onRefresh}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="memo" className="overflow-auto">
                    <div className="flex flex-col gap-3 p-1">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">
                                알레르기·특이사항
                            </span>
                            <div className="text-xs whitespace-pre-line rounded-md border border-border bg-muted/20 p-3 min-h-[48px]">
                                {student.allergy ?? "—"}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">
                                성격 특징
                            </span>
                            <div className="text-xs whitespace-pre-line rounded-md border border-border bg-muted/20 p-3 min-h-[48px]">
                                {student.personality ?? "—"}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">
                                기타 메모
                            </span>
                            <div className="text-xs whitespace-pre-line rounded-md border border-border bg-muted/20 p-3 min-h-[96px]">
                                {student.memo ?? "—"}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
