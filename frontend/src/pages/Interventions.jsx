import { useState } from 'react'
import { useQuery } from 'react-query'
import { Plus, Heart, Calendar, User, Clock } from 'lucide-react'
import { interventionsAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import CreateInterventionModal from '../components/Modals/CreateInterventionModal'
import toast from 'react-hot-toast'

const Interventions = () => {
  const [activeTab, setActiveTab] = useState('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch interventions from API
  const { data: interventionsData, isLoading, error, refetch } = useQuery(
    ['interventions'],
    () => interventionsAPI.getAll({}), // Get all interventions, filter on frontend
    {
      keepPreviousData: true,
    }
  )

  const allInterventions = interventionsData?.data?.data?.interventions || interventionsData?.data?.interventions || []
  
  // Filter interventions based on active tab
  const interventions = allInterventions.filter(intervention => {
    if (activeTab === 'active') {
      return ['In Progress', 'Scheduled'].includes(intervention.status)
    } else {
      return intervention.status === 'Completed'
    }
  })

  const handleCreateIntervention = async (interventionData) => {
    try {
      const response = await interventionsAPI.create(interventionData)
      if (response.data.success) {
        toast.success('Intervention created successfully!')
        refetch() // Refresh the interventions list
      }
    } catch (error) {
      toast.error('Failed to create intervention')
      console.error('Create intervention error:', error)
    }
  }

  const handleViewDetails = async (intervention) => {
    try {
      const response = await interventionsAPI.getById(intervention.id)
      if (response.data.success) {
        const details = response.data.data
        // Show detailed information in a more comprehensive way
        const detailsMessage = `
Intervention: ${details.title}
Student: ${details.student}
Type: ${details.type}
Priority: ${details.priority}
Status: ${details.status}
Progress: ${details.progress}%
Start Date: ${details.startDate}
End Date: ${details.endDate}
Assigned To: ${details.assignedTo}
Description: ${details.description}
        `
        alert(detailsMessage) // For now, use alert. In production, use a proper modal
        toast.success(`Loaded details for: ${intervention.title}`)
      }
    } catch (error) {
      toast.error('Failed to load intervention details')
      console.error('Error loading intervention:', error)
    }
  }

  const handleEditIntervention = async (intervention) => {
    try {
      // Simple edit - update status to next logical state
      let newStatus = intervention.status
      if (intervention.status === 'Scheduled') newStatus = 'In Progress'
      else if (intervention.status === 'In Progress') newStatus = 'Completed'
      else if (intervention.status === 'Completed') newStatus = 'In Progress'
      
      const updatedData = {
        ...intervention,
        status: newStatus,
        progress: newStatus === 'Completed' ? 100 : intervention.progress + 25
      }
      
      const response = await interventionsAPI.update(intervention.id, updatedData)
      if (response.data.success) {
        toast.success(`Updated ${intervention.title} status to: ${newStatus}`)
        refetch() // Refresh the interventions list
      }
    } catch (error) {
      toast.error('Failed to update intervention')
      console.error('Edit intervention error:', error)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-purple-100 text-purple-800'
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Scheduled':
        return 'bg-orange-100 text-orange-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'On Hold':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Interventions</h1>
          <p className="text-gray-600">Manage and track student intervention programs</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Intervention
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Interventions</p>
              <p className="text-2xl font-bold text-blue-600">
                {allInterventions.filter(i => ['In Progress', 'Scheduled'].includes(i.status)).length}
              </p>
            </div>
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {allInterventions.filter(i => i.status === 'Completed').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-purple-600">
                {allInterventions.filter(i => ['High', 'Critical'].includes(i.priority)).length}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-orange-600">{allInterventions.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Interventions ({activeTab === 'active' ? interventions.length : 0})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({activeTab === 'completed' ? interventions.length : 0})
            </button>
          </nav>
        </div>

        {/* Interventions List */}
        <div className="p-6">
          {isLoading ? (
            <LoadingSpinner className="h-32" />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load interventions</p>
              <button onClick={() => refetch()} className="btn-primary">
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {interventions.map((intervention) => (
                <div key={intervention.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {intervention.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{intervention.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Student: <span className="font-medium text-gray-900">{intervention.student}</span></span>
                        <span>•</span>
                        <span>Assigned to: <span className="font-medium text-gray-900">{intervention.assignedTo}</span></span>
                        <span>•</span>
                        <span>Type: <span className="font-medium text-gray-900">{intervention.type}</span></span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(intervention.priority)}`}>
                          {intervention.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(intervention.status)}`}>
                          {intervention.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>Start: {intervention.startDate}</span>
                      <span>End: {intervention.endDate}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {intervention.status !== 'Completed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Progress:</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${intervention.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{intervention.progress}%</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewDetails(intervention)}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEditIntervention(intervention)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && interventions.length === 0 && (
            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} interventions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'active' 
                  ? 'Get started by creating your first intervention.'
                  : 'No completed interventions to show.'
                }
              </p>
              {activeTab === 'active' && (
                <div className="mt-6">
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create Intervention
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Intervention Modal */}
      <CreateInterventionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateIntervention}
      />
    </div>
  )
}

export default Interventions