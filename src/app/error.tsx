"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Application error:", error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Application Error</h2>
                <p className="text-muted-foreground">
                    {error.message || "An error occurred while loading the application"}
                </p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={() => reset()}>
                        Try again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/"}>
                        Go to Home
                    </Button>
                </div>
            </div>
        </div>
    )
}
