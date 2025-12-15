import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  Target,
  MessageSquare,
  BookMarked,
  User,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ParentSidebar = () => {
  const { logout, user } = useAuth()

  const navItems = [
    { name: 'Dashboard', href: '/parent/dashboard', icon: Home },
    { name: 'Attendance', href: '/parent/attendance', icon: Calendar },
    { name: 'Academic Performance', href: '/parent/academic', icon: BookOpen },
    { name: 'Risk Status', href: '/parent/risk', icon: AlertTriangle },
    { name: 'Interventions', href: '/parent/interventions', icon: Target },
    { name: 'Communications', href: '/parent/communications', icon: MessageSquare },
    { name: 'Support & Guidance', href: '/parent/support', icon: BookMarked },
    { name: 'Profile & Settings', href: '/parent/profile', icon: User },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Parent Portal</h1>
        <p className="text-sm text-gray-600 mt-1">
          {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default ParentSidebar
