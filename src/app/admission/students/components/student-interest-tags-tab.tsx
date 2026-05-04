"use client"

import * as React from "react"
import { toast } from "sonner"
import { Hash, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { patchStudentMeta } from "@/actions/student-actions"

interface StudentInterestTagsTabProps {
    studentId: number
    photoUrl: string | null
    interestTags: string | null
    isAdmin: boolean
    onSaved: () => void | Promise<void>
}

const parseTags = (raw: string | null): string[] =>
    (raw ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

const serializeTags = (tags: string[]): string => tags.join(",")

export const StudentInterestTagsTab = ({
    studentId,
    photoUrl,
    interestTags,
    isAdmin,
    onSaved,
}: StudentInterestTagsTabProps) => {
    const [tags, setTags] = React.useState<string[]>(() => parseTags(interestTags))
    const [draft, setDraft] = React.useState("")
    const [photo, setPhoto] = React.useState(photoUrl ?? "")
    const [busy, setBusy] = React.useState(false)

    React.useEffect(() => {
        setTags(parseTags(interestTags))
        setPhoto(photoUrl ?? "")
    }, [interestTags, photoUrl, studentId])

    const handleAddTag = () => {
        const t = draft.trim().replace(/^#+/, "")
        if (!t) {
            toast.warning("태그 내용을 입력하세요.")
            return
        }
        const label = `#${t}`
        if (tags.some((x) => x.toLowerCase() === label.toLowerCase())) {
            setDraft("")
            return
        }
        setTags((prev) => [...prev, label])
        setDraft("")
    }

    const handleRemoveTag = (label: string) => {
        setTags((prev) => prev.filter((x) => x !== label))
    }

    const handleSave = async () => {
        if (!isAdmin) return
        setBusy(true)
        const res = await patchStudentMeta(studentId, {
            photoUrl: photo.trim() || null,
            interestTags: serializeTags(tags) || null,
        })
        setBusy(false)
        if (res.success) {
            toast.success("저장되었습니다.")
            await onSaved()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-1 max-w-lg">
            <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">프로필 사진 URL</span>
                <Input
                    className="h-9 text-xs bg-card"
                    placeholder="https://… (외부 호스팅 이미지 주소)"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    disabled={!isAdmin}
                />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" aria-hidden />
                    관심 키워드 (맞춤 보듬·필터용)
                </span>
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                    {tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">등록된 태그가 없습니다.</span>
                    ) : (
                        tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] gap-1 pr-1"
                            >
                                {tag}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="rounded p-0.5 hover:bg-muted"
                                        onClick={() => handleRemoveTag(tag)}
                                        aria-label={`${tag} 삭제`}
                                    >
                                        ×
                                    </button>
                                )}
                            </Badge>
                        ))
                    )}
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Input
                            className="h-9 text-xs bg-card flex-1"
                            placeholder="예: 낯가림심함, 수학강점"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddTag()
                                }
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 shrink-0 text-xs"
                            onClick={handleAddTag}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            추가
                        </Button>
                    </div>
                )}
            </div>
            {isAdmin && (
                <Button
                    type="button"
                    size="sm"
                    className="h-9 w-fit text-xs"
                    onClick={handleSave}
                    disabled={busy}
                >
                    {busy ? "저장 중…" : "사진·태그 저장"}
                </Button>
            )}
        </div>
    )
}
