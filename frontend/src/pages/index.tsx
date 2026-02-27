import type { NextPage } from 'next'

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">📚 Hệ Thống Quản Lý Sách Và Quà</h1>
        <div className="space-x-4">
          <a
            href="/dashboard/materials?type=book"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            HCCS
          </a>
          <a
            href="/enrollment"
            className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition"
          >
            Tư Vấn Viên
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home
