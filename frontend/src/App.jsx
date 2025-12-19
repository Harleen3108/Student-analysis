import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import TeacherLayout from './components/Layout/TeacherLayout'
import ParentLayout from './components/Layout/ParentLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import RiskAnalysis from './pages/RiskAnalysis'
import Interventions from './pages/Interventions'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'
import BulkUpload from './pages/BulkUpload'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import AttendanceManagement from './pages/teacher/AttendanceManagementNew'
import MyClasses from './pages/teacher/MyClasses'
import AtRiskStudents from './pages/teacher/AtRiskStudents'
import AcademicEntry from './pages/teacher/AcademicEntry'
import Observations from './pages/teacher/Observations'
import StudentProfiles from './pages/teacher/StudentProfiles'
import Communications from './pages/teacher/Communications'
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentAttendance from './pages/parent/Attendance'
import ParentAcademic from './pages/parent/Academic'
import ParentRiskStatus from './pages/parent/RiskStatus'
import ParentInterventions from './pages/parent/Interventions'
import ParentCommunications from './pages/parent/Communications'
import ParentSupport from './pages/parent/Support'
import ParentProfile from './pages/parent/Profile'
import StudentProfile from './pages/StudentProfile'
import LoadingSpinner from './components/UI/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  console.log('🔄 App state:', { user: user ? 'logged in' : 'not logged in', loading, role: user?.role })
  console.log('🔍 Full user object:', user)

  if (loading) {
    console.log('⏳ App loading...')
    return <LoadingSpinner />
  }

  // Redirect based on user role
  const getDefaultRoute = () => {
    if (!user) return '/login'
    if (user.role === 'teacher') return '/teacher'
    if (user.role === 'parent') return '/parent'
    return '/' // Admin dashboard
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to={getDefaultRoute()} replace />} 
      />
      
      {/* Teacher Routes */}
      {user?.role === 'teacher' && (
        <>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="my-classes" element={<MyClasses />} />
            <Route path="at-risk-students" element={<AtRiskStudents />} />
            <Route path="academic-entry" element={<AcademicEntry />} />
            <Route path="observations" element={<Observations />} />
            <Route path="students" element={<StudentProfiles />} />
            <Route path="communications" element={<Communications />} />
          </Route>
          <Route path="/teacher/students/:id" element={<StudentProfile />} />
        </>
      )}
      
      {/* Parent Routes */}
      {user?.role === 'parent' && (
        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="attendance" element={<ParentAttendance />} />
          <Route path="academic" element={<ParentAcademic />} />
          <Route path="risk" element={<ParentRiskStatus />} />
          <Route path="interventions" element={<ParentInterventions />} />
          <Route path="communications" element={<ParentCommunications />} />
          <Route path="support" element={<ParentSupport />} />
          <Route path="profile" element={<ParentProfile />} />
        </Route>
      )}
      
      {/* Admin Routes */}
      {user?.role === 'admin' && (
        <>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="risk-analysis" element={<RiskAnalysis />} />
            <Route path="interventions" element={<Interventions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="bulk-upload" element={<BulkUpload />} />
          </Route>
          <Route path="/students/:id" element={<StudentProfile />} />
        </>
      )}
      
      {/* Fallback route */}
      <Route 
        path="*" 
        element={user ? <Navigate to={getDefaultRoute()} replace /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  )
}

export default App