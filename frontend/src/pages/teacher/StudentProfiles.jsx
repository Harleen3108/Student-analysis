import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  User, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  BookOpen,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Award,
  Clock
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const StudentProfiles = () => {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [view, setView] = useState('list') // 'list' or 'detail'

  // Get dashboard for class data
  const { data: dashboardData } = useQuery(
    'teacher-dashboard',
    () => teacherAPI.getDashboard(),
    {
      staleTime: 30000,
    }
  )

  // Get students for selected class
  const { data: studentsData, isLoading } = useQuery(
    ['class-students', selectedClass],
    () => teacherAPI.getClassStudents(selectedClass),
    {
      enabled: !!selectedClass,
      staleTime: 30000,
    }
  )

  // Get student profile details
  const { data: profileData, isLoading: profileLoading } = useQuery(
    ['student-profile', selectedStudent?.id],
    () => teacherAPI.getStudentProfile(selectedStudent.id),
    {
      enabled: !!selectedStudent && view === 'detail',
      staleTime: 30000,
    }
  )

  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [] } = dashboard
  const students = studentsData?.data?.data?.students || studentsData?.data?.students || []
  const profile = profileData?.data?.data || profileData?.data || {}

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRisk = !riskFilter || student.riskLevel === riskFilter

    return matchesSearch && matchesRisk
  })

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

  const getTrendIcon = (trend) => {
    if (trend === 'Improving') return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend === 'Declining') return <TrendingDown className="w-4 h-4 text-red-600" />
    return <div className="w-4 h-4" />
  }

  // Detail View
  if (view === 'detail' && selectedStudent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setView('list')
                setSelectedStudent(null)
              }}
              className="btn-outline"
            >
              ← Back to List
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </h1>
              <p className="text-gray-600">Roll No: {selectedStudent.rollNumber} • Class {selectedStudent.section}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selectedStudent.riskLevel)}`}>
            {selectedStudent.riskLevel} Risk
          </span>
        </div>

        {profileLoading ? (
          <LoadingSpinner className="h-64" />
        ) : (
          <>
            {/* Student Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.student?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.student?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{profile.student?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Academic Overview</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Overall Percentage</p>
                    <p className="text-2xl font-bold text-purple-600">{profile.student?.overallPercentage || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Academic Trend</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(profile.student?.academicTrend)}
                      <span className="text-sm font-medium">{profile.student?.academicTrend || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Attendance</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-green-600">{profile.student?.attendancePercentage || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Days Present</p>
                    <p className="text-sm font-medium">{profile.attendanceSummary?.presentDays || 0} / {profile.attendanceSummary?.totalDays || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Summary (Last 6 Months)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{profile.attendanceSummary?.totalDays || 0}</p>
                  <p className="text-sm text-gray-600">Total Days</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{profile.attendanceSummary?.presentDays || 0}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{profile.attendanceSummary?.absentDays || 0}</p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{profile.attendanceSummary?.lateDays || 0}</p>
                  <p className="text-sm text-gray-600">Late</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{profile.attendanceSummary?.percentage || 0}%</p>
                  <p className="text-sm text-gray-600">Rate</p>
                </div>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Performance (Last 6 Months)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{profile.academicSummary?.totalExams || 0}</p>
                  <p className="text-sm text-gray-600">Total Exams</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{profile.academicSummary?.averagePercentage || 0}%</p>
                  <p className="text-sm text-gray-600">Average</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{profile.academicSummary?.bestPercentage || 0}%</p>
                  <p className="text-sm text-gray-600">Best Score</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{profile.academicSummary?.passingRate || 0}%</p>
                  <p className="text-sm text-gray-600">Pass Rate</p>
                </div>
              </div>

              {/* Recent Performance */}
              {profile.performanceTrends && profile.performanceTrends.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Exams</h4>
                  <div className="space-y-2">
                    {profile.performanceTrends.slice(0, 5).map((exam, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{exam.examType}</p>
                            <p className="text-xs text-gray-500">{new Date(exam.examDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {exam.isImprovement !== null && getTrendIcon(exam.isImprovement ? 'Improving' : 'Declining')}
                          <span className="text-sm font-medium">{exam.percentage}%</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            exam.grade === 'A+' || exam.grade === 'A' ? 'bg-green-100 text-green-800' :
                            exam.grade === 'B+' || exam.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            exam.grade === 'C+' || exam.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {exam.grade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Observations */}
            {profile.observations && profile.observations.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Observations</h3>
                <div className="space-y-3">
                  {profile.observations.slice(0, 5).map((obs) => (
                    <div key={obs.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{obs.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(obs.severity)}`}>
                            {obs.severity}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(obs.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{obs.description}</p>
                      {obs.followUpRequired && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-yellow-700">
                          <Clock className="w-3 h-3" />
                          Follow-up required
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Student Profiles</h1>
        <p className="text-gray-600">View detailed information about your students</p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Choose a class</option>
              {assignedClasses.map((classData) => (
                <option key={classData.className} value={classData.className}>
                  Class {classData.className} ({classData.totalStudents} students)
                </option>
              ))}
            </select>
          </div>

          <div>
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
                disabled={!selectedClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input"
              disabled={!selectedClass}
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      {selectedClass && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Students in Class {selectedClass} ({filteredStudents.length})
            </h3>
          </div>

          {isLoading ? (
            <LoadingSpinner className="h-32" />
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || riskFilter ? 'No students found' : 'No students in this class'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || riskFilter ? 'Try adjusting your filters.' : 'Students will appear here once enrolled.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(student.riskLevel)}`}>
                            {student.riskLevel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Roll No:</span> {student.rollNumber}
                          </div>
                          <div>
                            <span className="font-medium">Attendance:</span> {student.attendancePercentage || 0}%
                          </div>
                          <div>
                            <span className="font-medium">Performance:</span> {student.overallPercentage || 0}%
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Trend:</span>
                            {getTrendIcon(student.academicTrend)}
                            <span>{student.academicTrend || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(student)
                        setView('detail')
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Class Selected */}
      {!selectedClass && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a class to view students</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a class from the dropdown above to see student profiles.
          </p>
        </div>
      )}
    </div>
  )
}

export default StudentProfiles
