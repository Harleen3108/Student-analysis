import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, GraduationCap, TrendingUp, Users, AlertCircle, BarChart3, Moon, Sun } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({})
  
  const { login, user } = useAuth()
  const { isDark: darkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          navigate("/", { replace: true })
          break
        case "teacher":
          navigate("/teacher", { replace: true })
          break
        case "parent":
          navigate("/parent", { replace: true })
          break
        case "counselor":
          navigate("/counselor", { replace: true })
          break
        default:
          navigate("/", { replace: true })
      }
    }
  }, [user, navigate])



  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")
    const newErrors = {}

    if (!email) {
      newErrors.email = "Email is required"
    }
    if (!password) {
      newErrors.password = "Password is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await login({ email, password })
      
      if (!result || !result.success) {
        setLoginError("Invalid email or password. Please try again.")
      }
    } catch (err) {
      console.error("Login failed", err)
      setLoginError("Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen px-4 py-4 transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`} style={{ fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif" }}>
      
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Dropout</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Analysis System</p>
            </div>
          </div>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} shadow-md`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
            
            {/* Left Side - Information */}
            <div className="pl-4 pr-8 flex flex-col justify-between">
              
              {/* Header */}
              <div>
                <h1 className={`text-3xl sm:text-4xl font-bold mb-3 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Predict, Intervene,<br />Succeed
                </h1>
                <p className={`mb-6 text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Data-driven insights to identify at-risk students and improve retention rates through early intervention.
                </p>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`rounded-xl p-4 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="text-3xl font-bold mb-1 text-blue-600">85%</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</div>
                  </div>
                  <div className={`rounded-xl p-4 border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="text-3xl font-bold mb-1 text-blue-600">10K+</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Students Analyzed</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Predictive Analytics</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Machine learning algorithms identify at-risk students early</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Performance Tracking</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Real-time monitoring of academic and behavioral patterns</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Early Intervention</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automated alerts enable timely support and intervention</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Collaborative Tools</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connect teachers, counselors, and parents for student success</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-start">
              <div className="w-full max-w-md mx-auto">
                
                <div className="mb-2 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h2 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Welcome Back
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sign in to access your dashboard
                  </p>
                </div>

                <div className={`rounded-2xl shadow-2xl p-8 space-y-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  {/* Error Message */}
                  {loginError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{loginError}</span>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setLoginError("")
                        setErrors({...errors, email: ""})
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setLoginError("")
                          setErrors({...errors, password: ""})
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-4 flex items-center transition ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Forgot password */}
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                </div>

                <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>Secure • Confidential • Powered by ML</p>
                </div>
              </div>
            </div>

          </div>
      </div>
    </div>
  )
}

export default Login