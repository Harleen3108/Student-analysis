import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  BookOpen, 
  Users, 
  Plus, 
  Save,
  Calendar,
  TrendingUp,
  Award,
  FileText,
  Eye
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const AcademicEntry = () => {
  const queryClient = useQueryClient()
  const [view, setView] = useState('list') // 'list' or 'entry'
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [examType, setExamType] = useState('Unit Test')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [maxMarks, setMaxMarks] = useState(100)
  const [passingMarks, setPassingMarks] = useState(40)
  const [grades, setGrades] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentExamId, setCurrentExamId] = useState(null)
  const [viewingExam, setViewingExam] = useState(null)

  // Get dashboard data for classes
  const { data: dashboardData, isLoading } = useQuery(
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

  // Get saved exams
  const { data: savedExamsData, isLoading: examsLoading, refetch: refetchExams } = useQuery(
    'saved-exams',
    () => teacherAPI.getSavedExams(),
    {
      staleTime: 30000,
    }
  )

  // Get exam details when viewing
  const { data: examDetailsData, isLoading: examDetailsLoading } = useQuery(
    ['exam-details', currentExamId],
    () => teacherAPI.getExamDetails(currentExamId),
    {
      enabled: !!currentExamId && view === 'entry',
      onSuccess: (data) => {
        const details = data.data?.data || data.data
        if (details && details.students) {
          // Load previous marks into grades state
          const previousGrades = {}
          details.students.forEach(student => {
            const subject = student.subjects.find(s => s.name === selectedSubject)
            if (subject) {
              previousGrades[student.studentId] = {
                marksObtained: subject.obtainedMarks
              }
            }
          })
          setGrades(previousGrades)
        }
      }
    }
  )

  // Extract data properly from Axios response wrapper
  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [] } = dashboard
  const students = studentsData?.data?.data?.students || studentsData?.data?.students || []
  const savedExams = savedExamsData?.data?.data?.exams || savedExamsData?.data?.exams || []

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Hindi',
    'History',
    'Geography',
    'Computer Science',
    'Physical Education'
  ]

  const examTypes = [
    'Unit Test',
    'Monthly Test',
    'Mid Term',
    'Final',
    'Quarterly',
    'Half Yearly',
    'Annual',
    'Assignment',
    'Project'
  ]

  const handleGradeChange = (studentId, marks) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: parseFloat(marks) || 0
      }
    }))
  }

  const handleSubmitGrades = async () => {
    if (!selectedClass || !selectedSubject || !examName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (Object.keys(grades).length === 0) {
      toast.error('Please enter marks for at least one student')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare grade entries for API
      const gradeEntries = Object.entries(grades).map(([studentId, gradeData]) => ({
        studentId,
        marksObtained: gradeData.marksObtained
      }))

      // Submit to real API
      const response = await teacherAPI.submitAcademicGrades({
        className: selectedClass,
        subject: selectedSubject,
        examType,
        examName,
        examDate,
        maxMarks: parseFloat(maxMarks),
        passingMarks: parseFloat(passingMarks),
        grades: gradeEntries
      })

      const result = response.data?.data || response.data
      
      toast.success(`Grades submitted successfully for ${result.summary.successful} students!`)
      
      if (result.summary.failed > 0) {
        toast.error(`Failed to submit grades for ${result.summary.failed} students`)
      }
      
      // Reset form and go back to list view
      setGrades({})
      setExamName('')
      setCurrentExamId(null)
      setView('list')
      
      // Refresh data
      refetchExams()
      queryClient.invalidateQueries(['class-students'])
      queryClient.invalidateQueries(['teacher-dashboard'])
      queryClient.invalidateQueries(['at-risk-students'])
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit grades')
      console.error('Grade submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateGrade = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C+'
    if (percentage >= 40) return 'C'
    return 'F'
  }

  const getGradeColor = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) return <LoadingSpinner className="h-64" />

  // View Exam Details Modal
  if (viewingExam) {
    const examDetails = examDetailsData?.data?.data || examDetailsData?.data
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Exam Details</h1>
            <p className="text-gray-600">View student performance</p>
          </div>
          <button
            onClick={() => {
              setViewingExam(null)
              setCurrentExamId(null)
            }}
            className="btn-outline"
          >
            Back to List
          </button>
        </div>

        {examDetailsLoading ? (
          <LoadingSpinner className="h-64" />
        ) : examDetails ? (
          <>
            {/* Exam Info */}
            <div className="card p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="text-lg font-semibold">{examDetails.exam.className}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exam Type</p>
                  <p className="text-lg font-semibold">{examDetails.exam.examType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold">{new Date(examDetails.exam.examDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-lg font-semibold">{examDetails.summary.totalStudents}</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average</p>
                    <p className="text-2xl font-bold text-blue-600">{examDetails.summary.avgPercentage}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{examDetails.summary.passCount}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{examDetails.summary.failCount}</p>
                  </div>
                  <Users className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Student Grades</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examDetails.students.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">Roll: {student.rollNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {student.subjects.map((sub, idx) => (
                              <div key={idx}>
                                <span className="font-medium">{sub.name}:</span> {sub.obtainedMarks}/{sub.maxMarks} ({sub.percentage}%)
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{student.overallMarks.percentage}%</div>
                          <div className="text-xs text-gray-500">{student.overallMarks.obtained}/{student.overallMarks.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.overallGrade === 'A+' || student.overallGrade === 'A' ? 'bg-green-100 text-green-800' :
                            student.overallGrade === 'B+' || student.overallGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                            student.overallGrade === 'C+' || student.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {student.overallGrade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.overallMarks.percentage >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.overallMarks.percentage >= 40 ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No exam details found</p>
          </div>
        )}
      </div>
    )
  }

  // List View - Show saved exams
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Academic Entry</h1>
            <p className="text-gray-600">Enter and manage student academic performance</p>
          </div>
          <button
            onClick={() => {
              setView('entry')
              setCurrentExamId(null)
              setGrades({})
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Exam Entry
          </button>
        </div>

        {/* Saved Exams List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Exam Entries</h3>
          </div>
          
          {examsLoading ? (
            <LoadingSpinner className="h-32" />
          ) : savedExams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exams entered yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click "New Exam Entry" to start entering grades
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {savedExams.map((exam) => (
                <div key={exam.examId} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Class {exam.className} - {exam.examType}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Avg: {exam.avgPercentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Subjects:</span> {exam.subjects.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(exam.examDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Students:</span> {exam.studentsGraded}
                        </div>
                        <div className="text-xs text-gray-500">
                          Saved: {new Date(exam.savedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setCurrentExamId(exam.examId)
                          setViewingExam(exam)
                        }}
                        className="btn-outline text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          // Load exam data for editing
                          setSelectedClass(exam.className)
                          setSelectedSubject(exam.subjects[0]) // Load first subject
                          setExamType(exam.examType)
                          setExamDate(exam.examDate.split('T')[0])
                          setCurrentExamId(exam.examId)
                          setView('entry')
                          toast.info('Loading exam for editing...')
                        }}
                        className="btn-outline text-sm"
                      >
                        Update Marks
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Entry View - Enter/Update grades
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Academic Entry</h1>
          <p className="text-gray-600">Enter and manage student academic performance</p>
        </div>
        <button
          onClick={() => {
            setView('list')
            setGrades({})
            setCurrentExamId(null)
          }}
          className="btn-outline"
        >
          Back to List
        </button>
      </div>

      {/* Exam Setup */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Select class</option>
              {assignedClasses.map((classData) => (
                <option key={classData.className} value={classData.className}>
                  Class {classData.className} ({classData.totalStudents} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="input"
            >
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g., Chapter 1-3 Test"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Marks
            </label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              min="1"
              max="1000"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passing Marks
            </label>
            <input
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              min="1"
              max={maxMarks}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSubmitGrades}
              disabled={!selectedClass || !selectedSubject || !examName || isSubmitting || Object.keys(grades).length === 0}
              className="btn-primary flex items-center gap-2 w-full"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Grades'}
            </button>
          </div>
        </div>
      </div>

      {/* Students Marks Entry */}
      {selectedClass && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Enter Marks - Class {selectedClass}
                {selectedSubject && ` - ${selectedSubject}`}
              </h3>
              <div className="text-sm text-gray-500">
                {students.length} students • Max: {maxMarks} marks
              </div>
            </div>
          </div>

          {studentsLoading ? (
            <LoadingSpinner className="h-32" />
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a different class.
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
                      Marks Obtained
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const studentGrade = grades[student.id] || {}
                    const marks = studentGrade.marksObtained || 0
                    const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0
                    const grade = calculateGrade(marks, maxMarks)
                    const status = marks >= passingMarks ? 'Pass' : 'Fail'

                    return (
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
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              step="0.5"
                              value={marks}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-500">/ {maxMarks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getGradeColor(marks, maxMarks)}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                            grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            grade === 'C+' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {Object.keys(grades).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students Graded</p>
                <p className="text-2xl font-bold text-blue-600">{Object.keys(grades).length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Marks</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(grades).length > 0 
                    ? Math.round(Object.values(grades).reduce((sum, g) => sum + (g.marksObtained || 0), 0) / Object.keys(grades).length)
                    : 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(grades).length > 0 
                    ? Math.round((Object.values(grades).filter(g => (g.marksObtained || 0) >= passingMarks).length / Object.keys(grades).length) * 100)
                    : 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.keys(grades).length > 0 
                    ? Math.max(...Object.values(grades).map(g => g.marksObtained || 0))
                    : 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicEntry