# Admin Analytics Features - Detailed Specifications

## Feature 1: Enhanced User Directory

### Location
`/admin/users/directory`

### Purpose
Provide comprehensive view of all portal users with activity metrics, filtering, and search.

### Current State
- Basic user list in `PortalAdminUsers.tsx`
- Shows name, email, role, last login
- Basic search and role filtering
- Opens modal for user details

### Enhancements Needed

#### 1. Enhanced Table View
**Columns:**
- Avatar + Name
- Email
- Company Name
- Role (with badge)
- Join Date
- Last Active
- Engagement Score (0-100)
- Activity Summary (icons for updates/surveys/events)
- Quick Actions (View, Edit, Email)

#### 2. Advanced Filtering
- **Role Filter:** Multi-select (admin, member, investor)
- **Activity Filter:** Active (7d/30d), Inactive (30d+), Never Active
- **Engagement Filter:** High (80+), Medium (40-79), Low (0-39)
- **Company Size:** Small, Medium, Large, Enterprise
- **Join Date:** Date range picker
- **Combination Filters:** AND/OR logic

#### 3. Search Enhancements
- Search across: Name, Email, Company, Phone
- Fuzzy matching
- Keyboard shortcut (Cmd/Ctrl + K)
- Search history (last 5 searches)

#### 4. Bulk Actions
- Select multiple users (checkbox)
- Bulk email
- Bulk export
- Bulk role assignment
- Archive/deactivate (future)

#### 5. View Options
- Grid view (cards)
- List view (table)
- Compact view (mini cards)
- Column customization (show/hide)
- Save view preferences

#### 6. Performance Metrics Display
**Engagement Score Breakdown:**
- Updates read: X/Y (weight: 20%)
- Surveys completed: X/Y (weight: 30%)
- Events registered: X (weight: 20%)
- Calculator submissions: X (weight: 15%)
- Referrals: X (weight: 15%)

**Visual Indicators:**
- Color-coded engagement score
- Activity badges (🔥 Very Active, ⚡ Active, 😴 Inactive)
- Trend arrows (↑ improving, → stable, ↓ declining)

### Database Requirements

```sql
-- Create comprehensive user view
CREATE OR REPLACE VIEW user_directory_view AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  p.first_name,
  p.last_name,
  p.company_name,
  p.company_size,
  p.phone,
  p.avatar_url,
  ur.role,

  -- Activity counts
  COALESCE(ua.update_count, 0) as updates_read,
  COALESCE(sa.survey_count, 0) as surveys_completed,
  COALESCE(sa.survey_started, 0) as surveys_started,
  COALESCE(ea.event_count, 0) as events_registered,
  COALESCE(ca.calc_count, 0) as calculator_submissions,
  COALESCE(ra.referral_count, 0) as referrals_made,

  -- Totals for percentage calculations
  (SELECT COUNT(*) FROM portal_updates WHERE status = 'published') as total_updates,
  (SELECT COUNT(*) FROM portal_surveys WHERE is_active = true) as total_surveys,

  -- Engagement score (0-100)
  ROUND(
    (COALESCE(ua.update_count, 0)::float / NULLIF((SELECT COUNT(*) FROM portal_updates WHERE status = 'published'), 0) * 20) +
    (COALESCE(sa.survey_count, 0)::float / NULLIF((SELECT COUNT(*) FROM portal_surveys WHERE is_active = true), 0) * 30) +
    (LEAST(COALESCE(ea.event_count, 0), 5)::float / 5 * 20) +
    (LEAST(COALESCE(ca.calc_count, 0), 3)::float / 3 * 15) +
    (LEAST(COALESCE(ra.referral_count, 0), 3)::float / 3 * 15)
  )::integer as engagement_score,

  -- Last activity timestamp
  GREATEST(
    u.last_sign_in_at,
    ua.last_update_read,
    sa.last_survey_completed,
    ea.last_event_registered,
    ca.last_calc_submitted
  ) as last_activity

FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id

-- Aggregated activity counts
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as update_count,
    MAX(created_at) as last_update_read
  FROM update_acknowledgements
  WHERE user_id = u.id
) ua ON true

LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE is_complete = true) as survey_count,
    COUNT(*) as survey_started,
    MAX(completed_at) as last_survey_completed
  FROM portal_survey_responses
  WHERE user_id = u.id
) sa ON true

LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as event_count,
    MAX(created_at) as last_event_registered
  FROM event_registrations
  WHERE user_id = u.id
) ea ON true

LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as calc_count,
    MAX(created_at) as last_calc_submitted
  FROM calculator_submissions
  WHERE user_id = u.id
) ca ON true

LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as referral_count
  FROM referrals
  WHERE referrer_id = u.id
) ra ON true

WHERE ur.role IN ('portal_member', 'admin', 'super_admin', 'investor')
ORDER BY engagement_score DESC, last_activity DESC NULLS LAST;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_directory_engagement
ON user_roles(user_id)
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');
```

