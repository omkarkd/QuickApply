import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { FileText, Briefcase, Bot, Home, LogOut, User, Target, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Resumes', path: '/dashboard' },
    { icon: Briefcase, label: 'Job Descriptions', path: '/jd' },
    { icon: Target, label: 'Match Score', path: '/match-score' },
    { icon: Wand2, label: 'Resume Rewriter', path: '/rewriter' },
    { icon: Bot, label: 'Telegram Bot', path: '/telegram' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col h-screen fixed left-0 top-0" data-testid="sidebar">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-neutral-200">
        <div className="w-8 h-8 bg-indigo-950 rounded-sm flex items-center justify-center">
          <FileText className="w-4 h-4 text-lime-200" />
        </div>
        <span className="ml-2 font-semibold text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
          QuickResume
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 ${
              isActive(item.path) 
                ? 'bg-indigo-50 text-indigo-950 hover:bg-indigo-100' 
                : 'text-slate-600 hover:bg-neutral-50 hover:text-indigo-950'
            }`}
            onClick={() => navigate(item.path)}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-950 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
          data-testid="sidebar-logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
