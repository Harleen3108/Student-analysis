import { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  UserCheck,
  BookOpen,
  Search,
  Filter
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const MyClasses = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Get teacher dashboard data to get class information
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    'teacher-dashboard',
    () => teacherAPI.getDashboard(),
    {
      staleTime: 30000,
    }
  )

  // Get students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useQuery(
    ['class-students', selectedClass],
    () => teacherAPI.getClassStudents(selectedClass),
    {
      enabled: !!selectedClass,
      staleTime: 30000,
    }
  )

  // Extract data properly from Axios response wrapper
  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [] } = dashboard
  const students = studentsData?.data?.data?.students || studentsData?.data?.students || []

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load classes</h3>
          <button onClick={() => refetch()} className="mt-2 btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
        <p className="text-gray-600">Manage your assigned classes and students</p>
      </div>

      {/* Class Selection */}
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
              <option value="">Choose a class to view students</option>
              {assignedClasses.map((classData) => (
                <option key={classData.className} value={classData.className}>
                  Class {classData.className} ({classData.totalStudents} students)
                </option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class Overview Cards */}
      {assignedClasses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedClasses.map((classData) => (
            <div
              key={classData.className}
              className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedClass === classData.className ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedClass(classData.className)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Class {classData.className}
                </h3>
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="text-sm font-medium text-gray-900">
                    {classData.totalStudents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">At Risk</span>
                  <span className="text-sm font-medium text-red-600">
                    {classData.atRiskStudents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Attendance</span>
                  <span className="text-sm font-medium text-green-600">
                    {classData.averageAttendance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Performance</span>
                  <span className="text-sm font-medium text-purple-600">
                    {classData.averagePerformance}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students List */}
      {selectedClass && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Students in Class {selectedClass}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Total: {students.length}</span>
                <span>Showing: {filteredStudents.length}</span>
              </div>
            </div>
          </div>

          {studentsLoading ? (
            <LoadingSpinner className="h-32" />
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No students found' : 'No students in this class'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Students will appear here once enrolled.'}
              </p>
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
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Roll No: {student.rollNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                          {student.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {student.attendancePercentage || 0}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${student.attendancePercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {student.overallPercentage || 0}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${student.overallPercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              toast.success(`Viewing profile for ${student.firstName} ${student.lastName}`)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => navigate(`/teacher/students/${student._id || student.id}`)}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              toast.success(`Adding observation for ${student.firstName} ${student.lastName}`)
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Add Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* No Classes Message */}
      {assignedClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No classes assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            Contact your administrator to get class assignments.
          </p>
        </div>
      )}
    </div>
  )
}

export default MyClasses