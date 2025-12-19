import { useState, useEffect } from 'react'
import { X, Upload, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Avatar from '../UI/Avatar'

const EditStudentModal = ({ isOpen, onClose, onSubmit, student }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  
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
      setValue('firstName', student.firstName || '')
      setValue('lastName', student.lastName || '')
      setValue('middleName', student.middleName || '')
      setValue('rollNumber', student.rollNumber || '')
      setValue('section', student.section || student.class || '')
      setValue('email', student.email || '')
      setValue('phone', student.phone || '')
      setValue('attendancePercentage', student.attendancePercentage || student.attendance || 0)
      setValue('overallPercentage', student.overallPercentage || student.academicScore || 0)
      
      // Set image preview if student has a photo (but don't set imageFile - that's only for new uploads)
      if (student.photo) {
        const photoUrl = typeof student.photo === 'object' && student.photo?.url ? student.photo.url : student.photo
        setImagePreview(photoUrl)
      } else {
        setImagePreview(null)
      }
      setImageFile(null) // Reset to null so we know if a new file was selected
    }
  }, [isOpen, student, setValue])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      setImageFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('📝 Edit form data:', data)
      console.log('📝 Image file:', imageFile)
      console.log('📝 Image preview exists:', !!imagePreview)
      
      // Prepare update data
      const updateData = {
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
        middleName: data.middleName?.trim() || undefined,
        rollNumber: data.rollNumber?.trim(),
        section: data.section?.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        attendancePercentage: data.attendancePercentage ? Number(data.attendancePercentage) : undefined,
        overallPercentage: data.overallPercentage ? Number(data.overallPercentage) : undefined,
      }
      
      // Only send photo if a new image file was uploaded
      if (imageFile && imagePreview) {
        updateData.photo = imagePreview
        console.log('📝 Including new photo in update')
      }
      
      console.log('📝 Final update data:', { ...updateData, photo: updateData.photo ? '[BASE64 IMAGE]' : 'NOT INCLUDED' })
      
      await onSubmit(student.id, updateData)
      toast.success('Student updated successfully!')
      reset()
      setImagePreview(null)
      setImageFile(null)
      onClose()
    } catch (error) {
      console.error('❌ Update error:', error)
      console.error('❌ Error response:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update student'
      toast.error(errorMessage)
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
          {/* Profile Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <Avatar
                    src={student.photo}
                    firstName={student.firstName}
                    lastName={student.lastName}
                    size="2xl"
                  />
                )}
              </div>
              <div>
                <label className="btn-outline cursor-pointer flex items-center gap-2 inline-flex">
                  <Upload className="w-4 h-4" />
                  {imageFile ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      // Restore original photo preview
                      if (student.photo) {
                        const photoUrl = typeof student.photo === 'object' && student.photo?.url ? student.photo.url : student.photo
                        setImagePreview(photoUrl)
                      } else {
                        setImagePreview(null)
                      }
                    }}
                    className="block text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Cancel
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG accepted.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="input"
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                {...register('middleName')}
                className="input"
                placeholder="Middle name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="input"
                placeholder="Last name"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class/Section *
            </label>
            <select
              {...register('section', { required: 'Class/Section is required' })}
              className="input"
            >
              <option value="">Select class/section</option>
              <option value="9A">Class 9-A</option>
              <option value="9B">Class 9-B</option>
              <option value="9C">Class 9-C</option>
              <option value="10A">Class 10-A</option>
              <option value="10B">Class 10-B</option>
              <option value="10C">Class 10-C</option>
              <option value="11A">Class 11-A</option>
              <option value="11B">Class 11-B</option>
              <option value="11C">Class 11-C</option>
              <option value="12A">Class 12-A</option>
              <option value="12B">Class 12-B</option>
              <option value="12C">Class 12-C</option>
            </select>
            {errors.section && (
              <p className="text-red-600 text-sm mt-1">{errors.section.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Format: Grade + Section (e.g., 11A for Class 11-A)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email', { 
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="input"
              placeholder="Enter email address (optional)"
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
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone must be 10 digits'
                }
              })}
              className="input"
              placeholder="Enter phone number (optional)"
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
                {...register('attendancePercentage', { 
                  min: { value: 0, message: 'Attendance cannot be negative' },
                  max: { value: 100, message: 'Attendance cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0-100"
                min="0"
                max="100"
              />
              {errors.attendancePercentage && (
                <p className="text-red-600 text-sm mt-1">{errors.attendancePercentage.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Score (%)
              </label>
              <input
                {...register('overallPercentage', { 
                  min: { value: 0, message: 'Score cannot be negative' },
                  max: { value: 100, message: 'Score cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0-100"
                min="0"
                max="100"
              />
              {errors.overallPercentage && (
                <p className="text-red-600 text-sm mt-1">{errors.overallPercentage.message}</p>
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