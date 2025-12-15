import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'

const CreateInterventionModal = ({ isOpen, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm()

  // Fetch students for selection
  const { data: studentsData } = useQuery(
    'students-for-intervention',
    () => studentsAPI.getAll({}),
    {
      enabled: isOpen,
    }
  )

  const students = studentsData?.data?.data?.students || studentsData?.data?.students || []

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    try {
      const selectedStudent = students.find(s => (s.id || s._id) === data.studentId)
      const interventionData = {
        ...data,
        student: selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Unknown Student',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: data.assignedTo || 'Support Team'
      }
      
      await onSubmit(interventionData)
      reset()
      onClose()
    } catch (error) {
      toast.error('Failed to create intervention')
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
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Intervention</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Enter intervention title"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              {...register('studentId', { required: 'Student selection is required' })}
              className="input"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id || student._id} value={student.id || student._id}>
                  {student.firstName} {student.lastName} - {student.rollNumber}
                </option>
              ))}
            </select>
            {errors.studentId && (
              <p className="text-red-600 text-sm mt-1">{errors.studentId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              {...register('type', { required: 'Type is required' })}
              className="input"
            >
              <option value="">Select intervention type</option>
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
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="input"
            >
              <option value="">Select priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            {errors.priority && (
              <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              className="input"
              rows="3"
              placeholder="Describe the intervention plan and objectives"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                {...register('startDate')}
                type="date"
                className="input"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                {...register('endDate')}
                type="date"
                className="input"
                defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <input
              {...register('assignedTo')}
              className="input"
              placeholder="Enter assigned counselor/teacher name"
              defaultValue="Support Team"
            />
          </div>

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
              {isLoading ? 'Creating...' : 'Create Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateInterventionModal