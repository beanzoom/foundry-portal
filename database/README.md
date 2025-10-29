# Foundry Portal Database

This directory contains the database schema, functions, views, and maintenance scripts for the Foundry Portal application.

## Directory Structure

### Active Directories

- **`applied/`** - SQL scripts that have been successfully applied to the production database
  - Contains verified fixes and updates that are now part of the live system
  - Do not re-run these scripts without understanding their impact

- **`functions/`** - Active database functions
  - Contains production SQL functions used by the application
  - Includes email notification, referral management, and data processing functions

- **`fixes/`** - Database fixes applied during production
  - Contains trigger fixes and corrections applied to resolve issues
  - Scripts in this directory have been applied to production

- **`views/`** - Active database views
  - Contains production database views used by the application
  - Includes user acquisition, calculator stats, and other reporting views

### Archived Directories

- **`archive/`** - Historical and migration artifacts
  - `archive/migration/` - Original migration scripts from FleetDRMS shared database
  - `archive/debug/` - Debug scripts used during development
  - `archive/maintenance/` - One-time maintenance and cleanup scripts
  - `archive/planning/` - Migration planning documents

### Documentation

- **`FOR_AI_ASSISTANT.md`** - Instructions for AI assistants working on database changes
- **`PORTAL_DATABASE_MIGRATION.md`** - Documentation of the database migration process
- **`POST_MIGRATION_FIXES.md`** - Post-migration fixes and improvements
- **`SCHEMA.md`** - Current database schema documentation
- **`VALIDATION_TEST_PLAN.md`** - Database validation and testing procedures

## Database Overview

The Foundry Portal uses Supabase (PostgreSQL) as its database backend. The database includes:

- **User Management**: Profiles, authentication, and role-based access control
- **Business Management**: Company information and associations
- **Email System**: Unified email queue, templates, and notification rules
- **Referral System**: Referral tracking and conversion management
- **Contact Tracking**: Contact management with DSP/station organization
- **Content Management**: Updates, surveys, and events
- **Calculator**: Foundry calculator submissions and statistics

## Important Notes

### Email System
- Uses unified `trigger_email_notification()` function for all content types (updates, surveys, events)
- Emails are processed immediately by triggers when content is published
- Email queue is managed by `process-email-queue` edge function with rate limiting

### Row Level Security (RLS)
- All tables have RLS enabled
- Service role is used for admin operations
- User-level access is controlled through policies

### Foreign Keys
- Some foreign keys are not enforced in the database
- Application layer handles referential integrity for certain relationships
- Related data is fetched separately when needed

## Making Database Changes

1. **Test locally first** using Supabase local development
2. **Document your changes** in the appropriate location
3. **Apply to production** using Supabase dashboard or CLI
4. **Move applied scripts** to the `applied/` directory with timestamp
5. **Update documentation** to reflect the current state

## Migration History

The Foundry Portal was migrated from a shared FleetDRMS database to a standalone database in October 2024. See `PORTAL_DATABASE_MIGRATION.md` for details.

Post-migration fixes and improvements are documented in `POST_MIGRATION_FIXES.md`.
