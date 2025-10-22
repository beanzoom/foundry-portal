import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  UserCheck,
  Clock,
  Plus,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Video,
  Send,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Contact, Interaction, InteractionType } from '@/types/contact-tracking';
import { usePortal } from '@/contexts/PortalContext';

interface InteractionFeedProps {
  contactId?: string;
  dspId?: string;
  limit?: number;
  showAddButton?: boolean;
}

// Map database interaction types to display config
const interactionTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  call: { icon: <Phone className="w-4 h-4" />, color: 'blue', label: 'Phone Call' },
  email: { icon: <Mail className="w-4 h-4" />, color: 'green', label: 'Email' },
  'in-person': { icon: <Calendar className="w-4 h-4" />, color: 'purple', label: 'In-Person Meeting' },
  other: { icon: <FileText className="w-4 h-4" />, color: 'gray', label: 'Other' }
};

export function InteractionFeed({ 
  contactId, 
  dspId, 
  limit = 10, 
  showAddButton = true 
}: InteractionFeedProps) {
  const { portalUser } = usePortal();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InteractionType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'other' as InteractionType,
    notes: '',
    interactionDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    type: InteractionType;
    details: string;
    interactionDate: string;
  }>({
    type: 'other',
    details: '',
    interactionDate: ''
  });

  useEffect(() => {
    loadInteractions();
  }, [contactId, dspId]);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('interactions')
        .select(`
          *,
          contact:contacts(first_name, last_name, email, phone)
        `)
        .order('interaction_date', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!newInteraction.notes?.trim() || !contactId) return;

    try {
      setSaving(true);
      // Convert the date to ISO string with current time if not specified
      const interactionDateTime = new Date(newInteraction.interactionDate + 'T12:00:00').toISOString();
      
      const { error } = await supabase
        .from('interactions')
        .insert({
          contact_id: contactId,
          interaction_type: newInteraction.type,
          details: newInteraction.notes || '',
          interaction_date: interactionDateTime,
          created_by: portalUser?.id
        });

      if (error) throw error;

      setShowAddDialog(false);
      setNewInteraction({
        type: 'other',
        notes: '',
        interactionDate: new Date().toISOString().split('T')[0]
      });
      loadInteractions();
    } catch (error) {
      console.error('Error adding interaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (interaction: Interaction) => {
    setEditingId(interaction.id);
    setEditFormData({
      type: interaction.interaction_type,
      details: interaction.details || '',
      interactionDate: new Date(interaction.interaction_date).toISOString().split('T')[0]
    });
    // Expand the item if not already expanded
    if (!expandedItems.has(interaction.id)) {
      toggleExpanded(interaction.id);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({
      type: 'other',
      details: '',
      interactionDate: ''
    });
  };

  const saveEdit = async () => {
    if (!editFormData.details?.trim() || !editingId) return;

    try {
      setSaving(true);
      const interactionDateTime = new Date(editFormData.interactionDate + 'T12:00:00').toISOString();
      
      const { error } = await supabase
        .from('interactions')
        .update({
          interaction_type: editFormData.type,
          details: editFormData.details,
          interaction_date: interactionDateTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      loadInteractions();
    } catch (error) {
      console.error('Error updating interaction:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredInteractions = interactions.filter(interaction => {
    if (filter !== 'all' && interaction.interaction_type !== filter) return false;
    if (searchTerm && !interaction.details?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getOutcomeColor = (outcome?: string) => {
    if (!outcome) return 'gray';
    const lower = outcome.toLowerCase();
    if (lower.includes('success') || lower.includes('completed') || lower.includes('resolved')) return 'green';
    if (lower.includes('pending') || lower.includes('follow')) return 'yellow';
    if (lower.includes('failed') || lower.includes('issue') || lower.includes('problem')) return 'red';
    return 'blue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search interactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as InteractionType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(interactionTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showAddButton && contactId && (
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Interaction
          </Button>
        )}
      </div>

      {/* Interactions Timeline */}
      <div className="space-y-3">
        {filteredInteractions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No interactions found</p>
              {showAddButton && contactId && (
                <Button 
                  onClick={() => setShowAddDialog(true)} 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add First Interaction
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInteractions.map((interaction) => {
            const config = interactionTypeConfig[interaction.interaction_type] || interactionTypeConfig.other;
            const isExpanded = expandedItems.has(interaction.id);
            
            return (
              <Card key={interaction.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full bg-${config.color}-100 text-${config.color}-600`}>
                      {config.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm">{config.label}</h4>
                            <Badge variant="outline" className="text-xs">
                              {interaction.interaction_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span title={new Date(interaction.interaction_date).toLocaleString()}>
                              {new Date(interaction.interaction_date).toLocaleDateString()} 
                              ({formatDistanceToNow(new Date(interaction.interaction_date), { addSuffix: true })})
                            </span>
                            {interaction.contact && (
                              <>
                                <span>•</span>
                                <span>
                                  {interaction.contact.first_name} {interaction.contact.last_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {interaction.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(interaction.id)}
                            className="px-2"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && interaction.details && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          {editingId === interaction.id ? (
                            // Edit mode
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={editFormData.type} 
                                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value as InteractionType })}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(interactionTypeConfig).map(([type, config]) => (
                                      <SelectItem key={type} value={type}>
                                        <div className="flex items-center gap-2">
                                          {config.icon}
                                          <span>{config.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={editFormData.interactionDate}
                                  onChange={(e) => setEditFormData({ ...editFormData, interactionDate: e.target.value })}
                                  max={new Date().toISOString().split('T')[0]}
                                  className="w-[150px]"
                                />
                              </div>
                              <Textarea
                                value={editFormData.details}
                                onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                                placeholder="Interaction details..."
                                rows={3}
                                className="w-full"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  disabled={saving}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={saveEdit}
                                  disabled={!editFormData.details?.trim() || saving}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  {saving ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="relative group">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">{interaction.details}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEditing(interaction)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Interaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Interaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select 
                value={newInteraction.type} 
                onValueChange={(value) => setNewInteraction({ ...newInteraction, type: value as InteractionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interactionTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={newInteraction.interactionDate}
                onChange={(e) => setNewInteraction({ ...newInteraction, interactionDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Can't be in the future
                required
              />
            </div>
            
            <div>
              <Label>Details *</Label>
              <Textarea
                value={newInteraction.notes}
                onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                placeholder="Describe the interaction details..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddInteraction} 
              disabled={!newInteraction.notes?.trim() || saving}
            >
              {saving ? 'Adding...' : 'Add Interaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}