import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NotificationsAdminClient } from "./components/notifications-admin-client"

export default async function AdminNotificationsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }
    if (session.user.userGrade !== "ADMIN") {
        redirect("/")
    }

    return (
        <TooltipProvider>
            <NotificationsAdminClient />
        </TooltipProvider>
    )
}
