'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BookOpen, CheckCircle } from 'lucide-react'

interface SalesStaff {
  id: string
  full_name: string
  email: string
}

interface Book {
  id: string
  title: string
  author: string
  level: string
  quantity_available: number
}

interface Student {
  id: string
  name: string
  email: string
  phone: string
  level: string
  student_type: string
}

// Vietnam phone validation: exactly 10 digits starting with 0
const validateVietnamPhone = (phone: string): boolean => {
  const phoneRegex = /^0\d{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export default function EnrollmentPage() {
  const [type, setType] = useState<'borrow' | 'return'>('borrow')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [phoneExists, setPhoneExists] = useState<Student | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [salesStaff, setSalesStaff] = useState<SalesStaff[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const [showBookDropdown, setShowBookDropdown] = useState(false)

  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone: '',
    level: 'beginner',
    purpose: 'new',
    sales_staff_id: '',
    sales_staff_name: '',
    book_id: '',
    book_title: '',
    notes: '',
  })

  // Fetch sales staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await axios.get('/api/users/sales')
        if (response.data.success) {
          setSalesStaff(response.data.data.staff)
        }
      } catch (err: any) {
        console.error('Failed to load sales staff:', err)
      }
    }

    fetchStaff()
  }, [])

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('/api/books?limit=100')
        if (response.data.success) {
          setBooks(response.data.data.books.filter((b: Book) => b.quantity_available > 0))
        }
      } catch (err: any) {
        console.error('Failed to load books:', err)
      }
    }

    fetchBooks()
  }, [])

  // Check phone exists (actual API call)
  const checkPhone = useCallback(async (phone: string) => {
    if (!validateVietnamPhone(phone)) {
      return
    }

    setCheckingPhone(true)
    try {
      const response = await axios.get(`/api/students/check-phone?phone=${phone}`)
      if (response.data.success && response.data.data.student) {
        setPhoneExists(response.data.data.student)
        setBorrowedBooks(response.data.data.borrowed_books || [])
      } else {
        setPhoneExists(null)
        setBorrowedBooks([])
      }
    } catch (err: any) {
      setPhoneExists(null)
      setBorrowedBooks([])
    } finally {
      setCheckingPhone(false)
    }
  }, [])

  // Debounce timer ref
  const phoneTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value
    setFormData({ ...formData, phone, book_id: '', book_title: '' })
    setBookSearch('')

    // Clear previous timer
    if (phoneTimerRef.current) {
      clearTimeout(phoneTimerRef.current)
    }

    // Reset state immediately when phone is cleared or invalid
    if (!phone) {
      setPhoneExists(null)
      setBorrowedBooks([])
      setCheckingPhone(false)
      return
    }

    if (!validateVietnamPhone(phone)) {
      setPhoneExists(null)
      setBorrowedBooks([])
      return
    }

    // Debounce 2s before calling API
    phoneTimerRef.current = setTimeout(() => {
      checkPhone(phone)
    }, 2000)
  }

  // Filter sales staff based on search
  const filteredStaff = staffSearch
    ? salesStaff.filter(
        (s) =>
          s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(staffSearch.toLowerCase())
      )
    : salesStaff

  // Get available books based on mode
  const availableBooks = type === 'borrow'
    ? // Borrow: exclude books the student currently has borrowed
      phoneExists && borrowedBooks.length > 0
        ? books.filter((b) => !borrowedBooks.some((bb: any) => bb.book_id === b.id))
        : books
    : // Return: only show books the student currently has borrowed
      borrowedBooks.map((bb: any) => bb.books).filter(Boolean)

  // Filter books based on search
  const filteredBooks = bookSearch
    ? availableBooks.filter(
        (b: any) =>
          b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
          b.author?.toLowerCase().includes(bookSearch.toLowerCase())
      )
    : availableBooks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone
    if (!formData.phone) {
      toast.error('Phone number is required')
      return
    }

    if (!validateVietnamPhone(formData.phone)) {
      toast.error('Invalid phone number. Must be exactly 10 digits starting with 0')
      return
    }

    if (type === 'borrow') {
      // Validate borrow fields
      if (!formData.student_name && !phoneExists?.name) {
        toast.error('Student name is required')
        return
      }

      if (!formData.sales_staff_id) {
        toast.error('Please select a sales staff member')
        return
      }

      if (!formData.book_id) {
        toast.error('Please select a book')
        return
      }
    } else {
      // Validate return fields
      if (!formData.book_id) {
        toast.error('Please select a book to return')
        return
      }

      if (!phoneExists) {
        toast.error('Student not found. Please check the phone number.')
        return
      }
    }

    try {
      setLoading(true)
      const response = await axios.post('/api/enrollment', {
        type,
        student_name: type === 'borrow' ? (formData.student_name || phoneExists?.name) : phoneExists?.name,
        email: type === 'borrow' ? formData.email : phoneExists?.email,
        phone: formData.phone,
        level: type === 'borrow' ? formData.level : phoneExists?.level,
        purpose: type === 'borrow' ? formData.purpose : undefined,
        sales_staff_id: type === 'borrow' ? formData.sales_staff_id : undefined,
        book_id: formData.book_id,
        notes: formData.notes,
      })

      if (response.data.success) {
        toast.success(response.data.data.message)
        setSubmitted(true)
        setFormData({
          student_name: '',
          email: '',
          phone: '',
          level: 'beginner',
          purpose: 'new',
          sales_staff_id: '',
          sales_staff_name: '',
          book_id: '',
          book_title: '',
          notes: '',
        })
        setPhoneExists(null)
        setBorrowedBooks([])
        setBookSearch('')
        setStaffSearch('')

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <BookOpen size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Book Management</h1>
          <p className="text-gray-600 mt-2">Borrow or return books</p>
        </div>

        {/* Success Message */}
        {submitted && (
          <Card className="p-4 mb-6 border-green-200 bg-green-50 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle size={24} />
              <div>
                <p className="font-semibold">Operation Successful!</p>
                <p className="text-sm">The transaction has been processed.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div>
              <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                Transaction Type *
              </Label>
              <div className="flex gap-4 mt-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="borrow"
                    checked={type === 'borrow'}
                    onChange={(e) => {
                      setType(e.target.value as 'borrow' | 'return')
                      setFormData({ student_name: '', email: '', phone: '', level: 'beginner', purpose: 'new', sales_staff_id: '', sales_staff_name: '', book_id: '', book_title: '', notes: '' })
                      setPhoneExists(null)
                      setBorrowedBooks([])
                      setBookSearch('')
                      setStaffSearch('')
                      setShowStaffDropdown(false)
                      setShowBookDropdown(false)
                    }}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-2 text-gray-700">Borrow Book</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="return"
                    checked={type === 'return'}
                    onChange={(e) => {
                      setType(e.target.value as 'borrow' | 'return')
                      setFormData({ student_name: '', email: '', phone: '', level: 'beginner', purpose: 'new', sales_staff_id: '', sales_staff_name: '', book_id: '', book_title: '', notes: '' })
                      setPhoneExists(null)
                      setBorrowedBooks([])
                      setBookSearch('')
                      setStaffSearch('')
                      setShowStaffDropdown(false)
                      setShowBookDropdown(false)
                    }}
                    className="w-4 h-4 text-green-600 cursor-pointer"
                  />
                  <span className="ml-2 text-gray-700">Return Book</span>
                </label>
              </div>
            </div>

            {/* Sales Staff (shown for borrow) */}
            {type === 'borrow' && (
              <div>
                <Label htmlFor="sales_staff" className="text-sm font-semibold text-gray-700">
                  Sales Staff *
                </Label>
                <div className="relative mt-2">
                  <Input
                    type="text"
                    placeholder="Search for staff member..."
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value)
                      setShowStaffDropdown(true)
                    }}
                    onFocus={() => setShowStaffDropdown(true)}
                    className="w-full"
                  />
                  {showStaffDropdown && filteredStaff.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              sales_staff_id: staff.id,
                              sales_staff_name: staff.full_name,
                            })
                            setStaffSearch(staff.full_name)
                            setShowStaffDropdown(false)
                          }}
                        >
                          <p className="font-medium text-gray-900">{staff.full_name}</p>
                          <p className="text-xs text-gray-500">{staff.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.sales_staff_id && (
                    <p className="text-xs text-green-600 mt-1">✓ {formData.sales_staff_name} selected</p>
                  )}
                </div>
              </div>
            )}

            {/* Phone (Always shown) */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Student Phone *
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="mt-2"
                />
                {checkingPhone && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    Checking...
                  </span>
                )}
              </div>
              {phoneExists && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Found: {phoneExists.name} ({phoneExists.level})
                </p>
              )}
              {formData.phone && !phoneExists && type === 'return' && (
                <p className="text-xs text-red-600 mt-1">
                  ✗ Student not found
                </p>
              )}
              {formData.phone && !validateVietnamPhone(formData.phone) && (
                <p className="text-xs text-red-600 mt-1">
                  Invalid format. Must be 10 digits starting with 0
                </p>
              )}
            </div>

            {/* BORROW FIELDS */}
            {type === 'borrow' && (
              <>
                {/* Student Name */}
                <div>
                  <Label htmlFor="student_name" className="text-sm font-semibold text-gray-700">
                    Student Name *
                  </Label>
                  <Input
                    id="student_name"
                    type="text"
                    placeholder={phoneExists ? phoneExists.name : 'Enter student full name'}
                    required
                    value={formData.student_name || (phoneExists?.name || '')}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Purpose */}
                <div>
                  <Label htmlFor="purpose" className="text-sm font-semibold text-gray-700">
                    Purpose *
                  </Label>
                  <select
                    id="purpose"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New Student</option>
                    <option value="trial">Trial Student</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {/* Book Selection: show only after valid phone */}
            {validateVietnamPhone(formData.phone) && (type === 'borrow' || phoneExists) && (
            <div>
              <Label htmlFor="book" className="text-sm font-semibold text-gray-700">
                Book Selection *
              </Label>
              <div className="relative mt-2">
                <Input
                  type="text"
                  placeholder="Search for a book..."
                  value={bookSearch}
                  onChange={(e) => {
                    setBookSearch(e.target.value)
                    setShowBookDropdown(true)
                  }}
                  onFocus={() => setShowBookDropdown(true)}
                  className="w-full"
                />
                {showBookDropdown && filteredBooks.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            book_id: book.id,
                            book_title: book.title,
                          })
                          setBookSearch(book.title)
                          setShowBookDropdown(false)
                        }}
                      >
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.author} • {book.level}</p>
                        {type === 'borrow' && (
                          <p className="text-xs text-gray-400">Available: {book.quantity_available}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {formData.book_id && (
                  <p className="text-xs text-green-600 mt-1">✓ {formData.book_title} selected</p>
                )}
              </div>
            </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3 ${
                type === 'borrow'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Processing...' : type === 'borrow' ? 'Borrow Book' : 'Return Book'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              All fields marked with * are required
            </p>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Need help? Contact the center administrator
          </p>
        </div>
      </div>
    </div>
  )
}

