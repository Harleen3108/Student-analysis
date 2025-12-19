import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Users, Wifi, WifiOff, MoreVertical } from 'lucide-react'
import { studentsAPI } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { useTheme } from '../contexts/ThemeContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Avatar from '../components/UI/Avatar'
import AddStudentModal from '../components/Modals/AddStudentModal'
import EditStudentModal from '../components/Modals/EditStudentModal'
import StudentDetailsModal from '../components/Modals/StudentDetailsModal'
import BulkUploadModal from '../components/Modals/BulkUploadModal'
import toast from 'react-hot-toast'

const Students = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('All')
  const [filterRisk, setFilterRisk] = useState('All Risks')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [openActionMenuId, setOpenActionMenuId] = useState(null)
  const { isDark } = useTheme()
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket()
  const menuRef = useRef(null)

  const { data: studentsData, isLoading, error, refetch } = useQuery(
    ['students', searchTerm, filterClass, filterRisk],
    () => {
      const params = {
        search: searchTerm || undefined,
        class: filterClass !== 'All' ? filterClass : undefined,
        riskLevel: filterRisk !== 'All Risks' ? filterRisk : undefined
      }
      return studentsAPI.getAll(params)
    },
    {
      staleTime: 30000,
      cacheTime: 300000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        console.log('✅ Students loaded:', data?.data?.data?.students?.length || 0)
      }
    }
  )

  let students = []
  if (studentsData?.data?.data?.students) {
    students = studentsData.data.data.students
  } else if (studentsData?.data?.students) {
    students = studentsData.data.students
  }

  // Handle navigation from Risk Analysis page
  useEffect(() => {
    if (location.state?.openStudentId && students.length > 0) {
      const studentToOpen = students.find(s => s.id === location.state.openStudentId || s._id === location.state.openStudentId)
      if (studentToOpen) {
        setSelectedStudent(studentToOpen)
        setIsDetailsModalOpen(true)
        // Clear the location state to prevent reopening on refresh
        window.history.replaceState({}, document.title)
      } else if (location.state?.studentData) {
        // Use the student data passed from Risk Analysis if student not found in list
        setSelectedStudent(location.state.studentData)
        setIsDetailsModalOpen(true)
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, students])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleStudentCreated = (data) => {
      console.log('🎉 Socket: student:created', data)
      queryClient.invalidateQueries(['students'])
      toast.success(`${data.firstName} ${data.lastName} added!`, { icon: '👨‍🎓', duration: 3000 })
    }

    const handleStudentUpdated = (data) => {
      queryClient.invalidateQueries(['students'])
    }

    const handleStudentDeleted = (data) => {
      queryClient.invalidateQueries(['students'])
      toast.success('Student removed', { icon: '🗑️' })
    }

    socket.on('student:created', handleStudentCreated)
    socket.on('student:updated', handleStudentUpdated)
    socket.on('student:deleted', handleStudentDeleted)

    return () => {
      socket.off('student:created', handleStudentCreated)
      socket.off('student:updated', handleStudentUpdated)
      socket.off('student:deleted', handleStudentDeleted)
    }
  }, [socket, isConnected, queryClient])

  const handleAddStudent = async (studentData) => {
    try {
      const response = await studentsAPI.create(studentData)
      if (response.data.success) {
        setIsAddModalOpen(false)
        toast.success('Student added successfully!', { icon: '✅', duration: 3000 })
        await new Promise(resolve => setTimeout(resolve, 500))
        queryClient.invalidateQueries(['students'])
        await refetch()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student')
      throw error
    }
  }

  const handleViewStudent = (student) => {
    // Navigate to the student profile page
    navigate(`/students/${student._id || student.id}`)
  }

  const handleEditStudent = (student) => {
    console.log('🔧 Edit button clicked for student:', student)
    setSelectedStudent(student)
    setIsEditModalOpen(true)
    toast.success(`Opening edit form for ${student.firstName} ${student.lastName}`)
  }

  const handleUpdateStudent = async (studentId, studentData) => {
    try {
      console.log('📝 Updating student:', studentId, studentData)
      const response = await studentsAPI.update(studentId, studentData)
      console.log('✅ Update response:', response.data)
      
      if (response.data.success) {
        toast.success('Student updated successfully!')
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('student:updated', response.data.data)
          console.log('📡 Socket event emitted: student:updated')
        }
        
        queryClient.invalidateQueries(['students'])
        await refetch()
        setIsEditModalOpen(false)
        setSelectedStudent(null)
      }
    } catch (error) {
      console.error('❌ Update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update student')
      throw error
    }
  }

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      try {
        await studentsAPI.delete(student.id)
        toast.success('Student deleted successfully!')
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('student:deleted', {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`
          })
        }
        
        queryClient.invalidateQueries(['students'])
        await refetch()
      } catch (error) {
        toast.error('Failed to delete student')
        console.error('Delete error:', error)
      }
    }
  }

  const handleBulkUpload = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await studentsAPI.bulkUpload(formData)
      if (response.data.success) {
        toast.success(`${response.data.data.successCount} students uploaded successfully!`)
        
        // Refresh data
        queryClient.invalidateQueries(['students'])
        queryClient.invalidateQueries(['analytics'])
        await refetch()
        
        setIsBulkUploadModalOpen(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk upload failed')
      throw error
    }
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const toggleSelectAll = () => {
    if (!students || students.length === 0) return
    const allIds = students.map((s) => s.id)
    const allSelected = allIds.every((id) => selectedStudentIds.includes(id))
    if (allSelected) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(allIds)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('No students selected')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedStudentIds.length} selected student(s)?`
    )
    if (!confirmed) return

    try {
      for (const id of selectedStudentIds) {
        await studentsAPI.delete(id)
      }
      toast.success('Selected students deleted successfully!')
      setSelectedStudentIds([])
      queryClient.invalidateQueries(['students'])
      await refetch()
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete some selected students')
    }
  }

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-red-100 text-red-800'
      case 'Critical': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load students</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage student records and monitor their progress</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? <><Wifi className="w-3 h-3" />Live</> : <><WifiOff className="w-3 h-3" />Offline</>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsBulkUploadModalOpen(true)} className="btn-outline flex items-center gap-2">
              <Users className="w-4 h-4" />Bulk Upload
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 border border-gray-300"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input">
              <option value="All">All Classes</option>
              <option value="9A">Class 9A</option>
              <option value="9B">Class 9B</option>
              <option value="10A">Class 10A</option>
              <option value="10B">Class 10B</option>
              <option value="11A">Class 11A</option>
              <option value="11B">Class 11B</option>
            </select>
          </div>
          <div className="sm:w-48">
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="input">
              <option value="All Risks">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>
          <button onClick={() => { toast.success('Refreshing...'); refetch(); }} className="btn-outline flex items-center gap-2">
            <Filter className="w-4 h-4" />Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <h3 className="text-lg font-medium text-gray-900">Student List</h3>
            <span className="text-sm text-gray-500">{students.length} students</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedStudentIds.length > 0 && (
              <span className="text-xs text-gray-600">
                {selectedStudentIds.length} selected
              </span>
            )}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedStudentIds.length === 0}
              className={`text-xs px-3 py-1 rounded border ${
                selectedStudentIds.length === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-red-200 text-red-600 hover:bg-red-50'
              }`}
            >
              Delete Selected
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first student.</p>
            <div className="mt-6">
              <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />Add Student
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      onChange={toggleSelectAll}
                      checked={
                        students.length > 0 &&
                        students.every((s) => selectedStudentIds.includes(s.id))
                      }
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Avatar
                            src={student.photo}
                            firstName={student.firstName}
                            lastName={student.lastName}
                            size="sm"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500">Roll No: {student.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${student.attendance}%` }}></div>
                        </div>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.academicScore}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(student.riskLevel)}`}>
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center relative w-12">
                      <button
                        onClick={() =>
                          setOpenActionMenuId(
                            openActionMenuId === student.id ? null : student.id
                          )
                        }
                        className={`inline-flex items-center justify-center w-8 h-8 mx-auto rounded-full focus:outline-none ${
                          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {openActionMenuId === student.id && (
                        <div
                          className={`absolute right-0 mt-2 w-36 rounded-md shadow-lg z-20 border flex flex-col overflow-hidden ${
                            isDark
                              ? 'bg-gray-900 border-gray-700'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => {
                              handleViewStudent(student)
                              setOpenActionMenuId(null)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              isDark
                                ? 'text-gray-100 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              handleEditStudent(student)
                              setOpenActionMenuId(null)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              isDark
                                ? 'text-gray-100 hover:bg-gray-800'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteStudent(student)
                              setOpenActionMenuId(null)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              isDark
                                ? 'text-red-400 hover:bg-gray-800'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddStudent} />

      <EditStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedStudent(null)
        }} 
        onSubmit={handleUpdateStudent}
        student={selectedStudent}
      />

      <StudentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEdit={handleEditStudent}
      />

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSubmit={handleBulkUpload}
      />
    </div>
  )
}

export default Students