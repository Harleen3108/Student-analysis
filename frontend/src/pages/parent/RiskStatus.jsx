import { useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const RiskStatus = () => {
  const location = useLocation()
  const [selectedStudentId, setSelectedStudentId] = useState(location.state?.studentId || '')

  const { data: dashboardData } = useQuery('parent-dashboard', () => parentAPI.getDashboard())
  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []

  const { data: riskData, isLoading } = useQuery(
    ['student-risk', selectedStudentId],
    () => parentAPI.getStudentRisk(selectedStudentId),
    { enabled: !!selectedStudentId }
  )

  const riskStatus = riskData?.data?.data || {}

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-300'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'High': return 'bg-red-100 text-red-800 border-red-300'
      case 'Critical': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Risk Status</h1>
        <p className="text-gray-600">Monitor your child's risk indicators</p>
      </div>

      <div className="card p-4">
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

      {!selectedStudentId ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
          <p className="text-gray-600">Choose a child to view their risk status and indicators</p>
        </div>
      ) : isLoading ? (
        <div className="card p-12">
          <LoadingSpinner className="h-16" />
        </div>
      ) : (
        <>
          {/* Risk Level Card */}
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                <AlertTriangle className={`w-16 h-16 ${
                  riskStatus.riskLevel === 'Low' ? 'text-green-600' :
                  riskStatus.riskLevel === 'Medium' ? 'text-yellow-600' :
                  riskStatus.riskLevel === 'High' ? 'text-red-600' :
                  'text-purple-600'
                }`} />
              </div>
              <div className={`inline-block px-8 py-3 rounded-full text-2xl font-bold border-2 ${getRiskColor(riskStatus.riskLevel)}`}>
                {riskStatus.riskLevel} Risk
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Last Updated: {new Date(riskStatus.lastUpdated || Date.now()).toLocaleDateString()}
              </p>
            </div>

            {/* Risk Explanation */}
            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">What does this mean?</h4>
              <p className="text-sm text-blue-800">
                {riskStatus.riskLevel === 'Low' && 'Your child is performing well with no significant concerns. Keep up the good work!'}
                {riskStatus.riskLevel === 'Medium' && 'Some areas need attention. Regular monitoring and support can help improve the situation.'}
                {riskStatus.riskLevel === 'High' && 'Immediate attention required. Please contact the school for support and intervention programs.'}
                {riskStatus.riskLevel === 'Critical' && 'Urgent intervention needed. Please schedule a meeting with the school counselor immediately.'}
              </p>
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Contributing Factors
            </h3>
            {riskStatus.reasons?.length > 0 ? (
              <div className="space-y-3">
                {riskStatus.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-orange-800 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-green-600 font-medium">✓ No significant concerns</p>
                <p className="text-sm text-gray-500 mt-1">Your child is doing well in all areas</p>
              </div>
            )}
          </div>

          {/* Action Steps */}
          <div className="card p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
            <div className="space-y-3">
              {riskStatus.riskLevel !== 'Low' && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">1</span>
                    </div>
                    <p className="text-gray-700">Schedule a meeting with your child's teacher to discuss concerns</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">2</span>
                    </div>
                    <p className="text-gray-700">Review attendance and academic performance regularly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">3</span>
                    </div>
                    <p className="text-gray-700">Encourage consistent study habits and school attendance</p>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{riskStatus.riskLevel !== 'Low' ? '4' : '1'}</span>
                </div>
                <p className="text-gray-700">Contact school counselor for additional support if needed</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="card p-6 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Important Note</p>
                <p className="text-sm text-blue-800">
                  This is a simplified view for parents. The risk assessment is based on multiple factors including attendance, academic performance, and behavioral observations. For detailed analysis, intervention plans, and personalized support, please contact your child's teacher or school counselor.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RiskStatus
