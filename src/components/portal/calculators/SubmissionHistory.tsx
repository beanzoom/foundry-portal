import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  History,
  Calendar,
  DollarSign,
  Clock,
  Settings,
  Briefcase,
  ChevronRight,
  FileText,
  Eye,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { calculatorService, type CalculatorSubmission } from '@/services/calculator.service';
import { toast } from '@/hooks/use-toast';

interface SubmissionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSubmission?: (submission: CalculatorSubmission) => void;
}

export function SubmissionHistory({ isOpen, onClose, onLoadSubmission }: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<CalculatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<CalculatorSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await calculatorService.getUserSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submission history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const viewDetails = (submission: CalculatorSubmission) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const handleLoadSubmission = (submission: CalculatorSubmission) => {
    if (onLoadSubmission) {
      onLoadSubmission(submission);
      onClose();
      toast({
        title: 'Submission loaded',
        description: 'Your previous calculation has been loaded into the calculator.',
      });
    }
  };

  const exportSubmission = (submission: CalculatorSubmission) => {
    const data = {
      date: submission.submission_date,
      monthly_savings: submission.total_monthly_savings,
      annual_savings: submission.total_annual_savings,
      labor_items: submission.labor_savings_items,
      system_items: submission.system_replacement_items,
      fixed_items: submission.fixed_savings_items,
      notes: submission.notes,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculator-submission-${format(new Date(submission.submission_date || ''), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Your Submission History
            </DialogTitle>
            <DialogDescription>
              View and manage your previous savings calculations
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading submissions...</div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No submissions yet</h3>
                <p className="text-muted-foreground">
                  Your calculator submissions will appear here after you submit them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(submission.submission_date || ''), 'MMMM d, yyyy h:mm a')}
                          </span>
                          {submission.is_latest && (
                            <Badge variant="default" className="ml-2">Latest</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="text-sm text-muted-foreground">Labor</div>
                              <div className="font-medium">
                                {formatCurrency(submission.labor_savings_total)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-purple-500" />
                            <div>
                              <div className="text-sm text-muted-foreground">Systems</div>
                              <div className="font-medium">
                                {formatCurrency(submission.system_savings_total)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="text-sm text-muted-foreground">Fixed</div>
                              <div className="font-medium">
                                {formatCurrency(submission.fixed_savings_total)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Monthly Total</div>
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(submission.total_monthly_savings)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Annual Total</div>
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(submission.total_annual_savings)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDetails(submission)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {onLoadSubmission && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLoadSubmission(submission)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Load
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportSubmission(submission)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                        
                        {submission.notes && (
                          <>
                            <Separator className="my-3" />
                            <div className="text-sm">
                              <span className="text-muted-foreground">Notes: </span>
                              <span className="italic">{submission.notes}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      {selectedSubmission && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedSubmission.submission_date || ''), 'MMMM d, yyyy h:mm a')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Labor Savings */}
              {selectedSubmission.labor_savings_items && selectedSubmission.labor_savings_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold">Labor Savings</h3>
                    <Badge variant="secondary">
                      {formatCurrency(selectedSubmission.labor_savings_total)}
                    </Badge>
                  </div>
                  <div className="space-y-2 ml-6">
                    {selectedSubmission.labor_savings_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.employees} employees × {item.minutesPerDay} min/day @ ${item.hourlyRate}/hr = {formatCurrency(item.monthlySavings)}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Replacements */}
              {selectedSubmission.system_replacement_items && selectedSubmission.system_replacement_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-purple-500" />
                    <h3 className="font-semibold">System Replacements</h3>
                    <Badge variant="secondary">
                      {formatCurrency(selectedSubmission.system_savings_total)}
                    </Badge>
                  </div>
                  <div className="space-y-2 ml-6">
                    {selectedSubmission.system_replacement_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.numberOfUsers} users × ${item.currentCostPerUser} = {formatCurrency(item.monthlySavings)}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed Savings */}
              {selectedSubmission.fixed_savings_items && selectedSubmission.fixed_savings_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <h3 className="font-semibold">Fixed Savings</h3>
                    <Badge variant="secondary">
                      {formatCurrency(selectedSubmission.fixed_savings_total)}
                    </Badge>
                  </div>
                  <div className="space-y-2 ml-6">
                    {selectedSubmission.fixed_savings_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.monthlyAmount || item.amount)}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Monthly Savings:</span>{' '}
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(selectedSubmission.total_monthly_savings)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual Savings:</span>{' '}
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(selectedSubmission.total_annual_savings)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedSubmission.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}