### Component Structure

```
/pages/portal/admin/users/
  └── UserDirectory.tsx                    # Main page
      /components/
        ├── UserDirectoryHeader.tsx        # Title, search, filters
        ├── UserDirectoryFilters.tsx       # Advanced filter panel
        ├── UserDirectoryTable.tsx         # Table view
        ├── UserDirectoryGrid.tsx          # Grid/card view
        ├── UserDirectoryCard.tsx          # Individual user card
        ├── UserEngagementBadge.tsx        # Engagement score display
        ├── UserActivityIcons.tsx          # Activity summary icons
        └── UserBulkActions.tsx            # Bulk action toolbar
```

---

## Feature 2: Survey Analytics Dashboard

### Location
`/admin/data/survey-analytics/:surveyId`

### Purpose
Provide comprehensive analytics for survey responses with aggregated insights and individual response viewing.

### Page Sections

#### 1. Overview Header
- Survey title and description
- Date range (created, published, closed)
- Quick stats cards:
  - Total Responses
  - Completion Rate
  - Average Completion Time
  - Response Trend (last 7d)

#### 2. Response Timeline
- Line chart showing responses over time
- X-axis: Dates
- Y-axis: Response count
- Show started vs completed
- Highlight days with high activity

#### 3. Question Analytics (tabs or accordion)

**For Multiple Choice Questions:**
```
Question: What is your primary delivery vehicle type?

EDV: ████████████████ 45% (23 responses)
PRIME: ██████████ 30% (15 responses)
STANDARD: ████ 15% (8 responses)
XL: ██ 10% (5 responses)

[Pie Chart Visualization]
```

**For Rating Scale Questions:**
```
Question: How satisfied are you with FleetDRMS?

5 stars: ████████████████████ 40% (20)
4 stars: ████████████ 30% (15)
3 stars: ████ 10% (5)
2 stars: ██ 5% (3)
1 star: ██ 5% (2)
No response: ████ 10% (5)

Average: 4.2 / 5.0
[Bar Chart Visualization]
```

**For Text Response Questions:**
```
Question: What features would you like to see added?

Responses: 32

Common themes (auto-detected):
- Route optimization (mentioned 12 times)
- Mobile app (mentioned 8 times)
- Better reporting (mentioned 7 times)

[Word Cloud - Optional]
[View All Text Responses Button]
```

**For Yes/No Questions:**
```
Question: Do you use multiple DSP management tools?

Yes: ████████████████ 65% (33)
No: ██████ 35% (17)

[Donut Chart]
```

#### 4. Response List
**Table columns:**
- User (name + email)
- Completion Status (badge)
- Started At
- Completed At
- Time Taken
- Actions (View Response, Export)

**Filters:**
- Completion status (Complete, Incomplete, All)
- Date range
- User search

**Sort:**
- Date submitted (newest/oldest)
- Completion time (longest/shortest)
- User name (A-Z)

#### 5. Individual Response Viewer (Modal)
```
┌─────────────────────────────────────┐
│  Survey Response                    │
│                                     │
│  User: John Doe (john@dsp.com)      │
│  Submitted: Mar 10, 2024 at 2:30 PM │
│  Time taken: 4 min 32 sec           │
│                                     │
│  Q1: What is your role?             │
│  A: Fleet Manager                   │
│                                     │
│  Q2: How many vehicles do you have? │
│  A: 25-50                           │
│                                     │
│  Q3: What challenges do you face?   │
│  A: [Long text response...]         │
│                                     │
│  [< Previous]  [Next >]  [Close]    │
└─────────────────────────────────────┘
```

### Database Requirements

