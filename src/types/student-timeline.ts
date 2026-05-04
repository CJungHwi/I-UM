export type StudentTimelineKind =
    | "CONSULT"
    | "LEVEL_TEST"
    | "CLASS_IN"
    | "CLASS_OUT"

export interface StudentTimelineEvent {
    kind: StudentTimelineKind
    evtAt: string
    title: string
    subtitle: string | null
    bodyText: string | null
    refId: number
}
