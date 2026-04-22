export const THREAD_TAGS = ["학습", "태도", "상담", "일반"] as const
export type ThreadTag = (typeof THREAD_TAGS)[number]

export interface ThreadPost {
    id: number
    studentId: number
    writerId: string
    writerName: string
    content: string
    tag: ThreadTag
    isPinned: boolean
    imageUrl: string | null
    createdAt: string
    updatedAt: string
}

export interface ThreadStudent {
    id: number
    mbId: string
    name: string
    level: number
}

export interface CreateThreadInput {
    studentId: number
    content: string
    tag: ThreadTag
    imageUrl?: string | null
}