```sql
-- Function to get survey analytics
CREATE OR REPLACE FUNCTION get_survey_analytics(survey_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'survey_id', s.id,
    'title', s.title,
    'description', s.description,
    'created_at', s.created_at,
    'published_at', s.published_at,
    'total_responses', (
      SELECT COUNT(*) FROM portal_survey_responses
      WHERE survey_id = s.id
    ),
    'completed_responses', (
      SELECT COUNT(*) FROM portal_survey_responses
      WHERE survey_id = s.id AND is_complete = true
    ),
    'completion_rate', (
      SELECT ROUND(
        COUNT(*) FILTER (WHERE is_complete = true)::numeric /
        NULLIF(COUNT(*), 0) * 100, 1
      )
      FROM portal_survey_responses
      WHERE survey_id = s.id
    ),
    'avg_completion_time', (
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
      FROM portal_survey_responses
      WHERE survey_id = s.id AND is_complete = true
    ),
    'questions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'type', q.question_type,
          'text', q.question_text,
          'options', q.options,
          'position', q.position,
          'responses', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'answer', a.answer_text,
                'selected_option', a.selected_option,
                'user_id', a.user_id,
                'created_at', a.created_at
              )
            )
            FROM survey_answers a
            WHERE a.question_id = q.id
          ),
          'analytics', (
            CASE
              WHEN q.question_type = 'multiple_choice' THEN (
                SELECT jsonb_object_agg(
                  selected_option,
                  count
                )
                FROM (
                  SELECT
                    selected_option,
                    COUNT(*) as count
                  FROM survey_answers
                  WHERE question_id = q.id
                  GROUP BY selected_option
                ) option_counts
              )
              WHEN q.question_type = 'rating' THEN (
                SELECT jsonb_build_object(
                  'average', AVG(answer_text::numeric),
                  'distribution', jsonb_object_agg(rating, count)
                )
                FROM (
                  SELECT
                    answer_text as rating,
                    COUNT(*) as count
                  FROM survey_answers
                  WHERE question_id = q.id
                  GROUP BY answer_text
                ) rating_dist
              )
              ELSE NULL
            END
          )
        )
        ORDER BY q.position
      )
      FROM portal_survey_questions q
      WHERE q.survey_id = s.id
    ),
    'timeline', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date,
          'started', started_count,
          'completed', completed_count
        )
        ORDER BY date
      )
      FROM (
        SELECT
          DATE(started_at) as date,
          COUNT(*) as started_count,
          COUNT(*) FILTER (WHERE is_complete = true) as completed_count
        FROM portal_survey_responses
        WHERE survey_id = s.id
        GROUP BY DATE(started_at)
      ) daily_stats
    )
  ) INTO result
  FROM portal_surveys s
  WHERE s.id = survey_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Component Structure

```
/pages/portal/admin/data/
  └── SurveyAnalytics.tsx                  # Main page
      /components/
        ├── SurveyAnalyticsHeader.tsx      # Title, stats cards
        ├── ResponseTimeline.tsx           # Chart of responses over time
        ├── QuestionAnalytics.tsx          # Per-question breakdown
        ├── MultipleChoiceAnalytics.tsx    # MC question charts
        ├── RatingAnalytics.tsx            # Rating question charts
        ├── TextResponseList.tsx           # Text responses viewer
        ├── ResponseTable.tsx              # Individual responses table
        ├── ResponseViewerModal.tsx        # Full response viewer
        └── SurveyExportButton.tsx         # CSV export (future)
