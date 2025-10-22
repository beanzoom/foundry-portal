import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminRoute } from '@/lib/portal/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users, Mail, GitBranch, Database, Shield, UserCheck,
  Workflow, Lock, Search, CheckCircle, Clock, AlertCircle,
  ChevronRight, FileText, BookOpen, BarChart, Activity,
  Package, Globe, Server
} from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'complete' | 'in-progress' | 'planned';
  category: string;
  hasContent: boolean;
}

export function DocDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Only include documents that have actual content
  const documents: DocItem[] = [
    {
      id: 'contact-deduplication',
      title: 'Contact Deduplication',
      description: 'Duplicate prevention system with intelligent merge detection',
      icon: Users,
      category: 'Core Systems',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'user-onboarding',
      title: 'User Onboarding',
      description: 'Complete registration and profile setup workflow',
      icon: UserCheck,
      category: 'User Flows',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'email-system',
      title: 'Email System',
      description: 'Resend integration and template management',
      icon: Mail,
      category: 'Core Systems',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'portal-routing',
      title: 'Dynamic Routing',
      description: 'Subdomain and path-based routing system',
      icon: GitBranch,
      category: 'Architecture',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'referral-system',
      title: 'Referral System',
      description: 'Multi-tier tracking with rewards',
      icon: Workflow,
      category: 'Features',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'auth-system',
      title: 'Authentication',
      description: 'Supabase Auth with RBAC',
      icon: Lock,
      category: 'Security',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'database-schema',
      title: 'Database Schema',
      description: 'PostgreSQL with RLS policies',
      icon: Database,
      category: 'Architecture',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'survey-system',
      title: 'Surveys',
      description: 'Dynamic builder with conditional logic',
      icon: BarChart,
      category: 'Features',
      status: 'complete',
      hasContent: true
    },
    {
      id: 'event-management',
      title: 'Events',
      description: 'Event creation and registration',
      icon: Activity,
      category: 'Features',
      status: 'complete',
      hasContent: true
    }
  ];

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory && doc.hasContent;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(documents.map(doc => doc.category)))];

  // Group documents by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return CheckCircle;
      case 'in-progress': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'complete': return 'text-green-600';
      case 'in-progress': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Documentation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            System & technical guides
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search docs..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {category === 'all' ? 'All Documents' : category}
                <span className="ml-2 text-xs opacity-60">
                  ({category === 'all'
                    ? documents.filter(d => d.hasContent).length
                    : documents.filter(d => d.category === category && d.hasContent).length})
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Stats Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {documents.filter(d => d.status === 'complete' && d.hasContent).length}
              </div>
              <div className="text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {documents.filter(d => d.status === 'in-progress' && d.hasContent).length}
              </div>
              <div className="text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">System Documentation</h1>
            <p className="text-muted-foreground mt-1">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'} available
            </p>
          </div>

          {/* Document Grid */}
          {filteredDocs.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documentation found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocs).map(([category, docs]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-semibold">{category}</h2>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {docs.map((doc) => {
                      const Icon = doc.icon;
                      const StatusIcon = getStatusIcon(doc.status);

                      return (
                        <Link
                          key={doc.id}
                          to={adminRoute(`docs/${doc.id}`)}
                          className="block"
                        >
                          <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <StatusIcon className={`h-4 w-4 ${getStatusColor(doc.status)}`} />
                              </div>

                              <h3 className="font-semibold text-sm mb-1">
                                {doc.title}
                              </h3>

                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {doc.description}
                              </p>

                              <div className="flex items-center justify-between mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  {doc.status}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Links Section */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Quick Links</h3>
            <div className="grid gap-2 md:grid-cols-4">
              <Button variant="outline" size="sm" asChild>
                <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">
                  <Database className="h-4 w-4 mr-2" />
                  Supabase Docs
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://resend.com/docs" target="_blank" rel="noopener noreferrer">
                  <Mail className="h-4 w-4 mr-2" />
                  Resend API
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer">
                  <Package className="h-4 w-4 mr-2" />
                  Tailwind CSS
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/docs/PORTAL_ROUTING_GUIDE.md">
                  <FileText className="h-4 w-4 mr-2" />
                  Local Docs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}