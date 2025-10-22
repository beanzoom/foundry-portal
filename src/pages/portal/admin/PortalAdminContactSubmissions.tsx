import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  User, 
  MessageSquare, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { contactService, ContactSubmissionWithUser } from '@/services/contact.service';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function PortalAdminContactSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ContactSubmissionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Debug: Log the current user
  useEffect(() => {
    console.log('Current user in ContactSubmissions:', user);
    console.log('User ID:', user?.id);
  }, [user]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmissionWithUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  
  // Statistics
  const [stats, setStats] = useState({
    total_submissions: 0,
    new_submissions: 0,
    in_progress_submissions: 0,
    resolved_submissions: 0,
    submissions_today: 0,
    submissions_this_week: 0,
    submissions_this_month: 0
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'read', label: 'Read' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'archived', label: 'Archived' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'feedback', label: 'Product Feedback' },
    { value: 'investor', label: 'Investor Inquiry' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [statusFilter, categoryFilter, currentPage]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const filters: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      const { data, count } = await contactService.getSubmissions(filters);
      
      if (data) {
        // Apply search filter locally
        let filteredData = data;
        if (searchQuery) {
          filteredData = data.filter(sub => 
            sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.company?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setSubmissions(filteredData);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await contactService.getSubmissionStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = async (submission: ContactSubmissionWithUser) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setShowDetailModal(true);
    
    // Mark as read if it's new
    if (submission.status === 'new' && submission.id) {
      await contactService.markAsRead(submission.id);
      fetchSubmissions();
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedSubmission?.id) return;
    
    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }
      
      if (adminNotes && adminNotes !== selectedSubmission.admin_notes) {
        updates.admin_notes = adminNotes;
      }
      
      await contactService.updateSubmission(selectedSubmission.id, updates);
      
      setShowDetailModal(false);
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      await contactService.deleteSubmission(id);
      fetchSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { variant: 'default' as const, icon: AlertCircle, label: 'New' },
      read: { variant: 'secondary' as const, icon: Eye, label: 'Read' },
      in_progress: { variant: 'outline' as const, icon: Clock, label: 'In Progress' },
      resolved: { variant: 'success' as const, icon: CheckCircle, label: 'Resolved' },
      archived: { variant: 'secondary' as const, icon: Archive, label: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      general: 'bg-blue-100 text-blue-800',
      feature: 'bg-purple-100 text-purple-800',
      feedback: 'bg-green-100 text-green-800',
      investor: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    const className = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
    const label = categoryOptions.find(opt => opt.value === category)?.label || category;
    
    return (
      <Badge className={cn('font-medium', className)}>
        {label}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-gray-600">Manage and respond to contact form submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_submissions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new_submissions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.in_progress_submissions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved_submissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                fetchSubmissions();
                fetchStats();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      Loading submissions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <TableRow key={submission.id} className={submission.status === 'new' ? 'bg-blue-50' : ''}>
                    <TableCell>{getStatusBadge(submission.status || 'new')}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {submission.created_at ? format(new Date(submission.created_at), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>{getCategoryBadge(submission.category)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{submission.subject}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => submission.id && handleDelete(submission.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Submission Details</DialogTitle>
            <DialogDescription>
              Review and respond to this contact submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status || 'new')}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Category</Label>
                  <div className="mt-1">{getCategoryBadge(selectedSubmission.category)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Submitted</Label>
                  <div className="mt-1 text-sm">
                    {selectedSubmission.created_at 
                      ? format(new Date(selectedSubmission.created_at), 'PPpp')
                      : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Subject</Label>
                  <div className="mt-1 font-medium">{selectedSubmission.subject}</div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="border-t pt-4">
                <Label className="text-sm text-gray-600 mb-3 block">Contact Information</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedSubmission.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedSubmission.email}`} className="text-blue-600 hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </div>
                  {selectedSubmission.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedSubmission.phone}</span>
                    </div>
                  )}
                  {selectedSubmission.company && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{selectedSubmission.company}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Message */}
              <div className="border-t pt-4">
                <Label className="text-sm text-gray-600 mb-2 block">Message</Label>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>
              
              {/* Admin Notes */}
              <div className="border-t pt-4">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes about this submission..."
                  className="mt-2"
                />
              </div>
              
              {/* Resolution Info */}
              {selectedSubmission.resolved_at && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Resolved on {format(new Date(selectedSubmission.resolved_at), 'PPp')}
                    {selectedSubmission.resolved_by_name && ` by ${selectedSubmission.resolved_by_name}`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            {selectedSubmission?.status !== 'resolved' && (
              <>
                {selectedSubmission?.status === 'new' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={updating}
                  >
                    Mark as In Progress
                  </Button>
                )}
                <Button
                  onClick={() => handleUpdateStatus('resolved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Resolved
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}