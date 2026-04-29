"use client"

import { useState } from "react"
import { CheckCircle, BookOpenCheck, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    triggerAttendancePoint,
    triggerAssignmentAPoint,
    grantManualPoint,
} from "@/actions/gamification-actions"

interface PointGrantBarProps {
    studentId: number
    studentName: string
    onPointEarned: (earned: number, total: number) => void
}

export function PointGrantBar({ studentId, studentName, onPointEarned }: PointGrantBarProps) {
    const [manualAmount, setManualAmount] = useState("")
    const [manualReason, setManualReason] = useState("")
    const [busy, setBusy] = useState(false)

    const handleAttendance = async () => {
        setBusy(true)
        try {
            const res = await triggerAttendancePoint(studentId)
            if (res.success && res.data) {
                onPointEarned(res.data.earned, res.data.totalPoint)
                toast.success(`${studentName} 님에게 출결 포인트 +10P 적립!`)
            } else if (!res.success) {
                toast.error(res.error)
            }
        } finally {
            setBusy(false)
        }
    }

    const handleAssignmentA = async () => {
        setBusy(true)
        try {
            const res = await triggerAssignmentAPoint(studentId)
            if (res.success && res.data) {
                onPointEarned(res.data.earned, res.data.totalPoint)
                toast.success(`${studentName} 님에게 과제 A등급 포인트 +50P 적립!`)
            } else if (!res.success) {
                toast.error(res.error)
            }
        } finally {
            setBusy(false)
        }
    }

    const handleManual = async () => {
        const amount = parseInt(manualAmount)
        if (isNaN(amount) || amount === 0) {
            toast.warning("포인트 금액을 입력하세요.")
            return
        }
        if (!manualReason.trim()) {
            toast.warning("사유를 입력하세요.")
            return
        }
        setBusy(true)
        try {
            const res = await grantManualPoint(studentId, amount, manualReason.trim())
            if (res.success && res.data) {
                onPointEarned(amount, res.data.totalPoint)
                toast.success(`${studentName} 님에게 ${amount > 0 ? "+" : ""}${amount}P ${amount > 0 ? "지급" : "차감"}!`)
                setManualAmount("")
                setManualReason("")
            } else if (!res.success) {
                toast.error(res.error)
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-3 space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">포인트 지급</p>

            <div className="flex gap-2 flex-wrap">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-xl gap-1.5"
                    onClick={handleAttendance}
                    disabled={busy}
                >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    출결 완료 (+10P)
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-xl gap-1.5"
                    onClick={handleAssignmentA}
                    disabled={busy}
                >
                    <BookOpenCheck className="h-3.5 w-3.5 text-blue-500" />
                    과제 A등급 (+50P)
                </Button>
            </div>

            <div className="flex gap-2 items-center">
                <Input
                    type="number"
                    placeholder="포인트"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-20 h-8 text-xs bg-card"
                    disabled={busy}
                />
                <Input
                    placeholder="사유 입력"
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="flex-1 h-8 text-xs bg-card"
                    disabled={busy}
                    onKeyDown={(e) => e.key === "Enter" && handleManual()}
                />
                <Button
                    size="icon"
                    onClick={handleManual}
                    disabled={busy}
                    className="h-8 w-8 rounded-xl bg-primary text-primary-foreground shrink-0"
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}
