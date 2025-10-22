import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts } from '@/hooks/useContactTracking';
import { ContactFormDialog } from './ContactFormDialog';
import { ContactDetailDialog } from './ContactDetailDialog';
import { ContactImportDialogEnhanced } from './ContactImportDialogEnhanced';
import { InteractionDialog } from './InteractionDialog';
import type { Contact, ContactFilters } from '@/types/contact-tracking';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Phone,
  Mail,
  User,
  Users,
  Building,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Edit2,
  Trash,
  Trash2,
  UserPlus,
  MessageSquare,
  PlusCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'email' | 'title' | 'organization' | 'status' | 'last_contact' | 'interactions';
type SortDirection = 'asc' | 'desc';

export function ContactList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [interactionContact, setInteractionContact] = useState<Contact | null>(null);
  const [localFilters, setLocalFilters] = useState<ContactFilters>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const {
    contacts,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    totalCount,
    deleteContact,
    refetch,
  } = useContacts(localFilters);

  // Apply search filter
  const handleSearch = () => {
    const newFilters = { ...localFilters, search: searchQuery };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    setPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setLocalFilters({});
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort contacts
  const sortedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'organization':
          aValue = (a.dsp?.dsp_code || a.dsp?.dsp_name || '').toLowerCase();
          bValue = (b.dsp?.dsp_code || b.dsp?.dsp_name || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.contact_status || '').toLowerCase();
          bValue = (b.contact_status || '').toLowerCase();
          break;
        case 'last_contact':
          aValue = a.last_contacted_at || '';
          bValue = b.last_contacted_at || '';
          break;
        case 'interactions':
          aValue = a.interaction_count || 0;
          bValue = b.interaction_count || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [contacts, sortField, sortDirection]);

  // Create sortable header component
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  // Status badge colors
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-700';
      case 'contacted':
        return 'bg-blue-100 text-blue-700';
      case 'qualified':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Title icon
  const getTitleIcon = (title?: string) => {
    switch (title) {
      case 'Owner':
        return <User className="h-3 w-3" />;
      case 'Ops':
        return <Building className="h-3 w-3" />;
      case 'Dispatch':
        return <MapPin className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV/Excel
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedContact(null);
                  setShowContactForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name, email, phone, or DSP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({ ...localFilters, search: undefined });
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-muted')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.keys(localFilters).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(localFilters).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Controls */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <Select
                  value={localFilters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={localFilters.title || 'all'}
                  onValueChange={(value) => handleFilterChange('title', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Titles</SelectItem>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Ops">Operations</SelectItem>
                    <SelectItem value="Dispatch">Dispatch</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={localFilters.has_interactions?.toString() || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('has_interactions', value === 'all' ? undefined : value === 'true')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Interactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="true">Has Interactions</SelectItem>
                    <SelectItem value="false">No Interactions</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="justify-start"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <SortableHeader field="name">Name</SortableHeader>
                <SortableHeader field="email">Contact Info</SortableHeader>
                <SortableHeader field="title">Title</SortableHeader>
                <SortableHeader field="organization">Organization</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="last_contact">Last Contact</SortableHeader>
                <SortableHeader field="interactions">Interactions</SortableHeader>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : contacts.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No contacts found</p>
                      <p className="text-sm mt-1">
                        {Object.keys(localFilters).length > 0
                          ? 'Try adjusting your filters'
                          : 'Get started by importing your contacts or adding them manually'}
                      </p>
                      {Object.keys(localFilters).length === 0 && (
                        <div className="mt-4 space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => setShowImportDialog(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import CSV/Excel
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedContact(null);
                              setShowContactForm(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Manually
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Contact rows
                sortedContacts.map((contact) => (
                  <TableRow 
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractionContact(contact);
                          setShowInteractionDialog(true);
                        }}
                        title="Add interaction"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell 
                      className="font-medium"
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      {contact.first_name || contact.last_name ? (
                        `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      {contact.title && (
                        <div className="flex items-center gap-1">
                          {getTitleIcon(contact.title)}
                          <span className="text-sm">{contact.title}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      <div className="text-sm font-medium">
                        {contact.dsp?.dsp_code || contact.dsp?.dsp_name || ''}
                      </div>
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      <Badge className={cn('text-xs', getStatusColor(contact.contact_status))}>
                        {contact.contact_status || 'new'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      {contact.last_contacted_at ? (
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.last_contacted_at), {
                            addSuffix: true,
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowContactDetail(true);
                      }}
                    >
                      <Badge variant="outline" className="text-xs">
                        {contact.interaction_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact(contact);
                            setShowContactForm(true);
                          }}
                          title="Edit contact"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${contact.first_name || 'this contact'}? This will remove them from all locations and cannot be undone.`)) {
                              try {
                                await deleteContact(contact.id);
                                refetch();
                              } catch (error) {
                                console.error('Error deleting contact:', error);
                              }
                            }
                          }}
                          title="Delete contact"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, totalCount)} of {totalCount} contacts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                    className="w-8"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <Button
                    variant={totalPages === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    className="w-8"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contact Form Dialog */}
      {showContactForm && (
        <ContactFormDialog
          contact={selectedContact}
          open={showContactForm}
          onClose={() => {
            setShowContactForm(false);
            setSelectedContact(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Contact Detail Dialog */}
      {showContactDetail && selectedContact && (
        <ContactDetailDialog
          contact={selectedContact}
          open={showContactDetail}
          onClose={() => {
            setShowContactDetail(false);
            setSelectedContact(null);
          }}
          onEdit={() => {
            setShowContactDetail(false);
            setShowContactForm(true);
          }}
        />
      )}

      {/* Import Dialog */}
      <ContactImportDialogEnhanced
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={() => {
          setShowImportDialog(false);
          refetch();
        }}
      />

      {/* Interaction Dialog */}
      <InteractionDialog
        contact={interactionContact}
        open={showInteractionDialog}
        onClose={() => {
          setShowInteractionDialog(false);
          setInteractionContact(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}