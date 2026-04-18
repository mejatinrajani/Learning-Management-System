import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { attendanceAPI } from '@/services/apiService';

interface AttendanceSessionRecord {
  date: string;
  class_name: string;
  section_name: string;
  subject_name: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
}

const TeacherAttendance: React.FC = () => {
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[TEACHER_ATTENDANCE_PAGE] Component mounted/re-rendered');

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        console.log('[TEACHER_ATTENDANCE] Fetching attendance records...');
        const data = await attendanceAPI.getAttendance();
        const records = Array.isArray(data) ? data : data.results || [];
        
        console.log('[TEACHER_ATTENDANCE] Received records:', records);

        // Group records by date + class + section to create session view
        const sessionMap = new Map<string, AttendanceSessionRecord>();
        
        records.forEach((record: any) => {
          const key = `${record.date || 'unknown'}-${record.class_assigned || 'unknown'}-${record.section || 'unknown'}`;
          
          if (!sessionMap.has(key)) {
            sessionMap.set(key, {
              date: record.date || 'Unknown Date',
              class_name: record.class_name || 'Unknown Class',
              section_name: record.section_name || 'Unknown Section',
              subject_name: record.subject_name || 'All Subjects',
              total_students: 0,
              present_count: 0,
              absent_count: 0,
              late_count: 0,
              excused_count: 0,
            });
          }

          const session = sessionMap.get(key)!;
          session.total_students++;

          // Count by status
          const statusName = record.status_details?.name || record.status_details?.short_code || '';
          if (statusName === 'Present' || record.status_details?.is_present) {
            session.present_count++;
          } else if (statusName === 'Absent') {
            session.absent_count++;
          } else if (statusName === 'Late') {
            session.late_count++;
          } else if (statusName === 'Excused') {
            session.excused_count++;
          }
        });

        const sessionsArray = Array.from(sessionMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setAttendanceSessions(sessionsArray);
      } catch (error) {
        console.error('[TEACHER_ATTENDANCE] Error fetching attendance:', error);
        setAttendanceSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getAttendancePercentage = (present: number, total: number) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate summary stats
  const totalSessions = attendanceSessions.length;
  const totalStudents = attendanceSessions.reduce((sum, session) => sum + session.total_students, 0);
  const totalPresent = attendanceSessions.reduce((sum, session) => sum + session.present_count, 0);
  const avgAttendance = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <Link to="/teacher" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Attendance Records</h1>
              <p className="text-muted-foreground">
                View and manage attendance for your classes
              </p>
            </div>
            <Button asChild>
              <Link to="/teacher/mark-attendance">
                <Users className="h-4 w-4 mr-2" />
                Mark Attendance
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Attendance sessions recorded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(avgAttendance)}`}>{avgAttendance}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all classes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Student Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Student attendance instances
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Sessions</CardTitle>
            <CardDescription>
              View attendance records organized by class and date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceSessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No attendance records found. <Link to="/teacher/mark-attendance" className="text-primary hover:underline">Mark attendance now</Link>.
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceSessions.map((session, idx) => {
                  const percentage = getAttendancePercentage(session.present_count, session.total_students);
                  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold">{session.class_name} - {session.section_name}</h3>
                            <p className="text-sm text-muted-foreground">{session.subject_name || 'General'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
                          </div>
                          <Badge variant="outline" className="ml-4">Total: {session.total_students}</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">{session.present_count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">{session.absent_count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{session.late_count}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Late</p>
                        </div>

                        {session.excused_count > 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-blue-600">
                              <span className="font-medium">{session.excused_count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Excused</p>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getAttendanceColor(percentage)}`}>
                            {percentage}%
                          </div>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAttendance;

