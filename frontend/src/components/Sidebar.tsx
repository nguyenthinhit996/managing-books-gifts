import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export const Sidebar: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  const isActive = (path: string) => router.pathname === path

  const getMenuItems = () => {
    const commonItems = [
      { href: '/dashboard', label: '📊 Dashboard', roles: ['manager', 'admin'] },
      { href: '/dashboard/books', label: '📚 Books', roles: ['manager', 'admin'] },
      { href: '/dashboard/students', label: '👥 Students', roles: ['manager', 'admin'] },
      { href: '/dashboard/lending', label: '🔄 Lending Records', roles: ['manager', 'admin'] },
    ]

    return commonItems.filter((item) =>
      item.roles.includes(user?.role || '')
    )
  }

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">📚 Book Manager</h2>
      </div>

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

      <div className="mt-8 pt-8 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Logged in as: <strong>{user?.full_name}</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Role: <strong>{user?.role}</strong>
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
