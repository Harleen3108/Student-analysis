import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/UI/LoadingSpinner"
import loginIllustration from "../assets/login-illustration.jpg"

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Login useEffect - user:', user)
    if (user) {
      console.log('User detected, navigating based on role:', user.role)
      switch (user.role) {
        case "admin":
          console.log('Navigating to admin dashboard (/)')
          navigate("/", { replace: true })
          break
        case "teacher":
          console.log('Navigating to teacher dashboard')
          navigate("/teacher", { replace: true })
          break
        case "parent":
          console.log('Navigating to parent dashboard')
          navigate("/parent", { replace: true })
          break
        case "counselor":
          console.log('Navigating to counselor dashboard')
          navigate("/counselor", { replace: true })
          break
        default:
          console.log('Navigating to default route (/)')
          navigate("/", { replace: true })
      }
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
      const result = await login(data)
      console.log('Login result:', result)
      
      if (result && result.success) {
        // Login successful, navigation will happen via useEffect
        console.log('Login successful, waiting for redirect...')
      } else {
        console.log('Login failed:', result?.error)
      }
    } catch (err) {
      console.error("Login failed", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT – Illustration */}
        <div className="hidden lg:flex items-center justify-center bg-blue-50 p-12">
         <img
  src={loginIllustration}
  alt="Login Illustration"
  className="max-w-md w-full"
/>

        </div>

        {/* RIGHT – Login Form */}
        <div className="flex items-center justify-center p-10 sm:p-14">
          <div className="w-full max-w-md">

            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Login
              </h1>
              <p className="text-gray-500">
                Welcome back! Please enter your details
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", { required: "Password is required" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
