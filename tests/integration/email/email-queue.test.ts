/**
 * Email Queue Integration Tests
 *
 * Tests email queueing functionality including:
 * - Direct email queue operations
 * - Notification rule resolution
 * - Email status transitions
 * - Queue filtering and retrieval
 *
 * NOTE: These tests run against a real Supabase database
 * Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for database operations

// Test data cleanup tracking
let testEmailIds: string[] = [];
let testRuleId: string | null = null;

describe('Email Queue Integration Tests', () => {
  let supabase: SupabaseClient;
  let adminClient: SupabaseClient;

  beforeAll(async () => {
    // Create Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create admin client for cleanup (if service key available)
    if (supabaseServiceKey) {
      adminClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('⚠️  No service role key - some cleanup operations may fail');
      adminClient = supabase; // Fallback to regular client
    }
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

    if (testRuleId) {
      console.log('Cleaning up test notification rule...');
      await adminClient
        .from('notification_rules')
        .delete()
        .eq('id', testRuleId);
    }
  }, TEST_TIMEOUT);

  beforeEach(() => {
    // Clear tracking arrays before each test
    testEmailIds = [];
  });

  describe('Email Queue Basic Operations', () => {
    it('should insert an email into the queue', async () => {
      const testEmail = {
        to_email: 'test@example.com',
        template_id: 'test_template',
        event_type: 'test_event',
        event_payload: { test: 'data' },
        priority: 5,
        status: 'queued'
      };

      const { data, error } = await adminClient
        .from('email_queue')
        .insert(testEmail)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.to_email).toBe('test@example.com');
      expect(data?.status).toBe('queued');
      expect(data?.priority).toBe(5);

      // Track for cleanup
      if (data?.id) testEmailIds.push(data.id);
    }, TEST_TIMEOUT);

    it('should have correct default values', async () => {
      const { data } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'test@example.com',
          template_id: 'test_template',
          event_type: 'test_event'
        })
        .select()
        .single();

      expect(data?.status).toBe('queued'); // Default status
      expect(data?.priority).toBe(5); // Default priority
      expect(data?.attempts).toBe(0); // Default attempts
      expect(data?.max_attempts).toBe(3); // Default max attempts
      expect(data?.retry_strategy).toBe('exponential'); // Default retry strategy

      if (data?.id) testEmailIds.push(data.id);
    }, TEST_TIMEOUT);

    it('should retrieve queued emails ready to send', async () => {
      // Insert test emails with different statuses
      const emails = await Promise.all([
        adminClient.from('email_queue').insert({
          to_email: 'ready@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'queued',
          scheduled_for: new Date().toISOString() // Ready now
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'future@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'queued',
          scheduled_for: new Date(Date.now() + 86400000).toISOString() // Future
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'sent@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'sent' // Already sent
        }).select().single()
      ]);

      // Track for cleanup
      emails.forEach(({ data }) => {
        if (data?.id) testEmailIds.push(data.id);
      });

      // Query for emails ready to send (admin can read)
      const { data: readyEmails } = await adminClient
        .from('email_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      // Should include the "ready" email but not future or sent
      const readyEmailAddresses = readyEmails?.map(e => e.to_email) || [];
      expect(readyEmailAddresses).toContain('ready@example.com');
      expect(readyEmailAddresses).not.toContain('future@example.com');
      expect(readyEmailAddresses).not.toContain('sent@example.com');
    }, TEST_TIMEOUT);

    it('should update email status to processing', async () => {
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'test@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'queued'
        })
        .select()
        .single();

      if (email?.id) testEmailIds.push(email.id);

      // Update to processing
      const { data: updated, error } = await adminClient
        .from('email_queue')
        .update({
          status: 'processing',
          processor_id: 'test-processor',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', email!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.status).toBe('processing');
      expect(updated?.processor_id).toBe('test-processor');
    }, TEST_TIMEOUT);

    it('should increment attempts on failure', async () => {
      const { data: email } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'test@example.com',
          template_id: 'test',
          event_type: 'test',
          status: 'queued',
          attempts: 0
        })
        .select()
        .single();

      if (email?.id) testEmailIds.push(email.id);

      // Simulate failed attempt
      const { data: updated } = await adminClient
        .from('email_queue')
        .update({
          status: 'failed',
          attempts: 1,
          last_error: 'Test error',
          next_retry_at: new Date(Date.now() + 60000).toISOString() // Retry in 1 min
        })
        .eq('id', email!.id)
        .select()
        .single();

      expect(updated?.status).toBe('failed');
      expect(updated?.attempts).toBe(1);
      expect(updated?.last_error).toBe('Test error');
      expect(updated?.next_retry_at).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Email Queue Filtering', () => {
    it('should filter by event_type', async () => {
      const emails = await Promise.all([
        adminClient.from('email_queue').insert({
          to_email: 'user1@example.com',
          template_id: 'test',
          event_type: 'update_published'
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'user2@example.com',
          template_id: 'test',
          event_type: 'survey_published'
        }).select().single()
      ]);

      emails.forEach(({ data }) => {
        if (data?.id) testEmailIds.push(data.id);
      });

      const { data } = await adminClient
        .from('email_queue')
        .select('*')
        .eq('event_type', 'update_published');

      const eventTypes = data?.map(e => e.event_type) || [];
      expect(eventTypes.every(t => t === 'update_published')).toBe(true);
    }, TEST_TIMEOUT);

    it('should filter by priority', async () => {
      const emails = await Promise.all([
        adminClient.from('email_queue').insert({
          to_email: 'high@example.com',
          template_id: 'test',
          event_type: 'test',
          priority: 1
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'low@example.com',
          template_id: 'test',
          event_type: 'test',
          priority: 10
        }).select().single()
      ]);

      emails.forEach(({ data }) => {
        if (data?.id) testEmailIds.push(data.id);
      });

      const { data } = await adminClient
        .from('email_queue')
        .select('*')
        .lte('priority', 5)
        .order('priority', { ascending: true });

      const priorities = data?.map(e => e.priority) || [];
      expect(priorities.every(p => p && p <= 5)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Email Queue Batch Operations', () => {
    it('should support batch_id grouping', async () => {
      // Create a valid batch record first (FK constraint requirement)
      const { data: batch, error: batchError } = await adminClient
        .from('email_notification_batches')
        .insert({
          notification_type: 'test',
          status: 'pending'
        })
        .select()
        .single();

      expect(batchError).toBeNull();
      expect(batch).toBeDefined();

      const batchId = batch!.id;

      const emails = await Promise.all([
        adminClient.from('email_queue').insert({
          to_email: 'batch1@example.com',
          template_id: 'test',
          event_type: 'test',
          batch_id: batchId
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'batch2@example.com',
          template_id: 'test',
          event_type: 'test',
          batch_id: batchId
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'nobatch@example.com',
          template_id: 'test',
          event_type: 'test'
          // No batch_id
        }).select().single()
      ]);

      // Verify inserts succeeded
      emails.forEach(({ data, error }) => {
        expect(error).toBeNull();
        if (data?.id) testEmailIds.push(data.id);
      });

      // Query by batch_id (admin can read)
      const { data: batchEmails, error: queryError } = await adminClient
        .from('email_queue')
        .select('*')
        .eq('batch_id', batchId);

      expect(queryError).toBeNull();
      expect(batchEmails).toHaveLength(2);
      expect(batchEmails?.every(e => e.batch_id === batchId)).toBe(true);

      // Cleanup batch
      await adminClient.from('email_notification_batches').delete().eq('id', batchId);
    }, TEST_TIMEOUT);
  });

  describe('Email Queue Tags', () => {
    it('should support tags array', async () => {
      const { data } = await adminClient
        .from('email_queue')
        .insert({
          to_email: 'tagged@example.com',
          template_id: 'test',
          event_type: 'test',
          tags: ['urgent', 'admin', 'notification']
        })
        .select()
        .single();

      if (data?.id) testEmailIds.push(data.id);

      expect(data?.tags).toEqual(['urgent', 'admin', 'notification']);
    }, TEST_TIMEOUT);

    it('should filter by tags using array contains', async () => {
      const emails = await Promise.all([
        adminClient.from('email_queue').insert({
          to_email: 'urgent@example.com',
          template_id: 'test',
          event_type: 'test',
          tags: ['urgent']
        }).select().single(),
        adminClient.from('email_queue').insert({
          to_email: 'normal@example.com',
          template_id: 'test',
          event_type: 'test',
          tags: ['normal']
        }).select().single()
      ]);

      emails.forEach(({ data }) => {
        if (data?.id) testEmailIds.push(data.id);
      });

      // Note: PostgreSQL array contains operator (admin can read)
      const { data: urgentEmails } = await adminClient
        .from('email_queue')
        .select('*')
        .contains('tags', ['urgent']);

      const addresses = urgentEmails?.map(e => e.to_email) || [];
      expect(addresses).toContain('urgent@example.com');
      expect(addresses).not.toContain('normal@example.com');
    }, TEST_TIMEOUT);
  });
});
