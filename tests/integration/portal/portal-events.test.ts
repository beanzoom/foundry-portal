/**
 * Portal Events Integration Tests
 *
 * Schema: status (varchar), is_active (boolean), registration_limit (int)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;
let testEventIds: string[] = [];

describe('Portal Events Integration Tests', () => {
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
    if (testEventIds.length > 0) {
      console.log(`Cleaning up ${testEventIds.length} test events...`);
      await adminClient.from('portal_events').delete().in('id', testEventIds);
    }
  }, TEST_TIMEOUT);

  it('should create an event', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);

    const { data, error } = await adminClient.from('portal_events').insert({
      title: 'Test Event',
      description: 'Test description',
      event_date: futureDate.toISOString(),
      start_datetime: futureDate.toISOString(),
      location: 'Test Location',
      status: 'draft',
      is_active: false
    }).select().single();

    expect(error).toBeNull();
    expect(data?.status).toBe('draft');
    if (data?.id) testEventIds.push(data.id);
  }, TEST_TIMEOUT);

  it('should publish an event', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);

    const { data: event } = await adminClient.from('portal_events').insert({
      title: 'Publish Test Event',
      description: 'Publish test',
      event_date: futureDate.toISOString(),
      location: 'Test Location',
      status: 'draft',
      is_active: false
    }).select().single();

    if (event?.id) testEventIds.push(event.id);

    const { data: published, error } = await adminClient.from('portal_events').update({
      status: 'published',
      is_active: true,
      registration_open: true,
      published_at: new Date().toISOString()
    }).eq('id', event!.id).select().single();

    expect(error).toBeNull();
    expect(published?.status).toBe('published');
    expect(published?.is_active).toBe(true);
  }, TEST_TIMEOUT);

  it('should support registration limits', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);

    const { data, error } = await adminClient.from('portal_events').insert({
      title: 'Event with Limit',
      description: 'Limited seats',
      event_date: futureDate.toISOString(),
      location: 'Test Location',
      status: 'published',
      is_active: true,
      registration_limit: 50,
      registration_required: true
    }).select().single();

    expect(error).toBeNull();
    expect(data?.registration_limit).toBe(50);
    if (data?.id) testEventIds.push(data.id);
  }, TEST_TIMEOUT);
});
