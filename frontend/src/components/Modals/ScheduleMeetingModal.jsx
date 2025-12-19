import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Users, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ScheduleMeetingModal = ({ isOpen, onClose, onSubmit, student, organizer }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: 'Risk Assessment',
    scheduledDate: '',
    scheduledTime: '',
    duration: 30,
    location: 'School Conference Room',
    locationType: 'In-Person',
    meetingLink: '',
    priority: 'Normal',
    agenda: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && student) {
      // Pre-fill title based on student
      setFormData(prev => ({
        ...prev,
        title: `Parent Meeting - ${student.name}`,
        description: `Meeting to discuss ${student.name}'s academic progress and risk factors`,
      }))
    }
  }, [isOpen, student])

  const topicOptions = [
    'Academic Performance',
    'Attendance Issues',
    'Behavioral Concerns',
    'Risk Assessment',
    'Financial Assistance',
    'Health Issues',
    'General Discussion',
    'Intervention Planning',
    'Progress Review',
    'Other'
  ]

  const locationTypes = [
    'In-Person',
    'Online',
    'Phone Call'
  ]

  const priorityLevels = [
    'Low',
    'Normal',
    'High',
    'Urgent'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Date is required'
    } else {
      const selectedDate = new Date(formData.scheduledDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Date cannot be in the past'
      }
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Time is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (formData.locationType === 'Online' && !formData.meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required for online meetings'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        ...formData,
        studentId: student.id,
      })
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        topic: 'Risk Assessment',
        scheduledDate: '',
        scheduledTime: '',
        duration: 30,
        location: 'School Conference Room',
        locationType: 'In-Person',
        meetingLink: '',
        priority: 'Normal',
        agenda: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Meeting scheduling error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      topic: 'Risk Assessment',
      scheduledDate: '',
      scheduledTime: '',
      duration: 30,
      location: 'School Conference Room',
      locationType: 'In-Person',
      meetingLink: '',
      priority: 'Normal',
      agenda: '',
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schedule Parent Meeting</h3>
            {student && (
              <p className="text-sm text-gray-600 mt-1">
                Student: {student.name} • {student.class} • Roll: {student.rollNumber}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info Banner */}
          {student && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Meeting Details</p>
                  <p className="text-sm text-blue-700 mt-1">
                    This meeting will be scheduled with the parents of <strong>{student.name}</strong>.
                    They will receive a notification with all meeting details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Information
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g., Parent Meeting - Academic Discussion"
                maxLength={200}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <select
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="input"
              >
                {topicOptions.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`input ${errors.description ? 'border-red-500' : ''}`}
                rows={3}
                placeholder="Describe the purpose and main points of discussion for this meeting"
                maxLength={1000}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input"
              >
                {priorityLevels.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`input ${errors.scheduledDate ? 'border-red-500' : ''}`}
                />
                {errors.scheduledDate && <p className="text-xs text-red-500 mt-1">{errors.scheduledDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className={`input ${errors.scheduledTime ? 'border-red-500' : ''}`}
                />
                {errors.scheduledTime && <p className="text-xs text-red-500 mt-1">{errors.scheduledTime}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Type
              </label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className="input"
              >
                {locationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Details <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`input ${errors.location ? 'border-red-500' : ''}`}
                placeholder={
                  formData.locationType === 'In-Person' 
                    ? 'e.g., School Conference Room, Principal Office'
                    : formData.locationType === 'Online'
                    ? 'e.g., Zoom, Google Meet'
                    : 'Phone number or contact details'
                }
              />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>

            {formData.locationType === 'Online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  className={`input ${errors.meetingLink ? 'border-red-500' : ''}`}
                  placeholder="https://zoom.us/j/..."
                />
                {errors.meetingLink && <p className="text-xs text-red-500 mt-1">{errors.meetingLink}</p>}
              </div>
            )}
          </div>

          {/* Agenda */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Meeting Agenda (Optional)
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda / Discussion Points
              </label>
              <textarea
                name="agenda"
                value={formData.agenda}
                onChange={handleChange}
                className="input"
                rows={4}
                placeholder="List the main points to be discussed in the meeting..."
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.agenda.length}/2000 characters</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleMeetingModal
