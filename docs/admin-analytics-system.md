# Admin Analytics System Documentation

**Last Updated:** 2025-01-03
**Status:** Production Ready
**Branch:** `portal-analytics`

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Analytics Dashboard](#analytics-dashboard)
4. [Navigation System](#navigation-system)
5. [User Activity System](#user-activity-system)
6. [Survey Analytics System](#survey-analytics-system)
7. [Event Analytics System](#event-analytics-system)
8. [Avatar Component System](#avatar-component-system)
9. [Database Schema](#database-schema)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Admin Analytics System provides comprehensive user activity tracking and analytics for portal administrators. The system enables both **user-centric** (view a user's activity) and **content-centric** (view activity for specific content) analysis.

### Key Features

- **Analytics Dashboard** - High-level overview of all portal metrics and engagement
- **User Activity Timeline** - Complete chronological view of all user actions
- **Survey Analytics** - Content-centric view of survey responses and completions
- **Event Analytics** - Track event registrations, attendance, and engagement (NEW)
- **Engagement Scoring** - Weighted algorithm calculating user engagement (0-100)
- **Quick Navigation** - Avatar-based quick selection (Jira-style)
- **Real-time Data** - All metrics pulled from actual database records (no mock data)
- **Dual-Access Pattern** - Access activity from user directory OR content items
- **Comprehensive Filtering** - By activity type, date range, and user
- **Top Users & Content** - Leaderboards showing most engaged users and best performing content

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Navigation                          │
│  Dashboard | Content | Users | Data | Communications | Settings│
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
     ┌──────▼──────┐              ┌──────▼──────┐
     │ User        │              │ Content     │
     │ Directory   │              │ Analytics   │
     │             │              │             │
     │ - List      │              │ - Surveys   │
     │ - Filter    │              │ - Events    │
     │ - Metrics   │              │ - Updates   │
     └──────┬──────┘              └──────┬──────┘
            │                             │
            └──────────┬──────────────────┘
                       │
              ┌────────▼─────────┐
              │ User Activity    │
              │ Timeline         │
              │                  │
              │ Services:        │
              │ - user-activity  │
              │ - user-analytics │
              └──────────────────┘
```

### Data Flow

1. **User Selection** → Avatar Click or Directory Navigation
2. **Service Call** → `fetchUserActivity(userId)` + `fetchUserActivityStats(userId)`
3. **Data Aggregation** → Queries 7 tables in parallel
4. **Timeline Generation** → Chronologically sorted activity events
5. **Rendering** → Timeline with filters and stats

---

## Analytics Dashboard

### Overview

The Analytics Dashboard is the main entry point for all analytics features. It provides a high-level overview of portal engagement, top users, and best performing content.

**Location:** `/admin/data/analytics`
**Component:** `PortalAdminAnalytics.tsx`
**Service:** `analytics-dashboard.service.ts`

### Features

#### 1. Overview Metrics Cards

Seven key metrics displayed prominently:

- **Total Users** - Total portal users with active percentage
- **New Users** - Users added this month
- **Survey Completion** - Percentage of survey responses completed
- **Event Attendance** - Percentage of registrations that attended
- **Update Read Rate** - Percentage of updates that were read
- **Referral Conversions** - Percentage of referrals that converted
- **Portal Engagement** - Average engagement across all content types

Each metric includes:
- Large number display
- Trend indicator (up/down/neutral arrow)
- Contextual subtitle

#### 2. Most Engaged Users

**Top 10 users by engagement score (last 30 days)**

Display format:
```
#1 [Avatar] John Doe                Score: 85  Activities: 12  2 hours ago
#2 [Avatar] Jane Smith              Score: 72  Activities: 9   1 day ago
...
```

Features:
- Clickable to navigate to user's activity page
- Color-coded avatars with initials
- Engagement score (weighted: surveys 10pts, events 8pts, updates 2pts)
- Total activity count
- Last active timestamp (relative)

#### 3. Top Performing Content

**Top 5 content items by engagement across all types**

Display format:
```
#1 [Survey Badge] Portal Feedback Survey    42 Responses    2 days ago
#2 [Event Badge]  Q1 Strategy Session       28 Registrations 1 week ago
#3 [Update Badge] Product Launch Update     51 Reads        3 days ago
...
```

Features:
- Color-coded badges by content type (Survey/Event/Update)
- Clickable to navigate to content detail page (Survey Analytics, etc.)
- Engagement count (responses/registrations/reads)
- Creation date (relative)

#### 4. Quick Actions

Four buttons for rapid navigation to key analytics pages:
- Survey Analytics
- User Directory
- Event Analytics (planned)
- Engagement Metrics (planned)

### Service Layer

**File:** `src/services/analytics-dashboard.service.ts`

#### Main Functions

**fetchDashboardMetrics()**

Returns: `DashboardMetrics`

Queries in parallel:
- User counts (total, new, active)
- Survey metrics (total, active, completion rate)
- Event metrics (total, upcoming, attendance rate)
- Update metrics (total, read rate)
- Referral metrics (total, conversion rate)

Calculation examples:
```typescript
// Active users = users with sign-in in last 30 days
const activeUsers = await supabase
  .from('profiles')
  .select('id', { count: 'exact' })
  .gte('last_sign_in_at', thirtyDaysAgo);

// Survey response rate = completed / total responses
const surveyResponseRate = Math.round(
  (completedResponses / totalResponses) * 100
);

// Event attendance rate = attended / total registrations
const eventAttendanceRate = Math.round(
  (attendedRegistrations / totalRegistrations) * 100
);
```

**fetchTopUsers(limit = 10)**

Returns: `TopUser[]`

Process:
1. Get all users from `user_acquisition_details`
2. Count activities by type in last 30 days:
   - Survey responses
   - Event registrations
   - Update reads
3. Calculate weighted engagement score:
   ```typescript
   engagement_score = Math.min(100,
     (surveyCount * 10) +  // Surveys worth 10 points
     (eventCount * 8) +    // Events worth 8 points
     (updateCount * 2)     // Updates worth 2 points
   );
   ```
4. Get last_sign_in_at from profiles
5. Sort by engagement score descending
6. Return top N users

**fetchTopContent(limit = 5)**

Returns: `ContentPerformance[]`

Process:
1. Query surveys with response counts
2. Query events with registration counts
3. Query updates with read counts
4. Combine all content into single array
5. Sort by engagement_count descending
6. Return top N items

**fetchEngagementTrends()**

Returns: `EngagementTrend[]` (30 days of activity)

Process:
1. Get all activities from last 30 days
2. Group by date (YYYY-MM-DD)
3. Count total activities per day
4. Count unique users per day
5. Sort chronologically

_Note: Trends display not yet implemented in UI_

### UI Components

**Metric Card Pattern:**

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
    <Users className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{metrics.totalUsers}</div>
    <p className="text-xs text-muted-foreground">
      {metrics.activeUsers} active ({percentage}%)
    </p>
  </CardContent>
</Card>
```

**Trend Indicator Logic:**

```typescript
const getTrendIcon = (value: number, threshold: number = 50) => {
  if (value > threshold) return <ArrowUpRight className="text-green-600" />;
  if (value < threshold) return <ArrowDownRight className="text-red-600" />;
  return <Minus className="text-gray-600" />;
};
```

### Color Coding

**Content Type Badges:**
- Survey: `bg-blue-100 text-blue-700`
- Event: `bg-purple-100 text-purple-700`
- Update: `bg-green-100 text-green-700`

**Trend Indicators:**
- Positive (>50%): Green with up arrow
- Negative (<50%): Red with down arrow
- Neutral (=50%): Gray with minus sign

### Navigation & Deep Linking

Users can click on:
- **User row** → Navigate to `/admin/users/activity?user_id={id}`
- **Survey content** → Navigate to `/admin/data/survey-analytics?survey_id={id}`
- **Quick action buttons** → Navigate to respective analytics pages

### Performance Optimization

All metrics loaded in parallel using `Promise.all()`:
```typescript
const [metricsData, usersData, contentData] = await Promise.all([
  fetchDashboardMetrics(),
  fetchTopUsers(10),
  fetchTopContent(5)
]);
```

### Loading States

1. **Initial load:** Spinner with "Loading analytics..." message
2. **Error state:** Toast notification with error message
3. **Empty state:** "No data available" message

### Usage Example

```typescript
// Component usage
import { PortalAdminAnalytics } from '@/pages/portal/admin/PortalAdminAnalytics';

// Route configuration
<Route path="data/analytics" element={<PortalAdminAnalytics />} />
```

### Future Enhancements

- **Engagement Trends Chart** - Line graph showing activity over 30 days
- **Export to CSV** - Download metrics and user/content lists
- **Date Range Selector** - Customize reporting period
- **Role-based Filtering** - Filter top users by role
- **Content Type Filtering** - Show only surveys, events, or updates
- **Comparison View** - Month-over-month or year-over-year comparisons
- **Scheduled Reports** - Email weekly/monthly summaries to admins

---

## Navigation System

### File Structure

```
src/components/portal/admin/navigation/
├── navigation-config.ts       # Central navigation configuration
├── AdminDropdownMenu.tsx      # Dropdown with React Portal
├── AdminBreadcrumbs.tsx       # Breadcrumb navigation
└── RouteRedirects.tsx         # Backward compatibility

src/pages/portal/admin/
├── content/ContentSectionLayout.tsx
├── users/UsersSectionLayout.tsx
├── data/DataSectionLayout.tsx
├── communications/CommunicationsSectionLayout.tsx
└── settings/PortalAdminSettings.tsx
```

### Navigation Configuration

**Type Definitions:**

```typescript
interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  status?: 'new' | 'planned' | 'beta';
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

type NavSection = NavItem | NavGroup;
```

**Key Design Patterns:**

1. **React Portal for Dropdowns** - Escapes overflow containers
   ```typescript
   createPortal(dropdown, document.body)
   ```

2. **Section Layouts** - Left sidebar navigation for grouped routes
   ```typescript
   <UsersSectionLayout>
     <Outlet />
   </UsersSectionLayout>
   ```

3. **Route Preservation** - All original routes maintained via redirects

---

## User Activity System

### Components

#### 1. UserActivity.tsx
**Location:** `src/pages/portal/admin/users/UserActivity.tsx`

**Purpose:** Main page for viewing individual user activity timelines

**Features:**
- Quick-select avatar bar (Jira-style)
- Searchable user dropdown
- 8 activity stat cards
- Filterable timeline (by type and date)
- URL parameter support for deep linking

**Key Code:**
```typescript
// URL parameter handling for deep linking
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const userIdParam = searchParams.get('user_id');
  if (userIdParam) {
    setSelectedUserId(userIdParam);
  }
}, [searchParams]);

// Quick select handler
const handleUserSelect = (userId: string) => {
  setSelectedUserId(userId);
  setUserSearchOpen(false);
  setSearchParams({ user_id: userId }); // Update URL
};
```

**Data Loading:**
```typescript
// Parallel loading of activity and stats
const [activityData, statsData] = await Promise.all([
  fetchUserActivity(selectedUserId),
  fetchUserActivityStats(selectedUserId)
]);
```

#### 2. UserActivityTimeline.tsx
**Location:** `src/components/portal/admin/UserActivityTimeline.tsx`

**Purpose:** Renders chronological activity feed with date grouping

**Features:**
- Groups activities by date (Today, Yesterday, Day Name, etc.)
- Type and status badges with color coding
- Click handler for activity details
- Metadata display for specific activity types

**Date Grouping Logic:**
```typescript
function groupByDate(activities: ActivityEvent[]): Record<string, ActivityEvent[]> {
  const groups: Record<string, ActivityEvent[]> = {};

  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp);
    let dateLabel: string;

    if (isSameDay(activityDate, today)) {
      dateLabel = 'Today';
    } else if (isSameDay(activityDate, yesterday)) {
      dateLabel = 'Yesterday';
    } else if (isWithinDays(activityDate, today, 7)) {
      dateLabel = format(activityDate, 'EEEE'); // "Monday"
    } else if (activityDate.getFullYear() === today.getFullYear()) {
      dateLabel = format(activityDate, 'MMMM d'); // "January 15"
    } else {
      dateLabel = format(activityDate, 'MMMM d, yyyy'); // "January 15, 2024"
    }

    if (!groups[dateLabel]) groups[dateLabel] = [];
    groups[dateLabel].push(activity);
  });

  return groups;
}
```

### Services

#### user-activity.service.ts
**Location:** `src/services/user-activity.service.ts`

**Purpose:** Fetches detailed activity events for individual users

**Activity Types:**
```typescript
type ActivityType =
  | 'survey'      // 📋 Survey responses
  | 'event'       // 📅 Event registrations
  | 'update'      // 📢 Update views/acknowledgements
  | 'calculator'  // 🧮 ROI calculator submissions
  | 'referral'    // 👥 Referrals made
  | 'auth'        // 🔐 Authentication events
  | 'profile';    // 👤 Profile updates
```

**Data Sources:**
```typescript
// Parallel queries to 7 tables
const [surveys, events, updates, calculators, referrals, profile] =
  await Promise.all([
    supabase.from('portal_survey_responses').select(...),
    supabase.from('portal_event_registrations').select(...),
    supabase.from('portal_update_reads').select(...),
    supabase.from('calculator_submissions').select(...),
    supabase.from('portal_referrals').select(...),
    supabase.from('profiles').select(...)  // Auth & profile events
  ]);
```

**Key Functions:**

1. **fetchUserActivity(userId, options?)**
   - Returns: `UserActivitySummary`
   - Options: type filter, date range, limit
   - Sorts chronologically (most recent first)

2. **fetchUserActivityStats(userId)**
   - Returns: Activity counts by type
   - Used for stat cards display

3. **getActivityTypeInfo(type)**
   - Returns: Label, icon, color scheme
   - Ensures consistent styling

4. **getActivityStatusInfo(status)**
   - Returns: Label and color for status badge
   - Handles undefined gracefully (returns null)

#### user-analytics.service.ts
**Location:** `src/services/user-analytics.service.ts`

**Purpose:** Calculates aggregate engagement metrics for all users

**Engagement Score Algorithm:**

```typescript
// Weighted scoring (0-100 scale)
const weights = {
  surveysCompleted: 0.30,      // 30%
  eventsRegistered: 0.20,      // 20%
  updatesAcknowledged: 0.20,   // 20%
  calculatorSubmissions: 0.15, // 15%
  referralsMade: 0.15          // 15%
};

// Normalization maximums
const MAX_VALUES = {
  surveys: 10,
  events: 5,
  updates: 20,
  calculators: 3,
  referrals: 5
};

// Calculate normalized score
const score =
  (Math.min(100, (surveys / MAX_SURVEYS) * 100) * 0.30) +
  (Math.min(100, (events / MAX_EVENTS) * 100) * 0.20) +
  // ... etc
```

**Engagement Levels:**
```typescript
80-100: 'Very Active' 🔥 (green)
50-79:  'Active'      ⚡ (blue)
20-49:  'Moderate'    📊 (yellow)
1-19:   'Low Activity' 💤 (orange)
0:      'Inactive'    😴 (gray)
```

---

## Event Analytics System

### Overview

Event Analytics provides content-centric analysis of portal events, tracking registrations, attendance, and engagement metrics. Administrators can view event performance, drill into attendee details, and analyze attendance patterns.

**Location:** `/admin/data/event-analytics`
**Component:** `EventAnalytics.tsx`
**Service:** `event-analytics.service.ts`

### Features

#### 1. Event List View

Grid display of all events with key metrics:
- Event cards with title, date, location/type
- Status badges (Published, Draft, Cancelled, Completed)
- Registration count and attendance rate
- Capacity progress bars (when registration limit exists)
- Virtual/In-Person indicators
- Search and filter capabilities

**Filters Available:**
- Status: All, Published, Draft, Cancelled, Completed
- Type: All, In Person, Virtual, Hybrid
- Search: Title and description

**Empty State:**
- Clean message when no events exist
- No placeholder or fake data
- Filter-specific empty state messages

#### 2. Registration Detail View

Click event → View all registrations:
- Summary metrics (Total, Attended, Cancelled, No Shows)
- Attendee table with user avatars
- Registration and check-in timestamps
- Attendance status badges
- Search and filter attendees
- URL parameter support for deep linking

**Metrics Displayed:**
```
┌─────────────────────────────────────────────────────────┐
│  Total Registrations  │  Attended  │  Cancelled  │  No Shows  │
│         42            │     38     │      2      │      2     │
└─────────────────────────────────────────────────────────┘
```

#### 3. Individual Registration Dialog

Detailed view of single registration:
- User information with avatar
- Attendance status badge
- Complete timeline:
  - Registered timestamp
  - Checked in timestamp (if applicable)
  - Attended timestamp (if applicable)
  - Cancelled timestamp + reason (if applicable)
- Payment information (if event has fees)
- Notes field

### Service Layer

**File:** `src/services/event-analytics.service.ts`

#### Main Functions

**fetchAllEventMetrics(): Promise<EventMetrics[]>**

Retrieves all events with calculated metrics:
```typescript
interface EventMetrics {
  event_id: string;
  title: string;
  description: string | null;
  status: string | null;
  event_date: string;
  start_datetime: string;
  end_datetime: string;
  type: string;
  location: string | null;
  virtual_link: string | null;
  registration_required: boolean;
  registration_limit: number | null;
  total_registrations: number;
  attended_count: number;
  cancelled_count: number;
  no_show_count: number;
  attendance_rate: number;      // Percentage
  capacity_percentage: number | null;
  created_at: string;
  published_at: string | null;
}
```

**Process:**
1. Fetch all events from `portal_events`
2. Fetch all registrations from `portal_event_registrations`
3. Calculate metrics for each event:
   - Total registrations (count)
   - Attended count (status = 'attended' OR attended_at exists)
   - Cancelled count (status = 'cancelled')
   - No show count (status = 'no_show')
   - Attendance rate: `(attended / total) * 100`
   - Capacity percentage: `(total / limit) * 100` (if limit exists)
4. Return sorted by event_date descending

**fetchEventRegistrations(eventId): Promise<EventRegistrationDetail[]>**

Retrieves all registrations for specific event:
```typescript
interface EventRegistrationDetail {
  registration_id: string;
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  attendance_status: string;
  payment_status: string | null;
  payment_amount: number | null;
  registered_at: string;
  check_in_time: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
}
```

**Process:**
1. Fetch registrations for event
2. Fetch event title
3. Fetch user data from `user_acquisition_details`
4. Map registrations with user information
5. Return sorted by registered_at descending

#### Helper Functions

**getEventStatusInfo(status): StatusInfo**

Returns badge configuration for event status:
- Published/Active: Green with ✓
- Draft: Gray with 📝
- Cancelled: Red with ✗
- Completed: Blue with ✓
- Upcoming: Purple with 📅

**getAttendanceStatusInfo(status): StatusInfo**

Returns badge configuration for attendance:
- Attended: Green with ✓
- Registered: Blue with 📝
- Cancelled: Red with ✗
- No Show: Yellow with ⚠
- Waitlist: Orange with ⏳

### HTML Content Handling

Event descriptions may contain HTML formatting. The component includes a `stripHtml` helper function:

```typescript
const stripHtml = (html: string, maxLength: number = 200): string => {
  // Remove HTML tags
  const stripped = html.replace(/<[^>]*>/g, '');
  // Decode HTML entities (&nbsp;, &amp;, etc.)
  // Trim whitespace
  // Limit length with ellipsis
  return trimmed;
};
```

This ensures clean display of event descriptions regardless of content format.

### Database Schema

**portal_events**
- Primary table for event data
- Contains title, description, dates, location, limits
- References: `created_by` → `profiles(id)`

**portal_event_registrations**
- Tracks user registrations
- Key columns: `registered_at`, `check_in_time`, `attended_at`, `attendance_status`
- Foreign keys: `event_id` → `portal_events(id)`, `user_id` → `profiles(id)`

**portal_event_dates**
- Supports multi-date events (referenced but not used in analytics)

### Navigation & Deep Linking

**URL Pattern:**
```
/admin/data/event-analytics                    # Event list view
/admin/data/event-analytics?event_id={uuid}    # Registration detail view
```

**Integration Points:**
- Analytics Dashboard → Top content list → Click survey navigates here
- Event cards → Click navigates to registration view
- Attendee rows → Click opens detail dialog

### Performance Optimizations

1. **Parallel Queries:** Event list and registrations fetched concurrently
2. **Conditional Loading:** Registration data only loaded when event selected
3. **User Data Batching:** Single query for all user info (no N+1 queries)
4. **Client-side Filtering:** Search and filters applied in-memory

### Error Handling

- Service layer catches and logs errors
- Toast notifications for user feedback
- Graceful degradation (no registrations fallback to empty array)
- Empty states for all scenarios

### Testing Checklist

- [ ] Event list displays correctly with real data
- [ ] Empty state shows when no events exist
- [ ] Status filters work (Published, Draft, Cancelled, Completed)
- [ ] Type filters work (In Person, Virtual, Hybrid)
- [ ] Search filters by title and description
- [ ] Event cards show correct metrics
- [ ] Capacity progress bars display when limit exists
- [ ] Click event navigates to registration view
- [ ] URL parameter persists on refresh
- [ ] Registration summary metrics calculate correctly
- [ ] Attendee table displays with avatars
- [ ] Attendance status badges show correct colors
- [ ] Search filters attendees
- [ ] Attendance filter works
- [ ] Registration detail dialog opens
- [ ] Timeline displays all events in order
- [ ] Payment info shows when present
- [ ] HTML in descriptions is stripped correctly
- [ ] Back button returns to event list
- [ ] Empty registration state displays properly

---

## Avatar Component System

### UserAvatar.tsx
**Location:** `src/components/portal/admin/UserAvatar.tsx`

**Purpose:** Consistent user representation with color-coded initials

**Features:**

1. **Initials Generation**
   ```typescript
   // Priority: First + Last > First 2 chars > Last 2 chars > Email 2 chars
   if (firstName && lastName) {
     return `${firstName[0]}${lastName[0]}`.toUpperCase();
   } else if (firstName) {
     return firstName.substring(0, 2).toUpperCase();
   } // ... etc
   ```

2. **Color Assignment**
   - 20 distinct color schemes
   - Consistent per user (hash based on email)
   - Tailwind color classes for easy theming

   ```typescript
   // Hash email to color index (0-19)
   let hash = 0;
   for (let i = 0; i < email.length; i++) {
     hash = email.charCodeAt(i) + ((hash << 5) - hash);
   }
   const colorIndex = Math.abs(hash) % 20;
   ```

3. **Size Variants**
   - `sm`: 6x6 (24px)
   - `md`: 8x8 (32px)
   - `lg`: 10x10 (40px)
   - `xl`: 12x12 (48px)

4. **Interaction**
   ```typescript
   <UserAvatar
     firstName="John"
     lastName="Doe"
     email="john@example.com"
     size="lg"
     onClick={() => navigate(`/admin/users/activity?user_id=${userId}`)}
   />
   ```

### UserAvatarGroup Component

**Purpose:** Display multiple avatars with overlap (e.g., "3 users assigned")

```typescript
<UserAvatarGroup
  users={[...userArray]}
  max={5}               // Show first 5, then "+X more"
  size="md"
  onUserClick={(index) => handleClick(users[index])}
/>
```

**Styling:**
- Negative margin for overlap: `-space-x-2`
- White ring around each: `ring-2 ring-white`
- "+X more" badge for overflow

---

## Database Schema

### Tables Used by Analytics System

#### 1. portal_survey_responses
```sql
Columns:
- id (uuid, PK)
- survey_id (uuid, FK → portal_surveys)
- user_id (uuid, FK → profiles)
- is_complete (boolean)
- status (text)
- started_at (timestamptz)
- completed_at (timestamptz)

Used For: Survey completion tracking
```

#### 2. portal_event_registrations
```sql
Columns:
- id (uuid, PK)
- event_id (uuid, FK → portal_events)
- user_id (uuid, FK → profiles)
- attendance_status (varchar)
- attended (boolean)
- registered_at (timestamptz)
- check_in_time (timestamptz)
- cancelled_at (timestamptz)

Used For: Event participation tracking
```

#### 3. portal_update_reads
```sql
Columns:
- id (uuid, PK)
- update_id (uuid, FK → portal_updates)
- user_id (uuid, FK → profiles)
- view_count (integer)
- first_viewed_at (timestamptz)
- acknowledged_at (timestamptz)
- dismissed_at (timestamptz)

Used For: Update engagement tracking
```

#### 4. calculator_submissions
```sql
Columns:
- id (uuid, PK)
- user_id (uuid, FK → profiles)
- fleet_size (integer)
- total_annual_savings (numeric)
- created_at (timestamptz)

Used For: ROI calculator usage
```

#### 5. portal_referrals
```sql
Columns:
- id (uuid, PK)
- referrer_id (uuid, FK → profiles)
- referee_first_name (text)
- referee_last_name (text)
- referee_email (text)
- status (text)
- created_at (timestamptz)

Used For: Referral tracking
```

#### 6. profiles
```sql
Columns (relevant):
- id (uuid, PK)
- email (text)
- first_name (text)
- last_name (text)
- role (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- last_sign_in_at (timestamptz)
- portal_registered_at (timestamptz)
- terms_accepted_at (timestamptz)
- profile_complete (boolean)

Used For: User metadata and auth events
```

#### 7. user_acquisition_details (VIEW)
```sql
-- Combines profiles with acquisition/referral data
Columns:
- user_id (uuid)
- email (text)
- first_name (text)
- last_name (text)
- role (text)
- acquisition_source (text) -- 'marketing' | 'referral' | 'direct'
- campaign_code (text)
- referrer_id (uuid)
- ... (additional marketing fields)

Used For: User Directory with acquisition context
```

### Query Patterns

**Parallel Loading (Optimized):**
```typescript
// Load all activity types simultaneously
const results = await Promise.all([
  supabase.from('portal_survey_responses').select(...).in('user_id', userIds),
  supabase.from('portal_event_registrations').select(...).in('user_id', userIds),
  // ... etc
]);

// Each service handles its own error gracefully
if (surveysError) console.error('Surveys failed:', surveysError);
// Continue processing other data sources
```

**Filtering Best Practices:**
```typescript
// Apply filters in memory (already fetched data)
// vs. Multiple database queries

// GOOD: Single fetch, filter in JS
const allActivities = await fetchUserActivity(userId);
const surveyActivities = allActivities.filter(a => a.type === 'survey');

// AVOID: Multiple fetches
const surveyActivities = await fetchUserActivity(userId, { type: 'survey' });
const eventActivities = await fetchUserActivity(userId, { type: 'event' });
```

---

## Integration Points

### User Directory → User Activity

**File:** `src/pages/portal/admin/PortalAdminUsersNew.tsx`

```typescript
// Avatar click handler
<UserAvatar
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/admin/users/activity?user_id=${user.user_id}`);
  }}
/>

// Activity icon button
<Button
  onClick={(e) => {
    e.stopPropagation();
    navigate(`/admin/users/activity?user_id=${user.user_id}`);
  }}
>
  <Activity className="h-4 w-4" />
</Button>
```

### Enhanced User Detail Modal

**File:** `src/components/portal/admin/UserDetailModalEnhanced.tsx`

**Integration:**
- Activity tab shows recent activity summary
- Links to full timeline in User Activity page
- Uses same `fetchUserActivity` service

**Fix Applied:**
- Min-height constraints to prevent "bouncing" between tabs
- `min-h-[600px]` on dialog
- `min-h-[400px]` on each tab content

---

## Future Enhancements

### Phase 1: Content-Centric Views (Partially Complete)

1. ✅ **Analytics Dashboard** - High-level overview of all metrics
2. ✅ **Survey Analytics** - View survey → see all user responses
3. 🔵 **Event Analytics** - View event → see all registrations (Planned)
4. 🔵 **Update Analytics** - View update → see all acknowledgements (Planned)

### Phase 2: Advanced Analytics

1. **Cohort Analysis** - Group users by signup date, track retention
2. **Funnel Visualization** - Survey start → completion rates
3. **Activity Heatmaps** - When are users most active?
4. **Comparative Metrics** - User vs. average engagement

### Phase 3: Export & Reporting

1. **CSV Export** - Activity data, user lists, engagement reports
2. **Scheduled Reports** - Email weekly/monthly summaries
3. **Custom Dashboards** - Admin-configurable widgets

### Phase 4: Real-time Features

1. **Live Activity Feed** - See user actions as they happen
2. **Notifications** - Alert on low engagement, survey completion
3. **WebSocket Integration** - Real-time updates without refresh

---

## Testing Checklist

### Analytics Dashboard

- [ ] Dashboard loads without errors
- [ ] All 7 metric cards display correctly
- [ ] Trend indicators show (up/down/neutral arrows)
- [ ] Total users and active percentage calculated correctly
- [ ] New users this month counted correctly
- [ ] Survey completion rate displays
- [ ] Event attendance rate displays
- [ ] Update read rate displays
- [ ] Referral conversion rate displays
- [ ] Portal engagement (average) calculated correctly
- [ ] Top 10 users list displays
- [ ] User avatars show with correct colors
- [ ] Engagement scores calculated correctly (weighted)
- [ ] Activity counts accurate
- [ ] Last active timestamps display (relative)
- [ ] Clicking user navigates to activity page with user_id
- [ ] Top 5 content items display
- [ ] Content type badges show correct colors
- [ ] Survey/Event/Update icons display
- [ ] Engagement counts accurate (responses/registrations/reads)
- [ ] Clicking survey content navigates to Survey Analytics
- [ ] Quick action buttons navigate to correct pages
- [ ] Loading state shows spinner
- [ ] Error state shows toast notification
- [ ] Empty states handled gracefully

### User Activity Page

- [ ] All 9 users visible in quick-select avatars
- [ ] Avatars sorted alphabetically by first name
- [ ] Selected avatar shows purple ring highlight
- [ ] Clicking avatar loads that user's timeline
- [ ] Search box filters users by name/email
- [ ] Stats cards show correct counts (8 types)
- [ ] Timeline groups activities by date
- [ ] Type filter works (surveys, events, updates, etc.)
- [ ] Date range filter works (7d, 30d, 90d, all)
- [ ] Authentication events display (🔐)
- [ ] Profile events display (👤)
- [ ] URL parameters persist on refresh
- [ ] Navigation from User Directory works
- [ ] Avatar click in User Directory navigates correctly

### User Directory

- [ ] Avatars display next to each user name
- [ ] Avatar colors consistent per user
- [ ] Activity icon button navigates with user_id
- [ ] Role filter works (admin, investor, etc.)
- [ ] Engagement scores display correctly
- [ ] Activity metrics display (surveys, events, updates)

### Navigation

- [ ] All 6 main nav items visible
- [ ] Dropdowns render via Portal (not clipped)
- [ ] Section sidebars display for each group
- [ ] Breadcrumbs show current location
- [ ] All original routes still accessible

---

## Troubleshooting

### Common Issues

**1. "Only 1 user showing in User Activity"**

**Cause:** Filter using `is_portal_user = true` instead of `user_acquisition_details` view

**Fix:**
```typescript
// WRONG
supabase.from('profiles').select(...).eq('is_portal_user', true)

// CORRECT
supabase.from('user_acquisition_details').select(...)
```

**2. "Cannot read properties of undefined (reading 'color')"**

**Cause:** `getActivityStatusInfo` called with undefined status

**Fix:**
```typescript
// Make function return null for undefined
export function getActivityStatusInfo(status: string | undefined) {
  if (!status) return null;
  // ... rest of function
}

// Handle null in component
const statusInfo = activity.status ? getActivityStatusInfo(activity.status) : null;
```

**3. "Dropdown menu clipped by overflow container"**

**Cause:** Parent has `overflow-x-auto`, position:absolute can't escape

**Fix:** Use React Portal
```typescript
import { createPortal } from 'react-dom';

{isOpen && createPortal(
  <div className="fixed" style={{ top, left }}>
    {/* dropdown content */}
  </div>,
  document.body
)}
```

**4. "User ID not passing from directory to activity page"**

**Cause:** Field name mismatch (`user_id` vs `id`)

**Fix:** Map field names consistently
```typescript
const mappedUsers = data.map(user => ({
  id: user.user_id,  // Map user_id to id
  email: user.email,
  // ...
}));
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Queries**
   ```typescript
   // Load all data simultaneously
   Promise.all([query1, query2, query3])
   ```

2. **Pagination** (Future)
   ```typescript
   // For large datasets
   .range(start, end)
   .limit(50)
   ```

3. **Caching** (Future)
   ```typescript
   // React Query or similar
   const { data } = useQuery(['user-activity', userId], fetchActivity, {
     staleTime: 5 * 60 * 1000 // 5 minutes
   });
   ```

4. **Debounced Search**
   ```typescript
   // Already implemented in Command component
   <CommandInput placeholder="Search..." />
   ```

---

## Code Style Guide

### TypeScript Conventions

```typescript
// Use explicit return types for public functions
export function fetchUserActivity(userId: string): Promise<UserActivitySummary> {
  // ...
}

// Use interfaces for complex types
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  // ...
}

// Use type unions for enums
type ActivityType = 'survey' | 'event' | 'update' | 'calculator' | 'referral' | 'auth' | 'profile';
```

### React Patterns

```typescript
// Parallel useEffect calls
useEffect(() => {
  // Independent operation
}, [dep1]);

useEffect(() => {
  // Another independent operation
}, [dep2]);

// NOT: Single useEffect with multiple dependencies
// (harder to reason about)

// Named functions for clarity
const handleUserSelect = (userId: string) => {
  setSelectedUserId(userId);
  setSearchParams({ user_id: userId });
};

// NOT: Inline arrow functions
onClick={() => { /* lots of logic */ }}
```

### Component Organization

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Interfaces/Types
interface Props {
  userId: string;
}

// 3. Component
export function MyComponent({ userId }: Props) {
  // 4. State
  const [data, setData] = useState();

  // 5. Effects
  useEffect(() => {}, []);

  // 6. Handlers
  const handleClick = () => {};

  // 7. Computed values
  const displayName = user?.name || 'Unknown';

  // 8. Render
  return <div>...</div>;
}

// 9. Helper functions (outside component)
function formatDate(date: Date) {
  // ...
}
```

---

## API Reference

### fetchUserActivity(userId, options?)

Fetches all activity events for a specific user.

**Parameters:**
- `userId` (string, required) - User UUID
- `options` (object, optional)
  - `type` (ActivityType) - Filter by activity type
  - `startDate` (Date) - Filter activities after date
  - `endDate` (Date) - Filter activities before date
  - `limit` (number) - Max number of results

**Returns:** `Promise<UserActivitySummary>`
```typescript
{
  user_id: string;
  total_activities: number;
  activities: ActivityEvent[];
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}
```

**Example:**
```typescript
// Get all activity
const summary = await fetchUserActivity(userId);

// Get only surveys from last 30 days
const recentSurveys = await fetchUserActivity(userId, {
  type: 'survey',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
});
```

### fetchUserActivityStats(userId)

Calculates activity statistics for a user.

**Parameters:**
- `userId` (string, required) - User UUID

**Returns:** `Promise<ActivityStats>`
```typescript
{
  total: number;
  by_type: {
    survey: number;
    event: number;
    update: number;
    calculator: number;
    referral: number;
    auth: number;
    profile: number;
  };
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}
```

### fetchUserActivityMetrics()

Fetches engagement metrics for all users (used in User Directory).

**Returns:** `Promise<Map<string, UserActivityMetrics>>`
```typescript
Map {
  'user-uuid-1' => {
    user_id: string;
    surveys_completed: number;
    surveys_started: number;
    events_registered: number;
    updates_acknowledged: number;
    calculator_submissions: number;
    referrals_made: number;
    last_activity_at: string | null;
    engagement_score: number; // 0-100
  },
  // ... more users
}
```

---

## Deployment Notes

### Environment Requirements

- Node.js 18+
- React 18+
- Supabase connection
- Tailwind CSS configured

### Build Checklist

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Bundle size within limits (<4MB gzipped)
- [ ] All routes accessible
- [ ] Database migrations applied
- [ ] RLS policies configured

### Database Migrations

No new tables created. Uses existing schema:
- `profiles`
- `portal_survey_responses`
- `portal_event_registrations`
- `portal_update_reads`
- `calculator_submissions`
- `portal_referrals`
- `user_acquisition_details` (view)

---

## Changelog

### 2025-01-03 - User Activity System v1.0

**Added:**
- User Activity page with timeline view
- UserAvatar component with 20 color schemes
- Quick-select avatar bar (Jira-style)
- Authentication and profile activity tracking
- User-centric activity service
- Integration with User Directory

**Changed:**
- Admin navigation to 6 grouped sections
- User Directory enhanced with engagement scores
- Role filter fixed (using correct role values)

**Fixed:**
- Status badge error handling for undefined values
- User ID field mapping (user_id → id)
- Dropdown clipping with React Portal
- Dialog bouncing with min-height constraints

---

## Support & Maintenance

### Key Developers

- Primary: Joey Lutes
- AI Assistant: Claude (Anthropic)

### Code Locations

**Entry Points:**
- `/admin/users/activity` - User Activity page
- `/admin/users/directory` - Enhanced User Directory

**Core Services:**
- `src/services/user-activity.service.ts`
- `src/services/user-analytics.service.ts`

**Components:**
- `src/components/portal/admin/UserAvatar.tsx`
- `src/components/portal/admin/UserActivityTimeline.tsx`

### Related Documentation

- [Navigation System](./admin-navigation.md) - Navigation redesign details
- [Database Schema](./database-schema.md) - Full schema reference
- [Component Library](./component-library.md) - UI components guide

---

**End of Documentation**
