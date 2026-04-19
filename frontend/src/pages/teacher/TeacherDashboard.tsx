import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from "@/components/auth/AuthContext";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  GraduationCap, 
  ClipboardCheck, 
  Clock, 
  Calendar, 
  Bell,
  CheckSquare,
  Upload,
  FileText,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const TeacherDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect if user is loaded and not a teacher
  if (user && user.role && user.role !== "TEACHER") {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  const todayClasses = [
    { id: 1, name: 'Mathematics', section: '10A', time: '09:00 - 09:45', room: 'Room 101' },
    { id: 2, name: 'Mathematics', section: '9B', time: '10:00 - 10:45', room: 'Room 102' },
    { id: 3, name: 'Mathematics', section: '11C', time: '11:30 - 12:15', room: 'Room 103' }
  ];

  const pendingTasks = [
    { id: 1, task: 'Grade 10A Algebra Quiz', due: '2025-05-19' },
    { id: 2, task: 'Upload study materials for 9B', due: '2025-05-20' },
    { id: 3, task: 'Submit mid-term marks', due: '2025-05-25' },
  ];

  const recentNotices = [
    { id: 1, title: 'Staff Meeting Tomorrow', date: '2025-05-17' },
    { id: 2, title: 'End of Term Exam Schedule', date: '2025-05-16' }
  ];

  const attendanceNeeded = [
    { id: 1, class: 'Mathematics', section: '10A', students: 32 },
    { id: 2, class: 'Mathematics', section: '9B', students: 28 }
  ];

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your teaching overview for today.
          </p>
        </div>

        {/* Quick Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex-col">
                <Link to="/teacher/mark-attendance">
                  <CheckSquare className="h-6 w-6 mb-2" />
                  Mark Attendance
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col">
                <Link to="/teacher/upload-marks">
                  <Upload className="h-6 w-6 mb-2" />
                  Upload Marks
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col">
                <Link to="/teacher/notices">
                  <Bell className="h-6 w-6 mb-2" />
                  Send Notice
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col">
                <Link to="/teacher/view-submissions">
                  <Eye className="h-6 w-6 mb-2" />
                  View Submissions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" /> Today's Classes
                </CardTitle>
                <Badge variant="outline">{todayClasses.length} Classes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayClasses.map(cls => (
                  <div key={cls.id} className="flex items-center p-3 border rounded-md">
                    <div className="bg-teacher/10 text-teacher p-3 rounded-full mr-4">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{cls.name} - {cls.section}</h3>
                      <div className="flex text-sm text-muted-foreground">
                        <span className="mr-3">{cls.time}</span>
                        <span>{cls.room}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto" asChild>
                      <Link to={`/teacher/class-details/${cls.id}`}>Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" /> Attendance Required
              </CardTitle>
              <CardDescription>
                Classes that need attendance marked today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceNeeded.map(cls => (
                  <div key={cls.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{cls.class} - {cls.section}</h3>
                        <p className="text-sm text-muted-foreground">{cls.students} students</p>
                      </div>
                      <Button asChild>
                        <Link to="/teacher/mark-attendance">Mark Attendance</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2" /> Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <div key={task.id} className="flex justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <h3 className="font-medium">{task.task}</h3>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(task.due).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Complete</Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Tasks</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" /> Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNotices.map(notice => (
                  <div key={notice.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <h3 className="font-medium">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notice.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Notices</Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" /> My Classes Overview
              </CardTitle>
              <Button variant="outline" size="sm">View All Classes</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground p-2">
                <div>Class</div>
                <div>Students</div>
                <div>Average Grade</div>
                <div>Attendance</div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 p-2 hover:bg-muted/50 rounded-md">
                <div className="font-medium">Mathematics 10A</div>
                <div>32</div>
                <div>B+ (85%)</div>
                <div>92%</div>
              </div>
              <div className="grid grid-cols-4 p-2 hover:bg-muted/50 rounded-md">
                <div className="font-medium">Mathematics 9B</div>
                <div>28</div>
                <div>A- (90%)</div>
                <div>88%</div>
              </div>
              <div className="grid grid-cols-4 p-2 hover:bg-muted/50 rounded-md">
                <div className="font-medium">Mathematics 11C</div>
                <div>30</div>
                <div>B (82%)</div>
                <div>95%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
