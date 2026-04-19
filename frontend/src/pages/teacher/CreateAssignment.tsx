import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileUp,
  Calendar,
  BookOpen,
  Users,
  Save,
  Send,
  Loader2,
  ArrowLeft,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { assignmentAPI } from '@/services/api';

interface AssignmentFormData {
  title: string;
  description: string;
  subject: string;
  class_assigned: string;
  section: string;
  due_date: string;
  due_time: string;
  max_marks: string;
  instructions: string;
  attachment?: File | null;
  allow_late_submission: boolean;
}

const CreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    subject: '',
    class_assigned: '',
    section: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '23:59',
    max_marks: '10',
    instructions: '',
    allow_late_submission: false,
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Load assignment if editing
  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  // Fetch sections when class changes
  useEffect(() => {
    if (formData.class_assigned) {
      fetchSections();
    }
  }, [formData.class_assigned]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const classesRes = await assignmentAPI.assignments.list();
      const subjectsRes = await fetch('http://localhost:8000/api/academic/subjects/');

      if (classesRes && subjectsRes.ok) {
        // Get unique classes from assignments or fetch from API
        const classesFromAPI = await fetch('http://localhost:8000/api/core/classes/');
        if (classesFromAPI.ok) {
          const classesData = await classesFromAPI.json();
          setClasses(classesData.results || []);
        }

        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/core/sections/?class_assigned=${formData.class_assigned}`
      );
      if (res.ok) {
        const data = await res.json();
        setSections(data.results || []);
        if (data.results?.length > 0 && !formData.section) {
          setFormData((prev) => ({ ...prev, section: data.results[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await assignmentAPI.assignments.retrieve(parseInt(assignmentId!));
      const data = res.data;

      const dueDateTime = new Date(data.due_date);
      const date = dueDateTime.toISOString().split('T')[0];
      const time = dueDateTime.toTimeString().slice(0, 5);

      setFormData({
        title: data.title,
        description: data.description,
        subject: data.subject.toString(),
        class_assigned: data.class_assigned.toString(),
        section: data.section.toString(),
        due_date: date,
        due_time: time,
        max_marks: data.max_marks.toString(),
        instructions: data.instructions,
        allow_late_submission: data.allow_late_submission,
      });

      if (data.attachment) {
        setAttachmentName(data.attachment.split('/').pop());
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAttachment(e.target.files[0]);
      setAttachmentName(e.target.files[0].name);
      toast({
        title: 'File Selected',
        description: `"${e.target.files[0].name}" is ready to upload`,
      });
    }
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      allow_late_submission: e.target.checked,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Assignment title is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.subject) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.class_assigned) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.section) {
      toast({
        title: 'Validation Error',
        description: 'Please select a section',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const prepareBulkData = (status: 'draft' | 'assigned'): FormData => {
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('subject', formData.subject);
    payload.append('class_assigned', formData.class_assigned);
    payload.append('section', formData.section);
    payload.append('due_date', `${formData.due_date}T${formData.due_time}:00`);
    payload.append('max_marks', formData.max_marks);
    payload.append('instructions', formData.instructions);
    payload.append('status', status);
    payload.append('is_active', status === 'assigned' ? 'true' : 'true');
    payload.append('allow_late_submission', formData.allow_late_submission.toString());

    if (attachment) {
      payload.append('attachment', attachment);
    }

    return payload;
  };

  const saveAsDraft = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = prepareBulkData('draft');

      if (assignmentId) {
        await assignmentAPI.assignments.update(parseInt(assignmentId), payload);
      } else {
        await assignmentAPI.assignments.create(payload);
      }

      toast({
        title: 'Success',
        description: 'Assignment saved as draft!',
      });

      navigate('/teacher/assignments');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment as draft',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const publishAssignment = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = prepareBulkData('assigned');

      if (assignmentId) {
        await assignmentAPI.assignments.update(parseInt(assignmentId), payload);
      } else {
        await assignmentAPI.assignments.create(payload);
      }

      toast({
        title: 'Success',
        description: 'Assignment published successfully! Students can now see it.',
      });

      navigate('/teacher/assignments');
    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish assignment',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="teacher">
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/teacher/assignments')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          <h1 className="text-4xl font-bold mb-2">
            {assignmentId ? 'Edit Assignment' : 'Create New Assignment'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {assignmentId
              ? 'Update your assignment or publish it to students'
              : 'Create an amazing assignment for your students. Save as draft to work on it later, or publish immediately.'}
          </p>
        </div>

        {/* Basic Details Card */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Assignment Details
            </CardTitle>
            <CardDescription>Enter the main information about this assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Assignment Title *
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Chapter 5: Linear Equations Practice"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-2 h-10"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Make it clear and descriptive so students know what to work on
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what students need to do, objectives, requirements, and any important notes..."
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Provide clear instructions so students understand the assignment
              </p>
            </div>

            {/* Grid: Subject, Class, Section, Max Marks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject" className="font-semibold">
                  Subject *
                </Label>
                <Select value={formData.subject} onValueChange={(v) => handleSelectChange('subject', v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class_assigned" className="font-semibold">
                  Class *
                </Label>
                <Select
                  value={formData.class_assigned}
                  onValueChange={(v) => handleSelectChange('class_assigned', v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section" className="font-semibold">
                  Section *
                </Label>
                <Select
                  value={formData.section}
                  onValueChange={(v) => handleSelectChange('section', v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_marks" className="font-semibold">
                  Max Marks *
                </Label>
                <Input
                  id="max_marks"
                  name="max_marks"
                  type="number"
                  min="1"
                  max="999"
                  value={formData.max_marks}
                  onChange={handleInputChange}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <Label htmlFor="instructions" className="font-semibold">
                Additional Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                name="instructions"
                placeholder="Add any special instructions, tips, or reminders for students..."
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Due Date & Settings Card */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Due Date & Settings
            </CardTitle>
            <CardDescription>Set when the assignment is due and configure submission options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Due Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date" className="font-semibold">
                  Due Date *
                </Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="mt-2 h-10"
                />
              </div>

              <div>
                <Label htmlFor="due_time" className="font-semibold">
                  Due Time *
                </Label>
                <Input
                  id="due_time"
                  name="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={handleInputChange}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            {/* Late Submission Toggle */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="allow_late_submission"
                checked={formData.allow_late_submission}
                onChange={handleToggleChange}
                className="rounded w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <Label htmlFor="allow_late_submission" className="cursor-pointer font-semibold text-sm">
                  Allow Late Submissions
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Students can submit after the due date (you'll see them marked as late)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Card */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Attachment (Optional)
            </CardTitle>
            <CardDescription>Upload a file for students to download with the assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition">
              <FileUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.png,.xls,.xlsx,.pptx"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <p className="text-sm font-semibold mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, TXT, JPG, PNG, XLS, XLSX, PPTX (max 10MB)
                </p>
              </label>

              {attachmentName && (
                <div className="mt-4 flex justify-center">
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    {attachmentName}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/assignments')}
            disabled={saving}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={saveAsDraft}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save as Draft
          </Button>

          <Button
            onClick={publishAssignment}
            disabled={saving}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Assignment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateAssignment;
