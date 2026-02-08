import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
