import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, ClipboardList,
  Monitor, FolderKanban, LogOut, Award, Crown, ShieldCheck, Library
} from 'lucide-react';

const hostLinks = [
  { to: '/host', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/host/admins', icon: ShieldCheck, label: 'Manage Admins' },
  { to: '/host/students', icon: Users, label: 'Students' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/subjects', icon: Library, label: 'Subjects' },
  { to: '/admin/marks', icon: BookOpen, label: 'Marks & Grades' },
  { divider: true, label: 'Task Allocation' },
  { to: '/admin/tasks/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/admin/tasks/presentations', icon: Monitor, label: 'Presentations' },
  { to: '/admin/tasks/projects', icon: FolderKanban, label: 'Projects' },
];

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/marks', icon: BookOpen, label: 'My Marks' },
  { divider: true, label: 'My Tasks' },
  { to: '/student/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/student/presentations', icon: Monitor, label: 'Presentations' },
  { to: '/student/projects', icon: FolderKanban, label: 'Projects' },
];

const roleConfig = {
  host: { links: hostLinks, label: 'Host Portal', icon: Crown, color: 'bg-amber-500' },
  admin: { links: adminLinks, label: 'Staff Portal', icon: ShieldCheck, color: 'bg-blue-600' },
  student: { links: studentLinks, label: 'Student Portal', icon: GraduationCap, color: 'bg-violet-600' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const config = roleConfig[user?.role] || roleConfig.student;
  const { links, label, icon: RoleIcon, color } = config;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
            <RoleIcon size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-base">AcadEdge</span>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link, i) => {
          if (link.divider) {
            return (
              <div key={i} className="pt-4 pb-2">
                <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold px-3">{link.label}</p>
              </div>
            );
          }
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} />
              <span className="flex-1">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-xs font-bold text-white`}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role} · {user?.studentId || user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </div>
  );
}
