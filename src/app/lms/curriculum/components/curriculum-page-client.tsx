"use client"

import * as React from "react"
import { toast } from "sonner"
import { BookOpen, Users, ListChecks, ClipboardList } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { ClassRow } from "@/types/class"
import { listClasses } from "@/actions/class-actions"
import { ClassSidebar } from "./class-sidebar"
import { ProgressPanel } from "./progress-panel"
import { AssignmentPanel } from "./assignment-panel"
import { CurriculumMasterPanel } from "./curriculum-master-panel"

interface CurriculumPageClientProps {
    isAdmin: boolean
    userAcademyId: number | null
}

export function CurriculumPageClient({
    isAdmin,
    userAcademyId,
}: CurriculumPageClientProps) {
    const [classes, setClasses] = React.useState<ClassRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [selected, setSelected] = React.useState<ClassRow | null>(null)

    const load = React.useCallback(async () => {
        setLoading(true)
        const res = await listClasses()
        if (res.success && res.data) {
            setClasses(res.data)
            // 현재 선택이 없어졌으면 첫 항목 자동 선택
            setSelected((prev) => {
                if (prev && res.data!.some((c) => c.id === prev.id)) {
                    return res.data!.find((c) => c.id === prev.id) ?? null
                }
                return res.data![0] ?? null
            })
        } else if (!res.success) {
            toast.error(res.error)
            setClasses([])
        }
        setLoading(false)
    }, [])

    React.useEffect(() => {
        load()
    }, [load])

    return (
        <div className="relative h-page-container p-0 flex flex-col gap-[3px] overflow-hidden bg-background transition-colors duration-500">
            <Card className="h-full flex flex-col bg-card rounded-3xl border border-border shadow-card dark:shadow-none">
                <CardHeader className="h-12 px-4 py-0 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none">
                        <BookOpen className="h-5 w-5 text-primary" />
                        수업 / 진도 관리
                    </CardTitle>
                    {selected && (
                        <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                                {selected.subject}
                            </Badge>
                            {selected.level && (
                                <Badge variant="outline" className="text-[10px]">
                                    {selected.level}
                                </Badge>
                            )}
                            <span className="text-muted-foreground">
                                <Users className="h-3 w-3 inline mr-0.5" />
                                {selected.enrolledCount}/{selected.capacity}
                            </span>
                            <span className="text-muted-foreground">
                                {selected.teacherName ?? "강사 미지정"}
                            </span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-[3px] flex flex-col md:flex-row gap-[3px]">
                    <Card className="w-full md:w-[300px] md:shrink-0 flex flex-col rounded-2xl border border-border overflow-hidden max-h-[45vh] md:max-h-none">
                        <ClassSidebar
                            classes={classes}
                            loading={loading}
                            selectedId={selected?.id ?? null}
                            isAdmin={isAdmin}
                            userAcademyId={userAcademyId}
                            onSelect={setSelected}
                            onChanged={load}
                        />
                    </Card>
                    <Card className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border overflow-hidden">
                        {selected ? (
                            <Tabs
                                defaultValue="progress"
                                className="flex-1 min-h-0 flex flex-col"
                            >
                                <div className="h-10 px-3 py-0 border-b border-border bg-muted/20 flex items-center shrink-0">
                                    <TabsList>
                                        <TabsTrigger
                                            value="progress"
                                            className="text-xs flex items-center gap-1"
                                        >
                                            <ListChecks className="h-3 w-3" />
                                            진도
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="assignments"
                                            className="text-xs flex items-center gap-1"
                                        >
                                            <ClipboardList className="h-3 w-3" />
                                            과제
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="curriculum"
                                            className="text-xs flex items-center gap-1"
                                        >
                                            <BookOpen className="h-3 w-3" />
                                            커리큘럼
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent
                                    value="progress"
                                    className="flex-1 min-h-0 overflow-auto"
                                >
                                    <ProgressPanel
                                        classRow={selected}
                                        isAdmin={isAdmin}
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="assignments"
                                    className="flex-1 min-h-0 overflow-hidden"
                                >
                                    <AssignmentPanel
                                        classRow={selected}
                                        isAdmin={isAdmin}
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="curriculum"
                                    className="flex-1 min-h-0 overflow-auto"
                                >
                                    <CurriculumMasterPanel
                                        classRow={selected}
                                        isAdmin={isAdmin}
                                    />
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                                반을 선택하거나 등록하세요.
                            </div>
                        )}
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}
