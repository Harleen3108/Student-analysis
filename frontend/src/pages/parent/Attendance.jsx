import { useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const Attendance = () => {
  const location = useLocation()
  const initialStudentId = location.state?.studentId
  
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { data: dashboardData } = useQuery('parent-dashboard', () => parentAPI.getDashboard())
  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []

  const { data: attendanceData, isLoading } = useQuery(
    ['student-attendance', selectedStudentId, selectedMonth, selectedYear],
    () => parentAPI.getStudentAttendance(selectedStudentId, { month: selectedMonth, year: selectedYear }),
    {
      enabled: !!selectedStudentId,
      staleTime: 30000,
    }
  )

  const records = attendanceData?.data?.data?.records || []
  const summary = attendanceData?.data?.data?.summary || {}

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'Absent':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'Late':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 border-green-300'
      case 'Absent':
        return 'bg-red-100 border-red-300'
      case 'Late':
        return 'bg-yellow-100 border-yellow-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const record = records.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr)
      
      days.push(
        <div
          key={day}
          className={`p-3 border rounded-lg text-center ${record ? getStatusColor(record.status) : 'bg-white border-gray-200'}`}
        >
          <div className="text-sm font-medium text-gray-900">{day}</div>
          {record && (
            <div className="mt-1 flex justify-center">
              {getStatusIcon(record.status)}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
        <p className="text-gray-600">View your child's attendance records</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Child</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="input"
            >
              <option value="">Select a child</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} - {student.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="card p-12 text-center">
          <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
          <p className="text-gray-600">Choose a child to view their attendance records</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12">
          <LoadingSpinner className="h-16" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100">
              <CalendarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{summary.totalDays || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Days</p>
            </div>
            <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-green-100">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-600">{summary.presentDays || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Present</p>
            </div>
            <div className="card p-6 text-center bg-gradient-to-br from-red-50 to-red-100">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{summary.absentDays || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Absent</p>
            </div>
            <div className="card p-6 text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-600">{summary.lateDays || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Late</p>
            </div>
            <div className="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#E5E7EB"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#9333EA"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(summary.percentage || 0) * 1.76} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-600">{summary.percentage || 0}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>

          {/* Calendar */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Late</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Attendance
