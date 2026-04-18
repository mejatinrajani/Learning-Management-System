import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect, useState } from "react";
import React from "react";

// Pages
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import PrincipalDashboard from "./pages/principal/PrincipalDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ParentDashboard from "./pages/parent/ParentDashboard";

// Principal Pages
import Teachers from "./pages/principal/Teachers";
import Timetable from "./pages/principal/Timetable";
import PrincipalClasses from "./pages/principal/Classes";
import Parents from "./pages/principal/Parents";
import PrincipalNotices from "./pages/principal/PrincipalNotices";
import PrincipalStudents from "./pages/principal/Students";
import PrincipalAttendance from "./pages/principal/Attendance";
import PrincipalSettings from "./pages/principal/PrincipalSettings";
import PrincipalHelpSupport from "./pages/principal/HelpSupport";
import PrincipalBehaviourLog from "./pages/principal/BehaviourLog";
import PrincipalFeeManagement from "./pages/principal/FeeManagement";
import AddTeacher from "./pages/principal/AddTeacher";
import AddStudent from "./pages/principal/AddStudent";
import AddParent from "./pages/principal/AddParent";
import CreateClass from "./pages/principal/CreateClass";
import PrincipalTeacherAttendance from "./pages/principal/TeacherAttendance";

// Teacher Pages
import TeacherClasses from "./pages/teacher/Classes";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherCalendar from "./pages/teacher/Calendar";
import TeacherNotices from "./pages/teacher/TeacherNotices";
import TeacherResources from "./pages/teacher/Resources";
import TeacherHelpSupport from "./pages/teacher/HelpSupport";
import TeacherBehaviourLog from "./pages/teacher/BehaviourLog";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import UploadMarks from "./pages/teacher/UploadMarks";
import ViewSubmissions from "./pages/teacher/ViewSubmissions";
import ClassDetails from "./pages/teacher/ClassDetails";

// Student Pages
import StudentClasses from "./pages/student/Classes";
import StudentAssignments from "./pages/student/Assignments";
import StudentAttendance from "./pages/student/Attendance";
import StudentCalendar from "./pages/student/Calendar";
import StudentNotices from "./pages/student/Notices";
import StudentResources from "./pages/student/Resources";
import StudentHelpSupport from "./pages/student/HelpSupport";
import StudentBehaviourLog from "./pages/student/BehaviourLog";
import StudentFeeManagement from "./pages/student/FeeManagement";

// Parent Pages
import Children from "./pages/parent/Children";
import ParentAttendance from "./pages/parent/Attendance";
import ParentCalendar from "./pages/parent/Calendar";
import ParentNotices from "./pages/parent/Notices";
import ChildDetail from "./pages/parent/ChildDetail";
import ChildAcademicPerformance from "./pages/parent/ChildAcademicPerformance";
import Progress from "./pages/parent/Progress";
import ParentHelpSupport from "./pages/parent/HelpSupport";
import ParentProfile from "./pages/parent/Profile";
import ParentBehaviourLog from "./pages/parent/BehaviourLog";
import ParentFeeManagement from "./pages/parent/FeeManagement";

// Developer Pages
import DeveloperHelpSupport from "./pages/developer/HelpSupport";
import Schools from "./pages/developer/Schools";
import Principals from "./pages/developer/Principals";

// Shared Pages
import Profile from "./pages/shared/Profile";

// Theme Components
import ThemeSwitcher from "./components/theme/ThemeSwitcher";
import { useAuth } from "./components/auth/AuthContext";

