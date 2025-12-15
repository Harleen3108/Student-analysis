import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import toast from 'react-hot-toast'

const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm()

  const selectedRole = watch('role')

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      toast.success('User added successfully!')
      reset()
      onClose()
    } catch (error) {
      toast.error('Failed to add user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="input"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="input"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="input"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              {...register('phone', { 
                required: 'Phone is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone must be 10 digits'
                }
              })}
              className="input"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="input"
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="counselor">Counselor</option>
              <option value="parent">Parent</option>
            </select>
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
                }
              })}
              type="password"
              className="input"
              placeholder="Enter password (e.g., Admin123)"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must contain: lowercase, uppercase, and number
            </p>
          </div>

          {/* Role-specific fields */}
          {selectedRole === 'teacher' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects (comma-separated)
                </label>
                <input
                  {...register('subjects')}
                  className="input"
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Classes
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {['9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'].map((className) => (
                    <label key={className} className="flex items-center">
                      <input
                        type="checkbox"
                        value={className}
                        {...register('assignedClasses')}
                        className="mr-2"
                      />
                      <span className="text-sm">Class {className}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select classes this teacher will handle</p>
              </div>
            </>
          )}

          {selectedRole === 'counselor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                {...register('specialization')}
                className="input"
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="career">Career</option>
              </select>
            </div>
          )}

          {selectedRole === 'parent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Roll Numbers (comma-separated)
              </label>
              <input
                {...register('childrenRollNumbers')}
                className="input"
                placeholder="e.g., ST001, ST002"
              />
              <p className="text-xs text-gray-500 mt-1">Enter roll numbers of children</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-outline flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddUserModal