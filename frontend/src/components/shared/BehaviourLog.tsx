import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, User, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { behaviorAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: number;
  student: string;
  behavior_type: 'positive' | 'negative' | 'neutral';
  category?: { name: string };
  description: string;
  reported_by?: string;
  date_recorded: string;
  severity: 'low' | 'medium' | 'high';
}

export default function BehaviourLog({ canAdd = false }: { canAdd?: boolean }) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student: '', behavior_type: 'positive', category: '', description: '', severity: 'low' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [l, c] = await Promise.all([behaviorAPI.logs.list(), behaviorAPI.categories.list()]);
      setLogs(l.data || []);
      setCategories(c.data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student || !form.description || !form.category) {
      toast({ title: 'Error', description: 'Fill all fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await behaviorAPI.logs.create(form);
      toast({ title: 'Success', description: 'Added' });
      setForm({ student: '', behavior_type: 'positive', category: '', description: '', severity: 'low' });
      setOpen(false);
      loadData();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const pos = logs.filter(l => l.behavior_type === 'positive').length;
  const neg = logs.filter(l => l.behavior_type === 'negative').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Behaviour Log</h1>
          <p className="text-muted-foreground">Track student behaviour</p>
        </div>
        {canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Log</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input type="number" value={form.student} onChange={(e) => setForm({...form, student: e.target.value})} placeholder="Student ID" required />
                <Select value={form.behavior_type} onValueChange={(v: any) => setForm({...form, behavior_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={form.severity} onValueChange={(v: any) => setForm({...form, severity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Describe..." rows={4} required />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Positive</p><p className="text-2xl font-bold text-green-600">{pos}</p></div><CheckCircle className="h-8 w-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Negative</p><p className="text-2xl font-bold text-red-600">{neg}</p></div><AlertTriangle className="h-8 w-8 text-red-600" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{logs.length}</p></div><Clock className="h-8 w-8 text-blue-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : logs.length === 0 ? <div className="text-center py-8">No logs</div> : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <div><h3 className="font-medium">{log.category?.name}</h3></div>
                    <Badge>{log.behavior_type}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{log.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{log.reported_by}</span>
                    <span>{new Date(log.date_recorded).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}