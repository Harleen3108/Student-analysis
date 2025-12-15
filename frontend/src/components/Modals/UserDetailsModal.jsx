import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { usersAPI } from '../../services/api'
import LoadingSpinner from '../UI/LoadingSpinner'
import Avatar from '../UI/Avatar'
import { useNavigate } from 'react-router-dom'

const UserDetailsModal = ({ isOpen, onClose, userId }) => {
  const navigate = useNavigate()

  // Fetch user details
  const { data: userData, isLoading } = useQuery(
    ['user-details', userId],
    () => usersAPI.getById(userId),
    {
      enabled: isOpen && !!userId,
      staleTime: 30000,
    }
  )

  const user = userData?.data?.data?.user || userData?.data?.user || null

  if (!isOpen) return null

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'counselor': return 'bg-green-100 text-green-800 border-green-300'
      case 'parent': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-red-100 text-red-800'
      case 'Critical': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner className="h-16" />
          </div>
        ) : !user ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-gray-600">User not found</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* User Profile Section */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={user.photo}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="2xl"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {user.employeeId && (
                    <p className="text-sm text-gray-600 mb-3">
                      Employee ID: <span className="font-medium">{user.employeeId}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Account Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium text-gray-900">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Permissions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Can login to system</span>
                  </div>
                  {user.role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Full system access</span>
                    </div>
                  )}
                  {user.role === 'teacher' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">Manage assigned classes</span>
                    </div>
                  )}
                  {user.role === 'parent' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">View children's data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role-Specific Information */}
            {user.role === 'teacher' && user.assignedClasses && user.assignedClasses.length > 0 && (
              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Assigned Classes ({user.assignedClasses.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.assignedClasses.map((className, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {className}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.role === 'teacher' && user.subjects && user.subjects.length > 0 && (
              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subjects ({user.subjects.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.subjects.map((subject, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Children (For Parents) */}
            {user.role === 'parent' && (
              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Linked Children ({user.children?.length || 0})
                </h4>
                
                {!user.children || user.children.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No children linked to this parent</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Children will be automatically linked when students are added with this parent's email
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.children.map((child) => (
                      <div 
                        key={child._id || child.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Student Avatar */}
                          <Avatar
                            src={child.photo}
                            firstName={child.firstName}
                            lastName={child.lastName}
                            size="sm"
                          />

                          {/* Student Info */}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              Roll: {child.rollNumber} • Class: {child.section || child.class || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Risk Level & Actions */}
                        <div className="flex items-center gap-2">
                          {child.riskLevel && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(child.riskLevel)}`}>
                              {child.riskLevel}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              navigate(`/students?search=${child.rollNumber}`)
                              onClose()
                            }}
                            className="text-primary-600 hover:text-primary-800 transition-colors"
                            title="View Student Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notification Preferences */}
            {user.notificationPreferences && (
              <div className="card p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Preferences</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user.notificationPreferences.email ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user.notificationPreferences.sms ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">SMS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user.notificationPreferences.inApp ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">In-App</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDetailsModal
