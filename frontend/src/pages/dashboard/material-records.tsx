'use client'

import { useEffect, useState, useMemo } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axios from 'axios'
import { Image as ImageIcon, X, Download, Search, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/context/AuthContext'

interface MaterialRecord {
  id: string
  material_id: string
  enrollment_id: string
  materials?: { title: string; author: string; level: string; type: string }
  enrollments?: {
    id: string
    issued_date: string
    due_date: string
    student_phone: string
    notes?: string
    erp_updated?: boolean
    students?: { name: string; email: string }
    users?: { full_name: string }
  }
}

interface EnrollmentGroup {
  enrollmentId: string
  enrollment: MaterialRecord['enrollments']
  items: MaterialRecord[]
}

interface EnrollmentImage {
  id: string
  storage_path: string
  file_name: string
  url: string
}

const typeLabel: Record<string, string> = { book: 'Sách', gift: 'Quà tặng', other: 'Khác' }

export default function MaterialRecordsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<MaterialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedEnrollments, setExpandedEnrollments] = useState<Set<string>>(new Set())

  // Date filter
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Image viewer
  const [viewingImages, setViewingImages] = useState<EnrollmentImage[]>([])
  const [viewingEnrollmentId, setViewingEnrollmentId] = useState<string | null>(null)
  const [loadingImages, setLoadingImages] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  interface ExportLog {
    id: string
    created_at: string
    material_id: string | null
    material_title: string
    quantity: number
    note: string | null
    exported_by: string | null
    erp_updated?: boolean
    materials?: { title: string; author: string; level: string; type: string }
  }
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([])
  const [loadingExportLogs, setLoadingExportLogs] = useState(false)

  const fetchExportLogs = async () => {
    try {
      setLoadingExportLogs(true)
      const params = new URLSearchParams()
      if (filterMonth) {
        const [y, m] = filterMonth.split('-').map(Number)
        params.set('date_from', `${y}-${String(m).padStart(2, '0')}-01`)
        const lastDay = new Date(y, m, 0).getDate()
        params.set('date_to', `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
      }
      const response = await axios.get(`/api/export-logs?${params.toString()}`)
      if (response.data.success) setExportLogs(response.data.data.logs)
    } catch {
      toast.error('Không thể tải lịch sử phát cho lớp')
    } finally {
      setLoadingExportLogs(false)
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)

      let dateFrom = ''
      let dateTo = ''

      if (filterMonth) {
        const [y, m] = filterMonth.split('-').map(Number)
        dateFrom = `${y}-${String(m).padStart(2, '0')}-01`
        const lastDay = new Date(y, m, 0).getDate()
        dateTo = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      }

      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const response = await axios.get(`/api/material-records?${params.toString()}`)
      if (response.data.success) {
        setRecords(response.data.data.records)
      }
    } catch {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    fetchExportLogs()
  }, [filterMonth])

  // Group records by enrollment_id
  const enrollmentGroups = useMemo<EnrollmentGroup[]>(() => {
    const map = new Map<string, EnrollmentGroup>()
    for (const r of records) {
      const eid = r.enrollment_id
      if (!map.has(eid)) {
        map.set(eid, { enrollmentId: eid, enrollment: r.enrollments, items: [] })
      }
      map.get(eid)!.items.push(r)
    }
    return Array.from(map.values())
  }, [records])

  // Search filter only (date filtering is done by DB)
  const filtered = useMemo(() => {
    if (!search.trim()) return enrollmentGroups
    const q = search.toLowerCase()
    return enrollmentGroups.filter((g) => {
      const name = g.enrollment?.students?.name?.toLowerCase() || ''
      const phone = g.enrollment?.student_phone || ''
      const staff = g.enrollment?.users?.full_name?.toLowerCase() || ''
      const titles = g.items.map((i) => i.materials?.title?.toLowerCase() || '').join(' ')
      return name.includes(q) || phone.includes(q) || staff.includes(q) || titles.includes(q)
    })
  }, [enrollmentGroups, search])

  const filteredExportLogs = useMemo(() => {
    if (!search.trim()) return exportLogs
    const q = search.toLowerCase()
    return exportLogs.filter((l) =>
      l.material_title.toLowerCase().includes(q) ||
      (l.note?.toLowerCase() || '').includes(q) ||
      (l.exported_by?.toLowerCase() || '').includes(q)
    )
  }, [exportLogs, search])

  const toggleExpand = (eid: string) => {
    setExpandedEnrollments((prev) => {
      const next = new Set(prev)
      next.has(eid) ? next.delete(eid) : next.add(eid)
      return next
    })
  }

  const handleExportLogErpToggle = async (logId: string, current: boolean) => {
    const next = !current
    setExportLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, erp_updated: next } : l))
    )
    try {
      await axios.patch(`/api/export-logs/${logId}`, { erp_updated: next })
    } catch {
      setExportLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, erp_updated: current } : l))
      )
      toast.error('Không thể cập nhật ERP')
    }
  }

  const handleErpToggle = async (enrollmentId: string, current: boolean) => {
    const next = !current
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) =>
        r.enrollment_id === enrollmentId && r.enrollments
          ? { ...r, enrollments: { ...r.enrollments, erp_updated: next } }
          : r
      )
    )
    try {
      await axios.patch(`/api/enrollments/${enrollmentId}`, { erp_updated: next })
    } catch {
      // Revert on failure
      setRecords((prev) =>
        prev.map((r) =>
          r.enrollment_id === enrollmentId && r.enrollments
            ? { ...r, enrollments: { ...r.enrollments, erp_updated: current } }
            : r
        )
      )
      toast.error('Không thể cập nhật ERP')
    }
  }

  const handleViewImages = async (enrollmentId: string) => {
    setViewingEnrollmentId(enrollmentId)
    setLoadingImages(true)
    setViewingImages([])
    try {
      const res = await axios.get(`/api/enrollment-images?enrollment_id=${enrollmentId}`)
      const rows = res.data.data || []

      const images: EnrollmentImage[] = rows.map((img: any) => {
        const { data: urlData } = supabase.storage
          .from('enrollment-images')
          .getPublicUrl(img.storage_path)
        return { ...img, url: urlData.publicUrl }
      })
      setViewingImages(images)
    } catch {
      toast.error('Không thể tải ảnh')
    } finally {
      setLoadingImages(false)
    }
  }

  return (
    <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Lịch sử</h1>
            <p className="text-gray-500 mt-1">Quản lý sách và quà tặng đã phát cho học viên</p>
          </div>

          {/* Date filter */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <CalendarDays size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lọc theo tháng</span>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </Card>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm theo tên sách, học viên, SĐT, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Export Logs Section */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📤 Phát cho lớp</h2>
            {loadingExportLogs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredExportLogs.length === 0 ? (
              <p className="text-sm text-gray-400 pl-1">Không có lịch sử phát cho lớp trong tháng này</p>
            ) : (
              <div className="space-y-2">
                {filteredExportLogs.map((log) => (
                  <Card key={log.id} className="px-5 py-4">
                    {/* Top row: title + ERP button */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-semibold text-gray-900 leading-snug">{log.material_title}</p>
                      {/* ERP Update */}
                      <div className="shrink-0">
                        {log.erp_updated ? (
                          <button
                            type="button"
                            disabled={!user}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium ${user ? 'hover:bg-green-200 cursor-pointer' : 'cursor-default'}`}
                            onClick={() => user && handleExportLogErpToggle(log.id, true)}
                          >
                            <span>&#10003;</span> Đã Cập Nhật ERP
                          </button>
                        ) : user ? (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-300 text-gray-500 text-xs hover:border-blue-400 hover:text-blue-600 transition-colors"
                            onClick={() => handleExportLogErpToggle(log.id, false)}
                          >
                            <span className="w-3 h-3 rounded border border-current inline-block" />
                            Cập Nhật ERP
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {/* Bottom row: meta info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded font-medium ${
                        (log.materials?.type ?? 'book') === 'book'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {(log.materials?.type ?? 'book') === 'book' ? 'Sách' : 'Quà tặng'}
                      </span>
                      <span className="font-medium text-gray-700">SL: {log.quantity}</span>
                      <span className="text-gray-300">·</span>
                      <span>
                        {new Date(log.created_at).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {log.exported_by && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{log.exported_by}</span>
                        </>
                      )}
                      {log.note && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="italic">{log.note}</span>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enrollment Records Section */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📋 Phát cho học viên</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500">Không tìm thấy dữ liệu</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((group) => {
                const isExpanded = expandedEnrollments.has(group.enrollmentId)

                return (
                  <Card key={group.enrollmentId} className="overflow-hidden">
                    {/* Enrollment header row */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpand(group.enrollmentId)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Student */}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {group.enrollment?.students?.name || 'Không rõ'}
                          </p>
                          <p className="text-xs text-gray-500">{group.enrollment?.student_phone}</p>
                        </div>

                        <div className="hidden sm:block h-8 w-px bg-gray-200" />

                        {/* Staff */}
                        <div className="hidden sm:block min-w-0">
                          <p className="text-xs text-gray-400">Tư vấn viên</p>
                          <p className="text-sm text-gray-700 truncate">{group.enrollment?.users?.full_name || '-'}</p>
                        </div>

                        <div className="hidden sm:block h-8 w-px bg-gray-200" />

                        {/* Date */}
                        <div className="hidden sm:block">
                          <p className="text-xs text-gray-400">Ngày phát</p>
                          <p className="text-sm text-gray-700">
                            {group.enrollment?.issued_date
                              ? new Date(group.enrollment.issued_date).toLocaleDateString('vi-VN')
                              : '-'}
                          </p>
                        </div>


                      </div>

                      {/* ERP Update */}
                      <div className="mx-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {group.enrollment?.erp_updated ? (
                          <button
                            type="button"
                            disabled={!user}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium ${user ? 'hover:bg-green-200 cursor-pointer' : 'cursor-default'}`}
                            onClick={() => user && handleErpToggle(group.enrollmentId, true)}
                          >
                            <span>&#10003;</span> Đã Cập Nhật ERP
                          </button>
                        ) : user ? (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-300 text-gray-500 text-xs hover:border-blue-400 hover:text-blue-600 transition-colors"
                            onClick={() => handleErpToggle(group.enrollmentId, false)}
                          >
                            <span className="w-3.5 h-3.5 rounded border border-current inline-block" />
                            Cập Nhật ERP
                          </button>
                        ) : null}
                      </div>

                      <div className="ml-3 text-gray-400 flex-shrink-0">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        {/* Material items */}
                        <div className="space-y-2 mb-4">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  item.materials?.type === 'book'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-pink-100 text-pink-700'
                                }`}>
                                  {typeLabel[item.materials?.type || ''] || item.materials?.type}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{item.materials?.title || 'Không rõ'}</p>
                                  <p className="text-xs text-gray-500">{item.materials?.author} · {item.materials?.level}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer: notes + photos button */}
                        <div className="flex items-center justify-between">
                          <div>
                            {group.enrollment?.notes && (
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Ghi chú:</span> {group.enrollment.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewImages(group.enrollmentId)}
                          >
                            <ImageIcon size={14} className="mr-1" />
                            Xem ảnh
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Image Viewer Dialog */}
          {viewingEnrollmentId && (
            <div
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
              onClick={() => setViewingEnrollmentId(null)}
            >
              <div
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Ảnh đính kèm</h2>
                  <button onClick={() => setViewingEnrollmentId(null)} className="text-gray-400 hover:text-gray-700">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  {loadingImages ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : viewingImages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Không có ảnh đính kèm</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingImages.map((img) => (
                        <div key={img.id} className="group relative">
                          <img
                            src={img.url}
                            alt={img.file_name}
                            className="w-full h-40 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxSrc(img.url)}
                          />
                          <a
                            href={img.url}
                            download={img.file_name}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Tải xuống"
                          >
                            <Download size={14} className="text-gray-700" />
                          </a>
                          <p className="text-xs text-gray-400 mt-1 truncate">{img.file_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lightbox */}
          {lightboxSrc && (
            <div
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightboxSrc(null)}
            >
              <img
                src={lightboxSrc}
                alt="fullsize"
                className="max-w-full max-h-full rounded-lg object-contain"
              />
              <button
                className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/70"
                onClick={() => setLightboxSrc(null)}
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
  )
}
