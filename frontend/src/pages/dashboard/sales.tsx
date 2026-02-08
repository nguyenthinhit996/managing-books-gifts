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
import { Plus, Edit2, Search, UserCheck, UserX, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface SalesStaff {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  lending_records?: any[]
}

export default function SalesPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<SalesStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)
  const [toggleActive, setToggleActive] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<SalesStaff | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  })

  // Fetch sales staff
  const fetchStaff = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('role', 'sales')
      if (search) params.append('search', search)

      const response = await axios.get(`/api/users?${params}`)
      if (response.data.success) {
        setStaff(response.data.data.users)
      }
    } catch (err: any) {
      toast.error('Failed to load sales staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [search])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await axios.put(`/api/users/${editingId}`, formData)
        toast.success('Staff updated!')
      } else {
        await axios.post('/api/users', { ...formData, role: 'sales' })
        toast.success('Staff created!')
      }

      setShowDialog(false)
      setFormData({ full_name: '', email: '' })
      setEditingId(null)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save staff')
    }
  }

  // Handle toggle active/inactive
  const handleToggle = async () => {
    if (!toggleId) return

    try {
      await axios.put(`/api/users/${toggleId}`, { is_active: toggleActive })
      toast.success(`Staff ${toggleActive ? 'activated' : 'deactivated'}!`)
      setToggleId(null)
      fetchStaff()
    } catch (err: any) {
      toast.error('Failed to update staff status')
    }
  }

  // Handle edit
  const handleEdit = (s: SalesStaff) => {
    setFormData({
      full_name: s.full_name,
      email: s.email,
    })
    setEditingId(s.id)
    setShowDialog(true)
  }

  // View lending history
  const viewHistory = async (s: SalesStaff) => {
    try {
      const response = await axios.get(`/api/users/${s.id}`)
      if (response.data.success) {
        setSelectedStaff(response.data.data)
        setShowHistory(true)
      }
    } catch (err: any) {
      toast.error('Failed to load staff history')
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Staff</h1>
              <p className="text-gray-600 mt-2">Manage sales staff who handle book borrowing and returning</p>
            </div>
            {user?.role === 'manager' && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ full_name: '', email: '' })
                  setShowDialog(true)
                }}
              >
                <Plus size={18} className="mr-2" />
                Add Staff
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="flex-1 relative max-w-md">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Staff Table */}
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : staff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{s.full_name}</td>
                        <td className="py-3 px-4 text-gray-600">{s.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            s.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewHistory(s)}
                          >
                            <BookOpen size={16} />
                          </Button>
                          {user?.role === 'manager' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(s)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant={s.is_active ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => {
                                  setToggleId(s.id)
                                  setToggleActive(!s.is_active)
                                }}
                              >
                                {s.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
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
              <p className="text-center text-gray-600 py-8">No sales staff found</p>
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Update' : 'Create'} Staff
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Lending History Modal */}
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lending History - {selectedStaff?.full_name}</DialogTitle>
              </DialogHeader>
              {selectedStaff?.lending_records && selectedStaff.lending_records.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedStaff.lending_records.map((record: any) => (
                    <div key={record.id} className="p-3 border border-gray-200 rounded">
                      <p className="font-medium text-gray-900">{record.books?.title}</p>
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(record.issued_date).toLocaleDateString()}
                      </p>
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

          {/* Toggle Active Confirmation */}
          <AlertDialog open={!!toggleId} onOpenChange={(open: boolean) => !open && setToggleId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {toggleActive ? 'Activate' : 'Deactivate'} Staff
                </AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-gray-600">
                {toggleActive
                  ? 'This staff member will be able to handle book transactions again.'
                  : 'This staff member will no longer appear in the enrollment form.'}
              </p>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setToggleId(null)}>
                  Cancel
                </Button>
                <Button
                  variant={toggleActive ? 'default' : 'destructive'}
                  onClick={handleToggle}
                >
                  {toggleActive ? 'Activate' : 'Deactivate'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
