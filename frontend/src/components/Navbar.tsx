import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Menu, X, LogOut, Lock, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

export const Navbar: React.FC = () => {
  const { user, signIn, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      await signIn(email, password)
      toast.success('Đăng nhập thành công!')
      setShowLoginModal(false)
      setEmail('')
      setPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <>
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
              <span>📚 Kho Sách và Quà</span>
            </Link>

            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  <span className="text-sm opacity-80">{user.full_name}</span>
                  <span className="flex items-center gap-1 text-xs bg-green-500 px-2 py-1 rounded">
                    <Unlock className="w-3 h-3" />
                    Quyền chỉnh sửa
                  </span>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  size="sm"
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                >
                  <Lock className="w-4 h-4" />
                  Quyền Chỉnh sửa
                </Button>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white hover:bg-blue-700 p-2 rounded"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {user ? (
                <>
                  <div className="text-sm">{user.full_name}</div>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full flex items-center gap-2 justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => { setIsOpen(false); setShowLoginModal(true) }}
                  className="w-full flex items-center gap-2 justify-center bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                >
                  <Lock className="w-4 h-4" />
                  Quyền Chỉnh sửa
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🔐 Đăng nhập</h2>
                <p className="text-xs text-gray-500 mt-0.5">Để mở quyền thêm / sửa / xoá</p>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  required
                  autoFocus
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="modal-password">Mật khẩu</Label>
                <Input
                  id="modal-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
