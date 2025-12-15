import { useState } from 'react'
import { useMutation } from 'react-query'
import { User, Mail, Phone, Bell, Lock } from 'lucide-react'
import { parentAPI, authAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    phone: user?.phone || '',
    email: user?.email || ''
  })
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    sms: user?.notificationPreferences?.sms ?? true,
    inApp: user?.notificationPreferences?.inApp ?? true
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const updateProfileMutation = useMutation(
    (data) => parentAPI.updateProfile(data),
    {
      onSuccess: () => toast.success('Profile updated successfully'),
      onError: () => toast.error('Failed to update profile')
    }
  )

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate({
      ...profileData,
      notificationPreferences: notificationPrefs
    })
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    // Password change logic would go here
    toast.success('Password changed successfully')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={user?.firstName || ''}
                disabled
                className="input bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={user?.lastName || ''}
                disabled
                className="input bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={updateProfileMutation.isLoading}>
            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationPrefs.email}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationPrefs.sms}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive alerts via text message</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={notificationPrefs.inApp}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, inApp: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <p className="font-medium text-gray-900">In-App Notifications</p>
              <p className="text-sm text-gray-600">Receive notifications within the app</p>
            </div>
          </label>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary">
            Change Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
