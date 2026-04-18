import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, Clock, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { attendanceAPI } from '@/services/apiService';
import { useAuth } from '@/components/auth/AuthContext';

interface AttendanceRecord {
  id: number;
  student_name: string;
  date: string;
  subject_name?: string;
  status_details: {
    name: string;
    short_code: string;
    is_present: boolean;
  };
  remarks: string;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  console.log('[STUDENT_ATTENDANCE_PAGE] Component mounted/re-rendered');

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        console.log('[STUDENT_ATTENDANCE] Fetching attendance records...');
        const data = await attendanceAPI.getAttendance();
        console.log('[STUDENT_ATTENDANCE] Received data:', data);
        
        // Handle both array and paginated responses
        const records = Array.isArray(data) ? data : data.results || [];
        setAttendanceRecords(records);
      } catch (error) {
        console.error('[STUDENT_ATTENDANCE] Error fetching attendance:', error);
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Calculate attendance summary
  const attendanceSummary = {
    present: attendanceRecords.filter(r => r.status_details?.is_present).length,
    absent: attendanceRecords.filter(r => r.status_details?.name === 'Absent').length,
    late: attendanceRecords.filter(r => r.status_details?.name === 'Late').length,
    excused: attendanceRecords.filter(r => r.status_details?.name === 'Excused').length,
    total: attendanceRecords.length,
    percentage: 0,
  };

  attendanceSummary.percentage = attendanceSummary.total > 0 
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) 
    : 0;

  // Filter records based on selected filter
  const filteredRecords = attendanceRecords.filter(record => {
    if (filter === 'present') return record.status_details?.is_present;
    if (filter === 'absent') return record.status_details?.name === 'Absent';
    if (filter === 'late') return record.status_details?.name === 'Late';
    return true;
  });

  const getStatusBadge = (status: string, is_present: boolean) => {
    switch(status) {
      case 'Present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'Absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'Late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'Excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Present':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'Absent':
        return <X className="h-4 w-4 text-red-600" />;
      case 'Late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Excused':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="student">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <div>
          <Link to="/student" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Attendance Records</h1>
          <p className="text-muted-foreground">
            View your attendance history and statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Current academic period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${attendanceSummary.percentage >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                  {attendanceSummary.percentage}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-green-50 rounded-md">
                  <div className="text-2xl font-semibold text-green-600">{attendanceSummary.present}</div>
                  <div className="text-xs text-green-800">Present</div>
                </div>
                <div className="p-3 bg-red-50 rounded-md">
                  <div className="text-2xl font-semibold text-red-600">{attendanceSummary.absent}</div>
                  <div className="text-xs text-red-800">Absent</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-md">
                  <div className="text-2xl font-semibold text-yellow-600">{attendanceSummary.late}</div>
                  <div className="text-xs text-yellow-800">Late</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-2xl font-semibold text-blue-600">{attendanceSummary.excused}</div>
                  <div className="text-xs text-blue-800">Excused</div>
                </div>
              </div>
              
              {attendanceSummary.percentage < 85 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="text-sm text-red-800">
                    Your attendance is below the required 85%. Please improve your attendance.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Total records: {attendanceSummary.total}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Days</span>
                  <span className="font-semibold">{attendanceSummary.total}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Present Rate</span>
                  <span className="font-semibold text-green-600">
                    {attendanceSummary.total > 0 
                      ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Absent Rate</span>
                  <span className="font-semibold text-red-600">
                    {attendanceSummary.total > 0 
                      ? `${Math.round((attendanceSummary.absent / attendanceSummary.total) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Late Rate</span>
                  <span className="font-semibold text-yellow-600">
                    {attendanceSummary.total > 0 
                      ? `${Math.round((attendanceSummary.late / attendanceSummary.total) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily Attendance Log</CardTitle>
              <CardDescription>Record of your daily attendance</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Filter: {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All Records
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('present')}>
                  Present Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('absent')}>
                  Absent Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('late')}>
                  Late Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {attendanceRecords.length === 0 
                  ? 'No attendance records found. Contact your teacher.'
                  : 'No records match the selected filter.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const date = new Date(record.date);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status_details?.name || '')}
                            <span>{getStatusBadge(record.status_details?.name || '', record.status_details?.is_present)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.subject_name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{record.remarks || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Policy</CardTitle>
            <CardDescription>Important information about the school's attendance policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Minimum Attendance Requirement</h4>
              <p className="text-muted-foreground">Students must maintain a minimum of 85% attendance throughout the academic year.</p>
            </div>
            <div>
              <h4 className="font-medium">Reporting Absences</h4>
              <p className="text-muted-foreground">Parents must notify the school office by 9:00 AM if a student will be absent.</p>
            </div>
            <div>
              <h4 className="font-medium">Late Arrival</h4>
              <p className="text-muted-foreground">Students arriving after 9:00 AM must report to the school office before proceeding to class.</p>
            </div>
            <div>
              <h4 className="font-medium">Consequences of Low Attendance</h4>
              <p className="text-muted-foreground">Students with attendance below 85% may face academic penalties and parent-teacher meetings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
