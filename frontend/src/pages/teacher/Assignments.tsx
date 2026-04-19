
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus,
  FileText,
  Clock,
  Calendar,
  PenLine,
  MoreVertical,
  ChevronDown,
  Filter,
  Loader2,
  Trash2,
  Edit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { assignmentAPI } from '@/services/api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  class_name: string;
  due_date: string;
  assigned_date: string;
  status: 'draft' | 'assigned' | 'completed' | 'cancelled';
  submission_count: number;
  total_students: number;
  is_overdue: boolean;
  max_marks: number;
}

const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Fetch assignments
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.assignments.list();
      setAssignments(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    setDeleting(id);
    try {
      // Note: Implement delete endpoint in backend if needed
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully',
      });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete assignment',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Filter assignments
  let filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statusFilter !== 'all') {
    filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-200 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <Card className="hover:shadow-md transition">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusBadgeColor(assignment.status)}>
                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
              </Badge>
              {assignment.is_overdue && assignment.status === 'assigned' && (
                <Badge variant="destructive" className="text-xs">Overdue</Badge>
              )}
              <Badge variant="outline">{assignment.class_name}</Badge>
            </div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {assignment.status === 'assigned' && (
                <DropdownMenuItem onClick={() => navigate(`/teacher/view-submissions?assignmentId=${assignment.id}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Submissions
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => handleDelete(assignment.id)}
                disabled={deleting === assignment.id}
              >
                {deleting === assignment.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="mt-2">{assignment.description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">Assigned: {formatDate(assignment.assigned_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">Due: {formatDate(assignment.due_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">Max: {assignment.max_marks}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">Submissions: {assignment.submission_count}/{assignment.total_students}</span>
            </div>
          </div>

          {assignment.status === 'assigned' && assignment.total_students > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Submission Progress</span>
                <span>{Math.round((assignment.submission_count / assignment.total_students) * 100)}%</span>
              </div>
              <Progress 
                value={(assignment.submission_count / assignment.total_students) * 100} 
                className="h-2" 
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex justify-between gap-2">
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Details
        </Button>
        {assignment.status === 'draft' ? (
          <Button size="sm" onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}>
            Publish
          </Button>
        ) : assignment.status === 'assigned' ? (
          <Button 
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/teacher/view-submissions?assignmentId=${assignment.id}`)}
          >
            Grade
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            View Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/teacher" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">Assignments</h1>
              <p className="text-muted-foreground">
                Create, manage and grade assignments for your classes
              </p>
            </div>
            <Button 
              onClick={() => navigate('/teacher/assignments/create')}
              className="shrink-0 gap-2"
            >
              <Plus className="h-4 w-4" /> Create Assignment
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assignments..."
              className="pl-10 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="assigned">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-0 border-none space-y-4">
            {loading ? (
              <div className="flex justify-center items-center min-h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAssignments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No assignments yet</p>
                  <Button onClick={() => navigate('/teacher/assignments/create')}>
                    Create Your First Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="draft" className="p-0 border-none space-y-4">
            {filteredAssignments.filter(a => a.status === 'draft').length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No draft assignments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.filter(a => a.status === 'draft').map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="p-0 border-none space-y-4">
            {filteredAssignments.filter(a => a.status === 'assigned').length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No active assignments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.filter(a => a.status === 'assigned').map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="p-0 border-none space-y-4">
            {filteredAssignments.filter(a => a.status === 'completed').length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No completed assignments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.filter(a => a.status === 'completed').map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
