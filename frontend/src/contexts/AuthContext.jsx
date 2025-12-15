import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user data
      authAPI.getProfile()
        .then(response => {
          console.log('Profile response:', response.data) // Debug log
          if (response.data.success || response.data.status === 'success') {
            setUser(response.data.user)
          } else {
            localStorage.removeItem('token')
          }
        })
        .catch((error) => {
          console.error('Profile error:', error) // Debug log
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials) // Debug log
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data) // Debug log
      
      if (response.data.success || response.data.status === 'success') {
        const { token, user: userData } = response.data
        console.log('Setting token and user:', { token: token.substring(0, 20) + '...', user: userData }) // Debug log
        localStorage.setItem('token', token)
        setUser(userData)
        toast.success('Login successful!')
        return { success: true, user: userData }
      } else {
        console.log('Login failed:', response.data) // Debug log
        toast.error(response.data.message || 'Login failed')
        return { success: false, error: response.data.message }
      }
    } catch (error) {
      console.error('Login error:', error) // Debug log
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}