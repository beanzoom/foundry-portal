import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Info, 
  Search,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Users,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { usePortalUpdates } from '@/hooks/usePortalUpdates';
import { UpdateModal } from '@/components/portal/updates/UpdateModal';
import { cn } from '@/lib/utils';

export function PortalUpdates() {
  const [activeTab, setActiveTab] = useState('all'); // Default to 'all' tab
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'compulsory' | 'advisory'>('all');

  // Fetch updates
  const { data: updates = [], isLoading } = usePortalUpdates();

  // Filter updates based on tab, search, and type
  const filteredUpdates = updates.filter(update => {
    // Tab filter
    if (activeTab === 'unread' && (update.is_read || update.is_dismissed)) return false;
    if (activeTab === 'acknowledged' && !update.is_acknowledged) return false;
    
    // Type filter
    if (typeFilter !== 'all' && update.update_type !== typeFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return update.title.toLowerCase().includes(search) || 
             update.content.toLowerCase().includes(search);
    }
    
    return true;
  });

  // Group updates by month for better organization
  const groupedUpdates = filteredUpdates.reduce((groups, update) => {
    const month = update.published_at ? 
      format(new Date(update.published_at), 'MMMM yyyy') : 
      'Unpublished';
    
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(update);
    return groups;
  }, {} as Record<string, typeof updates>);

  const getUpdateIcon = (type: string) => {
    return type === 'compulsory' ? 
      <AlertTriangle className="h-5 w-5 text-red-500" /> : 
      <Info className="h-5 w-5 text-blue-500" />;
  };

  const getUpdateBadge = (update: any) => {
    if (update.is_acknowledged) {
      return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
    }
    if (update.is_dismissed) {
      return <Badge variant="secondary">Dismissed</Badge>;
    }
    if (update.is_read) {
      return <Badge variant="outline">Read</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">New</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portal Updates</h1>
        <p className="text-gray-600 mt-2">
          Stay informed with the latest announcements and important updates
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
                className={typeFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                All Types
              </Button>
              <Button
                variant={typeFilter === 'compulsory' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('compulsory')}
                className={typeFilter === 'compulsory' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Compulsory
              </Button>
              <Button
                variant={typeFilter === 'advisory' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('advisory')}
                className={typeFilter === 'advisory' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Info className="h-4 w-4 mr-1" />
                Advisory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Updates
            {updates.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {updates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {updates.filter(u => !u.is_read && !u.is_dismissed).length > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                {updates.filter(u => !u.is_read && !u.is_dismissed).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged
            {updates.filter(u => u.is_acknowledged).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {updates.filter(u => u.is_acknowledged).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </CardContent>
            </Card>
          ) : filteredUpdates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {activeTab === 'unread' ? (
                    <CheckCircle className="h-12 w-12 mx-auto" />
                  ) : (
                    <Info className="h-12 w-12 mx-auto" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'unread' ? 'All caught up!' : 'No updates found'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'unread' 
                    ? "You've read all the latest updates."
                    : searchTerm 
                      ? "Try adjusting your search or filters."
                      : "Check back later for new announcements."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedUpdates).map(([month, monthUpdates]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {month}
                  </h3>
                  <div className="space-y-3">
                    {monthUpdates.map((update) => (
                      <Card 
                        key={update.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          !update.is_read && !update.is_dismissed && "border-l-4 border-l-yellow-400"
                        )}
                        onClick={() => setSelectedUpdate(update)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getUpdateIcon(update.update_type)}
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {update.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  {getUpdateBadge(update)}
                                  {update.update_type === 'compulsory' && (
                                    <Badge variant="destructive">Required</Badge>
                                  )}
                                  {update.target_audience === 'investors' && (
                                    <Badge variant="outline">
                                      <Users className="h-3 w-3 mr-1" />
                                      Investors
                                    </Badge>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {format(new Date(update.published_at), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 line-clamp-2">
                            {/* Strip HTML, style tags, and CSS for preview */}
                            {update.content
                              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags and their content
                              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and their content
                              .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
                              .trim()
                              .substring(0, 150)}...
                          </p>
                          {update.read_record && (
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              {update.read_record.first_viewed_at && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  First viewed {format(new Date(update.read_record.first_viewed_at), 'MMM d')}
                                </span>
                              )}
                              {update.read_record.acknowledged_at && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Acknowledged {format(new Date(update.read_record.acknowledged_at), 'MMM d')}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Update Modal */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          isOpen={!!selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </div>
  );
}