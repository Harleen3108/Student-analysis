import React from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { X, User, Phone, Mail, Calendar, MapPin, GraduationCap, AlertTriangle, FileText, Clock } from 'lucide-react'
import { adminAPI, interventionsAPI } from '../../services/api'
import LoadingSpinner from '../UI/LoadingSpinner'
import Avatar from '../UI/Avatar'
import toast from 'react-hot-toast'

const StudentDetailsModal = ({ isOpen, onClose, student, onEdit }) => {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  // Fetch observations for this student
  const { data: observationsData, isLoading: observationsLoading } = useQuery(
    ['student-observations', student?.id],
    () => adminAPI.getStudentObservations(student.id),
    {
      enabled: isOpen && !!student?.id,
      staleTime: 30000,
    }
  )

  const observations = observationsData?.data?.data?.observations || observationsData?.data?.observations || []

  if (!isOpen || !student) return null

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'High': return 'text-red-600 bg-red-100'
      case 'Critical': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Student Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Student Profile */}
        <div className="flex items-start gap-6 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar
              src={student.photo}
              firstName={student.firstName}
              lastName={student.lastName}
              size="xl"
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              {student.firstName} {student.lastName}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Roll No:</span>
                <span className="font-medium">{student.rollNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Class:</span>
                <span className="font-medium">{student.class}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium break-all">{student.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{student.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Risk Badge */}
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getRiskColor(student.riskLevel)}`}>
              <AlertTriangle className="w-4 h-4" />
              {student.riskLevel} Risk
            </div>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Attendance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-semibold text-blue-900 mb-2">Attendance</h5>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${student.attendance}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-blue-900">{student.attendance}%</span>
            </div>
          </div>

          {/* Academic Score */}
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-semibold text-green-900 mb-2">Academic Score</h5>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-green-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${student.academicScore}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-green-900">{student.academicScore}%</span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="bg-red-50 rounded-lg p-4">
            <h5 className="font-semibold text-red-900 mb-2">Risk Score</h5>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-red-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${student.riskScore || 0}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-red-900">{student.riskScore || 0}%</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-3">Status Information</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className="font-medium">{student.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <span className={`font-medium ${student.riskLevel === 'High' || student.riskLevel === 'Critical' ? 'text-red-600' : 'text-green-600'}`}>
                  {student.riskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-3">Quick Actions</h5>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  if (user?.role === 'teacher') {
                    navigate(`/teacher/attendance`, { state: { studentId: student.id } })
                  } else if (user?.role === 'parent') {
                    navigate(`/parent/attendance`, { state: { studentId: student.id } })
                  } else {
                    // Admin - navigate to interventions or show toast
                    navigate(`/interventions`, { state: { studentId: student.id } })
                  }
                  onClose()
                  toast.success(`Viewing attendance for ${student.firstName} ${student.lastName}`)
                }}
                className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                📊 View Attendance History
              </button>
              <button 
                onClick={() => {
                  if (user?.role === 'teacher') {
                    navigate(`/teacher/academic-entry`, { state: { studentId: student.id } })
                  } else if (user?.role === 'parent') {
                    navigate(`/parent/academic`, { state: { studentId: student.id } })
                  } else {
                    // Admin - show info
                    toast.info('Academic records feature - Access via teacher/student pages')
                  }
                  onClose()
                  toast.success(`Viewing academic records for ${student.firstName} ${student.lastName}`)
                }}
                className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                📝 View Academic Records
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Check if student already has interventions
                    const interventions = await interventionsAPI.getByStudent(student.id)
                    if (interventions?.data?.data?.interventions?.length > 0) {
                      // Navigate to interventions page
                      navigate(`/interventions`, { state: { studentId: student.id } })
                      toast.info('Student already has interventions. Showing existing plans.')
                    } else {
                      // Navigate to create intervention page
                      navigate(`/interventions`, { state: { studentId: student.id, create: true } })
                      toast.success(`Creating intervention plan for ${student.firstName} ${student.lastName}`)
                    }
                    onClose()
                  } catch (error) {
                    // Fallback: navigate to interventions page anyway
                    navigate(`/interventions`, { state: { studentId: student.id, create: true } })
                    onClose()
                    toast.success(`Creating intervention plan for ${student.firstName} ${student.lastName}`)
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                🎯 Create Intervention Plan
              </button>
            </div>
          </div>
        </div>

        {/* Observations & Notes */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Observations & Notes
            </h5>
            <span className="text-sm text-gray-600">
              {observations.length} {observations.length === 1 ? 'note' : 'notes'}
            </span>
          </div>
          
          {observationsLoading ? (
            <div className="py-8">
              <LoadingSpinner className="h-12" />
            </div>
          ) : observations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No observations recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {observations.map((obs) => {
                const getSeverityColor = (severity) => {
                  switch (severity) {
                    case 'Critical': return 'bg-purple-100 text-purple-800 border-purple-200'
                    case 'High': return 'bg-red-100 text-red-800 border-red-200'
                    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    case 'Low': return 'bg-green-100 text-green-800 border-green-200'
                    default: return 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                }

                return (
                  <div key={obs.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(obs.severity)}`}>
                            {obs.severity}
                          </span>
                          <span className="text-xs text-gray-500">{obs.observationType}</span>
                        </div>
                        <h6 className="font-medium text-gray-900 text-sm">{obs.title}</h6>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{obs.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </div>
                      {obs.createdBy && (
                        <span className="text-xs text-gray-500">
                          by {obs.createdBy.name} ({obs.createdBy.role})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button 
              onClick={() => {
                onEdit(student)
                onClose()
              }}
              className="btn-primary"
            >
              Edit Student
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsModal