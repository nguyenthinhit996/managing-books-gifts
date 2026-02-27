import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export const Sidebar: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  const isActive = (path: string) => {
    const [pathname, query] = path.split('?')
    if (pathname !== router.pathname) return false
    if (!query) return !router.query.type
    const params = new URLSearchParams(query)
    return params.get('type') === router.query.type
  }

  const getMenuItems = () => {
    const commonItems = [
      { href: '/dashboard', label: '📊 Tổng quan', roles: ['manager', 'admin'], hidden: true },
      { href: '/dashboard/materials?type=book', label: '📖 Sách', roles: ['manager', 'admin'] },
      { href: '/dashboard/materials?type=gift', label: '🎁 Quà tặng', roles: ['manager', 'admin'] },
      { href: '/dashboard/students', label: '👥 Học viên', roles: ['manager', 'admin'], hidden: true },
      { href: '/dashboard/material-records', label: '🕓 Lịch sử', roles: ['manager', 'admin'] },
    ]

    return commonItems.filter((item) => !item.hidden)
  }

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <nav className="space-y-2">
        {getMenuItems().map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive(item.href) ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                isActive(item.href)
                  ? 'bg-blue-600'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {user && (
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Đăng nhập: <strong>{user.full_name}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Vai trò: <strong>{user.role}</strong>
          </p>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
