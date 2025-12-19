import React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { analyticsAPI } from '../services/api'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Dashboard = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    'dashboard',
    () => {
      console.log('🔄 Dashboard query executing...');
      return analyticsAPI.getDashboard();
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      onSuccess: (data) => {
        console.log('✅ Dashboard data received:', data);
      },
      onError: (error) => {
        console.error('❌ Dashboard error:', error);
      }
    }
  )

  const handleRefresh = () => {
    queryClient.invalidateQueries('dashboard')
    refetch()
  }

  if (isLoading) {
    return <LoadingSpinner className="h-64" />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const data = dashboardData?.data?.data || dashboardData?.data || {}
  const attendanceData = data.attendanceTrend || []
  const riskDistributionData = data.riskDistribution || []
  const classPerformanceData = data.classPerformance || []
  const highRiskStudents = data.highRiskStudents || []

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </div>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Refresh
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Generate Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.totalStudents?.toLocaleString() || '0'}</p>
            <p className="text-sm font-medium text-gray-600">Total Students</p>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-green-600 font-medium">↑ 5.2%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.atRiskStudents || '0'}</p>
            <p className="text-sm font-medium text-gray-600">At Risk Students</p>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-red-600 font-medium">+2</span>
              <span className="text-xs text-gray-500">from last week</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.activeInterventions || '0'}</p>
            <p className="text-sm font-medium text-gray-600">Active Interventions</p>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-green-600 font-medium">3 completed</span>
              <span className="text-xs text-gray-500">this week</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{data.averageAttendance || '0'}%</p>
            <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
            <div className="mt-3 flex items-center gap-1">
              <span className="text-xs text-green-600 font-medium">↑ 2.1%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Left: Charts, Right: Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT SIDE - Charts (8 columns) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Attendance Trend */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Attendance Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly attendance percentage over time</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Performance */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Class Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Average scores and attendance by class</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="class" 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="score" fill="#8B5CF6" name="Academic Score" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="attendance" fill="#10B981" name="Attendance %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution - Moved to bottom left */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Risk Distribution</h3>
              <p className="text-sm text-gray-500 mt-1">Student risk levels breakdown</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {riskDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{item.name}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (4 columns) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* High Risk Students */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">High Risk Students</h3>
              <button 
                onClick={() => navigate('/risk-analysis')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {highRiskStudents.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 hover:shadow-sm transition-shadow cursor-pointer">
                  {student.photo?.url ? (
                    <img 
                      src={student.photo.url} 
                      alt={student.name}
                      className="w-10 h-10 rounded-lg object-cover shadow-sm border border-red-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-red-200 flex-shrink-0">
                      <span className="text-red-600 font-bold text-xs">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.class}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">{student.riskScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Students */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Top Performers</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', class: 'Grade 10-A', score: 98, photo: null },
                { name: 'Michael Chen', class: 'Grade 11-B', score: 96, photo: null },
                { name: 'Emma Davis', class: 'Grade 9-C', score: 95, photo: null },
                { name: 'James Wilson', class: 'Grade 10-B', score: 94, photo: null },
                { name: 'Olivia Brown', class: 'Grade 11-A', score: 93, photo: null }
              ].map((student, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 hover:shadow-sm transition-shadow cursor-pointer">
                  {student.photo?.url ? (
                    <img 
                      src={student.photo.url} 
                      alt={student.name}
                      className="w-10 h-10 rounded-lg object-cover shadow-sm border border-green-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-green-200 flex-shrink-0">
                      <span className="text-green-600 font-bold text-xs">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.class}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{student.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard