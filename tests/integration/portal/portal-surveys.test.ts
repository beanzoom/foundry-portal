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

  it('should publish a survey', async () => {
    const { data: survey } = await adminClient.from('portal_surveys').insert({
      title: 'Publish Test',
      description: 'Publish test',
      status: 'draft',
      is_active: false
    }).select().single();

    if (survey?.id) testSurveyIds.push(survey.id);

    const { data: published, error } = await adminClient.from('portal_surveys').update({
      status: 'published',
      is_active: true,
      published_at: new Date().toISOString()
    }).eq('id', survey!.id).select().single();

    expect(error).toBeNull();
    expect(published?.status).toBe('published');
    expect(published?.is_active).toBe(true);
  }, TEST_TIMEOUT);

  it('should support due dates', async () => {
    const dueDate = new Date(Date.now() + 86400000 * 7);

    const { data, error } = await adminClient.from('portal_surveys').insert({
      title: 'Survey with Due Date',
      description: 'Has deadline',
      status: 'published',
      is_active: true,
      due_date: dueDate.toISOString()
    }).select().single();

    expect(error).toBeNull();
    expect(data?.due_date).toBeDefined();
    if (data?.id) testSurveyIds.push(data.id);
  }, TEST_TIMEOUT);
});
