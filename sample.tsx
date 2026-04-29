"use client"

import { useState, useEffect, useCallback } from "react"
import {
  HardHat,
  List,
  Search,
  FileText,
  Camera,
  Plus,
  X,
  Save,
  Trash2,
  FileSearch,
  MessageSquare,
  CircleHelp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ACTION_BUTTON_CLASS } from "@/components/ui/action-button-styles"
import { Textarea } from "@/components/ui/textarea"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useSyncBusyCursor } from "@/components/busy-cursor-provider"
import { useImagePreview } from "@/components/image-preview/image-preview-provider"
import { isAdminDashboardLevel } from "@/lib/member-role"

import EstimatePdfViewerDialog from "./estimate-pdf-viewer-dialog"
import { ConstructionManagementHelpContent } from "./construction-management-help"

const COMM_LAST_READ_KEY = "construction-comm-lastRead"

interface ConstructionItem {
  id: number
  estimateId: number
  estimateNo: string
  customerName: string
  companyName: string | null
  siteName: string | null
  siteAddress: string | null
  siteManagerName: string | null
  expectedStartDate: string | null
  expectedEndDate: string | null
  status: string
  /** customer_receptions.status (수금완료 등) */
  receptionStatus: string | null
  /** payment_masters.remaining_amount, 없으면 null */
  paymentRemaining: number | null
}

interface ConstructionLog {
  id: number
  orderId: number
  logDate: string
  logTitle: string | null
  content: string | null
  remarks: string | null
  sortOrder: number
}

interface ConstructionLogDetail extends ConstructionLog {
  photos: { id: number; name: string; preview: string }[]
}

interface OrderCommunication {
  id: number
  orderId: number
  writerType: "H" | "S"
  content: string
  createdBy: number | null
  createdByName: string | null
  createdAt: string
  photos: { id: number; fileName: string; filePath: string; fileSize: number }[]
}

const TH_CLASS = "h-[45px] text-center text-sm bg-[#b9adb5] dark:bg-gray-800 text-[#27272a] dark:text-[#94a3b8] border-r border-b border-[#343637] dark:border-[#6b7280]"
const TH_LAST_CLASS = "h-[45px] text-center text-sm bg-[#b9adb5] dark:bg-gray-800 text-[#27272a] dark:text-[#94a3b8] border-b border-[#343637] dark:border-[#6b7280]"
const TD_CLASS = "h-[35px] text-center text-sm border-r border-b border-[#343637]/20 dark:border-[#6b7280]/20"
const TD_LAST_CLASS = "h-[35px] text-center text-sm border-b border-[#343637]/20 dark:border-[#6b7280]/20"

