import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  CheckSquare,
  Calendar,
  Search,
  Save,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { academicAPI } from '@/services/apiService';
import { useToast } from '@/components/ui/use-toast';
import { attendanceAPI } from '@/services/apiService';
import { Class, Section, Student as StudentAPI } from '@/services/apiService';

// Define attendance status enum for type safety
enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

// Interface for local student state
interface Student {
  id: number;
  name: string;
  rollNo: string;
  status: AttendanceStatus;
}

// Interface for backend attendance status
interface AttendanceStatusRecord {
  id: number;
  short_code: string;
  name: string;
}

// Mapping of status strings to short codes
const statusStringToShortCode: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'P',
  [AttendanceStatus.ABSENT]: 'A',
  [AttendanceStatus.LATE]: 'L',
  [AttendanceStatus.EXCUSED]: 'E',
};

const MarkAttendance: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<AttendanceStatusRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch initial data (classes, sections, statuses)
useEffect(() => {
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, sectionsRes, statusesRes] = await Promise.all([
        academicAPI.getClasses(),
        academicAPI.getSections(),
        attendanceAPI.getStatuses(),
      ]);

      // Extract data correctly
      const classesData = classesRes.data.results || classesRes.results || [];
      const sectionsData = sectionsRes.data.results || sectionsRes.results || [];
      const statusesData = statusesRes.results || [];

      console.log('[MARK_ATTENDANCE] Classes:', classesData);
      console.log('[MARK_ATTENDANCE] Sections:', sectionsData);
      console.log('[MARK_ATTENDANCE] Statuses:', statusesData);
      console.log('[MARK_ATTENDANCE] Full statuses response:', statusesRes);

      setClasses(classesData);
      setSections(sectionsData);
      setStatuses(statusesData);

      // Set initial class and section
      if (classesData.length > 0) {
        setSelectedClassId(classesData[0].id);
        // Find sections for the first class
        const matchingSections = sectionsData.filter(
          (section) => section.class_name === classesData[0].name // Match by class_name
        );
        if (matchingSections.length > 0) {
          setSelectedSectionId(matchingSections[0].id);
        }
      }

      if (classesData.length === 0) {
        toast({
          title: 'Warning',
          description: 'No classes available. Please contact the administrator.',
          variant: 'destructive',
        });
      }
      if (sectionsData.length === 0) {
        toast({
          title: 'Warning',
          description: 'No sections available. Please contact the administrator.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch initial data:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load classes, sections, or statuses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  fetchInitialData();
}, [toast]);

  // Reset section when class changes
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find((cls) => cls.id === selectedClassId);
      if (selectedClass) {
        const matchingSections = sections.filter(
          (section) => section.class_name === selectedClass.name
        );
        if (matchingSections.length > 0) {
          setSelectedSectionId(matchingSections[0].id);
        } else {
          setSelectedSectionId(null);
        }
      }
    }
  }, [selectedClassId, sections, classes]);

  // Fetch students and existing attendance when class, section, or date changes
  useEffect(() => {
    if (selectedClassId && selectedSectionId && selectedDate) {
      fetchStudentsAndAttendance(selectedClassId, selectedSectionId, selectedDate);
    } else {
      setStudents([]);
    }
  }, [selectedClassId, selectedSectionId, selectedDate]);

  const fetchStudentsAndAttendance = async (classId: number, sectionId: number, date: string) => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        academicAPI.getStudents(classId, sectionId),
        attendanceAPI.getClassReport(classId.toString(), date, sectionId.toString()),
      ]);

      // Extract student data
      const studentsData: StudentAPI[] = studentsRes.data.results || [];
      console.log('Students Data:', studentsData);

      const initialStudents: Student[] = studentsData.map((student: StudentAPI) => ({
        id: student.id,
        name:
          student.user?.full_name ||
          [student.user?.first_name, student.user?.last_name].filter(Boolean).join(' ') ||
          'Unknown Student',
        rollNo: student.roll_number || 'N/A',
        status: AttendanceStatus.PRESENT,
      }));

      // Process existing attendance
      const attendanceMap = new Map<number, AttendanceStatus>();
      const attendanceRecords = attendanceRes.students || [];

      attendanceRecords.forEach((record: any) => {
        if (record.student_id && record.status_code) {
          const statusKey = Object.keys(statusStringToShortCode).find(
            (key) => statusStringToShortCode[key as AttendanceStatus] === record.status_code
          ) as AttendanceStatus | undefined;
          if (statusKey) {
            attendanceMap.set(record.student_id, statusKey);
          }
        }
      });

      // Merge attendance with students
      const updatedStudents = initialStudents.map((student) => ({
        ...student,
        status: attendanceMap.get(student.id) || AttendanceStatus.PRESENT,
      }));

      setStudents(updatedStudents);
    } catch (error: any) {
      console.error('Failed to fetch students or attendance:', error);
      toast({
        title: 'Error',
        description:
          error.response?.data?.detail || error.message || 'Failed to fetch students or attendance data',
        variant: 'destructive',
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute filtered sections based on selected class
  const filteredSections = sections.filter(
    (section) => section.class_name === classes.find((cls) => cls.id === selectedClassId)?.name
  );

  // Update attendance status for a student
  const updateAttendance = (studentId: number, status: AttendanceStatus) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  // Mark all students as present
  const markAllPresent = () => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => ({ ...student, status: AttendanceStatus.PRESENT }))
    );
    toast({
      title: 'Action Applied',
      description: 'All students marked as present locally. Save to confirm.',
      variant: 'default',
    });
  };

  // Get status ID from short code
  const getStatusId = (status: AttendanceStatus): number | undefined => {
    const shortCode = statusStringToShortCode[status];
    const foundStatus = statuses.find((s) => s.short_code === shortCode);
    console.log(`[GET_STATUS_ID] Looking for status: ${status}, short_code: ${shortCode}, found:`, foundStatus);
    console.log(`[GET_STATUS_ID] Available statuses:`, statuses);
    return foundStatus?.id;
  };

  // Save attendance to backend
  const handleSave = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select class, section, and date',
        variant: 'destructive',
      });
      return;
    }

    if (statuses.length === 0) {
      toast({
        title: 'Error',
        description: 'Attendance statuses not loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const attendanceData = students.map((student) => {
        const statusId = getStatusId(student.status);
        if (!statusId) {
          throw new Error(`Invalid status for student ${student.name}: ${student.status}`);
        }
        return {
          student: student.id,
          status: statusId,
        };
      });

      const payload = {
        class_assigned: selectedClassId,
        section: selectedSectionId,
        date: selectedDate,
        period: 1,
        attendance_data: attendanceData,
      };

      console.log('[ATTENDANCE_SAVE] Sending payload:', JSON.stringify(payload, null, 2));
      console.log('[ATTENDANCE_SAVE] Number of students:', attendanceData.length);

      const response = await attendanceAPI.bulkMarkAttendance(payload);
      console.log('[ATTENDANCE_SAVE] Response:', response);

      toast({
        title: 'Success',
        description: 'Attendance saved successfully!',
      });
      navigate('/teacher/attendance');
    } catch (error: any) {
      console.error('[ATTENDANCE_SAVE] Full error:', error);
      console.error('[ATTENDANCE_SAVE] Error response:', error.response);
      console.error('[ATTENDANCE_SAVE] Error status:', error.response?.status);
      console.error('[ATTENDANCE_SAVE] Error data:', JSON.stringify(error.response?.data, null, 2));
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate attendance statistics
  const attendanceStats = {
    present: students.filter((s) => s.status === AttendanceStatus.PRESENT).length,
    absent: students.filter((s) => s.status === AttendanceStatus.ABSENT).length,
    late: students.filter((s) => s.status === AttendanceStatus.LATE).length,
    excused: students.filter((s) => s.status === AttendanceStatus.EXCUSED).length,
  };

  // Loading state for initial fetch
  if (loading && !selectedClassId) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6 p-4">
        {/* Header */}
        <div>
          <Link
            to="/teacher"
            className="text-sm text-muted-foreground hover:text-primary transition-colors mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">Record daily attendance for your classes</p>
        </div>

        {/* Controls */}
        <Card className="bg-background border-muted">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Calendar className="h-5 w-5 mr-2" />
              Attendance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={saving}
                  className="bg-background border-muted rounded-lg focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Class</label>
                <Select
                  value={selectedClassId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setSelectedClassId(value === 'none' ? null : Number(value))
                  }
                  disabled={loading || saving}
                >
                  <SelectTrigger className="w-full bg-background border-muted rounded-lg">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="none">Select Class</SelectItem>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No classes available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Section</label>
                <Select
                  value={selectedSectionId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setSelectedSectionId(value === 'none' ? null : Number(value))
                  }
                  disabled={loading || saving || !selectedClassId}
                >
                  <SelectTrigger className="w-full bg-background border-muted rounded-lg">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="none">Select Section</SelectItem>
                    {filteredSections.length > 0 ? (
                      filteredSections.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.name || `Section ${section.id}`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No sections available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search Student</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or Roll No..."
                  className="pl-8 bg-background border-muted rounded-lg focus:ring-2 focus:ring-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading || saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-background border-muted hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-semibold text-green-600">{attendanceStats.present}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-muted hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-semibold text-red-600">{attendanceStats.absent}</p>
                </div>
                <UserX className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-muted hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-2xl font-semibold text-yellow-600">{attendanceStats.late}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background border-muted hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Excused</p>
                  <p className="text-2xl font-semibold text-blue-600">{attendanceStats.excused}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <Card className="bg-background border-muted">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Users className="h-5 w-5 mr-2" />
                  Students - {classes.find((cls) => cls.id === selectedClassId)?.name || 'Select a Class'}
                  {selectedSectionId &&
                    ` (${filteredSections.find((sec) => sec.id === selectedSectionId)?.name || ''})`}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Mark attendance for{' '}
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={markAllPresent}
                  disabled={loading || saving || students.length === 0}
                  className="hover:bg-primary/10 transition-colors"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving || students.length === 0}
                  className="bg-primary hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground p-2 border-b border-muted">
                  <div className="col-span-1">Roll No</div>
                  <div className="col-span-4">Student Name</div>
                  <div className="col-span-7">Attendance Status</div>
                </div>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b border-muted rounded-lg hover:bg-muted-gray-50 dark:hover:bg-muted-gray-800 transition-colors duration-100"
                  >
                    <div className="col-span-1">
                      <Badge variant="outline" className="border-muted rounded-md">
                        {student.rollNo}
                      </Badge>
                    </div>
                    <div className="col-span-4">
                      <span className="font-medium text-sm">{student.name}</span>
                    </div>
                    <div className="col-span-7">
                      <div className="grid grid-cols-4 gap-3 w-full">
                        <Button
                          variant={student.status === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                          size="lg"
                          onClick={() => updateAttendance(student.id, AttendanceStatus.PRESENT)}
                          disabled={saving}
                          className={`px-4 py-6 text-base font-semibold ${
                            student.status === AttendanceStatus.PRESENT
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <UserCheck className="mr-2 h-5 w-5" />
                          Present
                        </Button>
                        <Button
                          variant={student.status === AttendanceStatus.ABSENT ? 'destructive' : 'outline'}
                          size="lg"
                          onClick={() => updateAttendance(student.id, AttendanceStatus.ABSENT)}
                          disabled={saving}
                          className={`px-4 py-6 text-base font-semibold ${
                            student.status === AttendanceStatus.ABSENT
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <UserX className="mr-2 h-5 w-5" />
                          Absent
                        </Button>
                        <Button
                          variant={student.status === AttendanceStatus.LATE ? 'secondary' : 'outline'}
                          size="lg"
                          onClick={() => updateAttendance(student.id, AttendanceStatus.LATE)}
                          disabled={saving}
                          className={`px-4 py-6 text-base font-semibold ${
                            student.status === AttendanceStatus.LATE
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Clock className="mr-2 h-5 w-5" />
                          Late
                        </Button>
                        <Button
                          variant={student.status === AttendanceStatus.EXCUSED ? 'secondary' : 'outline'}
                          size="lg"
                          onClick={() => updateAttendance(student.id, AttendanceStatus.EXCUSED)}
                          disabled={saving}
                          className={`px-4 py-6 text-base font-semibold ${
                            student.status === AttendanceStatus.EXCUSED
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <AlertTriangle className="mr-2 h-5 w-5" />
                          Excused
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground" role="alert">
                {students.length === 0
                  ? 'No students found for this class and section'
                  : 'No students match your search'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;