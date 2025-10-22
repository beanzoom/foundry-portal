import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  Download,
  Eye,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Clock,
  Settings,
  Briefcase,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { calculatorService, type CalculatorSubmission, type CalculatorStats } from '@/services/calculator.service';
import { toast } from '@/hooks/use-toast';

export function CalculatorSubmissions() {
  const [submissions, setSubmissions] = useState<CalculatorSubmission[]>([]);
  const [stats, setStats] = useState<CalculatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<CalculatorSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minSavings, setMinSavings] = useState('');
  const [maxSavings, setMaxSavings] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch submissions and stats in parallel
      const [submissionsData, statsData] = await Promise.all([
        calculatorService.getAllSubmissions(),
        calculatorService.getStatistics()
      ]);
      
      setSubmissions(submissionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calculator submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const filtered = await calculatorService.getAllSubmissions({
        search: searchTerm,
        startDate: dateRange.start,
        endDate: dateRange.end,
        minSavings: minSavings ? parseFloat(minSavings) : undefined,
        maxSavings: maxSavings ? parseFloat(maxSavings) : undefined,
      });
      setSubmissions(filtered);
    } catch (error) {
      console.error('Error filtering:', error);
      toast({
        title: 'Error',
        description: 'Failed to filter submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no submissions to export.',
        variant: 'destructive',
      });
      return;
    }
    
    const filename = `calculator-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    calculatorService.downloadCSV(submissions, filename);
    
    toast({
      title: 'Export successful',
      description: `Downloaded ${submissions.length} submissions as CSV.`,
    });
  };

  const viewSubmissionDetails = async (submission: CalculatorSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await calculatorService.deleteSubmission(id);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Submission deleted successfully',
        });

        await fetchData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete submission',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calculator Submissions</h1>
          <p className="text-muted-foreground">View and analyze user savings calculations</p>
        </div>
        <Button onClick={handleExportCSV} disabled={submissions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_submissions}</div>
              <p className="text-xs text-muted-foreground">
                from {stats.unique_users} users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Monthly Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.avg_monthly_savings)}
              </div>
              <p className="text-xs text-muted-foreground">per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Annual Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.avg_annual_savings)}
              </div>
              <p className="text-xs text-muted-foreground">per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest Potential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.max_monthly_savings)}
              </div>
              <p className="text-xs text-muted-foreground">monthly (top prospect)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissions_last_7_days}</div>
              <p className="text-xs text-muted-foreground">last 7 days</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="min-savings">Min Savings</Label>
              <Input
                id="min-savings"
                type="number"
                placeholder="0"
                value={minSavings}
                onChange={(e) => setMinSavings(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submissions</CardTitle>
          <CardDescription>
            {submissions.length} total submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="text-right">Annual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {format(new Date(submission.submission_date || ''), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.user_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.company_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(submission.total_monthly_savings)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(submission.total_annual_savings)}
                    </TableCell>
                    <TableCell>
                      {submission.is_latest ? (
                        <Badge variant="default">Latest</Badge>
                      ) : (
                        <Badge variant="secondary">Previous</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewSubmissionDetails(submission)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(submission.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete submission"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  {selectedSubmission.user_name} • {' '}
                  {format(new Date(selectedSubmission.submission_date || ''), 'MMMM d, yyyy h:mm a')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* User Information */}
              <div>
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{selectedSubmission.user_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{selectedSubmission.user_email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>{' '}
                    <span className="font-medium">{selectedSubmission.company_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fleet Size:</span>{' '}
                    <span className="font-medium">{selectedSubmission.fleet_size || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Savings Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Savings Breakdown</h3>
                
                {/* Labor Savings */}
                {selectedSubmission.labor_savings_items && selectedSubmission.labor_savings_items.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Labor Savings</span>
                      <Badge variant="secondary">
                        {formatCurrency(selectedSubmission.labor_savings_total)}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      {selectedSubmission.labor_savings_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            {item.employees} employees × {item.minutesPerDay} min/day = {formatCurrency(item.monthlySavings)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Replacements */}
                {selectedSubmission.system_replacement_items && selectedSubmission.system_replacement_items.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">System Replacements</span>
                      <Badge variant="secondary">
                        {formatCurrency(selectedSubmission.system_savings_total)}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      {selectedSubmission.system_replacement_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            {item.numberOfUsers} users × ${item.currentCostPerUser} = {formatCurrency(item.monthlySavings)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fixed Savings */}
                {selectedSubmission.fixed_savings_items && selectedSubmission.fixed_savings_items.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Fixed Savings</span>
                      <Badge variant="secondary">
                        {formatCurrency(selectedSubmission.fixed_savings_total)}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      {selectedSubmission.fixed_savings_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(item.monthlyAmount || item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Total Savings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Monthly:</span>{' '}
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(selectedSubmission.total_monthly_savings)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual:</span>{' '}
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(selectedSubmission.total_annual_savings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedSubmission.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}