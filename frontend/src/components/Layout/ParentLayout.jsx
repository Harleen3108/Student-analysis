import { Outlet } from 'react-router-dom'
import ParentSidebar from './ParentSidebar'
import Header from './Header'
import NotificationToast from '../Notifications/NotificationToast'
import { useTheme } from '../../contexts/ThemeContext'

const ParentLayout = () => {
  const { isDark } = useTheme()
  const containerClasses = isDark
    ? 'dark-mode flex h-screen bg-gray-900 text-gray-100'
    : 'flex h-screen bg-gray-50'
  const mainClasses = isDark
    ? 'flex-1 overflow-y-auto bg-gray-900 p-6'
    : 'flex-1 overflow-y-auto p-6'

  return (
    <div className={containerClasses}>
      <ParentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={mainClasses}>
          <Outlet />
        </main>
      </div>
      {/* Real-time notification toasts */}
      <NotificationToast />
    </div>
  )
}

export default ParentLayout
