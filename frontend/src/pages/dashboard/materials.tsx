'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog'
import axios from 'axios'
import { Plus, Edit2, Trash2, Search, Download, Trash } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface Material {
  id: string
  isbn?: string
  title: string
  author: string
  type: string
  level: string
  quantity_total: number
  quantity_available: number
  condition?: string
  created_at: string
}

interface ExportRow {
  material_id: string
  quantity: number
  searchText: string
  showDropdown: boolean
}

const levelLabel: Record<string, string> = {
  ielts: 'IELTS',
  toeic: 'TOEIC',
  'giao-tiep': 'Giao tiếp',
  junior: 'Junior',
  sat: 'SAT',
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const activeTab = (router.query.type === 'gift' ? 'gift' : 'book') as 'book' | 'gift'
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportRows, setExportRows] = useState<ExportRow[]>([{ material_id: '', quantity: 1, searchText: '', showDropdown: false }])
  const [exportNote, setExportNote] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    level: 'ielts',
    type: 'book',
    quantity_total: '1',
  })

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/materials?limit=500')
      if (response.data.success) {
        setMaterials(response.data.data.materials)
      }
    } catch {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  useEffect(() => {
    setSearch('')
  }, [activeTab])

  // Filter by active tab + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return materials.filter((m) => {
      if (m.type !== activeTab) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q)
      )
    })
  }, [materials, activeTab, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await axios.put(`/api/materials/${editingId}`, {
          ...formData,
          quantity_total: Number(formData.quantity_total),
        })
        toast.success('Đã cập nhật!')
      } else {
        await axios.post('/api/materials', {
          ...formData,
          quantity_total: Number(formData.quantity_total),
        })
        toast.success('Đã thêm mới!')
      }
      setShowDialog(false)
      setFormData({ isbn: '', title: '', author: '', level: 'ielts', type: activeTab, quantity_total: '1' })
      setEditingId(null)
      fetchMaterials()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể lưu')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axios.delete(`/api/materials/${deleteId}`)
      toast.success('Đã xoá!')
      setDeleteId(null)
      fetchMaterials()
    } catch {
      toast.error('Không thể xoá')
    }
  }

  const handleEdit = (material: Material) => {
    setFormData({
      isbn: material.isbn || '',
      title: material.title,
      author: material.author,
      level: material.level,
      type: material.type || 'book',
      quantity_total: String(material.quantity_total),
    })
    setEditingId(material.id)
    setShowDialog(true)
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({ isbn: '', title: '', author: '', level: 'ielts', type: activeTab, quantity_total: '1' })
    setShowDialog(true)
  }

  const openExport = () => {
    if (!user) { toast.error('Vui lòng đăng nhập để xuất'); return }
    setExportRows([{ material_id: '', quantity: 1, searchText: '', showDropdown: false }])
    setExportNote('')
    setShowExportDialog(true)
  }

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate
    for (const row of exportRows) {
      if (!row.material_id) { toast.error('Vui lòng chọn tài liệu'); return }
      const mat = materials.find((m) => m.id === row.material_id)
      if (!mat) continue
      if (row.quantity <= 0) { toast.error('Số lượng phải lớn hơn 0'); return }
      if (row.quantity > mat.quantity_available) {
        toast.error(`"${mat.title}" chỉ còn ${mat.quantity_available} cuốn`)
        return
      }
    }

    setExportLoading(true)
    try {
      for (const row of exportRows) {
        const mat = materials.find((m) => m.id === row.material_id)!
        // Deduct stock
        await axios.put(`/api/materials/${row.material_id}`, {
          quantity_available: mat.quantity_available - row.quantity,
        })
        // Save to export history
        await axios.post('/api/export-logs', {
          material_id: mat.id,
          material_title: mat.title,
          quantity: row.quantity,
          note: exportNote || null,
          exported_by: user?.email || null,
        })
      }
      toast.success('Xuất thành công!')
      setShowExportDialog(false)
      fetchMaterials()
    } catch {
      toast.error('Xuất thất bại')
    } finally {
      setExportLoading(false)
    }
  }

  const isBook = activeTab === 'book'

  return (
    <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'book' ? 'Sách' : 'Quà tặng'}
              </h1>
              <p className="text-gray-500 mt-1">Danh sách trong kho</p>
            </div>
            {user && (
              <Button variant="outline" onClick={openExport}>
                <Download size={16} className="mr-2" />
                Phát cho lớp {activeTab === 'book' ? 'Sách' : 'Quà tặng'}
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={`Tìm ${activeTab === 'book' ? 'sách' : 'quà tặng'} theo tên...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Card className="p-6">
            <div className="flex items-center justify-end mb-4">
              {user && (
                <Button size="sm" onClick={openAdd}>
                  <Plus size={16} className="mr-1" />
                  Thêm {activeTab === 'book' ? 'Sách' : 'Quà tặng'}
                </Button>
              )}
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tên</th>
                      {isBook && <th className="text-center py-3 px-4 font-semibold text-gray-700">Cấp độ</th>}
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Tổng SL</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Còn lại</th>
                      {user && <th className="text-right py-3 px-4 font-semibold text-gray-700"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((material) => (
                      <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{material.title}</p>
                        </td>
                        {isBook && (
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {levelLabel[material.level] || material.level}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4 text-center font-medium text-gray-700">{material.quantity_total}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-semibold ${material.quantity_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {material.quantity_available}
                          </span>
                        </td>
                        {user && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                                <Edit2 size={15} />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => setDeleteId(material.id)}>
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">
                Không có {activeTab === 'book' ? 'sách' : 'quà tặng'} nào
              </p>
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Chỉnh sửa' : 'Thêm mới'} {formData.type === 'book' ? 'Sách' : 'Quà tặng'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tên *</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                {formData.type === 'book' && (
                  <>
                    <div>
                      <Label>Cấp độ *</Label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ielts">IELTS</option>
                        <option value="toeic">TOEIC</option>
                        <option value="giao-tiep">Giao tiếp</option>
                        <option value="junior">Junior</option>
                        <option value="sat">SAT</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <Label>Số lượng *</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity_total}
                    onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Hủy
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
              </AlertDialogHeader>
              <p className="text-gray-600">Bạn chắc chắn muốn xoá mục này? Hành động không thể hoàn tác.</p>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
                <Button variant="destructive" onClick={handleDelete}>Xoá</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Export Dialog */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  📤 Phát cho lớp {activeTab === 'book' ? 'Sách' : 'Quà tặng'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExport} className="space-y-4">
                <div className="space-y-3">
                  {exportRows.map((row, idx) => {
                    const mat = materials.find((m) => m.id === row.material_id)
                    const dropdownOptions = materials.filter(
                      (m) =>
                        m.type === activeTab &&
                        m.quantity_available > 0 &&
                        (!row.searchText || m.title.toLowerCase().includes(row.searchText.toLowerCase()))
                    )
                    return (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 relative">
                          {idx === 0 && <Label className="mb-1 block">Tài liệu</Label>}
                          <Input
                            placeholder="Tìm tên sách..."
                            value={row.searchText}
                            autoComplete="off"
                            onChange={(e) => {
                              const updated = [...exportRows]
                              updated[idx] = {
                                ...updated[idx],
                                searchText: e.target.value,
                                material_id: '',
                                showDropdown: true,
                              }
                              setExportRows(updated)
                            }}
                            onFocus={() => {
                              const updated = [...exportRows]
                              updated[idx] = { ...updated[idx], showDropdown: true }
                              setExportRows(updated)
                            }}
                            onBlur={() => {
                              // Delay to allow click on dropdown item
                              setTimeout(() => {
                                setExportRows((prev) => {
                                  const updated = [...prev]
                                  updated[idx] = { ...updated[idx], showDropdown: false }
                                  return updated
                                })
                              }, 150)
                            }}
                            className="w-full"
                          />
                          {row.showDropdown && dropdownOptions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-lg z-30 max-h-44 overflow-y-auto">
                              {dropdownOptions.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const updated = [...exportRows]
                                    updated[idx] = {
                                      ...updated[idx],
                                      material_id: m.id,
                                      searchText: m.title,
                                      quantity: 1,
                                      showDropdown: false,
                                    }
                                    setExportRows(updated)
                                  }}
                                >
                                  <p className="text-sm font-medium text-gray-800">{m.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {m.author} • {levelLabel[m.level] ?? m.level} • còn {m.quantity_available}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-24 shrink-0">
                          {idx === 0 && <Label className="mb-1 block">Số lượng</Label>}
                          <Input
                            type="number"
                            min={1}
                            max={mat?.quantity_available ?? 9999}
                            required
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...exportRows]
                              updated[idx] = { ...updated[idx], quantity: Number(e.target.value) }
                              setExportRows(updated)
                            }}
                          />
                        </div>
                        {exportRows.length > 1 && (
                          <button
                            type="button"
                            className={`text-gray-400 hover:text-red-500 ${idx === 0 ? 'mt-6' : ''}`}
                            onClick={() => setExportRows(exportRows.filter((_, i) => i !== idx))}
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExportRows([...exportRows, { material_id: '', quantity: 1, searchText: '', showDropdown: false }])}
                >
                  + Thêm dòng
                </Button>

                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    placeholder="VD: Xuất cho lớp IELTS tháng 3..."
                    value={exportNote}
                    onChange={(e) => setExportNote(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowExportDialog(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={exportLoading}>
                    {exportLoading ? 'Đang phát...' : 'Xác nhận phát'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
  )
}
