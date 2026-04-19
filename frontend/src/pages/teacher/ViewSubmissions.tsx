import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search as SearchIcon,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { assignmentAPI } from '@/services/api';

interface Submission {
  id: number;
  student_name: string;
  student_roll: string;
  assignment_title: string;
  submitted_at: string;
  marks_obtained: number | null;
  feedback: string;
  is_late: boolean;
  attachment: string;
  text_submission: string;
}

interface AssignmentInfo {
  id: number;
  title: string;
  max_marks: number;
  due_date: string;
  total_students: number;
}

const ViewSubmissions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const assignmentId = searchParams.get('assignmentId');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Grading form state
  const [gradingData, setGradingData] = useState({
    marks: '',
    feedback: '',
  });

  // Load submissions and assignment info
  useEffect(() => {
    if (assignmentId) {
      loadData();
      // Auto-refresh every 30 seconds if enabled
      const interval = autoRefresh ? setInterval(loadData, 30000) : undefined;
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [assignmentId, autoRefresh]);

  const loadData = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      // Fetch submissions
      const submissionsRes = await assignmentAPI.assignments.submissions(parseInt(assignmentId));
      setSubmissions(submissionsRes.data || []);

      // Fetch assignment info
      const assignmentRes = await assignmentAPI.assignments.retrieve(parseInt(assignmentId));
      setAssignmentInfo(assignmentRes.data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (submissionId: number) => {
    if (!gradingData.marks || isNaN(parseFloat(gradingData.marks))) {
      toast({
        title: 'Error',
        description: 'Please enter a valid marks value',
        variant: 'destructive',
      });
      return;
    }

    const marks = parseFloat(gradingData.marks);
    if (assignmentInfo && (marks < 0 || marks > assignmentInfo.max_marks)) {
      toast({
        title: 'Error',
        description: `Marks must be between 0 and ${assignmentInfo.max_marks}`,
        variant: 'destructive',
      });
      return;
    }

    setGrading(submissionId);
    try {
      await assignmentAPI.submissions.grade(submissionId, {
        marks_obtained: marks,
        feedback: gradingData.feedback,
      });

      // Update local state
      setSubmissions(
        submissions.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                marks_obtained: marks,
                feedback: gradingData.feedback,
              }
            : sub
        )
      );

      toast({
        title: 'Success',
        description: `Grades submitted for ${
          submissions.find((s) => s.id === submissionId)?.student_name
        }`,
      });

      setGradingData({ marks: '', feedback: '' });
      setGrading(null);
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit grades',
        variant: 'destructive',
      });
    } finally {
      setGrading(null);
    }
  };

  // Filter submissions
  let filteredSubmissions = submissions.filter((s) =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_roll.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterStatus !== 'all') {
    if (filterStatus === 'submitted') {
      filteredSubmissions = filteredSubmissions.filter((s) => s.marks_obtained === null);
    } else if (filterStatus === 'graded') {
      filteredSubmissions = filteredSubmissions.filter((s) => s.marks_obtained !== null);
    } else if (filterStatus === 'late') {
      filteredSubmissions = filteredSubmissions.filter((s) => s.is_late);
    }
  }

  const gradedCount = submissions.filter((s) => s.marks_obtained !== null).length;
  const lateCount = submissions.filter((s) => s.is_late).length;

  const getStatusBadge = (submission: Submission) => {
    if (submission.marks_obtained !== null) {
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
    }
    return (
      <Badge
        className={submission.is_late ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
      >
        {submission.is_late ? 'Late' : 'Submitted'}
      </Badge>
    );
  };

  if (!assignmentId) {
    return (
      <DashboardLayout requiredRole="teacher">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No assignment selected</p>
            <Link to="/teacher/assignments">
              <Button>Go to Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/teacher/assignments" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Assignments
          </Link>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">
                {assignmentInfo?.title} - Submissions
              </h1>
              <p className="text-muted-foreground">
                Review and grade student submissions in real-time
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Assignment Stats */}
        {assignmentInfo && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-2xl font-bold">{assignmentInfo.total_students}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                  <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Graded</p>
                  <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Late</p>
                  <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Grading Progress</span>
                  <span>
                    {gradedCount} of {submissions.length}
                  </span>
                </div>
                <Progress
                  value={submissions.length > 0 ? (gradedCount / submissions.length) * 100 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="submitted">Pending Grading</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="late">Late Submissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Refresh Toggle */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded w-4 h-4 cursor-pointer"
          />
          <Label htmlFor="autoRefresh" className="cursor-pointer text-sm">
            Auto-refresh every 30 seconds to see new submissions
          </Label>
        </div>

        {/* Submissions List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="text-center py-12">
              <CardContent>
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                <p className="text-muted-foreground">Loading submissions...</p>
              </CardContent>
            </Card>
          ) : filteredSubmissions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No submissions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold">
                          {submission.student_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{submission.student_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Roll: {submission.student_roll}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(submission)}
                      {submission.marks_obtained !== null && (
                        <Badge className="bg-blue-50 text-blue-800">
                          {submission.marks_obtained}/{assignmentInfo?.max_marks} marks
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-3">
                  {/* Submission Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                    {submission.is_late && (
                      <Badge variant="destructive" className="text-xs ml-auto">
                        Late Submission
                      </Badge>
                    )}
                  </div>

                  {/* Submission Content */}
                  {submission.text_submission && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-semibold mb-1">Text Submission:</p>
                      <p className="text-sm text-muted-foreground max-h-24 overflow-y-auto">
                        {submission.text_submission}
                      </p>
                    </div>
                  )}

                  {submission.attachment && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm flex-1 truncate">{submission.attachment}</span>
                      <a href={`http://localhost:8000/api${submission.attachment}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}

                  {/* Grades and Feedback */}
                  {submission.marks_obtained !== null && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold">
                          Marks: {submission.marks_obtained}/{assignmentInfo?.max_marks}
                        </span>
                      </div>
                      {submission.feedback && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                          <p className="text-sm font-semibold mb-1">Your Feedback:</p>
                          <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <div className="border-t px-6 py-3 flex justify-end">
                  {submission.marks_obtained === null ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Grade This Submission
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Grade Submission</DialogTitle>
                          <DialogDescription>
                            Grade {submission.student_name}'s submission
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="marks" className="text-base">
                              Marks (out of {assignmentInfo?.max_marks}) *
                            </Label>
                            <Input
                              id="marks"
                              type="number"
                              min="0"
                              max={assignmentInfo?.max_marks}
                              placeholder="Enter marks"
                              value={gradingData.marks}
                              onChange={(e) =>
                                setGradingData({ ...gradingData, marks: e.target.value })
                              }
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="feedback" className="text-base">
                              Feedback (Optional)
                            </Label>
                            <Textarea
                              id="feedback"
                              placeholder="Provide constructive feedback to the student..."
                              value={gradingData.feedback}
                              onChange={(e) =>
                                setGradingData({ ...gradingData, feedback: e.target.value })
                              }
                              rows={4}
                              className="mt-2"
                            />
                          </div>

                          <Button
                            onClick={() => handleGradeSubmit(submission.id)}
                            disabled={grading === submission.id}
                            className="w-full gap-2"
                          >
                            {grading === submission.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Submit Grade
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="secondary" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Already Graded
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewSubmissions;
