import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { attendanceAPI } from '@/services/apiService';
import { useAuth } from '@/components/auth/AuthContext';

interface AttendanceRecord {
  id: number;
  date: string;
  student_id: number;
  student_name: string;
  status_details: {
    name: string;
    is_present: boolean;
  };
  remarks: string;
}

interface ChildAttendance {
  student_id: number;
  student_name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  records: AttendanceRecord[];
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [childrenAttendance, setChildrenAttendance] = useState<ChildAttendance[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');

  console.log('[PARENT_ATTENDANCE_PAGE] Component mounted/re-rendered');

  // Fetch attendance data for all children
  useEffect(() => {
    const fetchChildrenAttendance = async () => {
      setLoading(true);
      try {
        console.log('[PARENT_ATTENDANCE] Fetching attendance records for all children...');
        const data = await attendanceAPI.getAttendance();
        const records = Array.isArray(data) ? data : data.results || [];
        
        console.log('[PARENT_ATTENDANCE] Received records:', records);

        // Group records by student
        const groupedByStudent = new Map<number, AttendanceRecord[]>();
        records.forEach((record: AttendanceRecord) => {
          const studentId = record.student_id || 0;
          if (!groupedByStudent.has(studentId)) {
            groupedByStudent.set(studentId, []);
          }
          groupedByStudent.get(studentId)!.push(record);
        });

        // Calculate statistics for each child
        const childrenData: ChildAttendance[] = Array.from(groupedByStudent.entries()).map(
          ([studentId, studentRecords]) => {
            const present = studentRecords.filter(r => r.status_details?.is_present).length;
            const absent = studentRecords.filter(r => r.status_details?.name === 'Absent').length;
            const late = studentRecords.filter(r => r.status_details?.name === 'Late').length;
            const total = studentRecords.length;

            return {
              student_id: studentId,
              student_name: studentRecords[0]?.student_name || `Student ${studentId}`,
              total,
              present,
              absent,
              late,
              percentage: total > 0 ? Math.round((present / total) * 100) : 0,
              records: studentRecords,
            };
          }
        );

        setChildrenAttendance(childrenData);
      } catch (error) {
        console.error('[PARENT_ATTENDANCE] Error fetching attendance:', error);
        setChildrenAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenAttendance();
  }, []);

  // Get current child's data
  const getCurrentChildData = () => {
    if (selectedChild === 'all') {
      const totalPresent = childrenAttendance.reduce((sum, child) => sum + child.present, 0);
      const totalAbsent = childrenAttendance.reduce((sum, child) => sum + child.absent, 0);
      const totalLate = childrenAttendance.reduce((sum, child) => sum + child.late, 0);
      const totalDays = childrenAttendance.reduce((sum, child) => sum + child.total, 0);
      
      return {
        student_id: 0,
        student_name: 'All Children',
        total: totalDays,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        percentage: totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0,
        records: childrenAttendance.flatMap(child => child.records),
      };
    }
    
    return childrenAttendance.find(c => c.student_id.toString() === selectedChild) || {
      student_id: 0,
      student_name: 'Unknown',
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
      records: [],
    };
  };

  const currentChild = getCurrentChildData();

  // Get recent 7 days records
  const recentRecords = currentChild.records
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7)
    .reverse();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Late':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="parent">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="parent">
      <div className="space-y-6">
        <div>
          <Link to="/parent" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Children's Attendance</h1>
          <p className="text-muted-foreground">
            Track your children's attendance records
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Tabs defaultValue="month" onValueChange={setView} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="term">Term</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select defaultValue={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {childrenAttendance.map(child => (
                <SelectItem key={child.student_id} value={child.student_id.toString()}>
                  {child.student_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${currentChild.percentage >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                {currentChild.percentage}%
              </div>
              <p className="text-xs text-muted-foreground">{currentChild.present} days out of {currentChild.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Present Days</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="text-3xl font-bold">{currentChild.present}</div>
            </CardContent>
          </Card>
          
          {selectedChild !== 'all' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Absences & Late Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Absences: {currentChild.absent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Late: {currentChild.late}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Last 7 days attendance record</CardDescription>
              </CardHeader>
              <CardContent>
                {recentRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(record.status_details?.name || '')}
                          <div>
                            <div className="font-medium">
                              {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Badge variant={
                            record.status_details?.is_present 
                              ? 'outline' 
                              : record.status_details?.name === 'Absent' 
                                ? 'destructive' 
                                : 'secondary'
                          }>
                            {record.status_details?.name || 'Unknown'}
                          </Badge>
                          {record.remarks && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {record.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Total Days</span>
                <span className="font-semibold">{currentChild.total}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Present</span>
                <span className="font-semibold text-green-600">{currentChild.present}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Absent</span>
                <span className="font-semibold text-red-600">{currentChild.absent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Late</span>
                <span className="font-semibold text-amber-600">{currentChild.late}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedChild !== 'all' && currentChild.absent + currentChild.late > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <CardTitle className="text-amber-800">Attendance Alert</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-amber-700">
              <p>Your child has missed {currentChild.absent} days and been late {currentChild.late} times this period.</p>
              <p className="mt-2">Please ensure regular attendance to support your child's academic progress.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
