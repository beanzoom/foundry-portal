import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users, Mail, Shield, UserPlus, TrendingUp, User, Settings,
  Search, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface RecipientList {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: 'static' | 'role_based' | 'dynamic' | 'custom';
  config: any;
  is_system: boolean;
  is_active: boolean;
  icon: string | null;
  color: string | null;
}

interface RecipientSelectorModalProps {
  isOpen: boolean;
  currentListId: string | null;
  eventId: string;
  eventName: string;
  onSelect: (listId: string) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
};

const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function RecipientSelectorModal({
  isOpen,
  currentListId,
  eventId,
  eventName,
  onSelect,
  onClose,
}: RecipientSelectorModalProps) {
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [filteredLists, setFilteredLists] = useState<RecipientList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(currentListId);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadRecipientLists();
      setSelectedListId(currentListId);
    }
  }, [isOpen, currentListId]);

  useEffect(() => {
    // Filter lists based on search term
    const filtered = lists.filter(list => {
      const matchesSearch =
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const isActive = list.is_active;
      return matchesSearch && isActive;
    });
    setFilteredLists(filtered);
  }, [lists, searchTerm]);

  const loadRecipientLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipient_lists')
        .select('*')
        .eq('is_active', true)
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setLists(data || []);
      setFilteredLists(data || []);
    } catch (error) {
      console.error('Error loading recipient lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getListIcon = (icon: string | null) => {
    return ICON_MAP[icon || 'Users'] || <Users className="h-4 w-4" />;
  };

  const getListBadge = (list: RecipientList) => {
    const colorClass = COLOR_CLASSES[list.color || 'gray'];
    return (
      <Badge className={cn(colorClass, 'gap-1')}>
        {getListIcon(list.icon)}
        <span>{list.name}</span>
      </Badge>
    );
  };

  const getRecommendedList = (): string | null => {
    // Recommend appropriate list based on event type
    if (eventId.includes('published')) {
      return lists.find(l => l.code === 'all_users')?.id || null;
    }
    if (eventId === 'referral_created') {
      return lists.find(l => l.code === 'referred_user')?.id || null;
    }
    if (eventId === 'user_registered') {
      return lists.find(l => l.code === 'portal_admins')?.id || null;
    }
    return lists.find(l => l.code === 'triggering_user')?.id || null;
  };

  const getRecipientEstimate = (list: RecipientList): string => {
    switch (list.type) {
      case 'static':
        const emailCount = list.config?.emails?.length || 0;
        return `${emailCount} email${emailCount !== 1 ? 's' : ''}`;
      case 'role_based':
        const roles = list.config?.roles || [];
        if (roles.includes('member') || roles.includes('all')) {
          return 'All portal users';
        }
        if (roles.includes('super_admin') && roles.length === 1) {
          return 'Super administrators only';
        }
        if (roles.includes('admin')) {
          return 'Portal administrators';
        }
        if (roles.includes('investor')) {
          return 'Investor accounts';
        }
        return `Users with ${roles.join(', ')} role${roles.length > 1 ? 's' : ''}`;
      case 'dynamic':
        if (list.code === 'triggering_user') {
          return 'The user who triggers the event';
        }
        if (list.code === 'referred_user') {
          return 'The user being invited/referred';
        }
        return 'Dynamically determined';
      default:
        return 'Custom criteria';
    }
  };

  const handleSelect = () => {
    if (selectedListId) {
      onSelect(selectedListId);
      onClose();
    }
  };

  const recommendedListId = getRecommendedList();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Recipient List</DialogTitle>
          <DialogDescription>
            Choose who should receive notifications for: <strong>{eventName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipient lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lists */}
          <ScrollArea className="flex-1 pr-4">
            <RadioGroup
              value={selectedListId || ''}
              onValueChange={setSelectedListId}>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading recipient lists...
                  </div>
                ) : filteredLists.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No recipient lists found</p>
                  </div>
                ) : (
                  filteredLists.map((list) => (
                    <div
                      key={list.id}
                      className={cn(
                        'relative flex items-start space-x-3 p-4 rounded-lg border transition-colors',
                        selectedListId === list.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value={list.id} id={list.id} className="mt-1" />
                      <Label
                        htmlFor={list.id}
                        className="flex-1 cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getListBadge(list)}
                            {list.is_system && (
                              <Badge variant="outline" className="text-xs">
                                System
                              </Badge>
                            )}
                            {list.id === recommendedListId && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                        {list.description && (
                          <p className="text-sm text-muted-foreground">
                            {list.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {getRecipientEstimate(list)}
                          </span>
                          <span className="capitalize">
                            {list.type.replace('_', ' ')}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </RadioGroup>
          </ScrollArea>

          {/* Info Alert */}
          {selectedListId && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Changing the recipient list will affect who receives emails for this notification.
                The change will take effect immediately after saving.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedListId || selectedListId === currentListId}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Update Recipients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}