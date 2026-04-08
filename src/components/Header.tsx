import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              AlumNet
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link href="/directory" className="text-gray-700 hover:text-gray-900">
              Directory
            </Link>
            <Link href="/mentorship" className="text-gray-700 hover:text-gray-900">
              Mentorship
            </Link>
            <Link href="/jobs" className="text-gray-700 hover:text-gray-900">
              Jobs
            </Link>
            <Link href="/forum" className="text-gray-700 hover:text-gray-900">
              Forum
            </Link>
          </nav>
          <div className="flex space-x-4">
            <Link href="/auth?mode=login" className="text-gray-700 hover:text-gray-900">
              Alumni Login
            </Link>
            <Link href="/auth?mode=signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Student Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}