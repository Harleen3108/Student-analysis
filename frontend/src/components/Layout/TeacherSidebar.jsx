import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  BookOpen, 
  ClipboardList,
  TrendingUp,
  MessageSquare,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const TeacherSidebar = () => {
  const { user } = useAuth()
  
  const navigation = [
    {
      name: 'Dashboard',
      href: '/teacher',
      icon: LayoutDashboard,
      section: 'Main'
    },
    {
      name: 'Attendance',
      href: '/teacher/attendance',
      icon: UserCheck,
      section: 'Main'
    },
    {
      name: 'My Classes',
      href: '/teacher/my-classes',
      icon: Users,
      section: 'Main'
    },
    {
      name: 'At-Risk Students',
      href: '/teacher/at-risk-students',
      icon: AlertTriangle,
      section: 'Main'
    },
    {
      name: 'Academic Entry',
      href: '/teacher/academic-entry',
      icon: BookOpen,
      section: 'Teaching'
    },
    {
      name: 'Observations',
      href: '/teacher/observations',
      icon: ClipboardList,
      section: 'Teaching'
    },
    {
      name: 'Student Profiles',
      href: '/teacher/students',
      icon: TrendingUp,
      section: 'Teaching'
    },
    {
      name: 'Communications',
      href: '/teacher/communications',
      icon: MessageSquare,
      section: 'Teaching'
    }
  ]

  const mainItems = navigation.filter(item => item.section === 'Main')
  const teachingItems = navigation.filter(item => item.section === 'Teaching')

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div className="bg-primary-600 p-2 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Dropout Analysis</h1>
          <p className="text-xs text-gray-500">Teacher Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8">
        {/* Main Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </h3>
          <div className="mt-3 space-y-1">
            {mainItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Teaching Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Teaching
          </h3>
          <div className="mt-3 space-y-1">
            {teachingItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              Teacher • {user?.assignedClasses?.length || 0} classes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherSidebar