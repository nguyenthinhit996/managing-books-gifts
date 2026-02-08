import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl">
            <span>📚</span>
            <span>Book Center</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <span className="text-sm">{user.full_name}</span>
                <span className="text-xs bg-blue-500 px-2 py-1 rounded">
                  {user.role}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:bg-blue-700 p-2 rounded"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isOpen && user && (
          <div className="md:hidden pb-4 space-y-2">
            <div className="text-sm">{user.full_name}</div>
            <div className="text-xs bg-blue-500 inline-block px-2 py-1 rounded">
              {user.role}
            </div>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full flex items-center gap-2 justify-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
