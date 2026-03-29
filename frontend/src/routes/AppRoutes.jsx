import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';

// Auth
import Login from '../pages/auth/Login';

// Host pages
import HostDashboard from '../pages/host/Dashboard';
import ManageAdmins from '../pages/host/Admins';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import Students from '../pages/admin/Students';
import Marks from '../pages/admin/Marks';
import Subjects from '../pages/admin/Subjects';
import AdminAssignments from '../pages/admin/tasks/Assignments';
import AdminPresentations from '../pages/admin/tasks/Presentations';
import AdminLabTasks from '../pages/admin/tasks/LabTasks';
import AdminProjects from '../pages/admin/tasks/Projects';

// Student pages
import StudentDashboard from '../pages/student/Dashboard';
import StudentMarks from '../pages/student/Marks';
import MyAssignments from '../pages/student/tasks/MyAssignment';
import { MyPresentations, MyLabTasks, MyProjects } from '../pages/student/tasks/StudentTasks';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedLayout({ allowedRoles, redirectTo }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={redirectTo || '/login'} replace />;
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          {allowedRoles.includes('host') && user.role === 'host' && (
            <>
              <Route index element={<HostDashboard />} />
              <Route path="admins" element={<ManageAdmins />} />
            </>
          )}
          {allowedRoles.includes('admin') && (user.role === 'admin' || user.role === 'host') && (
            <>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="marks" element={<Marks />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="tasks/assignments" element={<AdminAssignments />} />
              <Route path="tasks/presentations" element={<AdminPresentations />} />
              <Route path="tasks/lab-tasks" element={<AdminLabTasks />} />
              <Route path="tasks/projects" element={<AdminProjects />} />
            </>
          )}
          {allowedRoles.includes('student') && user.role === 'student' && (
            <>
              <Route index element={<StudentDashboard />} />
              <Route path="marks" element={<StudentMarks />} />
              <Route path="assignments" element={<MyAssignments />} />
              <Route path="presentations" element={<MyPresentations />} />
              <Route path="lab-tasks" element={<MyLabTasks />} />
              <Route path="projects" element={<MyProjects />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  const { user } = useAuth();
  const defaultPath = user
    ? user.role === 'host' ? '/host' : user.role === 'admin' ? '/admin' : '/student'
    : '/login';

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={defaultPath} />} />
      <Route path="/host/*" element={<ProtectedLayout allowedRoles={['host']} redirectTo="/login" />} />
      <Route path="/admin/*" element={<ProtectedLayout allowedRoles={['admin']} redirectTo="/login" />} />
      <Route path="/student/*" element={<ProtectedLayout allowedRoles={['student']} redirectTo="/login" />} />
      <Route path="/" element={<Navigate to={defaultPath} />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
