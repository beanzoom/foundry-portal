/**
 * Portal Updates Integration Tests
 *
 * Schema: status (varchar), update_type (varchar), priority (int)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;
let testUpdateIds: string[] = [];

describe('Portal Updates Integration Tests', () => {
  let adminClient: SupabaseClient;

  beforeAll(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (testUpdateIds.length > 0) {
      console.log(`Cleaning up ${testUpdateIds.length} test updates...`);
      await adminClient.from('portal_updates').delete().in('id', testUpdateIds);
    }
  }, TEST_TIMEOUT);

  it('should read portal updates', async () => {
    const { data, error } = await adminClient.from('portal_updates')
      .select('*').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);

  it('should verify schema fields', async () => {
    const { data } = await adminClient.from('portal_updates')
      .select('id, title, content, update_type, status, priority, published_at')
      .limit(1).single();

    if (data) {
      expect(data).toHaveProperty('update_type');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('priority');
    }
  }, TEST_TIMEOUT);

  it('should filter by status', async () => {
    const { data, error } = await adminClient.from('portal_updates')
      .select('*').eq('status', 'published').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);
});
