-- Fix get_contact_analytics function
CREATE OR REPLACE FUNCTION public.get_contact_analytics()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'total_contacts', (SELECT COUNT(*) FROM contacts WHERE is_active = true),
        'total_markets', (SELECT COUNT(*) FROM markets WHERE is_active = true),
        'total_stations', (SELECT COUNT(*) FROM stations WHERE is_active = true),
        'total_dsps', (SELECT COUNT(*) FROM dsps WHERE is_active = true),
        'total_interactions', (SELECT COUNT(*) FROM interactions)
      )
    ),
    'contacts_by_status', (
      SELECT COALESCE(jsonb_object_agg(
        COALESCE(contact_status, 'unknown'),
        count
      ), '{}'::jsonb)
      FROM (
        SELECT contact_status, COUNT(*) as count
        FROM contacts
        WHERE is_active = true
        GROUP BY contact_status
      ) t
    ),
    'contacts_by_title', (
      SELECT COALESCE(jsonb_object_agg(
        COALESCE(title::text, 'none'),
        count
      ), '{}'::jsonb)
      FROM (
        SELECT title, COUNT(*) as count
        FROM contacts
        WHERE is_active = true
        GROUP BY title
      ) t
    ),
    'interactions_by_type', (
      SELECT COALESCE(jsonb_object_agg(
        interaction_type::text,
        count
      ), '{}'::jsonb)
      FROM (
        SELECT interaction_type, COUNT(*) as count
        FROM interactions
        GROUP BY interaction_type
      ) t
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'date', date,
          'new_contacts', new_contacts,
          'new_interactions', new_interactions
        )
      ), '[]'::jsonb)
      FROM (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as new_contacts,
          0 as new_interactions
        FROM contacts
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND is_active = true
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ) t
    ),
    'conversion_funnel', jsonb_build_object(
      'new_to_contacted', CASE
        WHEN (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'new') > 0
        THEN ((SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'contacted')::float /
              (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'new')::float * 100)
        ELSE 0
      END,
      'contacted_to_qualified', CASE
        WHEN (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'contacted') > 0
        THEN ((SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'qualified')::float /
              (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'contacted')::float * 100)
        ELSE 0
      END,
      'qualified_to_active', CASE
        WHEN (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'qualified') > 0
        THEN ((SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'active')::float /
              (SELECT COUNT(*) FROM contacts WHERE is_active = true AND contact_status = 'qualified')::float * 100)
        ELSE 0
      END
    )
  );
END;
$$;
