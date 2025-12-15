import { Outlet } from 'react-router-dom'
import ParentSidebar from './ParentSidebar'
import Header from './Header'
import NotificationToast from '../Notifications/NotificationToast'

const ParentLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <ParentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      {/* Real-time notification toasts */}
      <NotificationToast />
    </div>
  )
}

export default ParentLayout
