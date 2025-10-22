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

  it('should queue email notification when published (then cleanup)', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);

    const { data: event } = await adminClient.from('portal_events').insert({
      title: 'Test Event Email Notification',
      description: 'Testing email queuing',
      event_date: futureDate.toISOString(),
      location: 'Test Location',
      status: 'draft',
      is_active: false
    }).select().single();

    if (event?.id) testEventIds.push(event.id);

    // Publish event - this WILL queue emails to portal@fleetdrms.com
    const { data: updated, error } = await adminClient.from('portal_events').update({
      status: 'published',
      is_active: true,
      registration_open: true,
      published_at: new Date().toISOString()
    }).eq('id', event!.id).select().single();

    expect(error).toBeNull();
    expect(updated?.status).toBe('published');

    // Wait for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify email was queued to portal@fleetdrms.com
    const { data: queuedEmails } = await adminClient
      .from('email_queue')
      .select('*')
      .eq('to_email', 'portal@fleetdrms.com')
      .eq('event_type', 'event_published')
      .gte('created_at', new Date(Date.now() - 5000).toISOString());

    expect(queuedEmails).toBeTruthy();
    expect(queuedEmails!.length).toBeGreaterThan(0);

    // CRITICAL: Delete queued emails before test ends
    if (queuedEmails && queuedEmails.length > 0) {
      const emailIds = queuedEmails.map(e => e.id);
      await adminClient.from('email_queue').delete().in('id', emailIds);
      console.log(`Cleaned up ${emailIds.length} test emails from queue`);
    }
  }, TEST_TIMEOUT);

  it('should support registration limits', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);

    const { data, error } = await adminClient.from('portal_events').insert({
      title: 'Event with Limit',
      description: 'Limited seats',
      event_date: futureDate.toISOString(),
      location: 'Test Location',
      status: 'draft', // DRAFT - never publish in tests
      is_active: false,
      registration_limit: 50,
      registration_required: true
    }).select().single();

    expect(error).toBeNull();
    expect(data?.registration_limit).toBe(50);
    if (data?.id) testEventIds.push(data.id);
  }, TEST_TIMEOUT);
});
