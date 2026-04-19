
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarItem } from '@/types';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings,
  CheckSquare,
  FileText as ResourceIcon,
  User,
  Bell,
  Clock,
  GraduationCap,
  TrendingUp,
  HelpCircle,
  CreditCard,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  Upload,
  Eye
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;

  let menuItems: SidebarItem[] = [];

  // Define menu items based on user role
  const roleValue = user.role?.toLowerCase()?.trim();
  console.log('[SIDEBAR] User role raw:', user.role);
  console.log('[SIDEBAR] User role processed:', roleValue);
  console.log('[SIDEBAR] Type:', typeof roleValue);
  
  switch (roleValue) {
    case 'developer':
      menuItems = [
        { title: 'Dashboard', href: '/developer', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'Schools', href: '/developer/schools', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { title: 'Principals', href: '/developer/principals', icon: <Users className="mr-2 h-4 w-4" /> },
        { title: 'Settings', href: '/developer/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
        { title: 'Profile', href: '/developer/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/developer/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
      break;
    
    case 'principal':
      menuItems = [
        { title: 'Dashboard', href: '/principal', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'Teachers', href: '/principal/teachers', icon: <Users className="mr-2 h-4 w-4" /> },
        { title: 'Students', href: '/principal/students', icon: <GraduationCap className="mr-2 h-4 w-4" /> },
        { title: 'Parents', href: '/principal/parents', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Classes', href: '/principal/classes', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { title: 'Timetable', href: '/principal/timetable', icon: <Clock className="mr-2 h-4 w-4" /> },
        { title: 'Attendance', href: '/principal/attendance', icon: <CheckSquare className="mr-2 h-4 w-4" /> },
        { title: 'Notices', href: '/principal/notices', icon: <Bell className="mr-2 h-4 w-4" /> },
        { title: 'Fee Management', href: '/principal/fees', icon: <CreditCard className="mr-2 h-4 w-4" /> },
        { title: 'Behaviour Log', href: '/principal/behaviour', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { title: 'Settings', href: '/principal/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
        { title: 'Profile', href: '/principal/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/principal/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
      break;
    
    case 'teacher':
      menuItems = [
        { title: 'Dashboard', href: '/teacher', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'My Classes', href: '/teacher/classes', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { title: 'Mark Attendance', href: '/teacher/mark-attendance', icon: <UserCheck className="mr-2 h-4 w-4" /> },
        { title: 'Upload Marks', href: '/teacher/upload-marks', icon: <Upload className="mr-2 h-4 w-4" /> },
        { title: 'Attendance Reports', href: '/teacher/attendance', icon: <CheckSquare className="mr-2 h-4 w-4" /> },
        { title: 'Assignments', href: '/teacher/assignments', icon: <FileText className="mr-2 h-4 w-4" /> },
        { title: 'View Submissions', href: '/teacher/view-submissions', icon: <Eye className="mr-2 h-4 w-4" /> },
        { title: 'Resources', href: '/teacher/resources', icon: <ResourceIcon className="mr-2 h-4 w-4" /> },
        { title: 'Notices', href: '/teacher/notices', icon: <Bell className="mr-2 h-4 w-4" /> },
        { title: 'Behaviour Log', href: '/teacher/behaviour', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { title: 'Calendar', href: '/teacher/calendar', icon: <Calendar className="mr-2 h-4 w-4" /> },
        { title: 'Profile', href: '/teacher/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/teacher/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
      break;
    
    case 'student':
      menuItems = [
        { title: 'Dashboard', href: '/student', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'Classes', href: '/student/classes', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { title: 'Assignments', href: '/student/assignments', icon: <FileText className="mr-2 h-4 w-4" /> },
        { title: 'Resources', href: '/student/resources', icon: <ResourceIcon className="mr-2 h-4 w-4" /> },
        { title: 'Attendance', href: '/student/attendance', icon: <CheckSquare className="mr-2 h-4 w-4" /> },
        { title: 'Calendar', href: '/student/calendar', icon: <Calendar className="mr-2 h-4 w-4" /> },
        { title: 'Notices', href: '/student/notices', icon: <Bell className="mr-2 h-4 w-4" /> },
        { title: 'Fee Management', href: '/student/fees', icon: <CreditCard className="mr-2 h-4 w-4" /> },
        { title: 'Behaviour Log', href: '/student/behaviour', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { title: 'Profile', href: '/student/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/student/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
      break;
    
    case 'parent':
      menuItems = [
        { title: 'Dashboard', href: '/parent', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'My Children', href: '/parent/children', icon: <Users className="mr-2 h-4 w-4" /> },
        { title: 'Attendance', href: '/parent/attendance', icon: <CheckSquare className="mr-2 h-4 w-4" /> },
        { title: 'Calendar', href: '/parent/calendar', icon: <Calendar className="mr-2 h-4 w-4" /> },
        { title: 'Notices', href: '/parent/notices', icon: <Bell className="mr-2 h-4 w-4" /> },
        { title: 'Progress Reports', href: '/parent/progress', icon: <TrendingUp className="mr-2 h-4 w-4" /> },
        { title: 'Fee Management', href: '/parent/fees', icon: <CreditCard className="mr-2 h-4 w-4" /> },
        { title: 'Behaviour Log', href: '/parent/behaviour', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { title: 'My Profile', href: '/parent/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/parent/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
      break;
    
    default:
      console.warn('[SIDEBAR] Unknown role, defaulting to teacher menu:', roleValue);
      // Default to teacher menu if role doesn't match
      menuItems = [
        { title: 'Dashboard', href: '/teacher', icon: <Home className="mr-2 h-4 w-4" /> },
        { title: 'My Classes', href: '/teacher/classes', icon: <BookOpen className="mr-2 h-4 w-4" /> },
        { title: 'Mark Attendance', href: '/teacher/mark-attendance', icon: <UserCheck className="mr-2 h-4 w-4" /> },
        { title: 'Upload Marks', href: '/teacher/upload-marks', icon: <Upload className="mr-2 h-4 w-4" /> },
        { title: 'Attendance Reports', href: '/teacher/attendance', icon: <CheckSquare className="mr-2 h-4 w-4" /> },
        { title: 'Assignments', href: '/teacher/assignments', icon: <FileText className="mr-2 h-4 w-4" /> },
        { title: 'View Submissions', href: '/teacher/view-submissions', icon: <Eye className="mr-2 h-4 w-4" /> },
        { title: 'Resources', href: '/teacher/resources', icon: <ResourceIcon className="mr-2 h-4 w-4" /> },
        { title: 'Notices', href: '/teacher/notices', icon: <Bell className="mr-2 h-4 w-4" /> },
        { title: 'Behaviour Log', href: '/teacher/behaviour', icon: <ClipboardList className="mr-2 h-4 w-4" /> },
        { title: 'Calendar', href: '/teacher/calendar', icon: <Calendar className="mr-2 h-4 w-4" /> },
        { title: 'Profile', href: '/teacher/profile', icon: <User className="mr-2 h-4 w-4" /> },
        { title: 'Help & Support', href: '/teacher/help', icon: <HelpCircle className="mr-2 h-4 w-4" /> },
      ];
  }

  return (
    <div className="h-full bg-sidebar border-r w-64 py-6 px-3 flex flex-col">
      <div className="px-3 mb-8">
        <h2 className="text-lg font-bold">School LMS</h2>
        <p className={cn(
          "text-xs mt-1 px-2 py-1 rounded-full w-fit",
          `role-indicator-${user.role?.toLowerCase() || 'user'}`
        )}>
          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Portal
        </p>
      </div>
      
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href || 
                         location.pathname.startsWith(`${item.href}/`);
          
          return (
            <Link 
              key={item.href} 
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
              {item.badge && (
                <span className="ml-auto bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 px-3">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/help">
            <Settings className="mr-2 h-4 w-4" />
            Help & Support
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
