import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  Send,
  Copy,
  MoreVertical,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { usePortal } from '@/contexts/PortalContext';
import { useToast } from '@/hooks/use-toast';
import { ReferralForm } from '@/components/portal/referrals/ReferralForm';

interface Referral {
  id: string;
  referee_first_name: string;
  referee_last_name: string;
  referee_email: string;
  referee_phone?: string;
  dsp_name?: string;
  dsp_code?: string;
  referral_code: string;
  status: 'pending' | 'sent' | 'registered' | 'completed';
  invitation_sent_at?: string;
  last_resent_at?: string;
  resend_count: number;
  registered_at?: string;
  created_at: string;
  conversion_date?: string;
  onboarding_completed: boolean;
}

interface ReferralStats {
  total_referrals: number;
  invitations_sent: number;
  registrations: number;
  completed: number;
  pending: number;
  conversion_rate: number;
  this_month: number;
  last_referral_date?: string;
}

export function PortalReferrals() {
  const { portalUser } = usePortal();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    if (portalUser) {
      loadReferrals();
      loadStats();
    }
  }, [portalUser]);

  const loadReferrals = async () => {
    if (!portalUser) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_referrals', {
          p_user_id: portalUser.id
        });

      if (error) {
        console.error('Error loading referrals:', error);
        toast({
          title: 'Error',
          description: 'Failed to load referrals',
          variant: 'destructive'
        });
        return;
      }

      setReferrals(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!portalUser) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_referral_stats', {
          p_user_id: portalUser.id
        });

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      setStats(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleResendInvitation = async (referralId: string) => {
    setResendingId(referralId);

    try {
      const { data, error } = await supabase
        .rpc('resend_referral_invitation', {
          p_referral_id: referralId
        });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to resend invitation',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Invitation Resent',
        description: 'The referral invitation has been sent again',
        duration: 3000
      });

      // Reload referrals to get updated data
      await loadReferrals();
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setResendingId(null);
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/portal/auth?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      description: 'Referral link has been copied to clipboard',
      duration: 2000
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Onboarded';
      case 'registered':
        return 'Registered';
      case 'sent':
        return 'Invited';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch = searchQuery === '' ||
      `${referral.referee_first_name} ${referral.referee_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.dsp_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || referral.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const exportReferrals = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'DSP Name', 'Status', 'Sent Date', 'Registered Date'],
      ...filteredReferrals.map(r => [
        `${r.referee_first_name} ${r.referee_last_name}`,
        r.referee_email,
        r.referee_phone || '',
        r.dsp_name || '',
        getStatusLabel(r.status),
        r.created_at ? format(new Date(r.created_at), 'MM/dd/yyyy') : '',
        r.registered_at ? format(new Date(r.registered_at), 'MM/dd/yyyy') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referrals</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Invite colleagues to join the Fleet DRMS Portal and track their progress
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total_referrals}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-500">Success</span>
              </div>
              <p className="text-2xl font-bold">{stats.registrations}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Registered Users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-500">Rate</span>
              </div>
              <p className="text-2xl font-bold">{stats.conversion_rate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Conversion Rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-gray-500">Recent</span>
              </div>
              <p className="text-2xl font-bold">{stats.this_month}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This Month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                Manage and track all your referral invitations
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowReferralForm(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite Colleague
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="sent">Invited</TabsTrigger>
                <TabsTrigger value="registered">Registered</TabsTrigger>
                <TabsTrigger value="completed">Onboarded</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              onClick={exportReferrals}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading referrals...</p>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery || selectedStatus !== 'all'
                  ? 'No referrals found matching your filters'
                  : 'No referrals yet'}
              </p>
              {searchQuery === '' && selectedStatus === 'all' && (
                <p className="text-sm text-gray-500 mb-4">
                  Start by inviting a colleague to join the portal
                </p>
              )}
              <Button
                onClick={() => setShowReferralForm(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Send Your First Invitation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referee_first_name} {referral.referee_last_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {referral.referee_email}
                            </span>
                          </div>
                          {referral.referee_phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {referral.referee_phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {referral.dsp_name && (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3 text-gray-400" />
                            <span>{referral.dsp_name}</span>
                            {referral.dsp_code && (
                              <span className="text-gray-500">({referral.dsp_code})</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          {getStatusLabel(referral.status)}
                        </Badge>
                        {referral.conversion_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(referral.conversion_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(new Date(referral.created_at), 'MMM d, yyyy')}
                          </p>
                          {referral.resend_count > 0 && (
                            <p className="text-xs text-gray-500">
                              Resent {referral.resend_count}x
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => copyReferralLink(referral.referral_code)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            {referral.status !== 'registered' && referral.status !== 'completed' && (
                              <DropdownMenuItem
                                onClick={() => handleResendInvitation(referral.id)}
                                disabled={resendingId === referral.id}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Form Modal */}
      <ReferralForm
        open={showReferralForm}
        onOpenChange={setShowReferralForm}
        onSuccess={() => {
          loadReferrals();
          loadStats();
        }}
      />
    </div>
  );
}