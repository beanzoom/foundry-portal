import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  MessageSquare,
  History,
  FileText,
  Wrench,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulatedResolutionDialog } from './SimulatedResolutionDialog';

interface SimulatedMaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceRecord?: any;
  onResolved?: () => void;
}

export function SimulatedMaintenanceDialog({
  isOpen,
  onClose,
  maintenanceRecord,
  onResolved
}: SimulatedMaintenanceDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [comments, setComments] = useState([
    {
      id: 'comment-1',
      text: 'Oil leak confirmed during morning inspection. Appears to be coming from the oil pan gasket.',
      author: 'John Smith',
      role: 'Driver',
      timestamp: '2024-02-28 08:30 AM',
      avatar: 'JS'
    },
    {
      id: 'comment-2',
      text: 'Scheduled for repair tomorrow morning. Estimated 2 hours for gasket replacement.',
      author: 'Mike Johnson',
      role: 'Technician',
      timestamp: '2024-02-28 02:15 PM',
      avatar: 'MJ'
    }
  ]);

  const history = [
    {
      id: 'history-1',
      action: 'Issue Created',
      user: 'John Smith',
      timestamp: '2024-02-28 08:30 AM',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      id: 'history-2',
      action: 'Status Changed to In Progress',
      user: 'Mike Johnson',
      timestamp: '2024-02-28 02:00 PM',
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      id: 'history-3',
      action: 'Technician Assigned',
      user: 'System',
      timestamp: '2024-02-28 02:01 PM',
      icon: User,
      color: 'text-blue-600'
    },
    {
      id: 'history-4',
      action: 'Parts Ordered',
      user: 'Mike Johnson',
      timestamp: '2024-02-28 02:30 PM',
      icon: Package,
      color: 'text-purple-600'
    }
  ];

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment = {
        id: `comment-${Date.now()}`,
        text: comment,
        author: 'Current User',
        role: 'Manager',
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        avatar: 'CU'
      };
      setComments([newComment, ...comments]);
      setComment('');
      toast.success('Comment added successfully');
    }
  };

  const handleResolve = () => {
    setResolutionDialogOpen(true);
  };

  const handleResolutionComplete = () => {
    toast.success('Maintenance issue resolved successfully', {
      description: 'The issue has been marked as complete.'
    });
    if (onResolved) {
      onResolved();
    } else {
      onClose();
    }
  };

  const handleSchedule = () => {
    toast.success('Maintenance scheduled successfully', {
      description: 'Service appointment has been created.'
    });
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) {
      return <Badge className="bg-red-500 text-white">Critical</Badge>;
    } else if (severity >= 3) {
      return <Badge className="bg-yellow-500 text-white">High</Badge>;
    } else {
      return <Badge className="bg-blue-500 text-white">Medium</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'In Progress': { color: 'bg-yellow-500', icon: Clock },
      'Requires Authorization': { color: 'bg-orange-500', icon: AlertTriangle },
      'Scheduled': { color: 'bg-blue-500', icon: Calendar },
      'Resolved': { color: 'bg-green-500', icon: CheckCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-500', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge className={cn(config.color, 'text-white gap-1')}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (!maintenanceRecord) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{maintenanceRecord.issue_title}</DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(maintenanceRecord.maintenance_record_status)}
            {getSeverityBadge(maintenanceRecord.severity)}
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {maintenanceRecord.location}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Due: {maintenanceRecord.date_due}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="details" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Issue Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{maintenanceRecord.issue_description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-2 font-medium">{maintenanceRecord.fleet.vehicle_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{maintenanceRecord.fleet.vehicle_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Make/Model:</span>
                      <span className="ml-2 font-medium">
                        {maintenanceRecord.fleet.make} {maintenanceRecord.fleet.model}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Odometer:</span>
                      <span className="ml-2 font-medium">{maintenanceRecord.fleet.odometer} miles</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reported By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {maintenanceRecord.profiles.first_name[0]}{maintenanceRecord.profiles.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium">
                        {maintenanceRecord.profiles.first_name} {maintenanceRecord.profiles.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{maintenanceRecord.profiles.user_roles[0].role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {comments.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-500 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                          {c.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{c.author}</span>
                            <Badge variant="outline" className="text-xs">
                              {c.role}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-auto">{c.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-600">{c.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {history.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-gray-100", item.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.action}</p>
                            <p className="text-xs text-gray-500">
                              by {item.user} • {item.timestamp}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleSchedule} className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule Service
          </Button>
          <Button onClick={handleResolve} className="gap-2">
            <Check className="w-4 h-4" />
            Resolve Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Resolution Dialog */}
    <SimulatedResolutionDialog
      isOpen={resolutionDialogOpen}
      onClose={() => setResolutionDialogOpen(false)}
      maintenanceRecord={maintenanceRecord}
      onResolved={handleResolutionComplete}
    />
    </>
  );
}

// Add missing Package import
const Package = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);