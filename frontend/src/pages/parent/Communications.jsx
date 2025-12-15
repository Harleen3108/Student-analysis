import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { MessageSquare, Send, X } from 'lucide-react'
import { parentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const Communications = () => {
  const [selectedComm, setSelectedComm] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const queryClient = useQueryClient()

  const { data: dashboardData } = useQuery('parent-dashboard', () => parentAPI.getDashboard())
  const students = dashboardData?.data?.data?.students || dashboardData?.data?.students || []

  const { data: communicationsData, isLoading } = useQuery(
    'parent-communications',
    () => parentAPI.getCommunications(),
    { staleTime: 30000 }
  )

  const replyMutation = useMutation(
    ({ communicationId, message }) => parentAPI.replyToCommunication(communicationId, { message }),
    {
      onSuccess: () => {
        toast.success('Reply sent successfully')
        queryClient.invalidateQueries('parent-communications')
        setReplyMessage('')
        setSelectedComm(null)
      },
      onError: () => toast.error('Failed to send reply')
    }
  )

  const markAsReadMutation = useMutation(
    (communicationId) => parentAPI.markCommunicationAsRead(communicationId),
    {
      onSuccess: () => queryClient.invalidateQueries('parent-communications')
    }
  )

  const communications = communicationsData?.data?.data?.communications || []

  const filteredCommunications = filterStudent
    ? communications.filter(c => c.student?.id === filterStudent || c.student?._id === filterStudent)
    : communications

  const handleOpenComm = (comm) => {
    setSelectedComm(comm)
    if (comm.status !== 'Read' && comm.status !== 'Replied') {
      markAsReadMutation.mutate(comm.id)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Low': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Communications</h1>
        <p className="text-gray-600">Messages from teachers and school</p>
      </div>

      {/* Filter */}
      {students.length > 1 && (
        <div className="card p-4">
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="input"
          >
            <option value="">All Children</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="h-16" />
      ) : filteredCommunications.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunications.map((comm) => (
            <div
              key={comm.id}
              onClick={() => handleOpenComm(comm)}
              className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{comm.subject}</h3>
                    {comm.priority && comm.priority !== 'Normal' && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(comm.priority)}`}>
                        {comm.priority}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="font-medium">From:</span>
                      {comm.sender?.firstName} {comm.sender?.lastName}
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {comm.sender?.role}
                      </span>
                    </p>
                    {comm.sender?.email && (
                      <p className="text-sm text-gray-500">
                        📧 {comm.sender.email}
                      </p>
                    )}
                    {comm.sender?.phone && (
                      <p className="text-sm text-gray-500">
                        📱 {comm.sender.phone}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Regarding:</span> {comm.student?.firstName} {comm.student?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {comm.type} • {new Date(comm.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    comm.status === 'Replied' ? 'bg-green-100 text-green-800' :
                    comm.status === 'Read' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {comm.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 line-clamp-2">{comm.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedComm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedComm.subject}</h3>
              <button onClick={() => setSelectedComm(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Teacher Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">From Teacher</h4>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{selectedComm.sender?.firstName} {selectedComm.sender?.lastName}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 rounded-full">
                      {selectedComm.sender?.role}
                    </span>
                  </p>
                  {selectedComm.sender?.email && (
                    <p className="text-sm text-blue-700">📧 {selectedComm.sender.email}</p>
                  )}
                  {selectedComm.sender?.phone && (
                    <p className="text-sm text-blue-700">📱 {selectedComm.sender.phone}</p>
                  )}
                </div>
              </div>

              {/* Message Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Regarding</p>
                  <p className="font-medium text-gray-900">{selectedComm.student?.firstName} {selectedComm.student?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedComm.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Priority</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(selectedComm.priority)}`}>
                    {selectedComm.priority}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600">Sent</p>
                  <p className="font-medium text-gray-900">{new Date(selectedComm.sentAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Message</h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedComm.message}</p>
                </div>
              </div>

              {selectedComm.parentResponse && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">Your Reply:</p>
                  <p className="text-green-700">{selectedComm.parentResponse.message}</p>
                </div>
              )}

              {!selectedComm.parentResponse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="Type your reply..."
                  />
                  <button
                    onClick={() => replyMutation.mutate({ communicationId: selectedComm.id, message: replyMessage })}
                    disabled={!replyMessage || replyMutation.isLoading}
                    className="btn-primary mt-3 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Communications
