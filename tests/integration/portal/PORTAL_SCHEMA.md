# Portal Database Schema Reference

This document maps the actual portal database schema for integration testing.

## portal_updates

**Key Fields:**
- `id` (uuid)
- `title` (varchar)
- `content` (text)
- `status` (varchar) - NOT `is_published` ✅
- `update_type` (varchar) - Can be used instead of `category`
- `published_at` (timestamp)
- `target_audience` (varchar)
- `priority` (integer)
- `created_by` (uuid)

**Notes:**
- Uses `status` column (e.g., 'published', 'draft') instead of boolean `is_published`
- Has `update_type` instead of `category`

## portal_surveys

**Key Fields:**
- `id` (uuid)
- `title` (varchar)
- `description` (text)
- `status` (varchar) - NOT `is_published` ✅
- `published_at` (timestamp)
- `closed_at` (timestamp)
- `due_date` (timestamp)
- `is_compulsory` (boolean)
- `is_active` (boolean) ✅
- `created_by` (uuid)

**Notes:**
- Uses `status` column instead of boolean `is_published`
- Has `is_active` boolean for active/inactive state
- Supports `due_date` field

**Related Tables (Migration 112):**
- `portal_survey_sections` - Groups survey questions into logical sections/categories
  - `survey_id` (uuid FK to portal_surveys)
  - `title`, `description`, `display_order`
  - `show_condition` (jsonb), `is_required`, `can_skip`
- `portal_survey_questions` - Now supports sections
  - `section_id` (uuid FK to portal_survey_sections) - NULL if ungrouped
  - `section_order` (integer) - Order within section

## portal_events

**Key Fields:**
- `id` (uuid)
- `title` (text)
- `description` (text)
- `event_date` (timestamp)
- `start_datetime` (timestamp) ✅
- `end_datetime` (timestamp) ✅
- `location` (text)
- `status` (text) - NOT `is_published` ✅
- `published_at` (timestamp)
- `is_active` (boolean) ✅
- `registration_limit` (integer) - NOT `max_capacity` ✅
- `registration_required` (boolean)
- `registration_open` (boolean) ✅
- `created_by` (uuid)

**Notes:**
- Uses `status` column instead of boolean `is_published`
- Has `registration_limit` instead of `max_capacity`
- Has both `event_date` (legacy) and `start_datetime`/`end_datetime` (new)
- Has `is_active` and `registration_open` booleans

## profiles (Portal Fields)

**Portal-Specific Fields:**
- `is_portal_user` (boolean) - NOT `portal_role` ✅
- `portal_registered_at` (timestamp)

**Notes:**
- NO `portal_role` column - uses `is_portal_user` boolean instead
- NO `portal_business_id` column

## businesses

**Table Name:** `businesses` - NOT `portal_businesses` ✅

**Notes:**
- The table is named `businesses`, not `portal_businesses`

## portal_referrals

**Key Fields:**
- `id` (uuid)
- `referrer_id` (uuid)
- `referee_first_name` (text) - Required ✅
- `referee_last_name` (text) - Required ✅
- `referee_email` (text)
- `dsp_name` (text)
- `dsp_code` (text)
- `referral_code` (text)
- `status` (text)
- `invitation_sent_at` (timestamp)
- `registered_at` (timestamp)
- `created_at` (timestamp)

**Notes:**
- Requires `referee_first_name` and `referee_last_name` (NOT NULL constraint)
- Has DSP (Delivery Service Partner) fields

## Common Patterns

1. **Publishing Status**: All portal tables use `status` (varchar) instead of `is_published` (boolean)
   - Common values: 'draft', 'published', 'archived'

2. **Active State**: Tables use `is_active` (boolean) for active/inactive

3. **Timestamps**: All have `published_at` for publication tracking

4. **Email Tracking**: All have `email_batch_id` and `email_sent_at` for notification tracking
