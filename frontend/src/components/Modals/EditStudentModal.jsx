import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const EditStudentModal = ({ isOpen, onClose, onSubmit, student }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm()

  // Populate form with student data when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setValue('firstName', student.firstName)
      setValue('lastName', student.lastName)
      setValue('rollNumber', student.rollNumber)
      setValue('class', student.class)
      setValue('section', student.class) // Using class as section for now
      setValue('email', student.email)
      setValue('phone', student.phone)
      setValue('attendance', student.attendance)
      setValue('academicScore', student.academicScore)
    }
  }, [isOpen, student, setValue])

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSubmit(student.id, data)
      toast.success('Student updated successfully!')
      reset()
      onClose()
    } catch (error) {
      toast.error('Failed to update student')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
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
              Roll Number
            </label>
            <input
              {...register('rollNumber', { required: 'Roll number is required' })}
              className="input"
              placeholder="Enter roll number"
            />
            {errors.rollNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.rollNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                {...register('class', { required: 'Class is required' })}
                className="input"
              >
                <option value="">Select class</option>
                <option value="9A">Class 9A</option>
                <option value="9B">Class 9B</option>
                <option value="10A">Class 10A</option>
                <option value="10B">Class 10B</option>
                <option value="11A">Class 11A</option>
                <option value="11B">Class 11B</option>
              </select>
              {errors.class && (
                <p className="text-red-600 text-sm mt-1">{errors.class.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                {...register('section', { required: 'Section is required' })}
                className="input"
              >
                <option value="">Select section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
              {errors.section && (
                <p className="text-red-600 text-sm mt-1">{errors.section.message}</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendance (%)
              </label>
              <input
                {...register('attendance', { 
                  min: { value: 0, message: 'Attendance cannot be negative' },
                  max: { value: 100, message: 'Attendance cannot exceed 100%' }
                })}
                type="number"
                className="input"
                placeholder="Enter attendance percentage"
                min="0"
                max="100"
              />
              {errors.attendance && (
                <p className="text-red-600 text-sm mt-1">{errors.attendance.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Score (%)
              </label>
              <input
                {...register('academicScore', { 
                  min: { value: 0, message: 'Score cannot be negative' },
                  max: { value: 100, message: 'Score cannot exceed 100%' }
                })}
                type="number"
                className="input"
                placeholder="Enter academic percentage"
                min="0"
                max="100"
              />
              {errors.academicScore && (
                <p className="text-red-600 text-sm mt-1">{errors.academicScore.message}</p>
              )}
            </div>
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
              {isLoading ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditStudentModal