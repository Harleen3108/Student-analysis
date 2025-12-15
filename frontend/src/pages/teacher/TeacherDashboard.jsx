import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  BookOpen,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState(null)

  // Debug: Log user info
  console.log('👤 Current user in TeacherDashboard:', user)
  
  // If user is not a teacher, show error
  if (user && user.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need teacher role to access this page. Current role: {user?.role}
          </p>
        </div>
      </div>
    )
  }

  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['teacher-dashboard'], // Remove timestamp to allow caching
    () => {
      console.log('🔄 Calling teacher dashboard API...')
      return teacherAPI.getDashboard()
    },
    {
      staleTime: 30000, // Cache for 30 seconds
      cacheTime: 300000, // Keep in cache for 5 minutes
      refetchOnMount: false, // Don't refetch on mount if data exists
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 2, // Retry twice on failure
      retryDelay: 1000, // Wait 1 second between retries
      onSuccess: (data) => {
        console.log('✅ Teacher dashboard data received:', data)
        console.log('✅ Response structure:', {
          hasData: !!data?.data,
          dataKeys: data?.data ? Object.keys(data.data) : 'no data',
          assignedClasses: data?.data?.assignedClasses,
          assignedClassesLength: data?.data?.assignedClasses?.length
        })
      },
      onError: (error) => {
        console.error('❌ Teacher dashboard error:', error)
        console.error('❌ Error details:', error.response?.data)
        toast.error('Failed to load dashboard data. Please try again.')
      }
    }
  )

  console.log('🔍 Dashboard query state:', { 
    isLoading, 
    error: error?.message, 
    data: dashboardData,
    user: user?.role 
  })

  // Extract data from Axios response
  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [], alerts = [], summary = {} } = dashboard
  
  console.log('📊 Dashboard data:', { 
    assignedClasses: assignedClasses.length, 
    alerts: alerts.length, 
    summary
  })

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
          <button onClick={() => refetch()} className="mt-2 btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'absence':
        return <UserX className="w-5 h-5 text-orange-600" />
      case 'risk_increase':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600" />
    }
  }

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">


      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your classes today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalStudents || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
              <p className="text-2xl font-bold text-red-600">{summary.atRiskStudents || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
              <p className="text-2xl font-bold text-green-600">{summary.averageAttendance || 0}%</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
              <p className="text-2xl font-bold text-purple-600">{summary.averagePerformance || 0}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Classes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Classes</h3>
            </div>
            <div className="p-6">
              {assignedClasses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No classes assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact your administrator to get class assignments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedClasses.map((classData) => (
                    <div
                      key={classData.className}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedClass(classData)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Class {classData.className}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {classData.totalStudents} students
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">At Risk</p>
                          <p className="font-semibold text-red-600">
                            {classData.atRiskStudents}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Attendance</p>
                          <p className="font-semibold text-green-600">
                            {classData.averageAttendance}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Performance</p>
                          <p className="font-semibold text-purple-600">
                            {classData.averagePerformance}%
                          </p>
                        </div>
                      </div>

                      {classData.students && classData.students.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Recent students:</p>
                          <div className="flex flex-wrap gap-1">
                            {classData.students.slice(0, 3).map((student) => (
                              <span
                                key={student._id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {student.firstName} {student.lastName}
                              </span>
                            ))}
                            {classData.students.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{classData.students.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Today's Alerts</h3>
            </div>
            <div className="p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts today</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All your students are doing well!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getAlertColor(alert.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {alert.title}
                          </h4>
                          {alert.students && alert.students.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Affected students:</p>
                              <div className="space-y-1">
                                {alert.students.slice(0, 3).map((student, idx) => (
                                  <div key={idx} className="text-xs text-gray-700">
                                    <span className="font-medium">
                                      {student.name}
                                    </span>
                                    <span className="text-gray-500 ml-1">
                                      ({student.rollNumber})
                                    </span>
                                    {student.observation && (
                                      <span className="text-gray-500 ml-1">
                                        - {student.observation}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {alert.students.length > 3 && (
                                  <p className="text-xs text-gray-500">
                                    +{alert.students.length - 3} more students
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="btn-outline flex items-center gap-2 justify-center"
          >
            <UserCheck className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={() => navigate('/teacher/at-risk-students')}
            className="btn-outline flex items-center gap-2 justify-center"
          >
            <AlertTriangle className="w-4 h-4" />
            View At-Risk Students
          </button>
          <button
            onClick={() => navigate('/teacher/academic-entry')}
            className="btn-outline flex items-center gap-2 justify-center"
          >
            <BookOpen className="w-4 h-4" />
            Enter Marks
          </button>
          <button
            onClick={() => navigate('/teacher/my-classes')}
            className="btn-outline flex items-center gap-2 justify-center"
          >
            <Clock className="w-4 h-4" />
            My Classes
          </button>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard