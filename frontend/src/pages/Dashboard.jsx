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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">School-wide visibility and decision-making center</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Monitoring
          </div>
          <button 
            onClick={handleRefresh}
            className="btn-outline"
          >
            Refresh Data
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="btn-primary"
          >
            Generate Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalStudents?.toLocaleString() || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+5.2% from last month</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk Students</p>
              <p className="text-2xl font-bold text-red-600">{data.atRiskStudents || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-red-600">+2 from last week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Interventions</p>
              <p className="text-2xl font-bold text-orange-600">{data.activeInterventions || '0'}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">💝</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">3 completed this week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{data.averageAttendance || '0'}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+2.1% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Distribution</h3>
          <p className="text-sm text-gray-600 mb-6">Student risk level breakdown</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Trend</h3>
          <p className="text-sm text-gray-600 mb-6">Monthly attendance percentage</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Performance */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Class Performance</h3>
          <p className="text-sm text-gray-600 mb-6">Average scores and attendance by class</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" name="Academic Score" />
                <Bar dataKey="attendance" fill="#10B981" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk Students */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">High Risk Students</h3>
              <p className="text-sm text-gray-600">Immediate attention needed</p>
            </div>
            <button 
              onClick={() => navigate('/risk-analysis')}
              className="btn-outline text-sm"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {highRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.class} • Roll No: {student.rollNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    student.riskLevel === 'Critical' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.riskLevel} Risk
                  </span>
                  <p className="text-sm text-gray-600 mt-1">Risk Score: {student.riskScore}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard