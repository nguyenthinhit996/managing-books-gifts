'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BookOpen, CheckCircle, Gift, X, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/utils/supabase'

interface SalesStaff {
  id: string
  full_name: string
  email: string
}

interface Material {
  id: string
  title: string
  author: string
  level: string
  type: string
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

// Vietnamese type label map
const typeLabel: Record<string, string> = { book: 'Sách', gift: 'Quà tặng', other: 'Khác' }

// Vietnam phone validation: exactly 10 digits starting with 0
const validateVietnamPhone = (phone: string): boolean => {
  const phoneRegex = /^0\d{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Normalize text: remove Vietnamese diacritics, punctuation, lowercase
const normalize = (str: string): string => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^\w\s]/g, '') // remove punctuation
    .toLowerCase()
    .trim()
}

export default function EnrollmentPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [phoneExists, setPhoneExists] = useState<Student | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [salesStaff, setSalesStaff] = useState<SalesStaff[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [borrowedMaterials, setBorrowedMaterials] = useState<any[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    phone: '',
    level: 'ielts',
    purpose: 'new',
    sales_staff_id: '',
    sales_staff_name: '',
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

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get('/api/materials?limit=100')
        if (response.data.success) {
          setMaterials(response.data.data.materials.filter((m: Material) => m.quantity_available > 0))
        }
      } catch (err: any) {
        console.error('Failed to load materials:', err)
      }
    }

    fetchMaterials()
  }, [])

  // Check phone exists (actual API call)
  // No useCallback wrapper — avoids stale closure; setState setters are always stable (Bug 3.1)
  const checkPhone = async (phone: string) => {
    if (!validateVietnamPhone(phone)) {
      return
    }

    setCheckingPhone(true)
    try {
      const response = await axios.get(`/api/students/check-phone?phone=${phone}`)
      if (response.data.success && response.data.data.student) {
        const borrowed: any[] = response.data.data.borrowed_materials || []
        setPhoneExists(response.data.data.student)
        setBorrowedMaterials(borrowed)
        // Clear any stale typed name so the DB name becomes authoritative (Bug 3.5)
        setFormData((prev) => ({ ...prev, student_name: '' }))
        // Remove any already-selected materials that the student has already borrowed
        setSelectedMaterials((prev) =>
          prev.filter((m) => !borrowed.some((bb: any) => bb.material_id === m.id))
        )
      } else {
        setPhoneExists(null)
        setBorrowedMaterials([])
      }
    } catch (err: any) {
      setPhoneExists(null)
      setBorrowedMaterials([])
    } finally {
      setCheckingPhone(false)
    }
  }

  // Debounce timer ref
  const phoneTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clear debounce timer on unmount to prevent setState on unmounted component (Bug 3.2)
  useEffect(() => {
    return () => {
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current)
    }
  }, [])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value
    setFormData({ ...formData, phone })
    setMaterialSearch('')

    // Clear previous timer
    if (phoneTimerRef.current) {
      clearTimeout(phoneTimerRef.current)
    }

    // Reset state immediately when phone is cleared or invalid
    if (!phone) {
      setPhoneExists(null)
      setBorrowedMaterials([])
      setCheckingPhone(false)
      return
    }

    if (!validateVietnamPhone(phone)) {
      setPhoneExists(null)
      setBorrowedMaterials([])
      return
    }

    // Debounce 2s before calling API
    phoneTimerRef.current = setTimeout(() => {
      checkPhone(phone)
    }, 2000)
  }

  const handleTypeToggle = (type: string) => {
    const isRemoving = selectedTypes.includes(type)
    const next = isRemoving ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]
    setSelectedTypes(next)
    if (isRemoving) {
      setSelectedMaterials((prev) => prev.filter((m) => m.type !== type))
      // Clear stale search text when the last type is deselected (Bug 3.4)
      if (next.length === 0) setMaterialSearch('')
    }
  }

  const handleAddMaterial = (material: Material) => {
    setSelectedMaterials((prev) => [...prev, material])
    setMaterialSearch('')
    setShowMaterialDropdown(false)
  }

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.id !== materialId))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = 3 - selectedImages.length
    if (remaining <= 0) {
      toast.error('Tối đa 3 ảnh')
      e.target.value = ''
      return
    }
    const accepted = files.slice(0, remaining)
    if (accepted.length < files.length) {
      toast.error(`Chỉ thêm được ${accepted.length} ảnh (tối đa 3)`)
    }

    const options = {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    }

    try {
      const compressed = await Promise.all(accepted.map((f) => imageCompression(f, options)))
      const previews = compressed.map((f) => URL.createObjectURL(f))
      setSelectedImages((prev) => [...prev, ...compressed])
      setImagePreviews((prev) => [...prev, ...previews])
    } catch (err) {
      toast.error('Không thể xử lý ảnh')
    }
    // reset input so same file can be picked again
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // Filter sales staff based on search
  const filteredStaff = staffSearch
    ? salesStaff.filter(
        (s) =>
          normalize(s.full_name).includes(normalize(staffSearch)) ||
          normalize(s.email).includes(normalize(staffSearch))
      )
    : salesStaff

  // Get available materials: filter by selected types, exclude already given & already selected
  const availableMaterials = materials
    .filter((m) => selectedTypes.length === 0 || selectedTypes.includes(m.type))
    .filter((m) => !(phoneExists && borrowedMaterials.some((bb: any) => bb.material_id === m.id)))
    .filter((m) => !selectedMaterials.some((sm) => sm.id === m.id))

  // Filter materials based on search (Vietnamese-aware)
  const filteredMaterials = materialSearch
    ? availableMaterials.filter(
        (m) =>
          normalize(m.title).includes(normalize(materialSearch)) ||
          normalize(m.author ?? '').includes(normalize(materialSearch))
      )
    : availableMaterials

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone
    if (!formData.phone) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }

    if (!validateVietnamPhone(formData.phone)) {
      toast.error('Số điện thoại không hợp lệ. Phải có đúng 10 chữ số bắt đầu bằng 0')
      return
    }

    if (!formData.student_name && !phoneExists?.name) {
      toast.error('Vui lòng nhập tên học viên')
      return
    }

    if (!formData.sales_staff_id) {
      toast.error('Vui lòng chọn tư vấn viên')
      return
    }

    if (selectedTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại (Sách hoặc Quà tặng)')
      return
    }

    if (selectedMaterials.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu')
      return
    }

    // Require image when Gift is selected
    if (selectedTypes.includes('gift') && selectedImages.length === 0) {
      toast.error('Vui lòng tải lên ít nhất một ảnh khi có quà tặng')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post('/api/enrollment', {
        type: 'borrow',
        // When existing student found, use the DB name to avoid overwriting it (Bug 3.5)
        student_name: phoneExists ? phoneExists.name : formData.student_name,
        email: formData.email,
        phone: formData.phone,
        level: formData.level,
        purpose: formData.purpose,
        sales_staff_id: formData.sales_staff_id,
        material_ids: selectedMaterials.map((m) => m.id),
        notes: formData.notes,
      })

      if (response.data.success) {
        const enrollmentId = response.data.data.enrollment_id

        // Upload images to Supabase Storage
        if (selectedImages.length > 0 && enrollmentId) {
          setUploadingImages(true)
          try {
            const uploadedPaths: { enrollment_id: string; storage_path: string; file_name: string; file_size: number }[] = []

            for (const file of selectedImages) {
              const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
              const storagePath = `${enrollmentId}/${fileName}`

              // Get a server-signed upload URL (bypasses storage RLS)
              const signRes = await fetch('/api/storage/sign-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: storagePath }),
              })
              if (!signRes.ok) continue
              const { token } = await signRes.json()

              const { error: uploadError } = await supabase.storage
                .from('enrollment-images')
                .uploadToSignedUrl(storagePath, token, file)

              if (!uploadError) {
                uploadedPaths.push({
                  enrollment_id: enrollmentId,
                  storage_path: storagePath,
                  file_name: file.name,
                  file_size: file.size,
                })
              }
            }

            if (uploadedPaths.length > 0) {
              await axios.post('/api/enrollment-images', uploadedPaths)
            }
          } catch (imgErr) {
            console.error('Image upload error:', imgErr)
            toast.error('Đã lưu nhưng một số ảnh tải lên thất bại')
          } finally {
            setUploadingImages(false)
          }
        }

        toast.success(response.data.data.message)
        setSubmitted(true)
        setFormData({
          student_name: '',
          email: '',
          phone: '',
          level: 'ielts',
          purpose: 'new',
          sales_staff_id: '',
          sales_staff_name: '',
          notes: '',
        })
        setPhoneExists(null)
        setBorrowedMaterials([])
        setMaterialSearch('')
        setStaffSearch('')
        setSelectedTypes([])
        setSelectedMaterials([])
        setSelectedImages([])
        // Revoke all object URLs to prevent memory leak (Bug 3.3)
        setImagePreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url))
          return []
        })

        // Reset success message after 5 seconds
        setTimeout(() => setSubmitted(false), 5000)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại')
    } finally {
      setLoading(false)
    }
  }

  // Count selected by type
  const selectedBooks = selectedMaterials.filter((m) => m.type === 'book')
  const selectedGifts = selectedMaterials.filter((m) => m.type === 'gift')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <BookOpen size={32} />
            </div>
            <div className="bg-pink-600 text-white p-3 rounded-lg">
              <Gift size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Sách & Quà Tặng</h1>
          <p className="text-gray-600 mt-2">Theo dõi phân phát sách và quà tặng</p>
        </div>

        {/* Success Message */}
        {submitted && (
          <Card className="p-4 mb-6 border-green-200 bg-green-50 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle size={24} />
              <div>
                <p className="font-semibold">Thành công!</p>
                <p className="text-sm">Giao dịch đã được xử lý.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Sales Staff */}
            <div>
              <Label htmlFor="sales_staff" className="text-sm font-semibold text-gray-700">
                Tư Vấn Viên *
              </Label>
              <div className="relative mt-2">
                <Input
                  type="text"
                  placeholder="Tìm tư vấn viên..."
                  value={staffSearch}
                  onChange={(e) => {
                    setStaffSearch(e.target.value)
                    setShowStaffDropdown(true)
                    // Clear previously selected staff when user edits the search field
                    if (formData.sales_staff_id) {
                      setFormData({ ...formData, sales_staff_id: '', sales_staff_name: '' })
                    }
                  }}
                  onFocus={() => setShowStaffDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStaffDropdown(false), 150)}
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
                  <p className="text-xs text-green-600 mt-1">✓ Đã chọn: {formData.sales_staff_name}</p>
                )}
              </div>
            </div>

            {/* 2. Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Số điện thoại học viên *
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
                    Đang kiểm tra...
                  </span>
                )}
              </div>
              {phoneExists && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Tìm thấy: {phoneExists.name} ({phoneExists.level})
                </p>
              )}
              {formData.phone && !validateVietnamPhone(formData.phone) && (
                <p className="text-xs text-red-600 mt-1">
                  Số điện thoại không hợp lệ. Phải có 10 chữ số bắt đầu bằng 0
                </p>
              )}
            </div>

            {/* 3. Student Name */}
            <div>
              <Label htmlFor="student_name" className="text-sm font-semibold text-gray-700">
                Họ và tên học viên *
              </Label>
              {phoneExists ? (
                <div className="mt-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 font-medium">
                  {phoneExists.name}
                </div>
              ) : (
                <Input
                  id="student_name"
                  type="text"
                  placeholder="Nhập họ và tên học viên"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            {/* 4. Type (Book / Gift checkboxes) */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Loại * (có thể chọn cả 2)
              </Label>
              <div className="flex gap-6 mt-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes('book')}
                    onChange={() => handleTypeToggle('book')}
                    className="w-4 h-4 text-blue-600 cursor-pointer rounded"
                  />
                  <span className="ml-2 text-gray-700">Sách</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes('gift')}
                    onChange={() => handleTypeToggle('gift')}
                    className="w-4 h-4 text-pink-600 cursor-pointer rounded"
                  />
                  <span className="ml-2 text-gray-700">Quà tặng</span>
                </label>
              </div>
            </div>

            {/* 5. Material Selection (multi-select, filtered by type) */}
            <div>
              <Label htmlFor="material" className="text-sm font-semibold text-gray-700">
                Chọn *
              </Label>

              {/* Search input — only shown when at least one type is ticked */}
              {selectedTypes.length > 0 && (
                <div className="relative mt-2">
                  <Input
                    type="text"
                    placeholder={`Tìm ${selectedTypes.map((t) => typeLabel[t] || t).join(' / ')} để thêm...`}
                    value={materialSearch}
                    onChange={(e) => {
                      setMaterialSearch(e.target.value)
                      setShowMaterialDropdown(true)
                    }}
                    onFocus={() => setShowMaterialDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 150)}
                    className="w-full"
                  />
                  {showMaterialDropdown && filteredMaterials.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredMaterials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                          onClick={() => handleAddMaterial(material)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{material.title}</p>
                              <p className="text-xs text-gray-500">{material.author} • {material.level}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              material.type === 'book'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {typeLabel[material.type] || material.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hint when no type selected */}
              {selectedTypes.length === 0 && selectedMaterials.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Tích Sách hoặc Quà tặng ở trên để thêm tài liệu</p>
              )}

              {/* Selected materials list — always visible once something is added */}
              {selectedMaterials.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500">
                    Đã chọn {selectedMaterials.length} mục
                    {selectedBooks.length > 0 && ` • ${selectedBooks.length} sách`}
                    {selectedGifts.length > 0 && ` • ${selectedGifts.length} quà tặng`}
                  </p>
                  {selectedMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          material.type === 'book'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {typeLabel[material.type] || material.type}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{material.title}</p>
                          <p className="text-xs text-gray-500">{material.author}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(material.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Photo Upload */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                Ảnh {selectedTypes.includes('gift') ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Không bắt buộc)</span>}
              </Label>
              {selectedTypes.includes('gift') && (
                <p className="text-xs text-red-500 mt-0.5">Bắt buộc khi có quà tặng</p>
              )}

              {/* Image preview grid */}
              {imagePreviews.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Ảnh ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                {selectedImages.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full border-dashed"
                >
                  <Camera size={16} className="mr-2" />
                  {imagePreviews.length > 0 ? `Thêm ảnh (${imagePreviews.length}/3)` : 'Thêm ảnh (tối đa 3)'}
                </Button>
                )}
                {selectedImages.length >= 3 && (
                  <p className="text-xs text-center text-gray-400 mt-1">Đã đạt tối đa 3 ảnh</p>
                )}
              </div>
            </div>

            {/* 7. Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Ghi chú (Không bắt buộc)
              </Label>
              <textarea
                id="notes"
                placeholder="Ghi chú thêm..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            >
              {uploadingImages
                ? 'Đang tải ảnh lên...'
                : loading
                ? 'Đang xử lý...'
                : selectedMaterials.length > 0
                ? `Nộp (${selectedMaterials.length} mục)`
                : 'Nộp'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Các trường có dấu * là bắt buộc
            </p>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Cần hỗ trợ? Liên hệ Hành Chính Cơ Sở
          </p>
        </div>
      </div>
    </div>
  )
}
