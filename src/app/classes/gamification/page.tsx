import { getGamiStudents } from "@/actions/gamification-actions"
import { GamificationClient } from "./components/gamification-client"

export default async function GamificationPage() {
    const result = await getGamiStudents()
    const students = result.success && result.data ? result.data : []

    return <GamificationClient students={students} />
}
