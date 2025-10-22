import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface CampaignAnalytics {
  campaign_code: string;
  campaign_name: string;
  total_conversions: number;
  last_30_days: number;
  last_7_days: number;
  conversion_rate: number;
  last_conversion_at: string | null;
}

interface MarketingFunnel {
  id: string;
  referral_code: string;
  source_metadata: {
    source_name?: string;
  };
  total_conversions: number;
  conversions_last_30_days: number;
  conversions_last_7_days: number;
}

interface FunnelAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnel: MarketingFunnel | null;
  analytics: CampaignAnalytics[];
}

export function FunnelAnalyticsDialog({
  open,
  onOpenChange,
  funnel,
  analytics
}: FunnelAnalyticsDialogProps) {
  if (!funnel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {funnel.source_metadata?.source_name || 'Marketing Funnel'} - Analytics
          </DialogTitle>
          <DialogDescription>
            Conversion tracking broken down by campaign. Code: {funnel.referral_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Conversions</p>
                    <p className="text-2xl font-bold">{funnel.total_conversions}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 30 Days</p>
                    <p className="text-2xl font-bold">{funnel.conversions_last_30_days}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last 7 Days</p>
                    <p className="text-2xl font-bold">{funnel.conversions_last_7_days}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Breakdown */}
          <div className="space-y-2">
            <h3 className="font-semibold">Campaign Breakdown</h3>
            {analytics.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No conversions tracked yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Conversions will appear here once users sign up using your campaign links
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Last 30d</TableHead>
                      <TableHead className="text-center">Last 7d</TableHead>
                      <TableHead className="text-center">% of Total</TableHead>
                      <TableHead>Last Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((campaign) => (
                      <TableRow key={campaign.campaign_code}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.campaign_name}</p>
                            <code className="text-xs text-gray-500">{campaign.campaign_code}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{campaign.total_conversions}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.last_30_days}
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.last_7_days}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-purple-600">
                            {campaign.conversion_rate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {campaign.last_conversion_at
                            ? format(new Date(campaign.last_conversion_at), 'MMM d, yyyy h:mm a')
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Insights */}
          {analytics.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Best performing campaign:{' '}
                  <strong>{analytics[0].campaign_name}</strong> ({analytics[0].total_conversions} conversions)
                </li>
                <li>
                  • Total campaigns tracked: <strong>{analytics.length}</strong>
                </li>
                {analytics.some(a => a.campaign_code === 'direct') && (
                  <li>
                    • Direct signups (no campaign):{' '}
                    <strong>
                      {analytics.find(a => a.campaign_code === 'direct')?.total_conversions || 0}
                    </strong>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
