import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const AttendanceManagementNew = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendanceData, setAttendanceData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const assignedClasses = user?.assignedClasses || []

  // Fetch attendance status for all classes
  const { data: classesStatus, isLoading: statusLoading } = useQuery(
    ['classes-attendance-status', selectedDate],
    async () => {
      const promises = assignedClasses.map(async (className) => {
        try {
          const response = await teacherAPI.getClassAttendance(className, selectedDate)
          const data = response.data?.data || response.data
          const isMarked = data.students?.some(s => s.attendance.id) || false
          return {
            className,
            isMarked,
            summary: data.summary || {},
            totalStudents: data.students?.length || 0
          }
        } catch (error) {
          return {
            className,
            isMarked: false,
            summary: {},
            totalStudents: 0,
            error: true
          }
        }
      })
      return Promise.all(promises)
    },
    {
      enabled: assignedClasses.length > 0 && !!selectedDate
    }
  )

  // Fetch detailed attendance for selected class
  const { data: attendanceResponse, isLoading: attendanceLoading, refetch } = useQuery(
    ['class-attendance-detail', selectedClass, selectedDate],
    () => teacherAPI.getClassAttendance(selectedClass, selectedDate),
    {
      enabled: !!selectedClass && !!selectedDate,
      onSuccess: (data) => {
        const actualData = data.data?.data || data.data
        const initialData = {}
        actualData.students?.forEach(student => {
          initialData[student.studentId] = {
            status: student.attendance.status,
            timeIn: student.attendance.timeIn,
            lateMinutes: student.attendance.lateMinutes || 0,
            reason: student.attendance.reason || '',
            remarks: student.attendance.remarks || '',
            isMarked: !!student.attendance.id
          }
        })
        setAttendanceData(initialData)
        setHasChanges(false)
      }
    }
  )

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(
    (data) => teacherAPI.markBulkAttendance(data),
    {
      onSuccess: () => {
        toast.success('Attendance marked successfully!')
        setHasChanges(false)
        queryClient.invalidateQueries(['class-attendance-detail'])
        queryClient.invalidateQueries(['classes-attendance-status'])
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

  // Main view - Class cards
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Select a class to mark or view attendance</p>
        </div>

        {/* Date Selector */}
        <div className="card p-6">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Class Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statusLoading ? (
            <LoadingSpinner className="col-span-full h-32" />
          ) : (
            classesStatus?.map((classInfo) => (
              <div
                key={classInfo.className}
                onClick={() => setSelectedClass(classInfo.className)}
                className="card p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Class {classInfo.className}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {classInfo.totalStudents} students
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {classInfo.isMarked ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Marked</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>

                {/* Summary (if marked) */}
                {classInfo.isMarked && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Present</p>
                      <p className="text-lg font-semibold text-green-600">
                        {classInfo.summary.present || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Absent</p>
                      <p className="text-lg font-semibold text-red-600">
                        {classInfo.summary.absent || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Late</p>
                      <p className="text-lg font-semibold text-yellow-600">
                        {classInfo.summary.late || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Excused</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {classInfo.summary.excused || 0}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action hint */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {classInfo.isMarked ? 'Click to view or edit' : 'Click to mark attendance'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {assignedClasses.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to get class assignments.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Detail view - Student list for selected class
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedClass(null)
              setHasChanges(false)
            }}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Class {selectedClass} - {new Date(selectedDate).toLocaleDateString()}
            </h1>
            <p className="text-gray-600">{students.length} students</p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveAttendance}
            disabled={markAttendanceMutation.isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {markAttendanceMutation.isLoading ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
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

      {/* Student List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
        </div>
        
        {attendanceLoading ? (
          <LoadingSpinner className="h-32" />
        ) : (
          <div className="divide-y divide-gray-200">
            {students.map((student) => {
              const currentAttendance = attendanceData[student.studentId] || {}
              return (
                <div key={student.studentId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                        </div>
                        {currentAttendance.isMarked && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Marked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Present', 'Absent', 'Late', 'Excused'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.studentId, status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            currentAttendance.status === status
                              ? getStatusColor(status)
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {currentAttendance.status === status && getStatusIcon(status)}
                            {status}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceManagementNew
