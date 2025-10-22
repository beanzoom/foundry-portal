/**
 * Email Templates Integration Tests
 *
 * Tests email template CRUD operations and schema validation:
 * - Template creation and retrieval
 * - Variable interpolation support
 * - Template activation/deactivation
 * - Category filtering
 * - TEXT id type validation (not UUID)
 *
 * NOTE: These tests run against a real Supabase database
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TEST_TIMEOUT = 30000;

let testTemplateIds: string[] = [];

describe('Email Templates Integration Tests', () => {
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
    // Cleanup test templates
    if (testTemplateIds.length > 0) {
      console.log(`Cleaning up ${testTemplateIds.length} test templates...`);
      await adminClient
        .from('email_templates')
        .delete()
        .in('id', testTemplateIds);
    }
  }, TEST_TIMEOUT);

  describe('Email Template Schema', () => {
    it('should use TEXT id (not UUID)', async () => {
      const templateId = `test_text_id_${Date.now()}`;

      const { data, error } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId, // TEXT id, not UUID
          name: 'Test TEXT ID Template',
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          is_active: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(templateId);
      expect(typeof data?.id).toBe('string');

      testTemplateIds.push(templateId);
    }, TEST_TIMEOUT);

    it('should NOT have is_system column (removed)', async () => {
      const templateId = `test_no_is_system_${Date.now()}`;

      // Create template
      const { data } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Test No is_system',
          subject: 'Test',
          body_html: '<p>Test</p>'
        })
        .select('id, name, subject')
        .single();

      testTemplateIds.push(templateId);

      // Attempting to select is_system should fail
      const { error } = await supabase
        .from('email_templates')
        .select('is_system')
        .eq('id', templateId)
        .single();

      expect(error).toBeDefined();
      expect(error?.message).toContain('column');
    }, TEST_TIMEOUT);

    it('should have required fields: id, name, subject', async () => {
      // Missing name should fail
      const { error: nameError } = await adminClient
        .from('email_templates')
        .insert({
          id: 'missing_name_test',
          subject: 'Test',
          body_html: '<p>Test</p>'
          // name: MISSING
        });

      expect(nameError).toBeDefined();
      expect(nameError?.code).toBe('23502'); // NOT NULL violation

      // Missing subject should fail
      const { error: subjectError } = await adminClient
        .from('email_templates')
        .insert({
          id: 'missing_subject_test',
          name: 'Test',
          body_html: '<p>Test</p>'
          // subject: MISSING
        });

      expect(subjectError).toBeDefined();
      expect(subjectError?.code).toBe('23502'); // NOT NULL violation
    }, TEST_TIMEOUT);
  });

  describe('Email Template CRUD Operations', () => {
    it('should create a new template', async () => {
      const templateId = `test_create_${Date.now()}`;

      const { data, error } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Test Create Template',
          subject: 'Welcome to {{company_name}}',
          body_html: '<h1>Hello {{user_name}}</h1><p>Welcome!</p>',
          body_text: 'Hello {{user_name}}, Welcome!',
          category: 'user_action',
          is_active: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(templateId);
      expect(data?.name).toBe('Test Create Template');
      expect(data?.subject).toContain('{{company_name}}');
      expect(data?.category).toBe('user_action');
      expect(data?.is_active).toBe(true);

      testTemplateIds.push(templateId);
    }, TEST_TIMEOUT);

    it('should read existing templates', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const template = data[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('body_html');
        expect(template).toHaveProperty('is_active');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('created_at');
        expect(template).toHaveProperty('updated_at');
      }
    }, TEST_TIMEOUT);

    it('should update a template', async () => {
      const templateId = `test_update_${Date.now()}`;

      // Create
      await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Original Name',
          subject: 'Original Subject',
          body_html: '<p>Original</p>',
          is_active: false
        });

      testTemplateIds.push(templateId);

      // Update
      const { data: updated, error } = await adminClient
        .from('email_templates')
        .update({
          name: 'Updated Name',
          subject: 'Updated Subject',
          body_html: '<p>Updated</p>',
          is_active: true
        })
        .eq('id', templateId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.subject).toBe('Updated Subject');
      expect(updated?.is_active).toBe(true);
    }, TEST_TIMEOUT);

    it('should delete a template', async () => {
      const templateId = `test_delete_${Date.now()}`;

      // Create
      await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Delete Me',
          subject: 'Test',
          body_html: '<p>Test</p>'
        });

      // Delete
      const { error: deleteError } = await adminClient
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      expect(deleteError).toBeNull();

      // Verify deleted
      const { data: deleted } = await supabase
        .from('email_templates')
        .select()
        .eq('id', templateId)
        .single();

      expect(deleted).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('Email Template Variables', () => {
    it('should store templates with variable placeholders', async () => {
      const templateId = `test_variables_${Date.now()}`;

      const { data, error } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Variable Test Template',
          subject: 'Hello {{user_name}} - {{event_type}}',
          body_html: `
            <h1>Hi {{user_name}},</h1>
            <p>Your {{event_type}} for {{company_name}} is ready.</p>
            <p>Event ID: {{event_id}}</p>
            <a href="{{portal_url}}">Visit Portal</a>
          `,
          body_text: 'Hi {{user_name}}, Your {{event_type}} is ready.',
          is_active: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.subject).toContain('{{user_name}}');
      expect(data?.subject).toContain('{{event_type}}');
      expect(data?.body_html).toContain('{{company_name}}');
      expect(data?.body_html).toContain('{{portal_url}}');

      testTemplateIds.push(templateId);
    }, TEST_TIMEOUT);
  });

  describe('Email Template Filtering', () => {
    it('should filter by is_active status', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        data.forEach(template => {
          expect(template.is_active).toBe(true);
        });
      }
    }, TEST_TIMEOUT);

    it('should filter by category', async () => {
      // Create test templates with different categories
      const templates = await Promise.all([
        adminClient.from('email_templates').insert({
          id: `test_cat_user_${Date.now()}`,
          name: 'User Action Template',
          subject: 'Test',
          body_html: '<p>Test</p>',
          category: 'user_action',
          is_active: false
        }).select().single(),
        adminClient.from('email_templates').insert({
          id: `test_cat_admin_${Date.now()}`,
          name: 'Admin Action Template',
          subject: 'Test',
          body_html: '<p>Test</p>',
          category: 'admin_action',
          is_active: false
        }).select().single()
      ]);

      templates.forEach(({ data }) => {
        if (data?.id) testTemplateIds.push(data.id);
      });

      // Filter by category
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('category', 'user_action');

      expect(error).toBeNull();

      if (data && data.length > 0) {
        data.forEach(template => {
          if (template.id.startsWith('test_cat_')) {
            expect(template.category).toBe('user_action');
          }
        });
      }
    }, TEST_TIMEOUT);
  });

  describe('Email Template Metadata', () => {
    it('should store and retrieve metadata as JSONB', async () => {
      const templateId = `test_metadata_${Date.now()}`;

      const metadata = {
        author: 'test_user',
        version: '1.0.0',
        tags: ['important', 'user-facing'],
        custom_settings: {
          send_time: 'immediate',
          tracking: true
        }
      };

      const { data, error } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Metadata Test Template',
          subject: 'Test',
          body_html: '<p>Test</p>',
          metadata: metadata,
          is_active: false
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.metadata).toEqual(metadata);

      testTemplateIds.push(templateId);
    }, TEST_TIMEOUT);
  });

  describe('Email Template Defaults', () => {
    it('should have default values for optional fields', async () => {
      const templateId = `test_defaults_${Date.now()}`;

      const { data } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'Defaults Test',
          subject: 'Test',
          body_html: '<p>Test</p>'
          // Omit optional fields to test defaults
        })
        .select()
        .single();

      expect(data?.is_active).toBe(true); // Default true
      expect(data?.category).toBe('general'); // Default 'general'
      expect(data?.metadata).toEqual({}); // Default empty object
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();

      testTemplateIds.push(templateId);
    }, TEST_TIMEOUT);
  });

  describe('Email Template Uniqueness', () => {
    it('should enforce unique id constraint', async () => {
      const templateId = `test_unique_${Date.now()}`;

      // Create first template
      const { error: firstError } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId,
          name: 'First Template',
          subject: 'Test',
          body_html: '<p>Test</p>'
        });

      expect(firstError).toBeNull();
      testTemplateIds.push(templateId);

      // Try to create second template with same id
      const { error: duplicateError } = await adminClient
        .from('email_templates')
        .insert({
          id: templateId, // Same ID
          name: 'Duplicate Template',
          subject: 'Test',
          body_html: '<p>Test</p>'
        });

      // Should fail with unique constraint violation
      expect(duplicateError).toBeDefined();
      expect(duplicateError?.code).toBe('23505'); // Unique violation
    }, TEST_TIMEOUT);
  });
});
