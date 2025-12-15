import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Tag,
  X,
  Save
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Observations = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [view, setView] = useState('list') // 'list', 'create', 'edit', 'view'
  const [selectedObservation, setSelectedObservation] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    className: '',
    observationType: '',
    severity: '',
    status: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    className: '',
    observationType: 'General',
    severity: 'Medium',
    title: '',
    description: '',
    actionTaken: '',
    followUpRequired: false,
    followUpDate: '',
    tags: '',
    isPrivate: false
  })

  // Get observations
  const { data: observationsData, isLoading, refetch } = useQuery(
    ['observations', filters],
    () => teacherAPI.getObservations(filters),
    {
      staleTime: 30000,
    }
  )

  // Get dashboard for class data
  const { data: dashboardData } = useQuery(
    'teacher-dashboard',
    () => teacherAPI.getDashboard(),
    {
      staleTime: 30000,
    }
  )

  // Get students for selected class
  const { data: studentsData } = useQuery(
    ['class-students', formData.className],
    () => teacherAPI.getClassStudents(formData.className),
    {
      enabled: !!formData.className,
      staleTime: 30000,
    }
  )

  // Create observation mutation
  const createMutation = useMutation(
    (data) => teacherAPI.createObservation(data),
    {
      onSuccess: () => {
        toast.success('Observation created successfully!')
        setView('list')
        resetForm()
        refetch()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create observation')
      }
    }
  )

  // Update observation mutation
  const updateMutation = useMutation(
    ({ id, data }) => teacherAPI.updateObservation(id, data),
    {
      onSuccess: () => {
        toast.success('Observation updated successfully!')
        setView('list')
        resetForm()
        refetch()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update observation')
      }
    }
  )

  // Delete observation mutation
  const deleteMutation = useMutation(
    (id) => teacherAPI.deleteObservation(id),
    {
      onSuccess: () => {
        toast.success('Observation deleted successfully!')
        refetch()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete observation')
      }
    }
  )

  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [] } = dashboard
  const students = studentsData?.data?.data?.students || studentsData?.data?.students || []
  const observations = observationsData?.data?.data?.observations || observationsData?.data?.observations || []

  const observationTypes = ['Behavioral', 'Academic', 'Health', 'Engagement', 'Social', 'Attendance', 'General']
  const severityLevels = ['Low', 'Medium', 'High', 'Critical']
  const statusOptions = ['Active', 'Resolved', 'Escalated']

  const resetForm = () => {
    setFormData({
      studentId: '',
      className: '',
      observationType: 'General',
      severity: 'Medium',
      title: '',
      description: '',
      actionTaken: '',
      followUpRequired: false,
      followUpDate: '',
      tags: '',
      isPrivate: false
    })
    setSelectedObservation(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.studentId || !formData.className || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
    }

    if (selectedObservation) {
      updateMutation.mutate({ id: selectedObservation.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleEdit = (observation) => {
    setSelectedObservation(observation)
    setFormData({
      studentId: observation.student._id || observation.student.id,
      className: observation.class,
      observationType: observation.observationType,
      severity: observation.severity,
      title: observation.title,
      description: observation.description,
      actionTaken: observation.actionTaken || '',
      followUpRequired: observation.followUpRequired,
      followUpDate: observation.followUpDate ? new Date(observation.followUpDate).toISOString().split('T')[0] : '',
      tags: observation.tags?.join(', ') || '',
      isPrivate: observation.isPrivate
    })
    setView('edit')
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this observation?')) {
      deleteMutation.mutate(id)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-800'
      case 'Escalated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  // View Details
  if (view === 'view' && selectedObservation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Observation Details</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(selectedObservation)}
              className="btn-outline flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                setView('list')
                setSelectedObservation(null)
              }}
              className="btn-outline"
            >
              Back to List
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedObservation.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedObservation.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(selectedObservation.severity)}`}>
                  {selectedObservation.severity}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedObservation.status)}`}>
                  {selectedObservation.status}
                </span>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-medium">{selectedObservation.student.firstName} {selectedObservation.student.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="font-medium">{selectedObservation.student.rollNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-medium">{selectedObservation.class}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{selectedObservation.observationType}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{selectedObservation.description}</p>
            </div>

            {/* Action Taken */}
            {selectedObservation.actionTaken && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Action Taken</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedObservation.actionTaken}</p>
              </div>
            )}

            {/* Follow-up */}
            {selectedObservation.followUpRequired && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <h3 className="text-sm font-medium text-yellow-900">Follow-up Required</h3>
                </div>
                {selectedObservation.followUpDate && (
                  <p className="text-sm text-yellow-800">
                    Due: {new Date(selectedObservation.followUpDate).toLocaleDateString()}
                  </p>
                )}
                {selectedObservation.followUpNotes && (
                  <p className="text-sm text-yellow-800 mt-2">{selectedObservation.followUpNotes}</p>
                )}
              </div>
            )}

            {/* Tags */}
            {selectedObservation.tags && selectedObservation.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedObservation.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Create/Edit Form
  if (view === 'create' || view === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {view === 'edit' ? 'Edit Observation' : 'New Observation'}
          </h1>
          <button
            onClick={() => {
              setView('list')
              resetForm()
            }}
            className="btn-outline"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-6">
            {/* Class and Student Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value, studentId: '' })}
                  className="input"
                  required
                >
                  <option value="">Select class</option>
                  {assignedClasses.map((classData) => (
                    <option key={classData.className} value={classData.className}>
                      Class {classData.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input"
                  required
                  disabled={!formData.className}
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {student.rollNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.observationType}
                  onChange={(e) => setFormData({ ...formData, observationType: e.target.value })}
                  className="input"
                  required
                >
                  {observationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="input"
                  required
                >
                  {severityLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Brief title for the observation"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
                placeholder="Detailed description of the observation"
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
            </div>

            {/* Action Taken */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Taken
              </label>
              <textarea
                value={formData.actionTaken}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                className="input"
                rows={3}
                placeholder="What action was taken regarding this observation?"
                maxLength={500}
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                  Follow-up required
                </label>
              </div>

              {formData.followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="Enter tags separated by commas (e.g., disruptive, needs-support)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
            </div>

            {/* Private */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                Private observation (visible only to you and admin)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setView('list')
                  resetForm()
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save Observation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Observations</h1>
          <p className="text-gray-600">Track and manage student observations</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Observation
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.className}
              onChange={(e) => setFilters({ ...filters, className: e.target.value })}
              className="input"
            >
              <option value="">All Classes</option>
              {assignedClasses.map((classData) => (
                <option key={classData.className} value={classData.className}>
                  Class {classData.className}
                </option>
              ))}
            </select>

            <select
              value={filters.observationType}
              onChange={(e) => setFilters({ ...filters, observationType: e.target.value })}
              className="input"
            >
              <option value="">All Types</option>
              {observationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="input"
            >
              <option value="">All Severities</option>
              {severityLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Observations List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            All Observations ({observations.length})
          </h3>
        </div>

        {isLoading ? (
          <LoadingSpinner className="h-32" />
        ) : observations.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No observations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by creating your first observation
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {observations.map((observation) => (
              <div key={observation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{observation.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(observation.severity)}`}>
                        {observation.severity}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(observation.status)}`}>
                        {observation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Student:</span> {observation.student.firstName} {observation.student.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Class:</span> {observation.class}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {observation.observationType}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(observation.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2">{observation.description}</p>

                    {observation.followUpRequired && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-yellow-700">
                        <Clock className="w-4 h-4" />
                        Follow-up required
                        {observation.followUpDate && ` by ${new Date(observation.followUpDate).toLocaleDateString()}`}
                      </div>
                    )}

                    {observation.tags && observation.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {observation.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedObservation(observation)
                        setView('view')
                      }}
                      className="btn-outline p-2"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(observation)}
                      className="btn-outline p-2"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(observation.id)}
                      className="btn-outline p-2 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default Observations
