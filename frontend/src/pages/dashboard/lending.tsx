'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog'
import axios from 'axios'
import { Plus, Edit2, Search, CheckCircle, Clock, AlertCircle as AlertIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface LendingRecord {
  id: string
  book_id: string
  student_id: string
  issued_date: string
  due_date: string
  return_date?: string
  status: string
  books?: { title: string; author: string; level: string }
  students?: { name: string; email: string }
  users?: { full_name: string }
}

export default function LendingPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<LendingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [updateId, setUpdateId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [books, setBooks] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [formData, setFormData] = useState({
    book_id: '',
    student_id: '',
    sales_staff_id: user?.id || '',
    due_date: '',
  })
  const [updateData, setUpdateData] = useState({
    status: 'returned',
    return_date: new Date().toISOString().split('T')[0],
  })

  // Fetch lending records
  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (status !== 'all') params.append('status', status)

      const response = await axios.get(`/api/lending?${params}`)
      if (response.data.success) {
        setRecords(response.data.data.records)
      }
    } catch (err: any) {
      toast.error('Failed to load lending records')
    } finally {
      setLoading(false)
    }
  }

  // Fetch books and students for dropdowns
  const fetchOptions = async () => {
    try {
      const [booksRes, studentsRes] = await Promise.all([
        axios.get('/api/books?limit=1000'),
        axios.get('/api/students?limit=1000'),
      ])
      if (booksRes.data.success) setBooks(booksRes.data.data.books)
      if (studentsRes.data.success) setStudents(studentsRes.data.data.students)
    } catch (err: any) {
      toast.error('Failed to load form options')
    }
  }

  useEffect(() => {
    fetchRecords()
    fetchOptions()
  }, [status])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const book = books.find((b) => b.id === formData.book_id)
      if (!book || book.quantity_available <= 0) {
        toast.error('Book is not available')
        return
      }

      await axios.post('/api/lending', {
        ...formData,
        sales_staff_id: user?.id || '',
      })
      toast.success('Lending record created!')

      setShowDialog(false)
      setFormData({
        book_id: '',
        student_id: '',
        sales_staff_id: user?.id || '',
        due_date: '',
      })
      fetchRecords()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create lending record')
    }
  }

  // Handle update
  const handleUpdate = async () => {
    if (!updateId) return

    try {
      await axios.put(`/api/lending/${updateId}`, updateData)
      toast.success(`Book marked as ${updateData.status}!`)
      setConfirmId(null)
      setUpdateId(null)
      setUpdateData({
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0],
      })
      fetchRecords()
    } catch (err: any) {
      toast.error('Failed to update lending record')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'borrowed':
        return 'bg-yellow-100 text-yellow-700'
      case 'returned':
        return 'bg-green-100 text-green-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'borrowed':
        return <Clock size={16} />
      case 'returned':
        return <CheckCircle size={16} />
      case 'overdue':
        return <AlertIcon size={16} />
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lending Records</h1>
              <p className="text-gray-600 mt-2">Manage book borrowing and returning</p>
            </div>
            {user?.role === 'sales' && (
              <Button
                onClick={() => {
                  setUpdateId(null)
                  setFormData({
                    book_id: '',
                    student_id: '',
                    sales_staff_id: user?.id || '',
                    due_date: '',
                  })
                  setShowDialog(true)
                }}
              >
                <Plus size={18} className="mr-2" />
                New Lending
              </Button>
            )}
          </div>

          {/* Filter */}
          <div className="mb-6">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="borrowed">Borrowed</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Lending Records Table */}
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Book</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sales Staff</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Issued Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      {user?.role === 'manager' && (
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{record.books?.title || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{record.books?.author}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{record.students?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{record.students?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {record.users?.full_name || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(record.issued_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            record.status
                          )}`}>
                            {getStatusIcon(record.status)}
                            {record.status}
                          </span>
                        </td>
                        {user?.role === 'manager' && (
                          <td className="py-3 px-4 text-right">
                            {record.status === 'borrowed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUpdateId(record.id)
                                  setUpdateData({
                                    status: 'returned',
                                    return_date: new Date().toISOString().split('T')[0],
                                  })
                                  setConfirmId(record.id)
                                }}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Mark Returned
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No lending records found</p>
            )}
          </Card>

          {/* Create Lending Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Lending Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Book *</Label>
                  <select
                    required
                    value={formData.book_id}
                    onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a book</option>
                    {books
                      .filter((b) => b.quantity_available > 0)
                      .map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.quantity_available} available)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Student *</Label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Record</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Return Confirmation Dialog */}
          <AlertDialog open={!!confirmId} onOpenChange={(open: boolean) => !open && setConfirmId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark Book as Returned</AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-gray-600 mb-4">Are you sure the book has been returned?</p>
              <div className="mb-4">
                <Label>Return Date</Label>
                <Input
                  type="date"
                  value={updateData.return_date}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, return_date: e.target.value })
                  }
                />
              </div>
              <AlertDialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmId(null)
                    setUpdateId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Confirm Return</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
