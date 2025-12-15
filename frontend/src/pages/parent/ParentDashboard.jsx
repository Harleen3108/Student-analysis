import { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  User, 
  Calendar, 
  BookOpen,
  Target,
  MessageSquare,
  BookMarked,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  BarChart3,
  PieChart
} from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Avatar from '../../components/UI/Avatar'
import { useNavigate } from 'react-router-dom'

const ParentDashboard = () => {
  const navigate = useNavigate()
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const { data: dashboardData, isLoading } = useQuery(
    'parent-dashboard',
    () => parentAPI.getDashboard(),
    {
      staleTime: 30000,
    }
  )

  // Fetch detailed data for selected student
  const { data: attendanceData } = useQuery(
    ['student-attendance-summary', selectedStudentId],
    () => parentAPI.getStudentAttendance(selectedStudentId, { 
      month: new Date().getMonth() + 1, 
      year: new Date().getFullYear() 
    }),
    { enabled: !!selectedStudentId }
  )

  const { data: academicData } = useQuery(
    ['student-academic-summary', selectedStudentId],
    () => parentAPI.getStudentAcademic(selectedStudentId),
    { enabled: !!selectedStudentId }
  )

  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0]
  
  // Auto-select first student
  if (!selectedStudentId && students.length > 0) {
    setSelectedStudentId(students[0].id)
  }

  const attendanceSummary = attendanceData?.data?.data?.summary || {}
  const performances = academicData?.data?.data?.performances || []
  const academicSummary = academicData?.data?.data?.summary || {}

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Critical':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'Present':
        return 'text-green-600'
      case 'Absent':
        return 'text-red-600'
      case 'Late':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  // Calculate attendance pie chart data
  const attendanceChartData = {
    present: attendanceSummary.presentDays || 0,
    absent: attendanceSummary.absentDays || 0,
    late: attendanceSummary.lateDays || 0,
    total: attendanceSummary.totalDays || 1
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-16" />
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="card p-12 text-center">
        <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Linked</h3>
        <p className="text-gray-600">
          No students are currently linked to your account. Please contact the school administration.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600">Overview of your child's progress and activities</p>
      </div>

      {/* Student Selector (if multiple children) */}
      {students.length > 1 && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="input"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} - Class {student.section}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Dashboard Grid: Profile Card (Left) + Report Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SIDE: Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Student Profile</h2>
          </div>

          {/* Student Header */}
          <div className="flex items-start gap-4 mb-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              <Avatar
                src={selectedStudent?.photo}
                firstName={selectedStudent?.firstName}
                lastName={selectedStudent?.lastName}
                size="xl"
              />
            </div>

            {/* Student Info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Class {selectedStudent?.section} • Roll No: {selectedStudent?.rollNumber}
              </p>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(selectedStudent?.riskLevel)}`}>
                {selectedStudent?.riskLevel} Risk
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Today's Attendance */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-xs text-gray-700 font-medium">Today</span>
              </div>
              <p className={`text-xl font-bold ${getAttendanceColor(selectedStudent?.todayAttendance)}`}>
                {selectedStudent?.todayAttendance || 'Unknown'}
              </p>
            </div>

            {/* Monthly Attendance */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-gray-700 font-medium">Attendance</span>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {selectedStudent?.attendancePercentage}%
              </p>
            </div>

            {/* Latest Academic Score */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="text-xs text-gray-700 font-medium">Latest Score</span>
              </div>
              {selectedStudent?.latestAcademicScore ? (
                <div>
                  <p className="text-xl font-bold text-purple-600">
                    {selectedStudent.latestAcademicScore.percentage}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedStudent.latestAcademicScore.examType}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Pending</p>
              )}
            </div>

            {/* Active Interventions */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span className="text-xs text-gray-700 font-medium">Interventions</span>
              </div>
              <p className="text-xl font-bold text-orange-600">
                {selectedStudent?.activeInterventions || 0}
              </p>
              <p className="text-xs text-gray-600">Active</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => navigate('/parent/attendance', { state: { studentId: selectedStudent?.id } })}
              className="btn-outline text-sm"
            >
              View Attendance
            </button>
            <button
              onClick={() => navigate('/parent/academic', { state: { studentId: selectedStudent?.id } })}
              className="btn-outline text-sm"
            >
              View Performance
            </button>
            <button
              onClick={() => navigate('/parent/risk', { state: { studentId: selectedStudent?.id } })}
              className="btn-outline text-sm"
            >
              Risk Details
            </button>
            <button
              onClick={() => navigate('/parent/interventions', { state: { studentId: selectedStudent?.id } })}
              className="btn-outline text-sm"
            >
              Interventions
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Report Card with Charts */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Performance Report Card</h2>
          </div>

          <div className="space-y-4">
            {/* Compact Charts Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Mini Attendance Pie Chart */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-1 mb-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Attendance</h3>
                </div>
                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-24 h-24">
                    {(() => {
                      const { present, absent, late, total } = attendanceChartData
                      if (total === 0) return null
                      
                      const presentPercent = (present / total) * 100
                      const absentPercent = (absent / total) * 100
                      
                      let currentAngle = 0
                      const slices = []
                      
                      const addSlice = (percent, color) => {
                        if (percent === 0) return
                        const angle = (percent / 100) * 360
                        const startAngle = currentAngle
                        const endAngle = currentAngle + angle
                        
                        const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180)
                        const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180)
                        const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180)
                        const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180)
                        
                        const largeArc = angle > 180 ? 1 : 0
                        
                        slices.push(
                          <path
                            key={currentAngle}
                            d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={color}
                          />
                        )
                        
                        currentAngle = endAngle
                      }
                      
                      addSlice(presentPercent, '#10B981')
                      addSlice(absentPercent, '#EF4444')
                      addSlice((late / total) * 100, '#F59E0B')
                      
                      return slices
                    })()}
                    <circle cx="50" cy="50" r="15" fill="white" />
                    <text x="50" y="55" textAnchor="middle" className="text-xs font-bold" fill="#374151">
                      {attendanceSummary.percentage || 0}%
                    </text>
                  </svg>
                </div>
                <div className="flex justify-around text-xs mt-2">
                  <div className="text-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                    <span className="text-gray-600">{attendanceChartData.present}</span>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
                    <span className="text-gray-600">{attendanceChartData.absent}</span>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                    <span className="text-gray-600">{attendanceChartData.late}</span>
                  </div>
                </div>
              </div>

              {/* Mini Subject Marks Pie Chart */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-1 mb-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-semibold text-gray-900">Subjects</h3>
                </div>
                <div className="flex items-center justify-center">
                  {performances.length > 0 && performances[0].subjects ? (
                    <svg viewBox="0 0 100 100" className="w-24 h-24">
                      {(() => {
                        const subjects = performances[0].subjects.slice(0, 5)
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                        let currentAngle = 0
                        
                        return subjects.map((subject, index) => {
                          const percent = subject.percentage / subjects.reduce((sum, s) => sum + s.percentage, 0) * 100
                          const angle = (percent / 100) * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle
                          
                          const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180)
                          const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180)
                          const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180)
                          const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180)
                          
                          const largeArc = angle > 180 ? 1 : 0
                          
                          currentAngle = endAngle
                          
                          return (
                            <path
                              key={index}
                              d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[index]}
                            />
                          )
                        })
                      })()}
                      <circle cx="50" cy="50" r="15" fill="white" />
                      <text x="50" y="55" textAnchor="middle" className="text-xs font-bold" fill="#374151">
                        {performances[0].subjects.length}
                      </text>
                    </svg>
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-gray-400">
                      <span className="text-xs">No data</span>
                    </div>
                  )}
                </div>
                {performances.length > 0 && performances[0].subjects && (
                  <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                    {performances[0].subjects.slice(0, 4).map((subject, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ 
                          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] 
                        }}></div>
                        <span className="text-gray-600 truncate">{subject.name.substring(0, 6)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mini Bar Chart for Monthly Attendance */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-1 mb-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <h3 className="text-xs font-semibold text-gray-900">Monthly Attendance Trend</h3>
              </div>
              <div className="flex items-end justify-between gap-1 h-20">
                {[85, 90, 88, 92, 87, 95, attendanceSummary.percentage || 90].slice(-6).map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100%' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t ${
                          value >= 90 ? 'bg-green-500' :
                          value >= 75 ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                        style={{ height: `${value}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{['J', 'F', 'M', 'A', 'M', 'J'][index]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Bar Chart for Exam Performance */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-1 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-semibold text-gray-900">Recent Exams</h3>
              </div>
              {performances.length > 0 ? (
                <div className="space-y-2">
                  {performances.slice(0, 4).map((perf, index) => {
                    const percentage = perf.overallMarks?.percentage || 0
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate">{perf.examType.substring(0, 12)}</span>
                          <span className="text-gray-900 font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              percentage >= 80 ? 'bg-green-500' :
                              percentage >= 60 ? 'bg-blue-500' :
                              percentage >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-xs py-4">No exam data</p>
              )}
            </div>

            {/* Compact Academic Summary */}
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-1 mb-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <h3 className="text-xs font-semibold text-gray-900">Academic Summary</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">{academicSummary.totalExams || 0}</p>
                  <p className="text-xs text-gray-600">Exams</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-600">{academicSummary.averagePercentage || 0}%</p>
                  <p className="text-xs text-gray-600">Avg</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{academicSummary.bestPercentage || 0}%</p>
                  <p className="text-xs text-gray-600">Best</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-600">{academicSummary.passingRate || 0}%</p>
                  <p className="text-xs text-gray-600">Pass</p>
                </div>
              </div>
            </div>

            {/* Performance Trend */}
            {performances.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Performance Trend</h3>
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  {performances[0]?.isImprovement ? (
                    <>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">Improving</p>
                        <p className="text-xs text-gray-600">Performance is getting better</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">Needs Attention</p>
                        <p className="text-xs text-gray-600">Focus on improvement areas</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Teacher's Remarks</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-900">
                  {selectedStudent?.attendancePercentage >= 90 && academicSummary.averagePercentage >= 80
                    ? "Excellent performance! Keep up the great work."
                    : selectedStudent?.attendancePercentage >= 75 && academicSummary.averagePercentage >= 60
                    ? "Good progress. Consistent effort will lead to better results."
                    : selectedStudent?.attendancePercentage < 75
                    ? "Attendance needs improvement. Regular attendance is crucial for academic success."
                    : "Focus on studies and maintain regular attendance for better performance."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/parent/communications')}
          className="card p-6 hover:shadow-md transition-shadow text-left"
        >
          <MessageSquare className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Communications</h3>
          <p className="text-sm text-gray-600">View messages from teachers</p>
        </button>

        <button
          onClick={() => navigate('/parent/support')}
          className="card p-6 hover:shadow-md transition-shadow text-left"
        >
          <BookMarked className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Support & Guidance</h3>
          <p className="text-sm text-gray-600">Resources and tips for parents</p>
        </button>

        <button
          onClick={() => navigate('/parent/profile')}
          className="card p-6 hover:shadow-md transition-shadow text-left"
        >
          <User className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Profile & Settings</h3>
          <p className="text-sm text-gray-600">Update your information</p>
        </button>
      </div>
    </div>
  )
}

export default ParentDashboard
