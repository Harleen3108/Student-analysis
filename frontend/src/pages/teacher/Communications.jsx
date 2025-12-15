import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Plus
} from 'lucide-react'
import { teacherAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const Communications = () => {
  const [view, setView] = useState('list') // 'list' or 'compose'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedComm, setSelectedComm] = useState(null)
  const queryClient = useQueryClient()

  // Form state for new communication
  const [formData, setFormData] = useState({
    studentId: '',
    recipient: 'parent',
    subject: '',
    message: '',
    type: 'General',
    priority: 'Normal',
    method: 'Email',
    followUpRequired: false,
    followUpDate: '',
    tags: []
  })

  // Get dashboard for student list
  const { data: dashboardData } = useQuery(
    'teacher-dashboard',
    () => teacherAPI.getDashboard(),
    {
      staleTime: 30000,
    }
  )

  // Get communications
  const { data: communicationsData, isLoading } = useQuery(
    ['communications', filterType, filterStatus],
    () => teacherAPI.getCommunications({ type: filterType, status: filterStatus }),
    {
      staleTime: 30000,
    }
  )

  // Send communication mutation
  const sendMutation = useMutation(
    (data) => teacherAPI.sendCommunication(data),
    {
      onSuccess: () => {
        toast.success('Communication sent successfully')
        queryClient.invalidateQueries('communications')
        setView('list')
        setFormData({
          studentId: '',
          recipient: 'parent',
          subject: '',
          message: '',
          type: 'General',
          priority: 'Normal',
          method: 'Email',
          followUpRequired: false,
          followUpDate: '',
          tags: []
        })
      },
      onError: (error) => {
        console.error('Communication error:', error)
        console.error('Error response:', error.response)
        console.error('Error data:', error.response?.data)
        toast.error(error.response?.data?.message || error.message || 'Failed to send communication')
      }
    }
  )

  const dashboard = dashboardData?.data?.data || dashboardData?.data || {}
  const { assignedClasses = [] } = dashboard
  const communications = communicationsData?.data?.data?.communications || communicationsData?.data?.communications || []

  // Get ALL students from all assigned classes (not just the 3 shown in dashboard)
  const { data: allStudentsData } = useQuery(
    ['all-students-for-communication', assignedClasses],
    async () => {
      if (assignedClasses.length === 0) return { students: [] }
      
      // Fetch all students from all assigned classes
      const promises = assignedClasses.map(classData => 
        teacherAPI.getClassStudents(classData.className)
      )
      const results = await Promise.all(promises)
      
      // Combine all students and ensure proper ID mapping
      const allStudents = results.flatMap((result, index) => {
        const students = result?.data?.data?.students || result?.data?.students || []
        return students.map(student => {
          // CRITICAL: Ensure we have a valid MongoDB ObjectId
          const studentId = student._id || student.id
          return {
            ...student,
            _id: studentId,
            id: studentId, // Ensure both _id and id are set
            className: assignedClasses[index].className
          }
        })
      })
      
      console.log('✅ All students for communication:', allStudents.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}` })))
      return { students: allStudents }
    },
    {
      enabled: assignedClasses.length > 0,
      staleTime: 60000,
    }
  )

  const allStudents = allStudentsData?.students || []

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Sent':
        return <Send className="w-4 h-4 text-blue-600" />
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Read':
        return <Mail className="w-4 h-4 text-purple-600" />
      case 'Replied':
        return <MessageSquare className="w-4 h-4 text-green-600" />
      case 'Failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Read':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Replied':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Normal':
        return 'bg-blue-100 text-blue-800'
      case 'Low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.studentId || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    console.log('Sending communication with data:', formData)
    sendMutation.mutate(formData)
  }

  // Compose View
  if (view === 'compose') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Compose Communication</h1>
            <p className="text-gray-600">Send a message to parents or students</p>
          </div>
          <button
            onClick={() => setView('list')}
            className="btn-outline"
          >
            ← Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a student</option>
              {allStudents.map((student) => {
                const studentId = student._id || student.id
                return (
                  <option key={studentId} value={studentId}>
                    {student.firstName} {student.lastName} - {student.className} ({student.rollNumber})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="input"
              required
            >
              <option value="parent">Parent</option>
              <option value="student">Student</option>
              <option value="both">Both Parent & Student</option>
            </select>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Attendance">Attendance</option>
                <option value="Health">Health</option>
                <option value="Event">Event</option>
                <option value="Meeting Request">Meeting Request</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="input"
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Phone Call">Phone Call</option>
                <option value="In-Person">In-Person</option>
                <option value="App">App Notification</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="Enter subject"
              maxLength={200}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="input"
              rows={6}
              placeholder="Enter your message"
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.message.length}/2000 characters</p>
          </div>

          {/* Follow-up */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Follow-up required</span>
            </label>

            {formData.followUpRequired && (
              <div className="flex-1">
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setView('list')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {sendMutation.isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Communication
                </>
              )}
            </button>
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
          <h1 className="text-2xl font-semibold text-gray-900">Communications</h1>
          <p className="text-gray-600">Manage parent and student communications</p>
        </div>
        <button
          onClick={() => setView('compose')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Communication
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Attendance">Attendance</option>
              <option value="Health">Health</option>
              <option value="Event">Event</option>
              <option value="Meeting Request">Meeting Request</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Delivered">Delivered</option>
              <option value="Read">Read</option>
              <option value="Replied">Replied</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Communications List */}
      {isLoading ? (
        <div className="card p-12">
          <LoadingSpinner className="h-16" />
        </div>
      ) : filteredCommunications.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No communications found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType || filterStatus
              ? 'Try adjusting your filters'
              : 'Start by sending your first communication'}
          </p>
          <button
            onClick={() => setView('compose')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Send Communication
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunications.map((comm) => (
            <div
              key={comm.id}
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedComm(comm)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{comm.subject}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(comm.priority)}`}>
                      {comm.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(comm.status)}`}>
                      {getStatusIcon(comm.status)}
                      <span className="ml-1">{comm.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {comm.student?.firstName} {comm.student?.lastName} ({comm.student?.rollNumber})
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {comm.recipient}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(comm.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{comm.type}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{comm.message}</p>
              
              {comm.parentResponse && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-800 mb-1">Parent Response:</p>
                  <p className="text-sm text-green-700">{comm.parentResponse.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Communication Detail Modal */}
      {selectedComm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Communication Details</h3>
              <button
                onClick={() => setSelectedComm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Subject</h4>
                <p className="text-gray-900">{selectedComm.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Student</h4>
                  <p className="text-gray-900">
                    {selectedComm.student?.firstName} {selectedComm.student?.lastName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Recipient</h4>
                  <p className="text-gray-900">{selectedComm.recipient}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Type</h4>
                  <p className="text-gray-900">{selectedComm.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Priority</h4>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedComm.priority)}`}>
                    {selectedComm.priority}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedComm.status)}`}>
                    {getStatusIcon(selectedComm.status)}
                    {selectedComm.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Message</h4>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedComm.message}</p>
              </div>

              {selectedComm.parentResponse && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Parent Response</h4>
                  <p className="text-sm text-green-700">{selectedComm.parentResponse.message}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Received: {new Date(selectedComm.parentResponse.receivedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Sent: {new Date(selectedComm.sentAt).toLocaleString()}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedComm(null)}
                className="btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Communications