const App = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [appError, setAppError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('[APP_DEBUG] Current state:', { 
      isLoading, 
      isAuthenticated, 
      userExists: !!user,
      userId: user?.id,
      userRole: user?.role 
    });
  }, [isLoading, isAuthenticated, user]);
  
  console.log('[APP] Rendering with:', { isAuthenticated, user: user?.username, isLoading });
  
  // Show loading screen while auth is initializing
  if (isLoading) {
    console.log('[APP_DEBUG] Auth still loading, showing spinner');
    return (
      <TooltipProvider>
        <div className="w-full h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </TooltipProvider>
    );
  }
  
  console.log('[APP_DEBUG] Auth loading complete, rendering app');
  
  if (appError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">App Error</h2>
          <p className="text-gray-700 mb-4">{appError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  try {
    return (
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitcher />
            </div>
            <AnimatePresence mode="wait">
              <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                isAuthenticated && user && user.role ? 
                <Navigate to={`/${user.role.toLowerCase()}`} replace /> : 
                <Welcome />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated && user && user.role ? 
                <Navigate to={`/${user.role.toLowerCase()}`} replace /> : 
                <Login />
              } 
            />
            <Route 
              path="/signup" 
              element={
                isAuthenticated && user && user.role ? 
                <Navigate to={`/${user.role.toLowerCase()}`} replace /> : 
                <Signup />
              } 
            />
            
            {/* Dashboard & Role-based Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/principal" element={<PrincipalDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/parent" element={<ParentDashboard />} />
            
            {/* Principal SubPages */}
            <Route path="/principal/teachers" element={<Teachers />} />
            <Route path="/principal/add-teacher" element={<AddTeacher />} />
            <Route path="/principal/add-student" element={<AddStudent />} />
            <Route path="/principal/add-parent" element={<AddParent />} />
            <Route path="/principal/create-class" element={<CreateClass />} />
            <Route path="/principal/teacher-attendance" element={<PrincipalTeacherAttendance />} />
            <Route path="/principal/timetable" element={<Timetable />} />
            <Route path="/principal/classes" element={<PrincipalClasses />} />
            <Route path="/principal/parents" element={<Parents />} />
            <Route path="/principal/notices" element={<PrincipalNotices />} />
            <Route path="/principal/students" element={<PrincipalStudents />} />
            <Route path="/principal/attendance" element={<PrincipalAttendance />} />
            <Route path="/principal/settings" element={<PrincipalSettings />} />
            <Route path="/principal/help" element={<PrincipalHelpSupport />} />
            <Route path="/principal/behaviour" element={<PrincipalBehaviourLog />} />
            <Route path="/principal/fees" element={<PrincipalFeeManagement />} />
            
            {/* Teacher SubPages */}
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/class-details/:classId" element={<ClassDetails />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/mark-attendance" element={<MarkAttendance />} />
            <Route path="/teacher/upload-marks" element={<UploadMarks />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/view-submissions" element={<ViewSubmissions />} />
            <Route path="/teacher/calendar" element={<TeacherCalendar />} />
            <Route path="/teacher/notices" element={<TeacherNotices />} />
            <Route path="/teacher/resources" element={<TeacherResources />} />
            <Route path="/teacher/help" element={<TeacherHelpSupport />} />
            <Route path="/teacher/behaviour" element={<TeacherBehaviourLog />} />
            
            {/* Student SubPages */}
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/calendar" element={<StudentCalendar />} />
            <Route path="/student/notices" element={<StudentNotices />} />
            <Route path="/student/resources" element={<StudentResources />} />
            <Route path="/student/help" element={<StudentHelpSupport />} />
            <Route path="/student/behaviour" element={<StudentBehaviourLog />} />
            <Route path="/student/fees" element={<StudentFeeManagement />} />
            
            {/* Parent SubPages */}
            <Route path="/parent/children" element={<Children />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/calendar" element={<ParentCalendar />} />
            <Route path="/parent/notices" element={<ParentNotices />} />
            <Route path="/parent/child/:id" element={<ChildDetail />} />
            <Route path="/parent/child/:id/academics" element={<ChildAcademicPerformance />} />
            <Route path="/parent/child/:id/progress" element={<Progress />} />
            <Route path="/parent/progress" element={<Progress />} />
            <Route path="/parent/help" element={<ParentHelpSupport />} />
            <Route path="/parent/behaviour" element={<ParentBehaviourLog />} />
            <Route path="/parent/fees" element={<ParentFeeManagement />} />

            {/* Developer SubPages */}
            <Route path="/developer/help" element={<DeveloperHelpSupport />} />
            <Route path="/developer/schools" element={<Schools />} />
            <Route path="/developer/principals" element={<Principals />} />
            
            {/* Shared Profile Routes */}
            <Route path="/student/profile" element={<Profile />} />
            <Route path="/teacher/profile" element={<Profile />} />
            <Route path="/parent/profile" element={<Profile />} />
            <Route path="/principal/profile" element={<Profile />} />
            <Route path="/developer/profile" element={<Profile />} />
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('[APP] Render error:', error);
    return (
      <TooltipProvider>
        <div className="w-full h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-4">Render Error</h2>
            <p className="text-gray-700 mb-4 text-sm">{String(error)}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </TooltipProvider>
    );
  }
};

export default App;
