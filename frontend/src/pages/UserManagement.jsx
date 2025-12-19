import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Search, Filter, Plus, Users, Shield, Edit, Trash2, UserCheck, Eye, MoreVertical } from 'lucide-react'
import { usersAPI, analyticsAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import Avatar from '../components/UI/Avatar'
import AddUserModal from '../components/Modals/AddUserModal'
import UserDetailsModal from '../components/Modals/UserDetailsModal'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)
  const menuRef = useRef(null)
  const queryClient = useQueryClient()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: usersData, isLoading, error, refetch } = useQuery(
    ['users', searchTerm, filterRole],
    () => {
      const params = {
        search: searchTerm || undefined,
        role: filterRole !== 'All' ? filterRole : undefined,
      }
      return usersAPI.getAll(params)
    },
    {
      staleTime: 30000,
      refetchOnMount: true,
    }
  )

  // Get user statistics
  const { data: userStatsData } = useQuery(
    'userStats',
    () => analyticsAPI.getUserStats(),
    {
      staleTime: 60000,
      refetchOnMount: true,
    }
  )

  const users = usersData?.data?.data?.users || []
  const userStats = userStatsData?.data?.data || {}

  const handleAddUser = async (userData) => {
    try {
      const response = await usersAPI.create(userData)
      if (response.data.status === 'success') {
        toast.success('User added successfully!')
        queryClient.invalidateQueries(['users'])
        queryClient.invalidateQueries(['userStats'])
        setIsAddModalOpen(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add user')
      throw error
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await usersAPI.updateStatus(userId, !currentStatus)
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`)
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['userStats'])
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId, userName, userRole) => {
    if (userRole === 'admin') {
      toast.error('Cannot delete admin users')
      return
    }

    if (window.confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
      try {
        const response = await usersAPI.delete(userId)
        if (response.data.status === 'success') {
          toast.success('User deleted successfully!')
          queryClient.invalidateQueries(['users'])
          queryClient.invalidateQueries(['userStats'])
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete user'
        toast.error(errorMessage)
        console.error('Delete user error:', error)
      }
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'counselor': return 'bg-green-100 text-green-800'
      case 'parent': return 'bg-orange-100 text-orange-800'
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
          <p className="text-red-600 mb-2">Failed to load users</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users, roles, and permissions</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers || users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {userStats.activeUsers || 0} active • {userStats.inactiveUsers || 0} inactive
            </span>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-2xl font-bold text-blue-600">
                {userStats.roleStats?.teacher || users.filter(u => u.role === 'teacher').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Counselors</p>
              <p className="text-2xl font-bold text-green-600">
                {userStats.roleStats?.counselor || users.filter(u => u.role === 'counselor').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Parents</p>
              <p className="text-2xl font-bold text-orange-600">
                {userStats.roleStats?.parent || users.filter(u => u.role === 'parent').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchTerm(searchInput)
                  }
                }}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input"
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="counselor">Counselor</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <button 
            onClick={() => setSearchTerm(searchInput)}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button 
            onClick={() => refetch()}
            className="btn-outline flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Users</h3>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Avatar
                            src={user.photo}
                            firstName={user.firstName}
                            lastName={user.lastName}
                            size="sm"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.employeeId && `ID: ${user.employeeId}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{user.email}</div>
                        <div className="text-gray-500">{user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative" ref={openActionMenuId === (user._id || user.id) ? menuRef : null}>
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === (user._id || user.id) ? null : (user._id || user.id)
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {openActionMenuId === (user._id || user.id) && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedUserId(user._id || user.id)
                                  setIsDetailsModalOpen(true)
                                  setOpenActionMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  toast.info(`Edit functionality for ${user.firstName} ${user.lastName} - Coming soon!`)
                                  setOpenActionMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleStatus(user._id || user.id, user.isActive)
                                  setOpenActionMenuId(null)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                  user.isActive ? 'text-orange-600' : 'text-green-600'
                                }`}
                              >
                                <UserCheck className="w-4 h-4" />
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteUser(user._id || user.id, `${user.firstName} ${user.lastName}`, user.role)
                                  setOpenActionMenuId(null)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 ${
                                  user.role === 'admin'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600'
                                }`}
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
      />
    </div>
  )
}

export default UserManagement