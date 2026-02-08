'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, AlertCircle } from 'lucide-react'

interface Stats {
  totalBooks: number
  availableBooks: number
  borrowedBooks: number
  overdueBooks: number
  totalStudents: number
}

interface RecentRecord {
  id: string
  books?: { title: string }
  students?: { name: string }
  issued_date: string
  status: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/stats')
        if (response.data.success) {
          setStats(response.data.data.stats)
          setRecent(response.data.data.recentRecords || [])
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, []) // Empty dependency array - runs once on mount

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Total Books */}
              <Card className="p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Books</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBooks}</p>
                  </div>
                  <BookOpen className="text-blue-500 opacity-20" size={40} />
                </div>
              </Card>

              {/* Available Books */}
              <Card className="p-6 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Available</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.availableBooks}</p>
                  </div>
                  <TrendingUp className="text-green-500 opacity-20" size={40} />
                </div>
              </Card>

              {/* Borrowed Books */}
              <Card className="p-6 border-l-4 border-l-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Borrowed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.borrowedBooks}</p>
                  </div>
                  <BookOpen className="text-yellow-500 opacity-20" size={40} />
                </div>
              </Card>

              {/* Overdue Books */}
              <Card className="p-6 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Overdue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdueBooks}</p>
                  </div>
                  <AlertCircle className="text-red-500 opacity-20" size={40} />
                </div>
              </Card>

              {/* Total Students */}
              <Card className="p-6 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
                  </div>
                  <Users className="text-purple-500 opacity-20" size={40} />
                </div>
              </Card>
            </div>
          ) : null}

          {/* Quick Actions */}
          {user?.role === 'manager' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link href="/dashboard/books">
                <Button className="w-full justify-start">
                  <BookOpen size={18} className="mr-2" />
                  Manage Books
                </Button>
              </Link>
              <Link href="/dashboard/students">
                <Button className="w-full justify-start" variant="outline">
                  <Users size={18} className="mr-2" />
                  Manage Students
                </Button>
              </Link>
              <Link href="/dashboard/lending">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp size={18} className="mr-2" />
                  View Lending
                </Button>
              </Link>
            </div>
          )}

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Lending Activity</h2>
            {recent.length > 0 ? (
              <div className="space-y-2">
                {recent.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.books?.title || 'Unknown Book'} - {record.students?.name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-600">{new Date(record.issued_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'borrowed'
                        ? 'bg-yellow-100 text-yellow-700'
                        : record.status === 'returned'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No recent activity</p>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
