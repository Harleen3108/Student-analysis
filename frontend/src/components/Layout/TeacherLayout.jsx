import React from 'react'
import { Outlet } from 'react-router-dom'
import TeacherSidebar from './TeacherSidebar'
import Header from './Header'
import { useTheme } from '../../contexts/ThemeContext'

const TeacherLayout = () => {
  const { isDark } = useTheme()
  const containerClasses = isDark
    ? 'dark-mode flex h-screen bg-gray-900 text-gray-100'
    : 'flex h-screen bg-gray-50'
  const mainClasses = isDark
    ? 'flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6'
    : 'flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6'

  return (
    <div className={containerClasses}>
      {/* Sidebar */}
      <TeacherSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className={mainClasses}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout