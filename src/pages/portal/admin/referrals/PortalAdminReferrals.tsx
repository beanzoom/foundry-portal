import { useState, useEffect, useMemo } from 'react';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Send,
  Eye,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReferralDeleteDialog } from '@/components/portal/admin/ReferralDeleteDialog';
import { canDeleteReferrals } from '@/services/referral-deletion.service';

interface Referral {
  id: string;
  referrer_id: string;
  referrer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  referee_first_name: string;
  referee_last_name: string;
  referee_email: string;
  referee_phone?: string;
  dsp_name?: string;
  dsp_code?: string;
  referral_code: string;
  status: 'pending' | 'sent' | 'registered' | 'completed';
  created_at: string;
  sent_at?: string;
  registered_at?: string;
  completed_at?: string;
  resend_count: number;
}

interface ReferralStats {
  total: number;
  pending: number;
  sent: number;
  registered: number;
  completed: number;
  conversionRate: number;
  lastWeek: number;
  growth: number;
}

export function PortalAdminReferrals() {
  const { portalUser } = usePortal();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('30');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [referralToDelete, setReferralToDelete] = useState<Referral | null>(null);
  const [canDelete, setCanDelete] = useState(false);

  // Fetch all referrals
  const fetchReferrals = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const daysAgo = dateRange === 'all' ? 36500 : parseInt(dateRange);
      const startDate = subDays(new Date(), daysAgo).toISOString();

      // Fetch referrals with referrer details
      // Exclude marketing-type referrals (they're managed in Settings → Marketing)
      const { data, error } = await supabase
        .from('portal_referrals')
        .select(`
          *,
          referrer:profiles!referrer_id(first_name, last_name, email)
        `)
        .gte('created_at', startDate)
        .neq('referral_type', 'marketing') // Exclude marketing funnels
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);

      // Calculate stats
      if (data) {
        const total = data.length;
        const pending = data.filter(r => r.status === 'pending').length;
        const sent = data.filter(r => r.status === 'sent').length;
        const registered = data.filter(r => r.status === 'registered').length;
        const completed = data.filter(r => r.status === 'completed').length;

        // Calculate last week's referrals for growth
        const lastWeekDate = subDays(new Date(), 7).toISOString();
        const lastWeek = data.filter(r => r.created_at >= lastWeekDate).length;
        const previousWeek = data.filter(r =>
          r.created_at < lastWeekDate &&
          r.created_at >= subDays(new Date(), 14).toISOString()
        ).length;

        const growth = previousWeek > 0
          ? ((lastWeek - previousWeek) / previousWeek) * 100
          : 100;

        setStats({
          total,
          pending,
          sent,
          registered,
          completed,
          conversionRate: total > 0 ? (completed / total) * 100 : 0,
          lastWeek,
          growth
        });
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referrals',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [dateRange]);

  // Check if user can delete referrals
  useEffect(() => {
    canDeleteReferrals().then(result => {
      setCanDelete(result);
    });
  }, []);

  // Filter referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter(referral => {
      const referrerName = referral.referrer ? `${referral.referrer.first_name} ${referral.referrer.last_name}` : '';
      const matchesSearch = searchTerm === '' ||
        referral.referee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${referral.referee_first_name} ${referral.referee_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referrer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.dsp_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [referrals, searchTerm, statusFilter]);

  // Resend invitation
  const handleResendInvitation = async (referralId: string) => {
    try {
      setResending(referralId);

      const { data, error } = await supabase.rpc('resend_referral_invitation', {
        p_referral_id: referralId,
        p_admin_id: portalUser?.id
      });

      if (error) throw error;

      // Try to send email
      try {
        await supabase.functions.invoke('send-referral-invitation', {
          body: { referralId }
        });
      } catch (emailError) {
        console.warn('Email could not be sent:', emailError);
      }

      toast({
        title: 'Success',
        description: 'Invitation resent successfully'
      });

      fetchReferrals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive'
      });
    } finally {
      setResending(null);
    }
  };

  // Copy referral link
  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/portal/auth?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied',
      description: 'Referral link copied to clipboard'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const csv = [
      ['Referrer', 'Referee Name', 'Email', 'Phone', 'DSP', 'Status', 'Date', 'Referral Code'],
      ...filteredReferrals.map(r => [
        r.referrer ? `${r.referrer.first_name} ${r.referrer.last_name}` : '',
        `${r.referee_first_name} ${r.referee_last_name}`,
        r.referee_email,
        r.referee_phone || '',
        r.dsp_name || '',
        r.status,
        format(parseISO(r.created_at), 'yyyy-MM-dd'),
        r.referral_code
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      pending: 'secondary',
      sent: 'outline',
      registered: 'default',
      completed: 'default'
    };

    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      sent: 'text-blue-600',
      registered: 'text-purple-600',
      completed: 'text-green-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-600">View and manage all portal referrals</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.total}</span>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.lastWeek} this week
                {stats.growth > 0 && (
                  <span className="text-green-600 ml-1">+{stats.growth.toFixed(0)}%</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pending}</span>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Registered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.registered}</span>
                <UserPlus className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Signed up</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Completed referrals</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or DSP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-[150px]">
              <Label htmlFor="status" className="sr-only">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <Label htmlFor="dateRange" className="sr-only">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referrals ({filteredReferrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No referrals found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>DSP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {referral.referrer
                              ? `${referral.referrer.first_name} ${referral.referrer.last_name}`
                              : 'Unknown'}
                          </div>
                          <div className="text-gray-500">{referral.referrer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {referral.referee_first_name} {referral.referee_last_name}
                      </TableCell>
                      <TableCell>{referral.referee_email}</TableCell>
                      <TableCell>{referral.referee_phone || '-'}</TableCell>
                      <TableCell>
                        {referral.dsp_name ? (
                          <div className="text-sm">
                            <div>{referral.dsp_name}</div>
                            {referral.dsp_code && (
                              <div className="text-gray-500">{referral.dsp_code}</div>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(referral.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReferral(referral)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyReferralLink(referral.referral_code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {referral.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResendInvitation(referral.id)}
                              disabled={resending === referral.id}
                            >
                              {resending === referral.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {(canDelete || true) && referral.status !== 'registered' && referral.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReferralToDelete(referral)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
            <DialogDescription>
              Complete information about this referral
            </DialogDescription>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Referrer</Label>
                  <p className="font-medium">
                    {selectedReferral.referrer
                      ? `${selectedReferral.referrer.first_name} ${selectedReferral.referrer.last_name}`
                      : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReferral.referrer?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReferral.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Referee Name</Label>
                  <p className="font-medium">
                    {selectedReferral.referee_first_name} {selectedReferral.referee_last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium">{selectedReferral.referee_email}</p>
                </div>
              </div>

              {(selectedReferral.referee_phone || selectedReferral.dsp_name) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedReferral.referee_phone && (
                    <div>
                      <Label className="text-xs text-gray-500">Phone</Label>
                      <p className="font-medium">{selectedReferral.referee_phone}</p>
                    </div>
                  )}
                  {selectedReferral.dsp_name && (
                    <div>
                      <Label className="text-xs text-gray-500">DSP</Label>
                      <p className="font-medium">{selectedReferral.dsp_name}</p>
                      {selectedReferral.dsp_code && (
                        <p className="text-sm text-gray-600">{selectedReferral.dsp_code}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500">Referral Code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {selectedReferral.referral_code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyReferralLink(selectedReferral.referral_code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Created</Label>
                  <p>{format(parseISO(selectedReferral.created_at), 'PPp')}</p>
                </div>
                {selectedReferral.sent_at && (
                  <div>
                    <Label className="text-xs text-gray-500">Sent</Label>
                    <p>{format(parseISO(selectedReferral.sent_at), 'PPp')}</p>
                  </div>
                )}
                {selectedReferral.registered_at && (
                  <div>
                    <Label className="text-xs text-gray-500">Registered</Label>
                    <p>{format(parseISO(selectedReferral.registered_at), 'PPp')}</p>
                  </div>
                )}
                {selectedReferral.completed_at && (
                  <div>
                    <Label className="text-xs text-gray-500">Completed</Label>
                    <p>{format(parseISO(selectedReferral.completed_at), 'PPp')}</p>
                  </div>
                )}
              </div>

              {selectedReferral.resend_count > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation has been resent {selectedReferral.resend_count} time(s)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ReferralDeleteDialog
        referral={referralToDelete}
        isOpen={!!referralToDelete}
        onClose={() => setReferralToDelete(null)}
        onSuccess={() => {
          setReferralToDelete(null);
          fetchReferrals();
        }}
      />
    </div>
  );
}