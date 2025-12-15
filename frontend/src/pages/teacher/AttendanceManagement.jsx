import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Save,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const AttendanceManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceData, setAttendanceData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Get teacher's assigned classes from user data
  const assignedClasses = user?.assignedClasses || []

  // Set default class
  useEffect(() => {
    if (assignedClasses.length > 0 && !selectedClass) {
      setSelectedClass(assignedClasses[0])
    }
  }, [assignedClasses, selectedClass])

  // Fetch attendance data
  const { data: attendanceResponse, isLoading, error, refetch } = useQuery(
    ['class-attendance', selectedClass, selectedDate],
    () => teacherAPI.getClassAttendance(selectedClass, selectedDate),
    {
      enabled: !!selectedClass && !!selectedDate,
      onSuccess: (data) => {
        // Initialize attendance data state
        const initialData = {}
        data.data.students.forEach(student => {
          initialData[student.studentId] = {
            status: student.attendance.status,
            timeIn: student.attendance.timeIn,
            lateMinutes: student.attendance.lateMinutes || 0,
            reason: student.attendance.reason || '',
            remarks: student.attendance.remarks || '',
            isMarked: !!student.attendance.id // Check if attendance was already marked
          }
        })
        setAttendanceData(initialData)
        setHasChanges(false)
      }
    }
  )

  // Check if attendance is already marked for this date
  const isAttendanceMarked = attendanceResponse?.data?.data?.students?.some(
    student => student.attendance.id
  ) || false

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(
    (data) => teacherAPI.markBulkAttendance(data),
    {
      onSuccess: () => {
        toast.success('Attendance marked successfully!')
        setHasChanges(false)
        queryClient.invalidateQueries(['class-attendance'])
        queryClient.invalidateQueries(['teacher-dashboard'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark attendance')
      }
    }
  )

  const attendance = attendanceResponse?.data?.data || attendanceResponse?.data || {}
  const students = attendance.students || []
  const summary = attendance.summary || {}

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        timeIn: status === 'Present' || status === 'Late' ? new Date().toISOString() : null,
        lateMinutes: status === 'Late' ? (prev[studentId]?.lateMinutes || 15) : 0
      }
    }))
    setHasChanges(true)
  }

  const handleReasonChange = (studentId, reason) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason
      }
    }))
    setHasChanges(true)
  }

  const handleLateMinutesChange = (studentId, lateMinutes) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateMinutes: parseInt(lateMinutes) || 0
      }
    }))
    setHasChanges(true)
  }

  const handleBulkAction = (action) => {
    const updatedData = { ...attendanceData }
    students.forEach(student => {
      updatedData[student.studentId] = {
        ...updatedData[student.studentId],
        status: action,
        timeIn: action === 'Present' || action === 'Late' ? new Date().toISOString() : null,
        lateMinutes: action === 'Late' ? 15 : 0
      }
    })
    setAttendanceData(updatedData)
    setHasChanges(true)
    toast.success(`Marked all students as ${action}`)
  }

  const handleSaveAttendance = () => {
    const attendanceRecords = students.map(student => ({
      studentId: student.studentId,
      status: attendanceData[student.studentId]?.status || 'Present',
      timeIn: attendanceData[student.studentId]?.timeIn,
      lateMinutes: attendanceData[student.studentId]?.lateMinutes || 0,
      reason: attendanceData[student.studentId]?.reason || '',
      remarks: attendanceData[student.studentId]?.remarks || ''
    }))

    markAttendanceMutation.mutate({
      className: selectedClass,
      date: selectedDate,
      attendanceData: attendanceRecords
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Excused':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-4 h-4" />
      case 'Absent':
        return <XCircle className="w-4 h-4" />
      case 'Late':
        return <Clock className="w-4 h-4" />
      default:
        return <UserCheck className="w-4 h-4" />
    }
  }

  if (assignedClasses.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No classes assigned</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contact your administrator to get class assignments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Mark daily attendance for your classes</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveAttendance}
            disabled={markAttendanceMutation.isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {markAttendanceMutation.isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      {/* Attendance Already Marked Banner */}
      {selectedClass && selectedDate && isAttendanceMarked && !hasChanges && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">
                Attendance Already Marked
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Attendance for Class {selectedClass} on {new Date(selectedDate).toLocaleDateString()} has been marked. 
                You can view the records below or make changes if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Choose a class</option>
              {assignedClasses.map(className => (
                <option key={className} value={className}>
                  Class {className}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {selectedClass && (
              <button
                onClick={() => {
                  toast.info('Attendance history feature - Coming soon!')
                  // Navigate to history page or open modal
                  // navigate(`/teacher/attendance/history/${selectedClass}`)
                }}
                className="btn-outline flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                View History
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{summary.present || 0}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{summary.absent || 0}</p>
                </div>
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.late || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('Present')}
                className="btn-outline text-green-600 border-green-200 hover:bg-green-50"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBulkAction('Absent')}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Attendance List */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Class {selectedClass} - {new Date(selectedDate).toLocaleDateString()}
              </h3>
            </div>
            
            {isLoading ? (
              <LoadingSpinner className="h-32" />
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600">Failed to load attendance data</p>
                <button onClick={() => refetch()} className="mt-2 btn-primary">
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late Minutes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                      const currentAttendance = attendanceData[student.studentId] || {}
                      return (
                        <tr key={student.studentId} className={`hover:bg-gray-50 ${currentAttendance.isMarked ? 'bg-green-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  Roll No: {student.rollNumber}
                                  {currentAttendance.isMarked && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      ✓ Marked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {['Present', 'Absent', 'Late', 'Excused'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(student.studentId, status)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    currentAttendance.status === status
                                      ? getStatusColor(status)
                                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {currentAttendance.status === status && getStatusIcon(status)}
                                    {status}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {currentAttendance.status === 'Late' ? (
                              <input
                                type="number"
                                min="0"
                                max="120"
                                value={currentAttendance.lateMinutes || 0}
                                onChange={(e) => handleLateMinutesChange(student.studentId, e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {(currentAttendance.status === 'Absent' || currentAttendance.status === 'Late') ? (
                              <input
                                type="text"
                                value={currentAttendance.reason || ''}
                                onChange={(e) => handleReasonChange(student.studentId, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Enter reason..."
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AttendanceManagement