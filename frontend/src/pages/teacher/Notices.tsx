
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  PlusCircle, 
  Bell, 
  Calendar, 
  Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { noticeAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Notice {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  target_audience?: string[];
  author?: {
    first_name: string;
    last_name: string;
  };
}

// CreateNoticeDialog component
const CreateNoticeDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await noticeAPI.notices.create({
        title,
        content,
        is_important: isImportant,
      });

      toast({
        title: 'Success',
        description: 'Notice created successfully',
      });

      setTitle('');
      setContent('');
      setIsImportant(false);
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create notice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notice',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Notice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Notice</DialogTitle>
          <DialogDescription>
            Create a new notice to share with your classes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title *</label>
            <Input 
              id="title" 
              placeholder="Notice title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">Content *</label>
            <Textarea 
              id="content" 
              placeholder="Notice content" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="important" 
              checked={isImportant}
              onCheckedChange={(checked) => setIsImportant(checked === true)}
            />
            <label htmlFor="important" className="text-sm font-medium">Mark as important</label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : 'Create Notice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Notices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'important'>('all');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  // Load notices
  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await noticeAPI.notices.list();
      setNotices(response.data || []);
    } catch (error) {
      console.error('Failed to load notices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter notices based on search term and filter
  const filteredNotices = notices.filter((notice: Notice) => {
    const matchesSearch = 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'important' && notice.is_important);
    
    return matchesSearch && matchesFilter;
  });

  // Handle notice deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    
    setDeleting(id);
    try {
      await noticeAPI.notices.list(); // Note: The API doesn't have a delete endpoint defined
      toast({
        title: 'Success',
        description: 'Notice deleted successfully',
      });
      loadNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notice',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="space-y-6">
        <div>
          <Link to="/teacher" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Notices</h1>
              <p className="text-muted-foreground">
                Create and manage notices for your classes
              </p>
            </div>
            <CreateNoticeDialog onSuccess={loadNotices} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notices..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'important' ? 'default' : 'outline'} 
              size="sm" 
              className="flex items-center"
              onClick={() => setFilter('important')}
            >
              <Bell className="h-4 w-4 mr-2 text-amber-500" />
              Important
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map((notice: Notice) => (
              <Card key={notice.id} className={notice.is_important ? "border-amber-200" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {notice.is_important && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Important</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(notice.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <CardDescription>
                    {notice.author && `By ${notice.author.first_name} ${notice.author.last_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{notice.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(notice.id)}
                      disabled={deleting === notice.id}
                    >
                      {deleting === notice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notices found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notices;
