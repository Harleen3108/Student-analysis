import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Dashboard from '../../pages/Dashboard'
import Students from '../../pages/Students'
import RiskAnalysis from '../../pages/RiskAnalysis'
import Interventions from '../../pages/Interventions'
import Reports from '../../pages/Reports'
import UserManagement from '../../pages/UserManagement'
import BulkUpload from '../../pages/BulkUpload'
import { useTheme } from '../../contexts/ThemeContext'

const Layout = () => {
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
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className={mainClasses}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/risk-analysis" element={<RiskAnalysis />} />
            <Route path="/interventions" element={<Interventions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default Layout