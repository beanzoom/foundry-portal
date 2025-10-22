import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminRoute } from '@/lib/portal/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Info, AlertCircle, CheckCircle, Clock,
  FileCode, Eye, Copy, Download, BookOpen, ChevronRight
} from 'lucide-react';
// REMOVED: Mermaid is app-specific component
// import Mermaid from '@/components/Mermaid';

// Placeholder for Mermaid diagrams (not included in portal)
const Mermaid = ({ chart }: { chart: string }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
    <p className="text-sm text-gray-500 mb-2 font-mono">Diagram:</p>
    <pre className="text-xs text-gray-600 overflow-x-auto">{chart}</pre>
  </div>
);

interface Documentation {
  id: string;
  title: string;
  content: React.ReactNode;
  lastUpdated: string;
  status: 'complete' | 'in-progress' | 'planned';
  readTime?: string;
}

export function DocViewer() {
  const { docId } = useParams<{ docId: string }>();
  const [doc, setDoc] = useState<Documentation | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = 'typescript', title, id }: { code: string, language?: string, title?: string, id: string }) => (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="secondary" className="text-xs">{language}</Badge>
        </div>
      )}
      <div className="relative">
        <pre className={`bg-gray-900 text-gray-100 p-4 ${title ? 'rounded-b-lg' : 'rounded-lg'} overflow-x-auto text-sm`}>
          <code>{code}</code>
        </pre>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copiedCode === id ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    const documentation: Record<string, Documentation> = {
      'contact-deduplication': {
        id: 'contact-deduplication',
        title: 'Contact Deduplication System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '15 min read',
        content: (
          <div className="space-y-8">
            {/* Overview Section */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Overview</h2>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <p className="text-lg leading-relaxed">
                    The contact deduplication system ensures data integrity by preventing duplicate contact records
                    when NEW contacts are created through three primary entry points: Admin manual addition/import,
                    Referral invitations, and User registration. The system automatically detects and merges duplicate
                    contacts based on email addresses while preserving all historical data and source attribution.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-t-2 border-t-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Automatic Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Real-time duplicate detection using email as the primary key
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-t-2 border-t-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Data Preservation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      All contact data, tags, and history preserved during merges
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-t-2 border-t-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      Multi-Source Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track contact origin from all entry points with full attribution
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* System Architecture */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">System Architecture</h2>

              <Tabs defaultValue="workflow" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="workflow">Workflow Diagram</TabsTrigger>
                  <TabsTrigger value="database">Database Design</TabsTrigger>
                  <TabsTrigger value="api">API Flow</TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Deduplication Workflow</CardTitle>
                      <CardDescription>
                        Visual representation of the deduplication process across all entry points
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Mermaid chart={`
                        graph TB
                          Start([New Contact Entry Point]) --> Check{Email Exists?}

                          Check -->|No| Create[Create New Contact]
                          Check -->|Yes| Merge[Merge/Update Contact]

                          Create --> Unified[Unified Contact Record]
                          Merge --> Unified

                          subgraph "Entry Points"
                            Admin[Admin Actions]
                            REF[Referral System]
                            REG[User Registration]
                          end

                          Admin --> Start
                          REF --> Start
                          REG --> Start

                          subgraph "Merge Process"
                            Merge --> Update[Update Fields]
                            Update --> Tags[Merge Tags]
                            Tags --> Source[Track Source]
                            Source --> Activity[Log Activity]
                          end

                          subgraph "Database Layer"
                            Unified --> DB[(Contacts Table)]
                            DB --> Constraint[UNIQUE: email]
                            DB --> Trigger[ON CONFLICT Trigger]
                          end

                          subgraph "Intelligent Detection"
                            NameMatch[Name Match + Different Email]
                            PhoneMatch[Same Phone]
                            CompanyMatch[Same Company]

                            NameMatch --> PossibleMerge[Possible Merges Dashboard]
                            PhoneMatch --> PossibleMerge
                            CompanyMatch --> PossibleMerge

                            PossibleMerge --> ManualReview{Admin Review}
                            ManualReview -->|Merge| Merge
                            ManualReview -->|Not Duplicate| MarkNotDupe[Mark as Not Duplicate]
                          end

                          style Start fill:#e1f5fe
                          style Unified fill:#c8e6c9
                          style DB fill:#fff3e0
                          style PossibleMerge fill:#fce4ec
                      `} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Database Schema</CardTitle>
                      <CardDescription>
                        PostgreSQL schema with unique constraints and merge tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        id="db-schema"
                        title="contacts_table.sql"
                        language="sql"
                        code={`-- Contacts table with unique email constraint
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  tags TEXT[],
  source JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_contact_email UNIQUE (email)
);

-- Index for fast email lookups
CREATE INDEX idx_contacts_email ON contacts(email);

-- Merge history tracking
CREATE TABLE contact_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_contact_id UUID REFERENCES contacts(id),
  merged_contact_data JSONB,
  merge_source TEXT,
  merged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track contacts marked as "not duplicates"
CREATE TABLE contact_not_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact1_id UUID REFERENCES contacts(id),
  contact2_id UUID REFERENCES contacts(id),
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_pair UNIQUE (
    LEAST(contact1_id, contact2_id),
    GREATEST(contact1_id, contact2_id)
  )
);

-- Index for fast lookups
CREATE INDEX idx_not_duplicates_contacts
ON contact_not_duplicates(contact1_id, contact2_id);`}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Integration</CardTitle>
                      <CardDescription>
                        RESTful API endpoints for contact management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        id="api-endpoints"
                        title="Contact API Endpoints"
                        language="typescript"
                        code={`// POST /api/contacts/create-or-update
{
  "email": "user@example.com",
  "name": "John Doe",
  "source": "referral",
  "tags": ["prospect", "referral"]
}

// Response
{
  "id": "uuid",
  "action": "created" | "merged",
  "contact": { ... },
  "merge_info": { ... } // If merged
}`}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>

            {/* Implementation Guide */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Implementation Guide</h2>

              <div className="space-y-4">
                {/* Phase 1 */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-blue-500 text-white">Phase 1</Badge>
                        Database Setup
                      </CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Establish the database foundation with unique constraints and tracking tables.
                    </p>
                    <CodeBlock
                      id="phase1-code"
                      title="Database Migration"
                      language="sql"
                      code={`-- Add unique constraint
ALTER TABLE contacts
ADD CONSTRAINT unique_contact_email
UNIQUE (email);

-- Create merge function
CREATE OR REPLACE FUNCTION merge_contact_data()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts SET
    name = COALESCE(NEW.name, contacts.name),
    phone = COALESCE(NEW.phone, contacts.phone),
    company = COALESCE(NEW.company, contacts.company),
    tags = array_cat(
      COALESCE(contacts.tags, '{}'),
      COALESCE(NEW.tags, '{}')
    ),
    source = jsonb_build_object(
      'original', contacts.source,
      'merged', NEW.source,
      'merged_at', NOW()
    ),
    updated_at = NOW()
  WHERE email = NEW.email;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;`}
                    />
                  </CardContent>
                </Card>

                {/* Phase 2 */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white">Phase 2</Badge>
                        Service Layer
                      </CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Implement the unified contact service with intelligent merging logic.
                    </p>
                    <CodeBlock
                      id="phase2-code"
                      title="contact.service.ts"
                      language="typescript"
                      code={`export class ContactService {
  async createOrUpdateContact(data: ContactInput): Promise<Contact> {
    // Check for existing contact
    const { data: existing } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', data.email)
      .single();

    if (existing) {
      // Merge with existing contact
      const merged = this.mergeContactData(existing, data);

      const { data: updated } = await supabase
        .from('contacts')
        .update(merged)
        .eq('id', existing.id)
        .select()
        .single();

      // Log merge activity
      await this.logMergeActivity({
        contact_id: existing.id,
        action: 'merged',
        source: data.source,
        metadata: { original: existing, new: data }
      });

      return updated;
    }

    // Create new contact
    const { data: created } = await supabase
      .from('contacts')
      .insert(data)
      .select()
      .single();

    return created;
  }

  private mergeContactData(
    existing: Contact,
    newData: ContactInput
  ): Partial<Contact> {
    return {
      name: newData.name || existing.name,
      phone: newData.phone || existing.phone,
      company: newData.company || existing.company,
      tags: [...new Set([
        ...(existing.tags || []),
        ...(newData.tags || [])
      ])],
      source: {
        ...existing.source,
        merged: [
          ...(existing.source?.merged || []),
          {
            source: newData.source,
            timestamp: new Date().toISOString()
          }
        ]
      }
    };
  }
}`}
                    />
                  </CardContent>
                </Card>

                {/* Phase 3 */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-purple-500 text-white">Phase 3</Badge>
                        Entry Point Integration
                      </CardTitle>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Update all contact creation points to use the unified service.
                    </p>

                    <div className="grid gap-3">
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Admin Contact Management</AlertTitle>
                        <AlertDescription>
                          Manual contact creation and CSV import in /admin/contacts uses unified service
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>Referral System</AlertTitle>
                        <AlertDescription>
                          create_referral function checks for existing contacts before creating new ones
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <AlertTitle>User Registration</AlertTitle>
                        <AlertDescription>
                          Portal sign-up flow creates contact record linked to auth user
                        </AlertDescription>
                      </Alert>

                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertTitle>Logged-in User Actions</AlertTitle>
                        <AlertDescription>
                          Contact forms, event registrations, and calculator submissions update existing contact records only
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                {/* Phase 4 */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-orange-500 text-white">Phase 4</Badge>
                        Intelligent Merge Detection
                      </CardTitle>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Implement intelligent detection for possible duplicates beyond email matching,
                      such as same name with different email addresses.
                    </p>

                    <Alert className="border-blue-200">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertTitle>Possible Merges Feature</AlertTitle>
                      <AlertDescription>
                        System identifies potential duplicates based on name matching and other factors,
                        allowing admins to review and manually merge contacts when appropriate.
                      </AlertDescription>
                    </Alert>

                    <CodeBlock
                      id="phase4-detection"
                      title="Duplicate Detection Algorithm"
                      language="typescript"
                      code={`// Intelligent duplicate detection
interface PossibleMatch {
  contact1: Contact;
  contact2: Contact;
  matchScore: number;
  matchReasons: string[];
}

export class DuplicateDetectionService {
  async findPossibleDuplicates(): Promise<PossibleMatch[]> {
    const contacts = await this.getAllContacts();
    const possibleMatches: PossibleMatch[] = [];

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const matchScore = this.calculateMatchScore(
          contacts[i],
          contacts[j]
        );

        if (matchScore >= 0.7) {
          possibleMatches.push({
            contact1: contacts[i],
            contact2: contacts[j],
            matchScore,
            matchReasons: this.getMatchReasons(
              contacts[i],
              contacts[j]
            )
          });
        }
      }
    }

    return possibleMatches;
  }

  private calculateMatchScore(c1: Contact, c2: Contact): number {
    let score = 0;
    const weights = {
      exactName: 0.5,
      similarName: 0.3,
      sameCompany: 0.2,
      samePhone: 0.3,
      similarEmail: 0.1
    };

    // Exact name match (different emails)
    if (c1.email !== c2.email) {
      const name1 = (c1.first_name + ' ' + c1.last_name).toLowerCase();
      const name2 = (c2.first_name + ' ' + c2.last_name).toLowerCase();

      if (name1 === name2 && name1 !== '') {
        score += weights.exactName;
      } else if (this.isSimilarName(name1, name2)) {
        score += weights.similarName;
      }
    }

    // Same company
    if (c1.company && c1.company === c2.company) {
      score += weights.sameCompany;
    }

    // Same phone
    if (c1.phone && c1.phone === c2.phone) {
      score += weights.samePhone;
    }

    // Similar email domain
    const domain1 = c1.email.split('@')[1];
    const domain2 = c2.email.split('@')[1];
    if (domain1 === domain2) {
      score += weights.similarEmail;
    }

    return score;
  }

  private isSimilarName(name1: string, name2: string): boolean {
    // Use Levenshtein distance or similar algorithm
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    const similarity = 1 - (distance / maxLength);
    return similarity > 0.8;
  }
}`}
                    />

                    <CodeBlock
                      id="phase4-ui"
                      title="Admin UI Component for Possible Merges"
                      language="typescript"
                      code={`// Possible Merges Admin Interface
export function PossibleMergesPanel() {
  const [possibleMatches, setPossibleMatches] = useState<PossibleMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMerge = async (match: PossibleMatch, keepId: string) => {
    const keepContact = keepId === match.contact1.id
      ? match.contact1
      : match.contact2;
    const mergeContact = keepId === match.contact1.id
      ? match.contact2
      : match.contact1;

    await contactService.mergeContacts(keepContact, mergeContact);

    // Refresh possible matches
    await loadPossibleMatches();
  };

  const handleDismiss = async (match: PossibleMatch) => {
    // Mark this pair as "not duplicates"
    await contactService.markAsNotDuplicates(
      match.contact1.id,
      match.contact2.id
    );

    // Remove from list
    setPossibleMatches(prev =>
      prev.filter(m => m !== match)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Possible Duplicate Contacts</CardTitle>
        <CardDescription>
          Review and merge contacts that may be duplicates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {possibleMatches.map((match, idx) => (
          <Alert key={idx} className="mb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <ContactCard contact={match.contact1} />
                  <ContactCard contact={match.contact2} />
                </div>
                <div className="mt-2">
                  <Badge variant="outline">
                    {Math.round(match.matchScore * 100)}% Match
                  </Badge>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {match.matchReasons.join(', ')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleMerge(match, match.contact1.id)}
                  size="sm"
                >
                  Keep First
                </Button>
                <Button
                  onClick={() => handleMerge(match, match.contact2.id)}
                  size="sm"
                >
                  Keep Second
                </Button>
                <Button
                  onClick={() => handleDismiss(match)}
                  variant="ghost"
                  size="sm"
                >
                  Not Duplicates
                </Button>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}`}
                    />
                  </CardContent>
                </Card>

                {/* Phase 5 - renumbered from 4 */}
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white">Phase 5</Badge>
                        Data Migration & Cleanup
                      </CardTitle>
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Planned
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Clean up existing duplicate contacts in the database using both automatic
                      email matching and manual review of possible duplicates.
                    </p>
                    <CodeBlock
                      id="phase5-code"
                      title="Data Migration Script"
                      language="sql"
                      code={`-- Identify exact email duplicates
WITH duplicates AS (
  SELECT
    email,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as ids
  FROM contacts
  GROUP BY email
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;

-- Identify possible name-based duplicates
WITH possible_duplicates AS (
  SELECT
    c1.id as id1,
    c2.id as id2,
    c1.first_name,
    c1.last_name,
    c1.email as email1,
    c2.email as email2,
    c1.company as company1,
    c2.company as company2
  FROM contacts c1
  JOIN contacts c2 ON
    c1.first_name = c2.first_name
    AND c1.last_name = c2.last_name
    AND c1.id < c2.id
    AND c1.email != c2.email
)
SELECT * FROM possible_duplicates;

-- Merge duplicate contacts
WITH duplicates AS (
  SELECT
    email,
    MIN(id) as keep_id,
    array_agg(id) FILTER (WHERE id != MIN(id)) as merge_ids
  FROM contacts
  GROUP BY email
  HAVING COUNT(*) > 1
)
UPDATE contacts c
SET
  tags = (
    SELECT array_agg(DISTINCT tag)
    FROM contacts c2, unnest(c2.tags) as tag
    WHERE c2.email = c.email
  ),
  source = jsonb_build_object(
    'merged_duplicates', true,
    'merged_ids', d.merge_ids,
    'merged_at', NOW()
  )
FROM duplicates d
WHERE c.id = d.keep_id AND c.email = d.email;

-- Delete merged duplicates
DELETE FROM contacts
WHERE id IN (
  SELECT unnest(merge_ids)
  FROM (
    SELECT array_agg(id) FILTER (WHERE id != MIN(id)) as merge_ids
    FROM contacts
    GROUP BY email
    HAVING COUNT(*) > 1
  ) d
);`}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Best Practices */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">Best Practices</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Integrity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Always validate email format before processing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Normalize email addresses (lowercase, trim)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Preserve all historical data during merges</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Use database indexes on email column</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Batch process large migrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Implement caching for frequent lookups</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Log all merge operations for audit trail</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Set up alerts for duplicate creation attempts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Regular reports on deduplication metrics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Transparent merge notifications to users</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Preserve user preferences and settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Allow manual merge conflict resolution</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )
      },

      'user-onboarding': {
        id: 'user-onboarding',
        title: 'User Onboarding Workflow',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '10 min read',
        content: (
          <div className="space-y-8">
            {/* Overview */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold">User Onboarding Workflow</h2>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <p className="text-lg leading-relaxed">
                    The user onboarding workflow guides new users through registration, profile completion,
                    and portal access setup. This multi-step process ensures users provide all necessary
                    information while maintaining a smooth experience.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Onboarding Flow */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Complete Onboarding Flow</h2>

              {/* Workflow Diagram */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>User Onboarding Workflow</CardTitle>
                  <CardDescription>
                    Visual representation of the complete onboarding process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`┌─────────────────────────────────────────────────────────┐
│                 User Onboarding Flow                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   1. Registration    │
                │  • Email & Password  │
                │  • Referral Code     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 2. Email Verification│
                │  • Send Magic Link   │
                │  • 24hr Expiration   │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  3. Terms Acceptance │
                │  • Terms of Service  │
                │  • Privacy Policy    │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 4. Profile Creation  │
                ├──────────────────────┤
                │  Personal Info       │
                │  • Name & Title      │
                │  • Phone Number      │
                ├──────────────────────┤
                │  Business Info       │
                │  • Company Name      │
                │  • Industry/Size     │
                ├──────────────────────┤
                │  Preferences         │
                │  • Notifications     │
                │  • Communication     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  5. Portal Access    │
                │  • Dashboard Access  │
                │  • Feature Unlock    │
                │  • Welcome Email     │
                └──────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │    Onboarding        │
                │     Complete!        │
                └──────────────────────┘

Entry Points:
├─ Direct Registration (/portal/register)
├─ Referral Invitation (with code)
├─ Admin Created Account (with welcome email)
└─ SSO Integration (planned)`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* Step 1 */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>Step 1</Badge>
                      User Registration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Initial user registration through portal sign-up or invitation link.
                    </p>

                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Registration Methods:</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Direct sign-up at /portal/register</li>
                        <li>• Invitation link from referral system</li>
                        <li>• Admin-created account with welcome email</li>
                        <li>• SSO integration (planned)</li>
                      </ul>
                    </div>

                    <CodeBlock
                      id="registration-code"
                      title="Registration Handler"
                      language="typescript"
                      code={`// Handle user registration
async function handleRegistration(data: RegistrationData) {
  // Create auth user
  const { data: authUser, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        referral_code: data.referralCode
      }
    }
  });

  if (error) throw error;

  // Create portal user record
  const { data: portalUser } = await supabase
    .from('portal_users')
    .insert({
      id: authUser.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'portal_member',
      onboarding_completed: false
    })
    .select()
    .single();

  // Send welcome email
  await sendWelcomeEmail(portalUser);

  return portalUser;
}`}
                    />
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>Step 2</Badge>
                      Email Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Verify email address to activate the account.
                    </p>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Verification Process</AlertTitle>
                      <AlertDescription>
                        Users receive a verification email with a secure link. The link expires after 24 hours
                        and can be resent from the login page.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>Step 3</Badge>
                      Terms Acceptance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Review and accept terms of service and privacy policy.
                    </p>

                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Terms of Service</span>
                        <Badge variant="outline">Required</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Privacy Policy</span>
                        <Badge variant="outline">Required</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Marketing Communications</span>
                        <Badge variant="secondary">Optional</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4 */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>Step 4</Badge>
                      Profile Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Complete profile with business information and preferences.
                    </p>

                    <Tabs defaultValue="personal" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal">Personal Info</TabsTrigger>
                        <TabsTrigger value="business">Business Info</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                      </TabsList>

                      <TabsContent value="personal" className="space-y-2">
                        <div className="text-sm space-y-1">
                          <p>• Full name and title</p>
                          <p>• Phone number</p>
                          <p>• Profile photo (optional)</p>
                          <p>• Bio/Description (optional)</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="business" className="space-y-2">
                        <div className="text-sm space-y-1">
                          <p>• Company name</p>
                          <p>• Business type</p>
                          <p>• Industry sector</p>
                          <p>• Company size</p>
                          <p>• Address</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="preferences" className="space-y-2">
                        <div className="text-sm space-y-1">
                          <p>• Communication preferences</p>
                          <p>• Notification settings</p>
                          <p>• Interest areas</p>
                          <p>• Language preference</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Step 5 */}
                <Card className="border-l-4 border-l-pink-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>Step 5</Badge>
                      Portal Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Grant access to portal features based on user role and permissions.
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Portal Member Access</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-1">
                            <li>✓ Dashboard & Updates</li>
                            <li>✓ Surveys & Events</li>
                            <li>✓ Referral Program</li>
                            <li>✓ Calculator Tools</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Admin Access</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-1">
                            <li>✓ All member features</li>
                            <li>✓ User management</li>
                            <li>✓ Content management</li>
                            <li>✓ Analytics & Reports</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Implementation Details */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Implementation Details</h2>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding State Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    id="onboarding-state"
                    title="OnboardingContext.tsx"
                    language="typescript"
                    code={`interface OnboardingState {
  currentStep: number;
  completedSteps: string[];
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string;
    role?: string;
  };
  preferences: {
    emailNotifications: boolean;
    marketingEmails: boolean;
    language: string;
  };
}

export const OnboardingProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    completedSteps: [],
    userData: {},
    preferences: {
      emailNotifications: true,
      marketingEmails: false,
      language: 'en'
    }
  });

  const completeStep = (stepName: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepName],
      currentStep: prev.currentStep + 1
    }));
  };

  const skipStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
  };

  return (
    <OnboardingContext.Provider value={{
      state,
      completeStep,
      skipStep,
      updateUserData,
      updatePreferences
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};`}
                  />
                </CardContent>
              </Card>
            </section>

            {/* Best Practices */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Onboarding Best Practices</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Show progress indicator throughout the process</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Allow users to save and resume later</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Provide clear instructions at each step</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Minimize required fields to essentials</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Validate email format and uniqueness</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Check password strength requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Verify phone number format</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Sanitize all user inputs</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        )
      },

      // Additional documentation entries
      'email-system': {
        id: 'email-system',
        title: 'Email Notification System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '8 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Email System Architecture</h2>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>System Overview</AlertTitle>
              <AlertDescription>
                The email system uses Resend for delivery, Supabase Edge Functions for processing,
                and a template management system for dynamic content generation.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground">
              Full implementation details available in the Email Settings panel.
            </p>
          </div>
        )
      },

      'portal-routing': {
        id: 'portal-routing',
        title: 'Dynamic Routing System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '5 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Portal Dynamic Routing</h2>
            <Card>
              <CardHeader>
                <CardTitle>Environment-Based Routing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">The portal supports two deployment modes:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Development:</strong> Path-based routing at localhost:5173/portal/*</li>
                  <li><strong>Production:</strong> Subdomain routing at portal.fleetdrms.com/*</li>
                </ul>
              </CardContent>
            </Card>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                See /docs/PORTAL_ROUTING_GUIDE.md for complete implementation details.
              </AlertDescription>
            </Alert>
          </div>
        )
      },

      'referral-system': {
        id: 'referral-system',
        title: 'Referral System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '6 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Referral System Architecture</h2>
            <Card>
              <CardContent className="pt-6">
                <p>Multi-tier referral tracking system with automatic rewards and comprehensive analytics.</p>
              </CardContent>
            </Card>
          </div>
        )
      },

      'auth-system': {
        id: 'auth-system',
        title: 'Authentication System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '7 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Authentication & Authorization</h2>
            <Card>
              <CardContent className="pt-6">
                <p>Supabase Auth integration with role-based access control (RBAC) for portal users.</p>
              </CardContent>
            </Card>
          </div>
        )
      },

      'database-schema': {
        id: 'database-schema',
        title: 'Database Schema',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '10 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Database Architecture</h2>
            <Card>
              <CardContent className="pt-6">
                <p>PostgreSQL database with comprehensive Row Level Security (RLS) policies.</p>
              </CardContent>
            </Card>
          </div>
        )
      },

      'survey-system': {
        id: 'survey-system',
        title: 'Survey System',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '8 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dynamic Survey System</h2>
            <Card>
              <CardContent className="pt-6">
                <p>Survey builder with conditional logic, branching, and comprehensive analytics.</p>
              </CardContent>
            </Card>
          </div>
        )
      },

      'event-management': {
        id: 'event-management',
        title: 'Event Management',
        lastUpdated: '2025-09-26',
        status: 'complete',
        readTime: '6 min read',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Event Management System</h2>
            <Card>
              <CardContent className="pt-6">
                <p>Complete event creation, registration, and attendee tracking system.</p>
              </CardContent>
            </Card>
          </div>
        )
      }
    };

    if (docId && documentation[docId]) {
      setDoc(documentation[docId]);
    }
  }, [docId]);

  if (!doc) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Documentation Not Found</AlertTitle>
          <AlertDescription>
            The requested documentation page could not be found.
          </AlertDescription>
        </Alert>
        <Link to={adminRoute('docs')}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'complete': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in-progress': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'planned': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return CheckCircle;
      case 'in-progress': return Clock;
      case 'planned': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const StatusIcon = getStatusIcon(doc.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{doc.title}</h1>
            <Badge
              variant="outline"
              className={`${getStatusColor(doc.status)}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {doc.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {doc.lastUpdated}
            </span>
            {doc.readTime && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {doc.readTime}
              </span>
            )}
          </div>
        </div>
        <Link to={adminRoute('docs')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {doc.content}
      </div>

      {/* Footer Navigation */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Link to={adminRoute('docs')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Documentation
              </Button>
            </Link>
            <Button variant="ghost" size="sm" disabled>
              Next Document
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}