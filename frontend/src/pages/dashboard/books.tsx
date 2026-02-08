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
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Book {
  id: string
  isbn?: string
  title: string
  author: string
  level: string
  quantity_total: number
  quantity_available: number
  condition?: string
  created_at: string
}

export default function BooksPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    level: 'beginner',
    quantity_total: '1',
  })

  // Fetch books
  const fetchBooks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (level !== 'all') params.append('level', level)

      const response = await axios.get(`/api/books?${params}`)
      if (response.data.success) {
        setBooks(response.data.data.books)
      }
    } catch (err: any) {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [search, level])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await axios.put(`/api/books/${editingId}`, {
          ...formData,
          quantity_total: Number(formData.quantity_total),
        })
        toast.success('Book updated!')
      } else {
        await axios.post('/api/books', {
          ...formData,
          quantity_total: Number(formData.quantity_total),
        })
        toast.success('Book created!')
      }

      setShowDialog(false)
      setFormData({ isbn: '', title: '', author: '', level: 'beginner', quantity_total: '1' })
      setEditingId(null)
      fetchBooks()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save book')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await axios.delete(`/api/books/${deleteId}`)
      toast.success('Book deleted!')
      setDeleteId(null)
      fetchBooks()
    } catch (err: any) {
      toast.error('Failed to delete book')
    }
  }

  // Handle edit
  const handleEdit = (book: Book) => {
    setFormData({
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      level: book.level,
      quantity_total: String(book.quantity_total),
    })
    setEditingId(book.id)
    setShowDialog(true)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Books Management</h1>
              <p className="text-gray-600 mt-2">Manage your library inventory</p>
            </div>
            {user?.role === 'manager' && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ isbn: '', title: '', author: '', level: 'beginner', quantity_total: '1' })
                  setShowDialog(true)
                }}
              >
                <Plus size={18} className="mr-2" />
                Add Book
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Search books..."
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
              <option value="ielts">IELTS</option>
              <option value="toeic">TOEIC</option>
            </select>
          </div>

          {/* Books Table */}
          <Card className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Borrowing</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Available</th>
                      {user?.role === 'manager' && (
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{book.title}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${book.quantity_total - book.quantity_available > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {book.quantity_total - book.quantity_available}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {book.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium">{book.quantity_total}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${book.quantity_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {book.quantity_available}
                          </span>
                        </td>
                        {user?.role === 'manager' && (
                          <td className="py-3 px-4 text-right flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(book)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteId(book.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No books found</p>
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Book' : 'Add New Book'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>ISBN (optional)</Label>
                  <Input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Author *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
                    <option value="ielts">IELTS</option>
                    <option value="toeic">TOEIC</option>
                  </select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity_total}
                    onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
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
                    {editingId ? 'Update' : 'Create'} Book
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Book</AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-gray-600">Are you sure? This cannot be undone.</p>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
