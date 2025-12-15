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
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editIntervention, setEditIntervention] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: '',
    priority: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
  })

  // Fetch interventions from API
  const { data: interventionsData, isLoading, error, refetch } = useQuery(
    ['interventions'],
    () => interventionsAPI.getAll({}), // Get all interventions, filter on frontend
    {
      keepPreviousData: true,
    }
  )

  const allInterventions = interventionsData?.data?.data?.interventions || interventionsData?.data?.interventions || []
  const activeCount = allInterventions.filter(i => ['In Progress', 'Scheduled'].includes(i.status)).length
  const completedCount = allInterventions.filter(i => i.status === 'Completed').length
  
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
        setSelectedIntervention(details)
        setIsDetailsModalOpen(true)
      }
    } catch (error) {
      toast.error('Failed to load intervention details')
      console.error('Error loading intervention:', error)
    }
  }

  const handleEditIntervention = async (intervention) => {
    // Open edit modal with current values (do not change status/progress here)
    setEditIntervention(intervention)
    setEditForm({
      title: intervention.title || '',
      description: intervention.description || '',
      type: intervention.type || '',
      priority: intervention.priority || '',
      startDate: (intervention.startDate || '').toString().slice(0, 10),
      endDate: (intervention.endDate || '').toString().slice(0, 10),
      assignedTo: intervention.assignedTo || '',
    })
    setIsEditModalOpen(true)
  }

  const handleMarkCompleted = async (intervention) => {
    try {
      if (intervention.status === 'Completed') {
        toast('This intervention is already marked as completed.')
        return
      }

      const confirmComplete = window.confirm(
        'Mark this intervention as completed? Progress will be set to 100%.'
      )
      if (!confirmComplete) return

      const updatedData = {
        ...intervention,
        status: 'Completed',
        progress: 100,
      }

      const response = await interventionsAPI.update(intervention.id, updatedData)
      if (response.data.success) {
        toast.success(`Marked ${intervention.title} as completed`)
        refetch()
      }
    } catch (error) {
      toast.error('Failed to mark intervention as completed')
      console.error('Mark completed error:', error)
    }
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEditFormSubmit = async (e) => {
    e.preventDefault()
    if (!editIntervention) return

    try {
      const updatedData = {
        ...editIntervention,
        title: editForm.title.trim() || editIntervention.title,
        description: editForm.description.trim(),
        type: editForm.type || editIntervention.type,
        priority: editForm.priority || editIntervention.priority,
        startDate: editForm.startDate || editIntervention.startDate,
        endDate: editForm.endDate || editIntervention.endDate,
        assignedTo: editForm.assignedTo || editIntervention.assignedTo,
        // IMPORTANT: keep existing status/progress untouched here
        status: editIntervention.status,
        progress:
          typeof editIntervention.progress === 'number'
            ? editIntervention.progress
            : 0,
      }

      const response = await interventionsAPI.update(editIntervention.id, updatedData)
      if (response.data.success) {
        toast.success(`Updated ${editIntervention.title}`)
        setIsEditModalOpen(false)
        setEditIntervention(null)
        refetch()
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
              Active Interventions ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({completedCount})
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
                        {intervention.status !== 'Completed' && (
                          <button 
                            onClick={() => handleMarkCompleted(intervention)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Mark Completed
                          </button>
                        )}
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

      {/* Edit Intervention Modal */}
      {isEditModalOpen && editIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Intervention
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditIntervention(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditFormSubmit} className="space-y-4 text-sm text-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="input"
                  placeholder="Intervention title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  className="input"
                  rows={3}
                  placeholder="Describe the intervention plan and objectives"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditFormChange}
                    className="input"
                  >
                    <option value="">Select type</option>
                    <option value="Academic Support">Academic Support</option>
                    <option value="Counseling">Counseling</option>
                    <option value="Parent Meeting">Parent Meeting</option>
                    <option value="Financial Aid">Financial Aid</option>
                    <option value="Remedial Classes">Remedial Classes</option>
                    <option value="Home Visit">Home Visit</option>
                    <option value="Behavioral Support">Behavioral Support</option>
                    <option value="Health Support">Health Support</option>
                    <option value="Mentoring">Mentoring</option>
                    <option value="Peer Support">Peer Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={editForm.priority}
                    onChange={handleEditFormChange}
                    className="input"
                  >
                    <option value="">Select priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={editForm.startDate}
                    onChange={handleEditFormChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={editForm.endDate}
                    onChange={handleEditFormChange}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <input
                  name="assignedTo"
                  value={editForm.assignedTo}
                  onChange={handleEditFormChange}
                  className="input"
                  placeholder="Counselor / teacher responsible"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditIntervention(null)
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intervention Details Modal */}
      {isDetailsModalOpen && selectedIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Intervention Details
              </h3>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  setSelectedIntervention(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{selectedIntervention.title}</p>
                <p className="mt-1 text-gray-600">{selectedIntervention.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Student</p>
                  <p className="font-medium">
                    {selectedIntervention.student || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium">
                    {selectedIntervention.assignedTo || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">
                    {selectedIntervention.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(selectedIntervention.priority)}`}>
                    {selectedIntervention.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedIntervention.status)}`}>
                    {selectedIntervention.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="font-medium">
                    {typeof selectedIntervention.progress === 'number'
                      ? `${selectedIntervention.progress}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium">{selectedIntervention.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="font-medium">{selectedIntervention.endDate}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    setSelectedIntervention(null)
                  }}
                  className="btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Interventions