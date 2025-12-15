import { useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { Target, CheckCircle } from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const Interventions = () => {
  const location = useLocation()
  const [selectedStudentId, setSelectedStudentId] = useState(location.state?.studentId || '')

  const { data: dashboardData } = useQuery('parent-dashboard', () => parentAPI.getDashboard())
  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []

  const { data: interventionsData, isLoading } = useQuery(
    ['student-interventions', selectedStudentId],
    () => parentAPI.getStudentInterventions(selectedStudentId),
    { enabled: !!selectedStudentId }
  )

  const interventions = interventionsData?.data?.data?.interventions || []

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Interventions</h1>
        <p className="text-gray-600">View support programs for your child</p>
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
          <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600">Select a child to view interventions</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner className="h-16" />
      ) : interventions.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Interventions</h3>
          <p className="text-gray-600">No support programs have been assigned yet</p>
          <p className="text-sm text-gray-500 mt-2">Interventions will appear here when the school creates support plans</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Interventions */}
          {interventions.filter(i => ['Planned', 'In Progress'].includes(i.status)).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Interventions</h3>
              <div className="space-y-4">
                {interventions.filter(i => ['Planned', 'In Progress'].includes(i.status)).map((intervention) => (
                  <div key={intervention.id} className="card p-6 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="w-6 h-6 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{intervention.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {intervention.type}
                          </span>
                          {intervention.priority && (
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              intervention.priority === 'High' ? 'bg-red-100 text-red-800' :
                              intervention.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {intervention.priority} Priority
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(intervention.status)}`}>
                        {intervention.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">{intervention.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Start Date</p>
                        <p className="font-medium text-gray-900">{new Date(intervention.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">End Date</p>
                        <p className="font-medium text-gray-900">{new Date(intervention.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Duration</p>
                        <p className="font-medium text-gray-900">
                          {Math.ceil((new Date(intervention.endDate) - new Date(intervention.startDate)) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Progress</p>
                        <p className="font-medium text-gray-900">{intervention.progress || 0}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-primary-600">{intervention.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${intervention.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Notes */}
                    {intervention.progressNotes && intervention.progressNotes.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Latest Update
                        </p>
                        <p className="text-sm text-green-800">{intervention.progressNotes[intervention.progressNotes.length - 1]}</p>
                        <p className="text-xs text-green-600 mt-2">
                          {intervention.progressNotes.length} update(s) recorded
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Interventions */}
          {interventions.filter(i => i.status === 'Completed').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Interventions</h3>
              <div className="space-y-4">
                {interventions.filter(i => i.status === 'Completed').map((intervention) => (
                  <div key={intervention.id} className="card p-6 border-l-4 border-green-500 bg-green-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{intervention.title}</h3>
                        </div>
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {intervention.type}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{intervention.description}</p>
                    <p className="text-sm text-gray-600">
                      Completed on: {new Date(intervention.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Interventions
