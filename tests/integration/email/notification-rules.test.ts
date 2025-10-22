/**
 * Notification Rules Integration Tests
 *
 * Tests notification rule resolution and trigger functionality:
 * - Notification rule CRUD operations
 * - Recipient list resolution
 * - Rule enabling/disabling
 * - FK constraint enforcement (Migration 111)
 *
 * NOTE: These tests run against a real Supabase database
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;

// Test data cleanup tracking
let testRuleIds: string[] = [];
let testRecipientListId: string | null = null;

describe('Notification Rules Integration Tests', () => {
  let supabase: SupabaseClient;
  let adminClient: SupabaseClient;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (supabaseServiceKey) {
      adminClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('⚠️  No service role key - some tests may fail');
      adminClient = supabase;
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup test data
    if (testRuleIds.length > 0) {
      console.log(`Cleaning up ${testRuleIds.length} test notification rules...`);
      await adminClient
        .from('notification_rules')
        .delete()
        .in('id', testRuleIds);
    }

    if (testRecipientListId) {
      console.log('Cleaning up test recipient list...');
      await adminClient
        .from('recipient_lists')
        .delete()
        .eq('id', testRecipientListId);
    }
  }, TEST_TIMEOUT);

  describe('Notification Rules Schema (Post-Migration 111)', () => {
    it('should have required recipient_list_id field', async () => {
      // Get a valid recipient_list_id for testing
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      expect(recipientList).toBeDefined();
      expect(recipientList?.id).toBeDefined();

      // Attempt to create rule WITH recipient_list_id (should succeed)
      const { data: validRule, error: validError } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'calculator_submission', // Use valid event_id
          name: 'Test Rule with Recipient List',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id,
          enabled: false // Don't trigger actual emails
        })
        .select()
        .single();

      expect(validError).toBeNull();
      expect(validRule).toBeDefined();
      expect(validRule?.recipient_list_id).toBe(recipientList!.id);

      if (validRule?.id) testRuleIds.push(validRule.id);
    }, TEST_TIMEOUT);

    it('should enforce NOT NULL on recipient_list_id', async () => {
      // Attempt to create rule WITHOUT recipient_list_id (should fail)
      const { error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'calculator_submission', // Use valid event_id
          name: 'Test Rule without Recipient List',
          template_id: 'test_template'
          // recipient_list_id: MISSING - should cause error
        })
        .select()
        .single();

      // Should fail with NOT NULL violation
      expect(error).toBeDefined();
      expect(error?.code).toBe('23502'); // PostgreSQL NOT NULL violation
    }, TEST_TIMEOUT);

    it('should enforce FK constraint to recipient_lists', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';

      // Attempt to create rule with non-existent recipient_list_id
      const { error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'calculator_submission', // Use valid event_id
          name: 'Test Rule with Invalid FK',
          template_id: 'test_template',
          recipient_list_id: fakeUuid // Doesn't exist
        })
        .select()
        .single();

      // Should fail with FK violation
      expect(error).toBeDefined();
      expect(error?.code).toBe('23503'); // PostgreSQL FK violation
    }, TEST_TIMEOUT);

    it('should NOT have recipient_type or recipient_config columns', async () => {
      // Query should fail if trying to access removed columns
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      const { data, error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'event_published', // Use valid event_id
          name: 'Test Column Check',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id
        })
        .select('id, event_id, name, recipient_list_id')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Attempting to select removed columns should fail
      const { error: selectError } = await supabase
        .from('notification_rules')
        .select('recipient_type, recipient_config')
        .eq('id', data!.id)
        .single();

      expect(selectError).toBeDefined();
      expect(selectError?.message).toContain('column');

      if (data?.id) testRuleIds.push(data.id);
    }, TEST_TIMEOUT);
  });

  describe('Notification Rules CRUD Operations', () => {
    it('should create a new notification rule', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      const { data, error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'event_registration', // Use valid event_id
          name: 'Test Create Rule',
          description: 'Test description',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id,
          priority: 3,
          enabled: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.event_id).toBe('event_registration');
      expect(data?.name).toBe('Test Create Rule');
      expect(data?.priority).toBe(3);
      expect(data?.enabled).toBe(false);

      if (data?.id) testRuleIds.push(data.id);
    }, TEST_TIMEOUT);

    it('should read existing notification rules', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Verify schema structure
      if (data && data.length > 0) {
        const rule = data[0];
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('event_id');
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('template_id');
        expect(rule).toHaveProperty('recipient_list_id');
        expect(rule).toHaveProperty('enabled');
        expect(rule).toHaveProperty('priority');
      }
    }, TEST_TIMEOUT);

    it('should update a notification rule', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      // Create rule
      const { data: rule } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'contact_form_submitted', // Use valid event_id
          name: 'Test Update Rule - Original',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id,
          enabled: false
        })
        .select()
        .single();

      if (rule?.id) testRuleIds.push(rule.id);

      // Update rule
      const { data: updated, error } = await adminClient
        .from('notification_rules')
        .update({
          name: 'Test Update Rule - Modified',
          priority: 1,
          enabled: true
        })
        .eq('id', rule!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.name).toBe('Test Update Rule - Modified');
      expect(updated?.priority).toBe(1);
      expect(updated?.enabled).toBe(true);
    }, TEST_TIMEOUT);

    it('should delete a notification rule', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      // Create rule
      const { data: rule } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'referral_created', // Use valid event_id
          name: 'Test Delete Rule',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id
        })
        .select()
        .single();

      expect(rule).toBeDefined();

      // Delete rule
      const { error: deleteError } = await adminClient
        .from('notification_rules')
        .delete()
        .eq('id', rule!.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: deleted } = await supabase
        .from('notification_rules')
        .select()
        .eq('id', rule!.id)
        .single();

      expect(deleted).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('Notification Rules with Recipient Lists', () => {
    it('should join with recipient_lists table', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select(`
          *,
          recipient_lists(id, name, code, type, config)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        const rule = data[0];
        expect(rule).toHaveProperty('recipient_lists');
        // recipient_lists is an object when using FK relationship
        if (rule.recipient_lists) {
          expect(rule.recipient_lists).toHaveProperty('name');
          expect(rule.recipient_lists).toHaveProperty('type');
        }
      }
    }, TEST_TIMEOUT);

    it('should filter rules by recipient list type', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select(`
          *,
          recipient_lists!inner(type)
        `)
        .eq('recipient_lists.type', 'role_based')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        // All should be role_based
        data.forEach(rule => {
          if (rule.recipient_lists) {
            expect(rule.recipient_lists.type).toBe('role_based');
          }
        });
      }
    }, TEST_TIMEOUT);
  });

  describe('Notification Rules Filtering', () => {
    it('should filter by event_id', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('event_id', 'update_published');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        data.forEach(rule => {
          expect(rule.event_id).toBe('update_published');
        });
      }
    }, TEST_TIMEOUT);

    it('should filter by enabled status', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('enabled', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        data.forEach(rule => {
          expect(rule.enabled).toBe(true);
        });
      }
    }, TEST_TIMEOUT);

    it('should order by priority', async () => {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('priority', { ascending: true })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 1) {
        // Verify ascending order
        for (let i = 1; i < data.length; i++) {
          expect(data[i].priority).toBeGreaterThanOrEqual(data[i - 1].priority);
        }
      }
    }, TEST_TIMEOUT);
  });

  describe('Notification Rule Conditions and Metadata', () => {
    it('should store and retrieve conditions as JSONB', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      const conditions = {
        min_amount: 1000,
        user_role: ['admin', 'super_admin'],
        time_window: { start: '09:00', end: '17:00' }
      };

      const { data, error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'bulk_notification', // Use valid event_id
          name: 'Test Conditions Rule',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id,
          conditions: conditions,
          enabled: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.conditions).toEqual(conditions);

      if (data?.id) testRuleIds.push(data.id);
    }, TEST_TIMEOUT);

    it('should store and retrieve metadata as JSONB', async () => {
      const { data: recipientList } = await adminClient
        .from('recipient_lists')
        .select('id')
        .limit(1)
        .single();

      const metadata = {
        created_by_user: 'test_user',
        tags: ['important', 'system'],
        custom_field: 'custom_value'
      };

      const { data, error } = await adminClient
        .from('notification_rules')
        .insert({
          event_id: 'account_locked', // Use valid event_id
          name: 'Test Metadata Rule',
          template_id: 'test_template',
          recipient_list_id: recipientList!.id,
          metadata: metadata,
          enabled: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.metadata).toEqual(metadata);

      if (data?.id) testRuleIds.push(data.id);
    }, TEST_TIMEOUT);
  });
});