const ConstructionManagementClient = () => {
  const { data: session, status: sessionStatus } = useSession()
  const isAdminViewer =
    sessionStatus === "authenticated" &&
    isAdminDashboardLevel(session?.user?.mbLevel ?? -1)
  const currentCommunicationWriterType: "H" | "S" =
    (session?.user?.mbLevel ?? 99) === 0 ? "H" : "S"

  const [constructionList, setConstructionList] = useState<ConstructionItem[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [logList, setLogList] = useState<ConstructionLog[]>([])
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [logDetail, setLogDetail] = useState<ConstructionLogDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isListLoading, setIsListLoading] = useState(false)
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isEstimatePdfOpen, setIsEstimatePdfOpen] = useState(false)
  const [estimatePdfTarget, setEstimatePdfTarget] = useState<{ estimateId: number; estimateNo: string } | null>(null)

  const [activeTab, setActiveTab] = useState<"log" | "communications">("log")
  const [communicationsList, setCommunicationsList] = useState<OrderCommunication[]>([])
  const [communicationsLoading, setCommunicationsLoading] = useState(false)
  const [lastReadIdByOrder, setLastReadIdByOrder] = useState<Record<number, number>>({})
  const [commFormContent, setCommFormContent] = useState("")
  const { open: openImagePreview } = useImagePreview()
  const [commFormPhotos, setCommFormPhotos] = useState<{ id: string; name: string; preview: string }[]>([])
  const [isCommSaving, setIsCommSaving] = useState(false)

  const [formData, setFormData] = useState({
    logDate: "",
    logTitle: "",
    content: "",
    remarks: "",
  })
  const [formPhotos, setFormPhotos] = useState<{ id: string; name: string; preview: string }[]>([])

  const selectedConstruction = constructionList.find((c) => c.id === selectedOrderId)
  const isConstructionCompleted = selectedConstruction?.status === "completed"
  const canMutateCommunications = !isConstructionCompleted
  const canMutateConstructionLog = !isAdminViewer && !isConstructionCompleted
  const canMutateConstructionStatus = !isAdminViewer
  const canCancelCompleteConstruction =
    !!selectedConstruction &&
    selectedConstruction.status === "completed" &&
    selectedConstruction.receptionStatus !== "수금완료" &&
    (selectedConstruction.paymentRemaining == null ||
      selectedConstruction.paymentRemaining > 0)

  const lastReadId = selectedOrderId ? (lastReadIdByOrder[selectedOrderId] ?? 0) : 0
  const unreadBadgeCount = selectedOrderId
    ? communicationsList.filter((c) => c.writerType === "H" && c.id > lastReadId).length
    : 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      const s = new Date(dateStr).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).replace(/\. /g, ".")
      return s.replace(/\.+$/, "")
    } catch {
      return dateStr
    }
  }

  const getProgressLabel = (c: ConstructionItem) => {
    if (c.receptionStatus === "수금완료") return "수금완료"
    if (c.status === "completed") return "공사완료"
    if (c.status === "in_progress") return "공사중"
    return "공사전"
  }

  const fetchConstructionList = useCallback(async () => {
    setIsListLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/construction?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setConstructionList(json.data)
      } else {
        toast.error(json.error || "목록을 불러올 수 없습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsListLoading(false)
    }
  }, [searchTerm])

  const fetchLogList = useCallback(async (orderId: number) => {
    setIsLogsLoading(true)
    try {
      const res = await fetch(`/api/construction/logs?orderId=${orderId}`)
      const json = await res.json()
      if (json.success) {
        setLogList(json.data)
        setSelectedLogId(null)
        setLogDetail(null)
        setFormData({ logDate: "", logTitle: "", content: "", remarks: "" })
        setFormPhotos([])
      } else {
        toast.error(json.error || "일지 목록을 불러올 수 없습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsLogsLoading(false)
    }
  }, [])

  const fetchCommunications = useCallback(async (orderId: number) => {
    setCommunicationsLoading(true)
    try {
      const res = await fetch(`/api/construction/communications?orderId=${orderId}`)
      const json = await res.json()
      if (json.success) {
        const sortedCommunications = [...json.data].sort(
          (a: OrderCommunication, b: OrderCommunication) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id - b.id
        )
        setCommunicationsList(sortedCommunications)
      } else {
        toast.error(json.error || "소통 목록을 불러올 수 없습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setCommunicationsLoading(false)
    }
  }, [])

  const fetchLogDetail = useCallback(async (logId: number) => {
    setIsDetailLoading(true)
    try {
      const res = await fetch(`/api/construction/logs/${logId}`)
      const json = await res.json()
      if (json.success) {
        setLogDetail(json.data)
        setFormData({
          logDate: json.data.logDate?.split("T")[0] || "",
          logTitle: json.data.logTitle || "",
          content: json.data.content || "",
          remarks: json.data.remarks || "",
        })
        setFormPhotos(json.data.photos?.map((p: { id: number; name: string; preview: string }) => ({
          id: String(p.id),
          name: p.name,
          preview: p.preview,
        })) || [])
      } else {
        toast.error(json.error || "일지 상세를 불러올 수 없습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConstructionList()
  }, [fetchConstructionList])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(COMM_LAST_READ_KEY)
      const parsed = stored ? (JSON.parse(stored) as Record<string, number>) : {}
      const byOrder: Record<number, number> = {}
      Object.entries(parsed).forEach(([k, v]) => {
        const id = parseInt(k, 10)
        if (!isNaN(id)) byOrder[id] = v
      })
      setLastReadIdByOrder(byOrder)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (selectedOrderId) {
      fetchLogList(selectedOrderId)
      fetchCommunications(selectedOrderId)
    } else {
      setLogList([])
      setSelectedLogId(null)
      setLogDetail(null)
      setCommunicationsList([])
    }
  }, [selectedOrderId, fetchLogList, fetchCommunications])

  const handleSelectConstruction = (item: ConstructionItem) => {
    setSelectedOrderId(item.id)
  }

  const handleMarkCommunicationsRead = useCallback(() => {
    if (!selectedOrderId) return
    const maxId = communicationsList.length > 0
      ? Math.max(...communicationsList.map((c) => c.id))
      : 0
    setLastReadIdByOrder((prev) => {
      const next = { ...prev, [selectedOrderId]: maxId }
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(COMM_LAST_READ_KEY, JSON.stringify(next))
        }
      } catch {
        // ignore
      }
      return next
    })
  }, [selectedOrderId, communicationsList])

  const handleCommunicationsTabClick = () => {
    setActiveTab("communications")
    handleMarkCommunicationsRead()
  }

  const handleSelectLog = (log: ConstructionLog) => {
    setSelectedLogId(log.id)
    fetchLogDetail(log.id)
  }

  const handleNewLog = () => {
    setSelectedLogId(null)
    setLogDetail(null)
    const today = new Date().toISOString().split("T")[0]
    setFormData({ logDate: today, logTitle: "", content: "", remarks: "" })
    setFormPhotos([])
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormPhotos((prev) => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          preview: reader.result as string,
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const handleRemovePhoto = (photoId: string) => {
    setFormPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  const handleCommPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConstructionCompleted) {
      e.target.value = ""
      return
    }
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCommFormPhotos((prev) => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          preview: reader.result as string,
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const handleRemoveCommPhoto = (photoId: string) => {
    setCommFormPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  const handleSaveCommunication = async () => {
    if (!selectedOrderId) return
    if (isConstructionCompleted) {
      toast.error("공사가 완료된 현장에는 본사 지시·협의를 등록할 수 없습니다.")
      return
    }
    if (!commFormContent.trim()) {
      toast.error("내용을 입력하세요.")
      return
    }

    setIsCommSaving(true)
    try {
      const res = await fetch("/api/construction/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          content: commFormContent.trim(),
          photos: commFormPhotos.filter((p) => p.preview.startsWith("data:")).map((p) => ({
            name: p.name,
            data: p.preview,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("등록되었습니다.")
        setCommFormContent("")
        setCommFormPhotos([])
        fetchCommunications(selectedOrderId)
      } else {
        toast.error(json.error || "등록에 실패했습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsCommSaving(false)
    }
  }

  const handleSaveLog = async () => {
    if (!selectedOrderId) return
    if (isConstructionCompleted) {
      toast.error("공사완료된 현장은 공사일지를 수정할 수 없습니다.")
      return
    }
    if (!formData.logDate) {
      toast.error("일자를 입력하세요.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        orderId: selectedOrderId,
        logDate: formData.logDate,
        logTitle: formData.logTitle || null,
        content: formData.content || null,
        remarks: formData.remarks || null,
        photos: formPhotos.filter((p) => p.preview.startsWith("data:")).map((p) => ({
          name: p.name,
          data: p.preview,
        })),
      }

      if (selectedLogId) {
        const res = await fetch(`/api/construction/logs/${selectedLogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            photos: payload.photos,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("공사일지가 수정되었습니다.")
          fetchLogList(selectedOrderId)
          setSelectedLogId(null)
          handleNewLog()
        } else {
          toast.error(json.error || "수정에 실패했습니다.")
        }
      } else {
        const res = await fetch("/api/construction/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("공사일지가 등록되었습니다.")
          fetchLogList(selectedOrderId)
          handleNewLog()
        } else {
          toast.error(json.error || "등록에 실패했습니다.")
        }
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLog = async () => {
    if (!selectedLogId) return
    if (isConstructionCompleted) {
      toast.error("공사완료된 현장의 공사일지는 삭제할 수 없습니다.")
      return
    }
    if (!confirm("이 공사일지를 삭제하시겠습니까?")) return

    try {
      const res = await fetch(`/api/construction/logs/${selectedLogId}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success("공사일지가 삭제되었습니다.")
        fetchLogList(selectedOrderId!)
        handleNewLog()
      } else {
        toast.error(json.error || "삭제에 실패했습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    }
  }

  const handleCompleteConstruction = async () => {
    if (!selectedOrderId) return
    if (!confirm("공사를 완료 처리하시겠습니까?")) return

    setIsCompleting(true)
    try {
      const res = await fetch("/api/construction/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrderId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("공사가 완료되었습니다.")
        fetchConstructionList()
        fetchLogList(selectedOrderId)
      } else {
        toast.error(json.error || "공사완료 처리에 실패했습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleCancelCompleteConstruction = async () => {
    if (!selectedOrderId) return
    if (!confirm("공사완료를 취소하시겠습니까? (공사중으로 복원됩니다)")) return

    setIsCompleting(true)
    try {
      const res = await fetch("/api/construction/cancel-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrderId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("공사완료가 취소되었습니다.")
        fetchConstructionList()
        fetchLogList(selectedOrderId)
      } else {
        toast.error(json.error || "공사완료 취소에 실패했습니다.")
      }
    } catch {
      toast.error("서버 연결에 실패했습니다.")
    } finally {
      setIsCompleting(false)
    }
  }

  useSyncBusyCursor(
    isListLoading ||
      isLogsLoading ||
      isDetailLoading ||
      isSaving ||
      isCompleting ||
      communicationsLoading ||
      isCommSaving
  )

  return (
    <TooltipProvider>
      <div className="relative flex h-full min-h-0 flex-col gap-[3px] overflow-hidden bg-background p-0">
        <Card className="flex flex-col flex-1 min-w-0 border border-[#343637] dark:border-[#6b7280] shadow-md overflow-hidden bg-card h-full">
          <CardHeader className="h-12 px-4 py-0 border-b bg-[#f9fafb] dark:bg-muted/30 flex flex-row items-center justify-between space-y-0 border-[#343637] dark:border-[#6b7280]">
            <CardTitle className="text-lg font-bold flex items-center gap-2 leading-none text-[#1d1d1d] dark:text-white">
              <HardHat className="h-5 w-5 text-primary" />
              공사관리
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#343637] dark:border-[#6b7280] bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="공사관리 도움말"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-[min(24rem,calc(100vw-2rem))] max-h-[min(70vh,32rem)] overflow-y-auto p-4 text-sm"
              >
                <ConstructionManagementHelpContent />
              </PopoverContent>
            </Popover>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 flex flex-col gap-0 p-0 overflow-hidden">
            {/* 상단: 공사목록 (고정 높이) */}
            <div className="flex flex-col shrink-0 h-[292px] border-b border-[#343637] dark:border-[#6b7280]">
              <div className="h-10 shrink-0 px-3 py-0 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0 border-[#343637] dark:border-[#6b7280]">
                <span className="text-sm font-bold flex items-center gap-1">
                  <List className="h-4 w-4 text-primary" />
                  공사목록
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="견적번호, 고객명, 현장명 검색"
                    className="h-7 w-[200px] text-sm bg-card border-[#343637] dark:border-[#6b7280]"
                    onKeyDown={(e) => e.key === "Enter" && fetchConstructionList()}
                  />
                  <Button size="sm" variant="outline" className="h-7 text-sm" onClick={() => fetchConstructionList()}>
                    <Search className="h-3.5 w-3.5 mr-1" />
                    검색
                  </Button>
                </div>
              </div>
              <div className="h-[220px] shrink-0 overflow-auto">
                <table className="w-full min-w-[900px] table-fixed border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className={`w-[90px] ${TH_CLASS}`}>견적번호</th>
                      <th className={`w-[80px] ${TH_CLASS}`}>고객명</th>
                      <th className={`w-[70px] ${TH_CLASS}`}>담당소장</th>
                      <th className={`w-[80px] ${TH_CLASS}`}>현장명</th>
                      <th className={`w-[140px] ${TH_CLASS}`}>주소</th>
                      <th className={`w-[90px] ${TH_CLASS}`}>공사시작일</th>
                      <th className={`w-[90px] ${TH_CLASS}`}>공사완료일</th>
                      <th className={`w-[100px] ${TH_CLASS}`}>진행사항</th>
                      <th className={`w-[120px] ${TH_LAST_CLASS}`}>견적보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isListLoading ? (
                      <tr>
                        <td colSpan={9} className="h-[120px] text-center text-sm text-muted-foreground">
                          데이터를 불러오는 중...
                        </td>
                      </tr>
                    ) : constructionList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="h-[120px] text-center text-sm text-muted-foreground">
                          공사 목록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      constructionList.map((c) => {
                        const isSelected = selectedOrderId === c.id
                        return (
                          <tr
                            key={c.id}
                            className={`cursor-pointer hover:bg-muted/30 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors ${
                              isSelected ? "bg-primary/20" : "bg-[#f9fafb] dark:bg-[#1d1d1d]"
                            }`}
                            onClick={() => handleSelectConstruction(c)}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handleSelectConstruction(c)}
                          >
                            <td className={TD_CLASS}>{c.estimateNo}</td>
                            <td className={TD_CLASS}>{c.companyName || c.customerName || "-"}</td>
                            <td className={TD_CLASS}>{c.siteManagerName || "-"}</td>
                            <td className={TD_CLASS}>{c.siteName || "-"}</td>
                            <td className={`${TD_CLASS} !text-left`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate block">{c.siteAddress || "-"}</span>
                                </TooltipTrigger>
                                <TooltipContent><p className="max-w-xs">{c.siteAddress || "-"}</p></TooltipContent>
                              </Tooltip>
                            </td>
                            <td className={TD_CLASS}>{formatDate(c.expectedStartDate)}</td>
                            <td className={TD_CLASS}>{formatDate(c.expectedEndDate)}</td>
                            <td className={TD_CLASS}>{getProgressLabel(c)}</td>
                            <td className={TD_LAST_CLASS}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEstimatePdfTarget({ estimateId: c.estimateId, estimateNo: c.estimateNo })
                                  setIsEstimatePdfOpen(true)
                                }}
                                aria-label="견적보기"
                              >
                                <FileSearch className="h-3 w-3 mr-1" />
                                견적보기
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="h-8 shrink-0 px-4 border-t border-[#343637] dark:border-[#6b7280] bg-muted/30 flex items-center">
                <span className="text-sm text-muted-foreground">총 {constructionList.length}건</span>
              </div>
            </div>

            {/* 하단: 공사현황 */}
            <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
              {/* 좌측: 공사일지목록 */}
              <div className="lg:w-[35%] min-w-0 shrink-0 flex flex-col overflow-hidden border-r border-[#343637] dark:border-[#6b7280] min-h-[180px] lg:min-h-0">
                <div className="h-10 shrink-0 px-3 py-0 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0 border-[#343637] dark:border-[#6b7280]">
                  <span className="text-sm font-bold flex items-center gap-1">
                    <FileText className="h-4 w-4 text-primary" />
                    공사일지목록
                  </span>
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full min-w-[400px] table-fixed border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className={`w-[90px] ${TH_CLASS}`}>일자</th>
                          <th className={`w-[120px] ${TH_CLASS}`}>일지</th>
                          <th className={TH_LAST_CLASS}>특이사항</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedOrderId ? (
                          <tr>
                            <td colSpan={3} className="h-[120px] text-center text-sm text-muted-foreground">
                              공사를 선택하세요
                            </td>
                          </tr>
                        ) : isLogsLoading ? (
                          <tr>
                            <td colSpan={3} className="h-[120px] text-center text-sm text-muted-foreground">
                              일지를 불러오는 중...
                            </td>
                          </tr>
                        ) : logList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="h-[120px] text-center text-sm text-muted-foreground">
                              공사일지가 없습니다
                            </td>
                          </tr>
                        ) : (
                          logList.map((log) => {
                            const isSelected = selectedLogId === log.id
                            return (
                              <tr
                                key={log.id}
                                className={`cursor-pointer hover:bg-muted/30 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors ${
                                  isSelected ? "bg-primary/20" : "bg-[#f9fafb] dark:bg-[#1d1d1d]"
                                }`}
                                onClick={() => handleSelectLog(log)}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && handleSelectLog(log)}
                              >
                                <td className={TD_CLASS}>{formatDate(log.logDate)}</td>
                                <td className={`${TD_CLASS} !text-left`}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block">{log.logTitle || log.content?.slice(0, 20) || "-"}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>{log.logTitle || log.content || "-"}</TooltipContent>
                                  </Tooltip>
                                </td>
                                <td className={`${TD_LAST_CLASS} !text-left`}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block">{log.remarks || "-"}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>{log.remarks || "-"}</TooltipContent>
                                  </Tooltip>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="h-8 shrink-0 px-4 border-t border-[#343637] dark:border-[#6b7280] bg-muted/30 flex items-center">
                    <span className="text-sm text-muted-foreground">총 {logList.length}건</span>
                  </div>
                </div>
              </div>

              <div className="w-1 shrink-0 border-l border-[#343637] dark:border-[#6b7280] hidden lg:block" aria-hidden />

              {/* 우측: 공사일지 상세내용 | 본사 지시·협의 */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
                <div className="h-10 shrink-0 px-3 py-0 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0 border-[#343637] dark:border-[#6b7280]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("log")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        activeTab === "log"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      aria-pressed={activeTab === "log"}
                      aria-label="공사일지 탭"
                    >
                      <FileText className="h-4 w-4" />
                      공사일지
                    </button>
                    <button
                      type="button"
                      onClick={handleCommunicationsTabClick}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        activeTab === "communications"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      aria-pressed={activeTab === "communications"}
                      aria-label="본사 지시·협의 탭"
                    >
                      <MessageSquare className="h-4 w-4" />
                      본사 지시·협의
                      {unreadBadgeCount > 0 && (
                        <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-xs">
                          {unreadBadgeCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                  {activeTab === "log" && selectedOrderId && canMutateConstructionLog && (
                    <Button size="sm" variant="outline" className="h-7 text-sm" onClick={handleNewLog} aria-label="새 일지">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      새 일지
                    </Button>
                  )}
                </div>
                <div className="flex-1 min-h-0 p-4 overflow-auto">
                  {!selectedOrderId ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground/30" aria-hidden />
                      <p className="text-sm text-muted-foreground">좌측에서 공사를 선택하세요</p>
                    </div>
                  ) : activeTab === "communications" ? (
                    <div className="flex flex-col gap-4 h-full">
                      <div className="flex-1 min-h-0 overflow-auto space-y-4">
                        {communicationsLoading ? (
                          <p className="text-sm text-muted-foreground">소통 목록을 불러오는 중...</p>
                        ) : communicationsList.length === 0 ? (
                          <p className="text-sm text-muted-foreground">본사 지시·협의 내용이 없습니다.</p>
                        ) : (
                          <div className="space-y-4">
                            {communicationsList.map((comm) => {
                              const isMine = comm.writerType === currentCommunicationWriterType
                              return (
                                <div
                                  key={comm.id}
                                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`min-w-[50%] max-w-[min(150rem,96%)] rounded-lg border p-4 ${
                                      isMine
                                        ? "border-r-4 border-r-primary bg-primary/10"
                                        : "border-l-4 border-l-muted-foreground/30 bg-muted/20"
                                    }`}
                                  >
                                    <div
                                      className={`flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2 ${
                                        isMine ? "justify-end text-right" : "justify-start"
                                      }`}
                                    >
                                      <span className="font-medium text-foreground">
                                        {comm.writerType === "H" ? "본사" : "소장"}
                                      </span>
                                      <span>{comm.createdByName || "-"}</span>
                                      <span>
                                        {comm.createdAt
                                          ? new Date(comm.createdAt).toLocaleString("ko-KR", {
                                              year: "numeric",
                                              month: "2-digit",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "-"}
                                      </span>
                                    </div>
                                    <p className="text-left text-sm whitespace-pre-wrap">{comm.content || "-"}</p>
                                    {comm.photos && comm.photos.length > 0 && (
                                      <div className={`flex gap-2 flex-wrap mt-2 ${isMine ? "justify-end" : "justify-start"}`}>
                                        {comm.photos.map((p) => {
                                          const isImagePath =
                                            p.filePath.startsWith("/") || p.filePath.startsWith("http")
                                          const imageSrc = isImagePath ? p.filePath : null
                                          return (
                                            <button
                                              key={p.id}
                                              type="button"
                                              onClick={() => imageSrc && openImagePreview({ src: imageSrc, alt: p.fileName })}
                                              className="w-16 h-16 rounded border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                                              aria-label={`${p.fileName} 크게 보기`}
                                              disabled={!imageSrc}
                                            >
                                              {imageSrc ? (
                                                <img
                                                  src={imageSrc}
                                                  alt={p.fileName}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
                                              )}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t pt-4 space-y-3">
                        {!canMutateCommunications && (
                          <p className="text-sm text-muted-foreground rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2">
                            공사가 완료된 현장은 본사 지시·협의를 추가할 수 없습니다.
                          </p>
                        )}
                        <Textarea
                          value={commFormContent}
                          onChange={(e) => setCommFormContent(e.target.value)}
                          placeholder="지시·협의 내용을 입력하세요"
                          className="min-h-[80px] text-sm border-[#343637] dark:border-[#6b7280] resize-none"
                          disabled={!canMutateCommunications}
                          aria-label="본사 지시·협의 내용"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <label htmlFor="comm-photo-camera" className={!canMutateCommunications ? "pointer-events-none opacity-50" : undefined}>
                              <span className="inline-flex items-center justify-center h-7 px-2 text-sm rounded-md hover:bg-muted cursor-pointer">
                                <Camera className="h-3 w-3 mr-1" />
                                찍기
                              </span>
                              <input
                                id="comm-photo-camera"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleCommPhotoUpload}
                                disabled={!canMutateCommunications}
                              />
                            </label>
                            <label htmlFor="comm-photo-gallery" className={!canMutateCommunications ? "pointer-events-none opacity-50" : undefined}>
                              <span className="inline-flex items-center justify-center h-7 px-2 text-sm rounded-md hover:bg-muted cursor-pointer">
                                <Plus className="h-3 w-3 mr-1" />
                                가져오기
                              </span>
                              <input
                                id="comm-photo-gallery"
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleCommPhotoUpload}
                                disabled={!canMutateCommunications}
                              />
                            </label>
                          </div>
                          <Button
                            size="sm"
                            className={`h-9 ${ACTION_BUTTON_CLASS.create}`}
                            onClick={handleSaveCommunication}
                            disabled={!canMutateCommunications || isCommSaving}
                          >
                            <Save className="h-4 w-4 mr-1.5" />
                            {isCommSaving ? "등록 중..." : "등록"}
                          </Button>
                        </div>
                        {commFormPhotos.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {commFormPhotos.map((p) => (
                              <div key={p.id} className="relative w-16 h-16 rounded border overflow-hidden group">
                                <button
                                  type="button"
                                  onClick={() => openImagePreview({ src: p.preview, alt: p.name })}
                                  className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-primary rounded"
                                  aria-label={`${p.name} 크게 보기`}
                                >
                                  <img src={p.preview} alt={p.name} className="w-full h-full object-cover pointer-events-none" />
                                </button>
                                <button
                                  type="button"
                                  className="absolute top-0 right-0 p-0.5 bg-destructive text-destructive-foreground rounded-bl opacity-0 group-hover:opacity-100 z-10 disabled:opacity-0"
                                  onClick={() => handleRemoveCommPhoto(p.id)}
                                  aria-label="사진 삭제"
                                  disabled={!canMutateCommunications}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isAdminViewer && selectedOrderId && (
                        <p className="text-sm text-muted-foreground rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2">
                          관리자는 공사일지 및 공사완료 처리는 조회만 가능합니다.
                        </p>
                      )}
                      <div className="grid grid-cols-[1fr_2fr] gap-4">
                        <div className="flex flex-col gap-1">
                          <Label className="text-sm">일자</Label>
                          <Input
                            type="date"
                            value={formData.logDate}
                            onChange={(e) => setFormData((p) => ({ ...p, logDate: e.target.value }))}
                            className="h-8 text-sm border-[#343637] dark:border-[#6b7280]"
                            disabled={!canMutateConstructionLog}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-sm">일지제목</Label>
                          <Input
                            value={formData.logTitle}
                            onChange={(e) => setFormData((p) => ({ ...p, logTitle: e.target.value }))}
                            placeholder="일지 제목"
                            className="h-8 text-sm border-[#343637] dark:border-[#6b7280]"
                            disabled={!canMutateConstructionLog}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">내용</Label>
                        <Textarea
                          value={formData.content}
                          onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                          placeholder="일지 내용"
                          className="min-h-[100px] text-sm border-[#343637] dark:border-[#6b7280] resize-none"
                          disabled={!canMutateConstructionLog}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">특이사항</Label>
                        <Textarea
                          value={formData.remarks}
                          onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                          placeholder="특이사항"
                          className="min-h-[80px] text-sm border-[#343637] dark:border-[#6b7280] resize-none"
                          disabled={!canMutateConstructionLog}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">시공전 사진</Label>
                          {canMutateConstructionLog && (
                            <div className="flex items-center gap-1">
                              <label htmlFor="construction-photo-camera">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-sm" type="button" asChild>
                                  <span>
                                    <Camera className="h-3 w-3 mr-1" />
                                    찍기
                                  </span>
                                </Button>
                                <input
                                  id="construction-photo-camera"
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                />
                              </label>
                              <label htmlFor="construction-photo-gallery">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-sm" type="button" asChild>
                                  <span>
                                    <Plus className="h-3 w-3 mr-1" />
                                    가져오기
                                  </span>
                                </Button>
                                <input
                                  id="construction-photo-gallery"
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {formPhotos.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {formPhotos.map((p) => (
                              <div key={p.id} className="relative w-16 h-16 rounded border overflow-hidden group">
                                <button
                                  type="button"
                                  onClick={() => openImagePreview({ src: p.preview, alt: p.name })}
                                  className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-primary rounded"
                                  aria-label={`${p.name} 크게 보기`}
                                >
                                  <img src={p.preview} alt={p.name} className="w-full h-full object-cover pointer-events-none" />
                                </button>
                                {canMutateConstructionLog && (
                                <button
                                  type="button"
                                  className="absolute top-0 right-0 p-0.5 bg-destructive text-destructive-foreground rounded-bl opacity-0 group-hover:opacity-100 z-10"
                                  onClick={() => handleRemovePhoto(p.id)}
                                  aria-label="사진 삭제"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-4">
                        {canMutateConstructionLog && (
                        <>
                        <Button size="sm" className={`h-9 ${ACTION_BUTTON_CLASS.create}`} onClick={handleSaveLog} disabled={isSaving}>
                          <Save className="h-4 w-4 mr-1.5" />
                          {isSaving ? "저장 중..." : "일지등록"}
                        </Button>
                        {selectedLogId && (
                          <Button size="sm" variant="outline" className={`h-9 ${ACTION_BUTTON_CLASS.delete}`} onClick={handleDeleteLog}>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            삭제
                          </Button>
                        )}
                        </>
                        )}
                        {canMutateConstructionStatus && (
                          selectedConstruction?.status === "completed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 ml-auto"
                              onClick={handleCancelCompleteConstruction}
                              disabled={isCompleting || !canCancelCompleteConstruction}
                              title={
                                !canCancelCompleteConstruction
                                  ? "수금이 완료된 공사는 공사완료를 취소할 수 없습니다."
                                  : undefined
                              }
                            >
                              <HardHat className="h-4 w-4 mr-1.5" />
                              {isCompleting ? "처리 중..." : "공사완료취소"}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-9 ml-auto" onClick={handleCompleteConstruction} disabled={isCompleting}>
                              <HardHat className="h-4 w-4 mr-1.5" />
                              {isCompleting ? "처리 중..." : "공사완료"}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {estimatePdfTarget && (
        <EstimatePdfViewerDialog
          open={isEstimatePdfOpen}
          onOpenChange={setIsEstimatePdfOpen}
          estimateId={estimatePdfTarget.estimateId}
          estimateNo={estimatePdfTarget.estimateNo}
        />
      )}
    </TooltipProvider>
  )
}

export default ConstructionManagementClient
