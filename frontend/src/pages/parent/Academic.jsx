import { useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { BookOpen, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const Academic = () => {
  const location = useLocation()
  const [selectedStudentId, setSelectedStudentId] = useState(location.state?.studentId || '')

  const { data: dashboardData } = useQuery('parent-dashboard', () => parentAPI.getDashboard())
  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []

  const { data: academicData, isLoading } = useQuery(
    ['student-academic', selectedStudentId],
    () => parentAPI.getStudentAcademic(selectedStudentId),
    { enabled: !!selectedStudentId }
  )

  const performances = academicData?.data?.data?.performances || []
  const summary = academicData?.data?.data?.summary || {}
  const trends = academicData?.data?.data?.trends || []

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'text-green-600'
    if (['B+', 'B'].includes(grade)) return 'text-blue-600'
    if (['C+', 'C'].includes(grade)) return 'text-yellow-600'
    if (grade === 'D') return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Academic Performance</h1>
        <p className="text-gray-600">Track your child's academic progress and exam results</p>
      </div>

      {/* Student Selector */}
      <div className="card p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="input"
        >
          <option value="">Select a child</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName} - Class {student.section}
            </option>
          ))}
        </select>
      </div>

      {!selectedStudentId ? (
        <div className="card p-12 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
          <p className="text-gray-600">Choose a child to view their academic performance</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12">
          <LoadingSpinner className="h-16" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-6 text-center">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{summary.totalExams || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Exams</p>
            </div>
            <div className="card p-6 text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-600">{summary.averagePercentage || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">Average Score</p>
            </div>
            <div className="card p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-600">{summary.bestPercentage || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">Best Score</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                {summary.passingRate >= 80 ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : summary.passingRate >= 60 ? (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                )}
              </div>
              <p className="text-3xl font-bold text-blue-600">{summary.passingRate || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">Pass Rate</p>
            </div>
          </div>

          {/* Performance Trend */}
          {trends.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {trends.slice(-6).map((trend, index) => {
                  const height = (trend.percentage / 100) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '100%' }}>
                        <div
                          className={`absolute bottom-0 w-full rounded-t transition-all ${
                            trend.percentage >= 80 ? 'bg-green-500' :
                            trend.percentage >= 60 ? 'bg-blue-500' :
                            trend.percentage >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ height: `${height}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                            {trend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {trend.examType?.substring(0, 8)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Detailed Exam Results */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Exam Results</h3>
            {performances.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No exam records available yet</p>
                <p className="text-sm text-gray-400 mt-1">Results will appear here once exams are graded</p>
              </div>
            ) : (
              <div className="space-y-6">
                {performances.map((perf, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Exam Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{perf.examType}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(perf.examDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900">
                            {perf.overallMarks?.percentage || 0}%
                          </p>
                          <p className={`text-lg font-semibold ${getGradeColor(perf.overallGrade)}`}>
                            Grade: {perf.overallGrade}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subject-wise Marks */}
                    <div className="p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Subject-wise Performance</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perf.subjects?.map((subject, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg border-2 ${
                              subject.isPassing 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">{subject.name}</p>
                              {subject.isPassing ? (
                                <span className="text-green-600 text-xs font-semibold">✓ Pass</span>
                              ) : (
                                <span className="text-red-600 text-xs font-semibold">✗ Fail</span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-gray-900">
                                {subject.obtainedMarks}
                              </p>
                              <p className="text-sm text-gray-600">/ {subject.maxMarks}</p>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm text-gray-600">{subject.percentage}%</p>
                              <p className={`text-sm font-semibold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                              </p>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  subject.isPassing ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${subject.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Overall Summary */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Total Marks</p>
                            <p className="text-lg font-bold text-gray-900">
                              {perf.overallMarks?.obtained} / {perf.overallMarks?.total}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Percentage</p>
                            <p className="text-lg font-bold text-purple-600">
                              {perf.overallMarks?.percentage}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Grade</p>
                            <p className={`text-lg font-bold ${getGradeColor(perf.overallGrade)}`}>
                              {perf.overallGrade}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Failed Subjects Alert */}
                      {perf.failedSubjects && perf.failedSubjects.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-1">
                            ⚠️ Attention Required
                          </p>
                          <p className="text-sm text-red-700">
                            Failed in: {perf.failedSubjects.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Improvement Indicator */}
                      {perf.isImprovement !== undefined && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          perf.isImprovement 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {perf.isImprovement ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-800">Improved from previous exam</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4 text-yellow-600" />
                                <span className="text-yellow-800">Needs improvement</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Academic