```

---

## Feature 3: Individual User Drill-Down

### Location
`/admin/users/analytics/:userId`

### Purpose
Complete view of a single user's portal activity, profile, and engagement.

### Page Layout

#### Header Section
```
┌────────────────────────────────────────────────────────┐
│  [<- Back to Users]                                    │
│                                                         │
│  [Avatar]  John Doe                    [Edit] [Email]  │
│            john@dsp.com                                 │
│            ABC Logistics Inc.                           │
│            Portal Member since Jan 2024                 │
│                                                         │
│  Engagement Score: 78/100 ████████░░                    │
│  Last Active: 2 hours ago                               │
└────────────────────────────────────────────────────────┘
```

#### Tabbed Interface

**Tab 1: Overview**
- Quick Stats Cards:
  - Updates Read: 12/15 (80%)
  - Surveys Completed: 3/4 (75%)
  - Events Registered: 2
  - Calculator Submissions: 1
  - Referrals Made: 0

- Recent Activity Timeline (last 30 days)
  ```
  Mar 10, 2024 at 2:30 PM
  📋 Completed survey: "Q1 2024 Feedback"

  Mar 8, 2024 at 9:15 AM
  📰 Read update: "New Features Release"

  Mar 5, 2024 at 4:00 PM
  📅 Registered for event: "Spring Webinar"

  [Load More...]
  ```

**Tab 2: Surveys**
- Table of all survey responses:
  - Survey Title
  - Status (Complete/Incomplete)
  - Started Date
  - Completed Date
  - Time Taken
  - Action (View Response)

- Click to view full response in modal

**Tab 3: Calculators**
- List of calculator submissions:
  - Submission Date
  - Current Annual Cost: $X
  - Projected Savings: $Y
  - ROI: Z%
  - Action (View Details)

**Tab 4: Events**
- Table of event registrations:
  - Event Title
  - Event Date
  - Registration Date
  - Status (Upcoming, Past, Cancelled)
  - Attendance Status (if tracked)

**Tab 5: Updates**
- List of updates with read status:
  - Update Title
  - Published Date
  - Status (✓ Read / ✗ Unread)
  - Read Date (if read)

**Tab 6: Referrals**
- Referrals made by this user:
  - Referred User (name + email)
  - Date Referred
  - Status (Pending, Joined, Declined)
  - Conversion Date (if joined)

**Tab 7: Activity Log**
- Chronological log of ALL activities:
  ```
  Mar 10, 2024 2:30 PM - Completed survey
  Mar 10, 2024 2:25 PM - Started survey
  Mar 8, 2024 9:15 AM - Logged in
  Mar 8, 2024 9:16 AM - Read update
  Mar 5, 2024 4:00 PM - Registered for event
  Mar 3, 2024 10:30 AM - Submitted calculator
  ```

- Filters: Activity type, date range
- Pagination

### Admin Actions Toolbar
```
[Edit Profile] [Change Role] [Send Email] [View as User] [Export Data] [Delete User]
```

### Database Requirements

```sql
-- Function to get comprehensive user activity
CREATE OR REPLACE FUNCTION get_user_comprehensive_activity(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'profile', (
      SELECT jsonb_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'company_name', p.company_name,
        'company_size', p.company_size,
        'phone', p.phone,
        'avatar_url', p.avatar_url
      )
      FROM profiles p WHERE p.id = u.id
    ),
    'role', (
      SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1
    ),
    'engagement_score', (
      SELECT engagement_score FROM user_directory_view WHERE id = u.id
    ),
    'updates', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'update_id', ua.update_id,
          'update_title', pu.title,
          'read_at', ua.created_at
        )
        ORDER BY ua.created_at DESC
      )
      FROM update_acknowledgements ua
      JOIN portal_updates pu ON ua.update_id = pu.id
      WHERE ua.user_id = u.id
    ),
    'surveys', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'survey_id', sr.survey_id,
          'survey_title', ps.title,
          'started_at', sr.started_at,
          'completed_at', sr.completed_at,
          'is_complete', sr.is_complete,
          'time_taken', EXTRACT(EPOCH FROM (sr.completed_at - sr.started_at))
        )
        ORDER BY sr.started_at DESC
      )
      FROM portal_survey_responses sr
      JOIN portal_surveys ps ON sr.survey_id = ps.id
      WHERE sr.user_id = u.id
    ),
    'events', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_id', er.event_id,
          'event_title', e.title,
          'event_date', e.start_datetime,
          'registered_at', er.created_at,
          'status', er.status
        )
        ORDER BY er.created_at DESC
      )
      FROM event_registrations er
      JOIN portal_events e ON er.event_id = e.id
      WHERE er.user_id = u.id
    ),
    'calculators', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cs.id,
          'submitted_at', cs.created_at,
          'current_cost', cs.current_annual_cost,
          'projected_savings', cs.projected_annual_savings,
          'roi_percentage', cs.roi_percentage
        )
        ORDER BY cs.created_at DESC
      )
      FROM calculator_submissions cs
      WHERE cs.user_id = u.id
    ),
    'referrals', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'referred_email', r.referred_email,
          'referred_name', r.referred_name,
          'created_at', r.created_at,
          'status', r.status,
          'converted_at', r.converted_at
        )
        ORDER BY r.created_at DESC
      )
      FROM referrals r
      WHERE r.referrer_id = u.id
    ),
    'activity_timeline', (
      -- Combined timeline of all activities
      SELECT jsonb_agg(
        activity
        ORDER BY timestamp DESC
      )
      FROM (
        -- Updates
        SELECT
          ua.created_at as timestamp,
          'update_read' as type,
          jsonb_build_object(
            'update_id', ua.update_id,
            'update_title', pu.title
          ) as details
        FROM update_acknowledgements ua
        JOIN portal_updates pu ON ua.update_id = pu.id
        WHERE ua.user_id = u.id

        UNION ALL

        -- Surveys
        SELECT
          sr.started_at as timestamp,
          'survey_started' as type,
          jsonb_build_object(
            'survey_id', sr.survey_id,
            'survey_title', ps.title
          ) as details
        FROM portal_survey_responses sr
        JOIN portal_surveys ps ON sr.survey_id = ps.id
        WHERE sr.user_id = u.id

        UNION ALL

        SELECT
          sr.completed_at as timestamp,
          'survey_completed' as type,
          jsonb_build_object(
            'survey_id', sr.survey_id,
            'survey_title', ps.title
          ) as details
        FROM portal_survey_responses sr
        JOIN portal_surveys ps ON sr.survey_id = ps.id
        WHERE sr.user_id = u.id AND sr.is_complete = true

        UNION ALL

        -- Events
        SELECT
          er.created_at as timestamp,
          'event_registered' as type,
          jsonb_build_object(
            'event_id', er.event_id,
            'event_title', e.title
          ) as details
        FROM event_registrations er
        JOIN portal_events e ON er.event_id = e.id
        WHERE er.user_id = u.id

        UNION ALL

        -- Calculator
        SELECT
          cs.created_at as timestamp,
          'calculator_submitted' as type,
          jsonb_build_object(
            'id', cs.id,
            'savings', cs.projected_annual_savings
          ) as details
        FROM calculator_submissions cs
        WHERE cs.user_id = u.id

        UNION ALL

        -- Referrals
        SELECT
          r.created_at as timestamp,
          'referral_made' as type,
          jsonb_build_object(
            'id', r.id,
            'referred_email', r.referred_email
          ) as details
        FROM referrals r
        WHERE r.referrer_id = u.id
      ) combined_activity
    )
  ) INTO result
  FROM auth.users u
  WHERE u.id = user_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Component Structure

