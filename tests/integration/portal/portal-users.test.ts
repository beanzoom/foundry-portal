/**
 * Portal Users Integration Tests
 *
 * Schema: is_portal_user (boolean), businesses (table name)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;
let testReferralIds: string[] = [];

describe('Portal Users Integration Tests', () => {
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
    if (testReferralIds.length > 0) {
      console.log(`Cleaning up ${testReferralIds.length} test referrals...`);
      await adminClient.from('portal_referrals').delete().in('id', testReferralIds);
    }
  }, TEST_TIMEOUT);

  it('should read portal user profiles', async () => {
    const { data, error } = await adminClient.from('profiles')
      .select('id, email, first_name, last_name, is_portal_user')
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);

  it('should filter portal users', async () => {
    const { data, error } = await adminClient.from('profiles')
      .select('id, email, is_portal_user')
      .eq('is_portal_user', true)
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);

  it('should query businesses', async () => {
    const { data, error } = await adminClient.from('businesses')
      .select('*').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);

  it('should create a referral with required fields', async () => {
    const { data: user } = await adminClient.from('profiles')
      .select('id').limit(1).single();

    if (!user) {
      console.warn('⚠️  No users found - skipping referral creation test');
      return;
    }

    const referralCode = `TEST-${Date.now()}`;

    const { data, error } = await adminClient.from('portal_referrals').insert({
      referrer_id: user.id,
      referee_first_name: 'Test',
      referee_last_name: 'Referee',
      referee_email: 'test-referral@example.com',
      referral_code: referralCode,
      status: 'pending'
    }).select().single();

    expect(error).toBeNull();
    expect(data?.status).toBe('pending');
    expect(data?.referral_code).toBe(referralCode);
    if (data?.id) testReferralIds.push(data.id);
  }, TEST_TIMEOUT);

  it('should read referrals', async () => {
    const { data, error } = await adminClient.from('portal_referrals')
      .select('*').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);

  it('should filter referrals by status', async () => {
    const { data, error } = await adminClient.from('portal_referrals')
      .select('*').eq('status', 'pending').limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, TEST_TIMEOUT);
});
