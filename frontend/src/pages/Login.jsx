import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  // Navigate when user becomes authenticated
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, redirecting...', user.role)
      const redirectPath = user.role === 'teacher' ? '/teacher' : '/'
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('🔐 Submitting login form with:', data)
      const result = await login(data)
      console.log('🔐 Login result:', result)
      console.log('🔐 Current user state after login:', user)
      
      if (result && result.success) {
        console.log('✅ Login successful, navigating immediately...')
        const userData = result.user
        const redirectPath = userData.role === 'teacher' ? '/teacher' : '/'
        console.log('🔐 Navigating to:', redirectPath, 'for role:', userData.role)
        navigate(redirectPath, { replace: true })
      } else {
        console.log('❌ Login failed:', result)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-full">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to the Student Dropout Analysis System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Username/Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Username is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  placeholder="Enter your username"
                  className="input"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 text-center font-medium">
                Demo Login Credentials:
              </p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-700">
                    <div className="font-medium">Admin:</div>
                    <div className="font-mono text-xs">admin@school.com / admin123</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[type="email"]').value = 'admin@school.com'
                      document.querySelector('input[type="password"]').value = 'admin123'
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition-colors"
                  >
                    Fill
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-700">
                    <div className="font-medium">Teacher:</div>
                    <div className="font-mono text-xs">teacher@school.com / teacher123</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[type="email"]').value = 'teacher@school.com'
                      document.querySelector('input[type="password"]').value = 'teacher123'
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition-colors"
                  >
                    Fill
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login