```
/pages/portal/admin/users/
  └── UserAnalytics.tsx                    # Main page
      /components/
        ├── UserAnalyticsHeader.tsx        # User info, stats, actions
        ├── UserOverviewTab.tsx            # Overview tab content
        ├── UserSurveysTab.tsx             # Surveys tab
        ├── UserCalculatorsTab.tsx         # Calculator tab
        ├── UserEventsTab.tsx              # Events tab
        ├── UserUpdatesTab.tsx             # Updates tab
        ├── UserReferralsTab.tsx           # Referrals tab
        ├── UserActivityLogTab.tsx         # Activity log tab
        ├── UserEngagementChart.tsx        # Engagement score breakdown
        ├── UserTimelineItem.tsx           # Activity timeline item
        └── UserAdminActions.tsx           # Admin action toolbar
```

---

## Implementation Priority

1. **Navigation Redesign** (Current focus)
   - Foundation for all new features
   - Immediate UX improvement

2. **Enhanced User Directory** (Week 2-3)
   - Most requested feature
   - Builds on existing users page
   - High impact for admins

3. **Individual User Drill-Down** (Week 3-4)
   - Natural extension of user directory
   - Completes user management story

4. **Survey Analytics** (Week 4-5)
   - High demand from stakeholders
   - Existing survey results page as starting point

5. **Additional Analytics** (Week 6+)
   - Event analytics
   - Engagement metrics
   - Nice-to-haves

## Performance Considerations

- Use database views for complex queries
- Add indexes on frequently filtered columns
- Implement pagination (50 items per page)
- Cache analytics data (5-minute TTL)
- Use React Query for client-side caching
- Lazy load heavy components (charts)
- Virtual scrolling for large tables (1000+ rows)

## Security Considerations

- All analytics routes require admin/super_admin role
- RLS policies on all data access
- Audit log for sensitive actions (user deletion, role changes)
- Rate limiting on export endpoints
- No PII in URLs (use UUIDs, not emails)

## Accessibility Requirements

- Keyboard navigation for all features
- Screen reader support (ARIA labels)
- High contrast mode support
- Focus indicators on all interactive elements
- Skip links for navigation
- Descriptive error messages
