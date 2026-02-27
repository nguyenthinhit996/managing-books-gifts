'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, AlertCircle, Gift, ClipboardList, RefreshCw } from 'lucide-react'

interface Stats {
  totalMaterials: number
  availableMaterials: number
  borrowedMaterials: number
  overdueMaterials: number
  totalStudents: number
}

interface RecentRecord {
  id: string
  materials?: { title: string }
  enrollments?: { issued_date: string; students?: { name: string } }
  status: string
}

const statusMap: Record<string, { label: string; className: string }> = {
  borrowed: { label: 'Đang mượn', className: 'bg-yellow-100 text-yellow-700' },
  returned: { label: 'Đã trả', className: 'bg-green-100 text-green-700' },
  overdue: { label: 'Quá hạn', className: 'bg-red-100 text-red-700' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.data.stats)
        setRecent(response.data.data.recentRecords || [])
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <DashboardLayout>
        <div className="p-8 max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Tổng quan</h1>
              <p className="text-gray-500 mt-1">Xin chào, <span className="font-medium text-gray-700">{user?.full_name || user?.email}</span> 👋</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="p-4 mb-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tổng tài liệu</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalMaterials}</p>
                    <p className="text-xs text-gray-400 mt-1">Sách + Quà tặng</p>
                  </div>
                  <BookOpen className="text-blue-400 mt-1 shrink-0" size={28} />
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Còn sẵn</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.availableMaterials}</p>
                    <p className="text-xs text-gray-400 mt-1">Có thể cho mượn</p>
                  </div>
                  <Gift className="text-green-400 mt-1 shrink-0" size={28} />
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đang mượn</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.borrowedMaterials}</p>
                    <p className="text-xs text-gray-400 mt-1">Học viên đang giữ</p>
                  </div>
                  <ClipboardList className="text-yellow-400 mt-1 shrink-0" size={28} />
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quá hạn</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdueMaterials}</p>
                    <p className="text-xs text-gray-400 mt-1">Chưa trả đúng hạn</p>
                  </div>
                  <AlertCircle className="text-red-400 mt-1 shrink-0" size={28} />
                </div>
              </Card>

              <Card className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Học viên</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-400 mt-1">Đã đăng ký</p>
                  </div>
                  <Users className="text-purple-400 mt-1 shrink-0" size={28} />
                </div>
              </Card>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">⚡ Truy cập nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/dashboard/materials?type=book">
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer border hover:border-blue-300">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Quản lý Sách</p>
                    <p className="text-xs text-gray-500">Xem & cập nhật kho sách</p>
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/materials?type=gift">
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer border hover:border-pink-300">
                  <div className="bg-pink-100 p-2 rounded-lg">
                    <Gift size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Quản lý Quà tặng</p>
                    <p className="text-xs text-gray-500">Xem & cập nhật kho quà</p>
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/material-records">
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer border hover:border-yellow-300">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <TrendingUp size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lịch sử mượn</p>
                    <p className="text-xs text-gray-500">Xem các lượt phát tài liệu</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">🕓 Hoạt động gần đây</h2>
            {recent.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recent.map((record) => {
                  const status = statusMap[record.status] ?? { label: record.status, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={record.id} className="flex justify-between items-center py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {record.materials?.title || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Học viên: <span className="font-medium">{record.enrollments?.students?.name || '—'}</span>
                          {record.enrollments?.issued_date && (
                            <> · {new Date(record.enrollments.issued_date).toLocaleDateString('vi-VN')}</>
                          )}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">Chưa có hoạt động nào</p>
            )}
          </Card>

        </div>
      </DashboardLayout>
  )
}
