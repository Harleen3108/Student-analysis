import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Heart, 
  FileText, 
  Upload,
  GraduationCap,
  Shield
} from 'lucide-react'

const Sidebar = () => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      section: 'Main'
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      section: 'Main'
    },
    {
      name: 'Risk Analysis',
      href: '/risk-analysis',
      icon: AlertTriangle,
      section: 'Main'
    },
    {
      name: 'Interventions',
      href: '/interventions',
      icon: Heart,
      section: 'Main'
    },
    {
      name: 'Dropout Reports',
      href: '/reports',
      icon: FileText,
      section: 'Main'
    },
    {
      name: 'User Management',
      href: '/user-management',
      icon: Shield,
      section: 'Management'
    },
    {
      name: 'Bulk Upload',
      href: '/bulk-upload',
      icon: Upload,
      section: 'Management'
    }
  ]

  const mainItems = navigation.filter(item => item.section === 'Main')
  const managementItems = navigation.filter(item => item.section === 'Management')

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div className="bg-primary-600 p-2 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Dropout Analysis</h1>
          <p className="text-xs text-gray-500">Student Monitoring</p>
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

        {/* Management Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Management
          </h3>
          <div className="mt-3 space-y-1">
            {managementItems.map((item) => (
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
            <span className="text-sm font-medium text-primary-700">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar