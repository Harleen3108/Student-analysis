import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Bell, Search, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { notificationsAPI } from '../../services/api'
import toast from 'react-hot-toast'

const Header = () => {
  const { user, logout } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  // Fetch unread count
  const { data: unreadData, refetch: refetchUnread } = useQuery(
    'unread-notifications-count',
    () => notificationsAPI.getUnreadCount(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 20000
    }
  )

  // Fetch notifications when panel is open
  const { data: notificationsData, refetch: refetchNotifications } = useQuery(
    'notifications',
    () => notificationsAPI.getAll({ limit: 10 }),
    {
      enabled: showNotifications,
      staleTime: 20000
    }
  )

  const unreadCount = unreadData?.data?.data?.unreadCount || unreadData?.data?.unreadCount || 0
  const notifications = notificationsData?.data?.data?.notifications || notificationsData?.data?.notifications || []

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      try {
        // Simulate global search across students, classes, etc.
        toast.loading('Searching...')
        
        // This would call a global search API
        const searchResults = {
          students: [
            { id: 1, name: 'John Doe', type: 'student' },
            { id: 2, name: 'Jane Smith', type: 'student' }
          ].filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          classes: [
            { id: 1, name: 'Class 10A', type: 'class' }
          ].filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        setTimeout(() => {
          toast.dismiss()
          const totalResults = searchResults.students.length + searchResults.classes.length
          
          if (totalResults > 0) {
            toast.success(`Found ${totalResults} results for "${searchTerm}"`)
            console.log('Search results:', searchResults)
            // TODO: Show search results in a dropdown or navigate to search page
          } else {
            toast.error(`No results found for "${searchTerm}"`)
          }
        }, 1000)
        
      } catch (error) {
        toast.dismiss()
        toast.error('Search failed')
        console.error('Search error:', error)
      }
    }
  }

  const handleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      refetchNotifications()
      refetchUnread()
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      refetchNotifications()
      refetchUnread()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleSettings = () => {
    // This would open settings modal or navigate to settings page
    toast.success('Settings panel opened')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students, classes, or reports..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={handleNotifications}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        toast.info('View all notifications - Coming soon')
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button 
            onClick={handleSettings}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header