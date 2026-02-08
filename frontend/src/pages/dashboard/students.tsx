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
import { Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  level: string
  student_type: string
  lending_records?: any[]
  created_at: string
}

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('all')
  const [studentType, setStudentType] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    level: 'beginner',
    student_type: 'new',
  })

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (level !== 'all') params.append('level', level)
      if (studentType !== 'all') params.append('student_type', studentType)

      const response = await axios.get(`/api/students?${params}`)
      if (response.data.success) {
        setStudents(response.data.data.students)
      }
    } catch (err: any) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [search, level, studentType])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await axios.put(`/api/students/${editingId}`, formData)
        toast.success('Student updated!')
      } else {
        await axios.post('/api/students', formData)
        toast.success('Student created!')
      }

      setShowDialog(false)
      setFormData({ name: '', email: '', phone: '', level: 'beginner', student_type: 'new' })
      setEditingId(null)
      fetchStudents()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save student')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return

    try {
      // Note: Students can't be deleted from students/[id].ts, only updated
      // This is intentional to preserve history
      toast.error('Students cannot be deleted to preserve lending history')
      setDeleteId(null)
    } catch (err: any) {
      toast.error('Failed to delete student')
    }
  }

  // Handle edit
  const handleEdit = (student: Student) => {
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      level: student.level,
      student_type: student.student_type,
    })
    setEditingId(student.id)
    setShowDialog(true)
  }

  // View lending history
  const viewHistory = async (student: Student) => {
    try {
      const response = await axios.get(`/api/students/${student.id}`)
      if (response.data.success) {
        setSelectedStudent(response.data.data)
        setShowHistory(true)
      }
    } catch (err: any) {
      toast.error('Failed to load student history')
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
              <p className="text-gray-600 mt-2">Manage students and their book borrowing records</p>
            </div>
            {user?.role === 'manager' && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', email: '', phone: '', level: 'beginner', student_type: 'new' })
                  setShowDialog(true)
                }}
              >
                <Plus size={18} className="mr-2" />
                Add Student
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={studentType}
              onChange={(e) => setStudentType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="new">New</option>
              <option value="trial">Trial</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Students Table */}
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{student.name}</td>
                        <td className="py-3 px-4 text-gray-600">{student.phone || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {student.level}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.student_type === 'new'
                              ? 'bg-green-100 text-green-700'
                              : student.student_type === 'trial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {student.student_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewHistory(student)}
                          >
                            <BookOpen size={16} />
                          </Button>
                          {user?.role === 'manager' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(student)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteId(student.id)}
                                disabled
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No students found</p>
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Level *</Label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <Label>Type *</Label>
                  <select
                    required
                    value={formData.student_type}
                    onChange={(e) => setFormData({ ...formData, student_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="trial">Trial</option>
                    <option value="returning">Returning</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Update' : 'Create'} Student
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Lending History Modal */}
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lending History - {selectedStudent?.name}</DialogTitle>
              </DialogHeader>
              {selectedStudent?.lending_records && selectedStudent.lending_records.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedStudent.lending_records.map((record: any) => (
                    <div key={record.id} className="p-3 border border-gray-200 rounded">
                      <p className="font-medium text-gray-900">{record.books?.title}</p>
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(record.issued_date).toLocaleDateString()}
                      </p>
                      {record.return_date && (
                        <p className="text-sm text-gray-600">
                          Returned: {new Date(record.return_date).toLocaleDateString()}
                        </p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
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
                <p className="text-center text-gray-600 py-4">No lending history</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-gray-600">Students cannot be deleted to preserve lending history.</p>
              <AlertDialogFooter>
                <Button onClick={() => setDeleteId(null)}>OK</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
