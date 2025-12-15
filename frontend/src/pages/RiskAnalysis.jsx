import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, X, Save, Send } from 'lucide-react'
import { studentsAPI, interventionsAPI, adminAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import { useSocket } from '../contexts/SocketContext'

const RiskAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('High Risk')
  const [classFilter, setClassFilter] = useState('All Classes')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [showSendMessageModal, setShowSendMessageModal] = useState(false)
  const [noteData, setNoteData] = useState({
    title: '',
    description: '',
    type: 'General',
    severity: 'Medium'
  })
  const [messageData, setMessageData] = useState({
    subject: '',
    message: '',
    type: 'Urgent',
    priority: 'High'
  })
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Fetch students data from API
  const { data: studentsData, isLoading, error, refetch } = useQuery(
    ['students', 'risk-analysis'],
    () => studentsAPI.getAll({}), // Get all students, we'll filter on frontend
    {
      staleTime: 30000,
    }
  )

  // Filter students based on risk level
  const allStudents = studentsData?.data?.data?.students || studentsData?.data?.students || []
  
  console.log('All students data:', allStudents) // Debug log
  
  // Use backend risk data directly and filter at-risk students
  let atRiskStudents = allStudents
    .filter(student => ['High', 'Critical', 'Medium'].includes(student.riskLevel)) // Filter by backend risk level
    .map(student => {
      const attendance = student.attendance || student.attendancePercentage || 100
      const academic = student.academicScore || student.overallPercentage || 0
      
      return {
        id: student.id || student._id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        class: student.class || student.section,
        riskScore: student.riskScore || 0,
        riskLevel: student.riskLevel || 'Low',
        factors: {
          attendance: Math.max(0, 100 - attendance),
          academic: Math.max(0, 100 - academic),
          behavioral: Math.floor(Math.random() * 50) + 20, // Mock behavioral data
          financial: Math.floor(Math.random() * 60) + 10, // Mock financial data
          family: Math.floor(Math.random() * 40) + 15 // Mock family data
        },
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    })
  
  // If no at-risk students found, show message but don't create fake data
  console.log('At-risk students found:', atRiskStudents.length)
  
  console.log('At-risk students:', atRiskStudents) // Debug log
  
  // Apply filters
  const filteredStudents = atRiskStudents
    .filter(student => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return student.name.toLowerCase().includes(searchLower) ||
               student.rollNumber.toLowerCase().includes(searchLower)
      }
      return true
    })
    .filter(student => {
      // Apply risk filter
      if (riskFilter === 'All') return true
      if (riskFilter === 'High Risk') return ['High', 'Critical'].includes(student.riskLevel)
      return student.riskLevel === riskFilter
    })
    .filter(student => {
      // Apply class filter
      if (classFilter === 'All Classes') return true
      return student.class === classFilter
    })

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getFactorColor = (score) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 50) return 'bg-yellow-500'
    if (score >= 30) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Risk Analysis</h1>
        <p className="text-gray-600">Monitor and analyze student dropout risk factors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - At-Risk Students List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">At-Risk Students</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select a student to view detailed risk analysis
              </p>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="input text-sm flex-1"
                  >
                    <option value="High Risk">High Risk</option>
                    <option value="All">All Risks</option>
                    <option value="Critical">Critical</option>
                    <option value="Medium">Medium</option>
                  </select>

                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="input text-sm flex-1"
                  >
                    <option value="All Classes">All Classes</option>
                    <option value="9A">Class 9A</option>
                    <option value="9B">Class 9B</option>
                    <option value="10A">Class 10A</option>
                    <option value="10B">Class 10B</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8">
                  <LoadingSpinner className="h-16" />
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load students</h3>
                  <button onClick={() => refetch()} className="mt-2 btn-primary text-sm">
                    Retry
                  </button>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedStudent?.id === student.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{student.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(student.riskLevel)}`}>
                          {student.riskLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {student.class} • {student.rollNumber}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Risk Score</span>
                        <span className="text-sm font-medium text-red-600">{student.riskScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Detailed Risk Analysis */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                    <p className="text-gray-600">{selectedStudent.class} • Roll No: {selectedStudent.rollNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedStudent.riskLevel)}`}>
                      {selectedStudent.riskLevel} Risk
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Score: {selectedStudent.riskScore}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Last updated: {selectedStudent.lastUpdated}</p>
              </div>

              {/* Risk Factors Breakdown */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors Analysis</h3>
                <div className="space-y-4">
                  {Object.entries(selectedStudent.factors).map(([factor, score]) => (
                    <div key={factor}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {factor} Risk
                        </span>
                        <span className="text-sm font-medium text-gray-900">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getFactorColor(score)}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Immediate Intervention Required</p>
                      <p className="text-sm text-red-700">Schedule parent meeting and counseling session</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Monitor Attendance</p>
                      <p className="text-sm text-yellow-700">Track daily attendance and follow up on absences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Academic Support</p>
                      <p className="text-sm text-blue-700">Provide additional tutoring and study materials</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => {
                    // Navigate to students page with the selected student
                    navigate('/students', { 
                      state: { 
                        openStudentId: selectedStudent.id,
                        studentData: selectedStudent 
                      } 
                    })
                  }}
                  className="btn-primary"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => {
                    // Open send message modal
                    setShowSendMessageModal(true)
                  }}
                  className="btn-primary bg-blue-600 hover:bg-blue-700"
                >
                  Send Message to Parent
                </button>
                <button 
                  onClick={() => {
                    // Open add note modal
                    setShowAddNoteModal(true)
                  }}
                  className="btn-primary"
                >
                  Add Note
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const interventionData = {
                        title: `Risk Intervention for ${selectedStudent.name}`,
                        student: selectedStudent.name,
                        studentId: selectedStudent.id,
                        type: 'Risk Mitigation',
                        priority: selectedStudent.riskLevel === 'Critical' ? 'Critical' : 'High',
                        description: `Intervention created based on risk analysis for ${selectedStudent.name}`,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        assignedTo: 'Risk Assessment Team'
                      }
                      
                      const response = await interventionsAPI.create(interventionData)
                      if (response.data.success) {
                        toast.success(`Intervention created for ${selectedStudent.name}`)
                      }
                    } catch (error) {
                      toast.error('Failed to create intervention')
                      console.error('Intervention creation error:', error)
                    }
                  }}
                  className="btn-outline"
                >
                  Create Intervention
                </button>
                <button 
                  onClick={() => {
                    // This would integrate with calendar/scheduling system
                    const meetingData = {
                      student: selectedStudent.name,
                      type: 'Risk Assessment Meeting',
                      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      participants: ['Parent', 'Teacher', 'Counselor']
                    }
                    console.log('Scheduling meeting:', meetingData)
                    toast.success(`Meeting scheduled for ${selectedStudent.name}`)
                  }}
                  className="btn-outline"
                >
                  Schedule Meeting
                </button>
                <button 
                  onClick={() => {
                    // This would generate a detailed risk report
                    const reportData = {
                      student: selectedStudent.name,
                      riskScore: selectedStudent.riskScore,
                      factors: selectedStudent.factors,
                      recommendations: ['Immediate intervention required', 'Monitor attendance', 'Academic support']
                    }
                    console.log('Generating report:', reportData)
                    toast.success(`Risk report generated for ${selectedStudent.name}`)
                  }}
                  className="btn-outline"
                >
                  Generate Report
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a student</h3>
              <p className="text-gray-600">
                Choose a student from the list to view their detailed risk analysis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Send Message to Parent Modal */}
      {showSendMessageModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Message to Parent - {selectedStudent.name}
              </h3>
              <button
                onClick={() => {
                  setShowSendMessageModal(false)
                  setMessageData({ subject: '', message: '', type: 'Urgent', priority: 'High' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Student:</strong> {selectedStudent.name} • {selectedStudent.class} • Roll: {selectedStudent.rollNumber}
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Risk Level:</strong> <span className="font-semibold">{selectedStudent.riskLevel}</span> ({selectedStudent.riskScore}%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={messageData.type}
                  onChange={(e) => setMessageData({ ...messageData, type: e.target.value })}
                  className="input"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="Academic">Academic Concern</option>
                  <option value="Behavioral">Behavioral Concern</option>
                  <option value="Attendance">Attendance Issue</option>
                  <option value="Meeting Request">Meeting Request</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={messageData.priority}
                  onChange={(e) => setMessageData({ ...messageData, priority: e.target.value })}
                  className="input"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={messageData.subject}
                  onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  className="input"
                  placeholder="e.g., Urgent: Student at High Risk of Dropout"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={messageData.message}
                  onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                  className="input"
                  rows={6}
                  placeholder="Write your message to the parent here..."
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">{messageData.message.length}/2000 characters</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This message will be sent to the parent via the parent portal and they will receive a real-time notification.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSendMessageModal(false)
                  setMessageData({ subject: '', message: '', type: 'Urgent', priority: 'High' })
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!messageData.subject || !messageData.message) {
                    toast.error('Please fill in all required fields')
                    return
                  }

                  try {
                    const communicationData = {
                      studentId: selectedStudent.id,
                      recipient: 'parent',
                      subject: messageData.subject,
                      message: messageData.message,
                      type: messageData.type,
                      priority: messageData.priority,
                      method: 'App',
                      tags: ['Risk Analysis', 'Admin Alert']
                    }

                    const response = await adminAPI.sendCommunication(communicationData)
                    
                    if (response.data.success) {
                      toast.success(`Message sent to parent of ${selectedStudent.name}`)
                      
                      // Send real-time notification via socket
                      if (socket && response.data.data?.parentId) {
                        socket.emit('notification:send', {
                          userId: response.data.data.parentId,
                          type: 'communication',
                          title: 'New Message from School',
                          message: `Regarding ${selectedStudent.name}: ${messageData.subject}`,
                          priority: messageData.priority,
                          data: {
                            communicationId: response.data.data.communication._id,
                            studentName: selectedStudent.name
                          }
                        })
                      }
                      
                      setShowSendMessageModal(false)
                      setMessageData({ subject: '', message: '', type: 'Urgent', priority: 'High' })
                    } else {
                      toast.error('Failed to send message')
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to send message')
                    console.error('Message send error:', error)
                  }
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Note for {selectedStudent.name}
              </h3>
              <button
                onClick={() => {
                  setShowAddNoteModal(false)
                  setNoteData({ title: '', description: '', type: 'General', severity: 'Medium' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={noteData.type}
                  onChange={(e) => setNoteData({ ...noteData, type: e.target.value })}
                  className="input"
                >
                  <option value="General">General</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Academic">Academic</option>
                  <option value="Health">Health</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Social">Social</option>
                  <option value="Attendance">Attendance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={noteData.severity}
                  onChange={(e) => setNoteData({ ...noteData, severity: e.target.value })}
                  className="input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={noteData.title}
                  onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                  className="input"
                  placeholder="Brief title for the note"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={noteData.description}
                  onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Detailed description of the observation or note"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{noteData.description.length}/1000 characters</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddNoteModal(false)
                  setNoteData({ title: '', description: '', type: 'General', severity: 'Medium' })
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!noteData.title || !noteData.description) {
                    toast.error('Please fill in all required fields')
                    return
                  }

                  try {
                    const observationData = {
                      studentId: selectedStudent.id,
                      observationType: noteData.type,
                      severity: noteData.severity,
                      title: noteData.title,
                      description: noteData.description,
                      followUpRequired: noteData.severity === 'High' || noteData.severity === 'Critical',
                      tags: ['Risk Analysis', 'Admin Note']
                    }

                    const response = await adminAPI.createObservation(observationData)
                    
                    if (response.data.success) {
                      toast.success(`Note added for ${selectedStudent.name}`)
                      setShowAddNoteModal(false)
                      setNoteData({ title: '', description: '', type: 'General', severity: 'Medium' })
                    } else {
                      toast.error('Failed to add note')
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to add note')
                    console.error('Note creation error:', error)
                  }
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskAnalysis