# Portal Analytics Branch - README

**Branch:** `portal-analytics`
**Created:** March 2024
**Purpose:** Admin navigation redesign and new analytics features

## 📋 Branch Overview

This branch contains work to:
1. **Redesign admin navigation** - Reduce from 12+ tabs to 6 organized groups
2. **Add user analytics** - Enhanced user directory, activity dashboard, individual user drill-down
3. **Add survey analytics** - Comprehensive survey results with charts and insights
4. **Prepare for future analytics** - Event analytics, engagement metrics, etc.

## 📁 Documentation

All detailed documentation is in `/docs/`:

- **`ADMIN_NAVIGATION_REDESIGN.md`** - Navigation redesign plan, component specs, migration checklist
- **`ADMIN_ANALYTICS_FEATURES.md`** - Detailed specs for all analytics features
- **`PORTAL_ANALYTICS_BRANCH_README.md`** - This file (branch overview)

## 🎯 Current Status

**Phase:** Navigation Redesign
**Progress:** Planning complete, ready to build

### Completed
✅ Requirements gathering
✅ Navigation structure design
✅ Component architecture planning
✅ Database schema planning
✅ Documentation created

### In Progress
🟡 Building navigation components

### Upcoming
⬜ Create placeholder pages
⬜ Update routing
⬜ Build analytics features

## 🏗️ New Navigation Structure

### Before (12+ tabs)
```
Dashboard | Updates | Surveys | Events | Referrals | Contacts |
Contact Forms | Calculator Reports | Settings | Analytics (disabled) |
Content (disabled) | [+ hidden pages]
```

### After (6 groups)
```
📊 Dashboard

📝 Content Management ▼
  - Updates
  - Surveys
  - Events
  - Solutions Editor

👥 Users & Community ▼
  - User Directory ⭐ Enhanced
  - User Activity ⭐ NEW
  - Referrals
  - DSP Contacts

📈 Data & Reports ▼
  - Survey Analytics ⭐ NEW
  - Calculator Reports
  - Event Analytics (planned)
  - Contact Forms
  - Engagement Metrics (planned)

💬 Communications ▼
  - Email Templates
  - Email Queue
  - Notification Rules
  - Recipient Lists
  - Dashboard
  - Email Logs

⚙️ Settings ▼
  - General
  - Email
  - Security
  - Role Permissions
  - Marketing
  - Database
  - Developer
```

## 🚀 New Features

### 1. Enhanced User Directory
**Path:** `/admin/users/directory`

**Features:**
- Advanced filtering (role, activity, engagement, date)
- Comprehensive search
- Engagement scoring (0-100)
- Activity metrics (updates, surveys, events, calculators, referrals)
- Multiple view modes (grid, list, compact)
- Bulk actions

**Status:** Planned for Week 2-3

### 2. Individual User Drill-Down
**Path:** `/admin/users/analytics/:userId`

**Features:**
- Complete user profile view
- Tabbed interface (Overview, Surveys, Calculators, Events, Updates, Referrals, Activity Log)
- Admin actions (edit, email, export, delete)
- Engagement score breakdown
- Activity timeline

**Status:** Planned for Week 3-4

### 3. Survey Analytics
**Path:** `/admin/data/survey-analytics/:surveyId`

**Features:**
- Overview stats (responses, completion rate, avg time)
- Response timeline chart
- Question-by-question analysis with charts
- Individual response viewer
- Export capabilities (future)

**Status:** Planned for Week 4-5

### 4. Additional Analytics (Future)
- Event Analytics
- Referral Analytics
- Engagement Dashboard
- Cohort Analysis

## 🗂️ File Structure

```
/src/
  /components/portal/admin/
    /navigation/                          # NEW
      ├── AdminNavigation.tsx             # Main nav container
      ├── AdminDropdownMenu.tsx           # Dropdown component
      ├── AdminBreadcrumbs.tsx            # Breadcrumb trail
      └── navigation-config.ts            # Nav structure data

  /pages/portal/admin/
    /users/                               # REORGANIZED
      ├── UserDirectory.tsx               # Enhanced (was PortalAdminUsers)
      ├── UserActivity.tsx                # NEW - Activity dashboard
      ├── UserAnalytics.tsx               # NEW - Individual user view
      ├── /components/                    # User feature components
      └── ...

    /data/                                # NEW SECTION
      ├── SurveyAnalytics.tsx             # NEW - Survey analytics
      ├── CalculatorReports.tsx           # Moved from /reports
      ├── EventAnalytics.tsx              # NEW - Planned
      ├── ContactForms.tsx                # Moved from root
      ├── EngagementMetrics.tsx           # NEW - Planned
      └── /components/                    # Analytics components

    /content/                             # NEW ORGANIZATION
      ├── Updates.tsx                     # Moved (was PortalAdminUpdates)
      ├── Surveys.tsx                     # Moved (was PortalAdminSurveys)
      ├── Events.tsx                      # Moved (was PortalAdminEventCreator)
      └── SolutionsEditor.tsx             # Moved

  /docs/                                  # NEW
    ├── ADMIN_NAVIGATION_REDESIGN.md
    ├── ADMIN_ANALYTICS_FEATURES.md
    └── PORTAL_ANALYTICS_BRANCH_README.md
```

## 🔄 Migration Plan

### Route Changes

**Content Management:**
- `/admin/updates` → `/admin/content/updates`
- `/admin/surveys` → `/admin/content/surveys`
- `/admin/events` → `/admin/content/events`
- `/admin/solutions` → `/admin/content/solutions`

**Users & Community:**
- `/admin/users` → `/admin/users/directory`
- `/admin/referrals` → `/admin/users/referrals`
- `/admin/contacts` → `/admin/users/contacts`

**Data & Reports:**
- `/admin/reports/calculator-submissions` → `/admin/data/calculator-reports`
- `/admin/contact-submissions` → `/admin/data/contact-forms`

**Communications & Settings:**
- No changes (already well-organized)

### Redirects
All old routes will redirect to new locations to preserve bookmarks.

## 🛠️ Technical Decisions

### Data Refresh Strategy
- **Real-time:** Not required
- **Refresh Rate:** 5 minutes (acceptable)
- **Method:** React Query with stale-while-revalidate

### Data Retention
- Activity logs: Indefinite (will revisit in a few months)
- Analytics data: Computed on-demand from source tables

### Privacy & Security
- No anonymization required - specific data preferred
- Admin and super_admin roles have full access
- No role-based restrictions between admin types

### Exports
- Not required at this time
- Can be added in future iterations

### Performance
- Database views for complex queries
- Indexes on commonly filtered columns
- Pagination (50 items/page)
- Client-side caching with React Query
- Virtual scrolling for large lists

## 📊 Database Changes

New views to create:
- `user_directory_view` - Comprehensive user data with activity metrics
- Helper functions for survey analytics
- Helper functions for user activity timelines

All SQL is documented in `ADMIN_ANALYTICS_FEATURES.md`

## 🧪 Testing Checklist

### Navigation
- [ ] All links work correctly
- [ ] Active route highlighted
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Mobile responsive
- [ ] Dropdowns open/close correctly
- [ ] Breadcrumbs show correct path
- [ ] No broken links

### Analytics
- [ ] Data loads correctly
- [ ] Charts render properly
- [ ] Filters work
- [ ] Search works
- [ ] Pagination works
- [ ] Performance acceptable (<3s load)

### Accessibility
- [ ] Keyboard-only navigation works
- [ ] Screen reader support
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Skip links functional

## 📈 Success Metrics

- Admin can view any user's complete activity in **< 3 clicks**
- Survey results viewable with charts in **< 2 seconds**
- User search returns results in **< 500ms**
- **80% reduction** in clicks to common admin tasks
- **100%** of existing functionality accessible via new navigation

## 🚧 Development Workflow

1. **Create feature branch** from `portal-analytics`
2. **Build feature** (navigation, then analytics)
3. **Test thoroughly**
4. **Merge back** to `portal-analytics`
5. **Deploy to staging**
6. **Final testing**
7. **Merge to main**

## 📝 Notes

- All placeholder pages should clearly indicate "Coming Soon" status
- Use existing design patterns and components
- Maintain backward compatibility during migration
- Document any breaking changes
- Keep performance in mind (lazy loading, virtualization)

## 🔗 Related Resources

- Supabase Dashboard: https://supabase.com/dashboard/project/...
- Figma Designs: (if applicable)
- Existing Analytics Page: `/admin/analytics` (currently disabled)
- React Query Docs: https://tanstack.com/query/latest

## 👥 Team

- **Owner:** Admin Features Team
- **Branch Creator:** Development Team
- **Reviewers:** TBD

## 📅 Timeline

- **Week 1:** Navigation redesign
- **Week 2-3:** Enhanced User Directory
- **Week 3-4:** Individual User Drill-Down
- **Week 4-5:** Survey Analytics
- **Week 6+:** Additional analytics features

---

**Last Updated:** March 2024
**Status:** Active Development
**Next Review:** End of Week 1
