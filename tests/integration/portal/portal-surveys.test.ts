/**
 * Portal Surveys Integration Tests
 *
 * Schema: status (varchar), is_active (boolean), due_date (timestamp)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;
let testSurveyIds: string[] = [];

describe('Portal Surveys Integration Tests', () => {
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
    if (testSurveyIds.length > 0) {
      console.log(`Cleaning up ${testSurveyIds.length} test surveys...`);
      await adminClient.from('portal_surveys').delete().in('id', testSurveyIds);
    }
  }, TEST_TIMEOUT);

  it('should create a survey', async () => {
    const { data, error } = await adminClient.from('portal_surveys').insert({
      title: 'Test Survey',
      description: 'Test description',
      status: 'draft',
      is_active: false
    }).select().single();

    expect(error).toBeNull();
    expect(data?.status).toBe('draft');
    if (data?.id) testSurveyIds.push(data.id);
  }, TEST_TIMEOUT);

  it('should queue email notification when published (then cleanup)', async () => {
    const { data: survey } = await adminClient.from('portal_surveys').insert({
      title: 'Test Survey Email Notification',
      description: 'Testing email queuing',
      status: 'draft',
      is_active: false
    }).select().single();

    if (survey?.id) testSurveyIds.push(survey.id);

    // Publish survey - this WILL queue emails to portal@fleetdrms.com
    const { data: updated, error } = await adminClient.from('portal_surveys').update({
      status: 'published',
      is_active: true,
      published_at: new Date().toISOString()
    }).eq('id', survey!.id).select().single();

    expect(error).toBeNull();
    expect(updated?.status).toBe('published');

    // Wait for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify email was queued to portal@fleetdrms.com
    const { data: queuedEmails } = await adminClient
      .from('email_queue')
      .select('*')
      .eq('to_email', 'portal@fleetdrms.com')
      .eq('event_type', 'survey_published')
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

  it('should support due dates', async () => {
    const dueDate = new Date(Date.now() + 86400000 * 7);

    const { data, error } = await adminClient.from('portal_surveys').insert({
      title: 'Survey with Due Date',
      description: 'Has deadline',
      status: 'draft', // DRAFT - never publish in tests
      is_active: false,
      due_date: dueDate.toISOString()
    }).select().single();

    expect(error).toBeNull();
    expect(data?.due_date).toBeDefined();
    if (data?.id) testSurveyIds.push(data.id);
  }, TEST_TIMEOUT);
});
