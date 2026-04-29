import { auth } from "@/auth"
import { getThreadStudents } from "@/actions/thread-actions"
import { ThreadsClient } from "./components/threads-client"

export default async function ThreadsPage() {
    const session = await auth()
    const result = await getThreadStudents()
    const students = result.success && result.data ? result.data : []

    return (
        <ThreadsClient
            students={students}
            currentUserId={session?.user?.mbId}
        />
    )
}
