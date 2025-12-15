import { useEffect, useState } from 'react'
import { X, Bell, AlertCircle, MessageSquare, Calendar } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'
import { useNavigate } from 'react-router-dom'

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([])
  const { socket } = useSocket()
  const navigate = useNavigate()

  useEffect(() => {
    if (!socket) return

    // Listen for new notifications
    socket.on('notification:new', (notification) => {
      console.log('📨 New notification received:', notification)
      
      // Add notification to list
      const newNotification = {
        id: Date.now(),
        ...notification,
        isRead: false
      }
      
      setNotifications(prev => [newNotification, ...prev])

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 10000)

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {
          // Ignore if sound fails
        })
      } catch (error) {
        // Ignore sound errors
      }
    })

    return () => {
      socket.off('notification:new')
    }
  }, [socket])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    if (notification.type === 'communication') {
      navigate('/parent/communications')
    }
    removeNotification(notification.id)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'communication':
        return <MessageSquare className="w-5 h-5" />
      case 'alert':
        return <AlertCircle className="w-5 h-5" />
      case 'event':
        return <Calendar className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500 border-red-600'
      case 'High':
        return 'bg-orange-500 border-orange-600'
      case 'Normal':
        return 'bg-blue-500 border-blue-600'
      case 'Low':
        return 'bg-gray-500 border-gray-600'
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className={`${getPriorityColor(notification.priority)} text-white rounded-lg shadow-lg border-2 p-4 cursor-pointer hover:shadow-xl transition-all animate-slide-in-right`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
              <p className="text-sm opacity-90 line-clamp-2">{notification.message}</p>
              {notification.data?.studentName && (
                <p className="text-xs opacity-75 mt-1">
                  Student: {notification.data.studentName}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeNotification(notification.id)
              }}
              className="flex-shrink-0 text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotificationToast
