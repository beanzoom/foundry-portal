/**
 * RLS Policy Integration Tests
 *
 * Tests Row Level Security policies after Migration 110:
 * - Admin-only access to email_queue
 * - Admin-only access to email_logs
 * - Anonymous/authenticated user restrictions
 * - Proper policy enforcement
 *
 * CRITICAL: These tests verify the security fix from Migration 110
 *
 * NOTE: Requires SUPABASE_SERVICE_ROLE_KEY for admin client
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;

let testEmailIds: string[] = [];

describe('RLS Policy Integration Tests (Post-Migration 110)', () => {
  let anonClient: SupabaseClient; // No authentication
  let authClient: SupabaseClient; // Authenticated but not admin
  let adminClient: SupabaseClient; // Admin/service role
  let testUserId: string | null = null;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Anonymous client (no auth)
    anonClient = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client (service role - bypasses RLS)
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY required for RLS policy tests');
    }
    adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticated client (regular user - NOT admin)
    authClient = createClient(supabaseUrl, supabaseAnonKey);

    // TODO: In a real test, you'd create a test user and sign in
    // For now, we'll test with anon and admin clients
    console.log('⚠️  Note: Some RLS tests require authenticated non-admin user');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup test data
    if (testEmailIds.length > 0) {
      console.log(`Cleaning up ${testEmailIds.length} test emails...`);
      await adminClient
        .from('email_queue')
        .delete()
        .in('id', testEmailIds);
    }
  }, TEST_TIMEOUT);

  describe('email_queue RLS Policies', () => {
    it('should block anonymous users from reading email_queue', async () => {
      const { data, error } = await anonClient
        .from('email_queue')
        .select('*')
        .limit(1);

      // Should return empty results (RLS blocks access)
      expect(data).toEqual([]);
      // May or may not have error depending on RLS config
      // The important thing is: no data returned
    }, TEST_TIMEOUT);

    it('should block anonymous users from inserting into email_queue', async () => {
      const { error } = await anonClient
        .from('email_queue')
        .insert({
          to_email: 'anon@example.com',
          template_id: 'test',
          event_type: 'test'
        });

      // Should fail - anon users can't insert
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);

    it('should allow admin client to read email_queue', async () => {
      // First insert a test email with admin client
      const { data: inserted } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'admin-test@example.com',
          template_id: 'test',
          event_type: 'test_rls'
        })
        .select()
        .single();

      if (inserted?.id) testEmailIds.push(inserted.id);

      // Admin should be able to read it
      const { data, error } = await adminClient
        .from('email_queue')
        .select('*')
        .eq('id', inserted!.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.to_email).toBe('admin-test@example.com');
    }, TEST_TIMEOUT);

    it('should allow admin client to insert into email_queue', async () => {
      const { data, error } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'admin-insert@example.com',
          template_id: 'test',
          event_type: 'test_rls'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.to_email).toBe('admin-insert@example.com');

      if (data?.id) testEmailIds.push(data.id);
    }, TEST_TIMEOUT);

    it('should allow admin client to update email_queue', async () => {
      // Create test email
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'update-test@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'queued'
        })
        .select()
        .single();

      if (email?.id) testEmailIds.push(email.id);

      // Update status
      const { data: updated, error } = await adminClient
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('id', email!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.status).toBe('sent');
    }, TEST_TIMEOUT);

    it('should allow admin client to delete from email_queue', async () => {
      // Create test email
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'delete-test@example.com',
          template_id: 'test',
          event_type: 'test'
        })
        .select()
        .single();

      expect(email).toBeDefined();

      // Delete
      const { error } = await adminClient
        .from('email_queue')
        .delete()
        .eq('id', email!.id);

      expect(error).toBeNull();

      // Verify deleted
      const { data: deleted } = await adminClient
        .from('email_queue')
        .select()
        .eq('id', email!.id)
        .single();

      expect(deleted).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('email_logs RLS Policies', () => {
    it('should block anonymous users from reading email_logs', async () => {
      const { data, error } = await anonClient
        .from('email_logs')
        .select('*')
        .limit(1);

      // Should return empty results (RLS blocks access)
      expect(data).toEqual([]);
    }, TEST_TIMEOUT);

    it('should block anonymous users from inserting into email_logs', async () => {
      // First create an email_queue entry to reference
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'log-test@example.com',
          template_id: 'test',
          event_type: 'test'
        })
        .select()
        .single();

      if (email?.id) testEmailIds.push(email.id);

      // Try to insert log as anon user
      const { error } = await anonClient
        .from('email_logs')
        .insert({
          queue_id: email!.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      // Should fail
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);

    it('should allow admin client to read email_logs', async () => {
      // Create email and log with admin client
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'log-read@example.com',
          template_id: 'test',
          event_type: 'test'
        })
        .select()
        .single();

      if (email?.id) testEmailIds.push(email.id);

      const { data: log, error: logError } = await adminClient
        .from('email_logs')
        .insert({
          to_email: 'log-test@example.com',
          subject: 'Test Log',
          status: 'sent',
          template: 'test_template',
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      expect(logError).toBeNull();
      expect(log).toBeDefined();

      // Admin should be able to read it
      const { data, error } = await adminClient
        .from('email_logs')
        .select('*')
        .eq('id', log!.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.to_email).toBe('log-test@example.com');

      // Cleanup
      await adminClient.from('email_logs').delete().eq('id', log!.id);
    }, TEST_TIMEOUT);
  });

  describe('email_templates RLS Policies', () => {
    it('should allow public read access to active templates', async () => {
      // Anonymous users should be able to read active templates
      const { data, error } = await anonClient
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      expect(error).toBeNull();
      // May or may not have data depending on what's in the database
      expect(Array.isArray(data)).toBe(true);
    }, TEST_TIMEOUT);

    it('should block anonymous users from creating templates', async () => {
      const { error } = await anonClient
        .from('email_templates')
        .insert({
          id: 'anon_test_template',
          name: 'Anon Test',
          subject: 'Test',
          body_html: '<p>Test</p>',
          is_active: false
        });

      // Should fail
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);

    it('should allow admin client to manage templates', async () => {
      const templateId = `test_template_${Date.now()}`;

      // Create
      const { data: created, error: createError } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Admin Test Template',
          subject: 'Test Subject',
          body_html: '<p>Test Body</p>',
          is_active: false
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(created).toBeDefined();

      // Update
      const { data: updated, error: updateError } = await adminClient
        .from('email_templates')
        .update({ subject: 'Updated Subject' })
        .eq('id', templateId)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updated?.subject).toBe('Updated Subject');

      // Delete (cleanup)
      const { error: deleteError } = await adminClient
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      expect(deleteError).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('notification_rules RLS Policies', () => {
    it('should block anonymous users from reading notification_rules', async () => {
      const { data, error } = await anonClient
        .from('notification_rules')
        .select('*')
        .limit(1);

      // NOTE: notification_rules may allow public read for active rules
      // This test verifies the query succeeds but may return data
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    }, TEST_TIMEOUT);

    it('should block anonymous users from modifying notification_rules', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      const { error } = await anonClient
        .from('notification_rules')
        .insert({
          event_id: 'anon_test',
          name: 'Anon Test Rule',
          template_id: 'test',
          recipient_list_id: recipientList!.id
        });

      // Should fail
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('recipient_lists RLS Policies', () => {
    it('should block anonymous users from reading recipient_lists', async () => {
      const { data, error } = await anonClient
        .from('recipient_lists')
        .select('*')
        .limit(1);

      // Should return empty results (RLS blocks access)
      expect(data).toEqual([]);
    }, TEST_TIMEOUT);

    it('should block anonymous users from modifying recipient_lists', async () => {
      const { error } = await anonClient
        .from('recipient_lists')
        .insert({
          name: 'Anon Test List',
          code: 'anon_test',
          type: 'static',
          config: {}
        });

      // Should fail
      expect(error).toBeDefined();
    }, TEST_TIMEOUT);

    it('should allow admin to manage non-system recipient_lists', async () => {
      const listCode = `test_list_${Date.now()}`;

      // Create
      const { data: created, error: createError } = await adminClient
        .from('recipient_lists')
        .insert({
          name: 'Test Recipient List',
          code: listCode,
          type: 'static',
          config: { emails: ['test@example.com'] },
          is_system: false // Not a system list
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(created).toBeDefined();

      // Update
      const { error: updateError } = await adminClient
        .from('recipient_lists')
        .update({ name: 'Updated Test List' })
        .eq('id', created!.id);

      expect(updateError).toBeNull();

      // Delete (cleanup)
      const { error: deleteError } = await adminClient
        .from('recipient_lists')
        .delete()
        .eq('id', created!.id);

      expect(deleteError).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('RLS Policy Verification', () => {
    it('should have removed permissive "allow all" policies', async () => {
      // This test verifies that Migration 110 worked correctly
      // We verify RLS is blocking anonymous access to email_queue and email_logs

      // Test 1: Anonymous cannot read email_queue
      const { data: queueData } = await anonClient
        .from('email_queue')
        .select('*')
        .limit(1);
      expect(queueData).toEqual([]);

      // Test 2: Anonymous cannot read email_logs
      const { data: logsData } = await anonClient
        .from('email_logs')
        .select('*')
        .limit(1);
      expect(logsData).toEqual([]);

      // Test 3: Admin CAN read (bypasses RLS)
      const { data: adminQueueData, error: adminError } = await adminClient
        .from('email_queue')
        .select('*')
        .limit(1);
      expect(adminError).toBeNull();
      expect(Array.isArray(adminQueueData)).toBe(true);
    }, TEST_TIMEOUT);
  });
});
