-- Fix delete_referral_admin_fixed to also delete orphaned contacts by email
CREATE OR REPLACE FUNCTION public.delete_referral_admin_fixed(
  p_referral_id uuid,
  p_admin_user_id uuid,
  p_deletion_reason text DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_referral RECORD;
  v_user_role TEXT;
  v_user_email TEXT;
  v_contacts_deleted INTEGER := 0;
  v_emails_cancelled INTEGER := 0;
BEGIN
  -- Get admin user details
  SELECT role, email INTO v_user_role, v_user_email
  FROM public.profiles
  WHERE id = p_admin_user_id;

  -- Check if admin user exists
  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Admin user not found with ID: ' || p_admin_user_id
    );
  END IF;

  -- Check admin permissions
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions. Your role: ' || v_user_role
    );
  END IF;

  -- Get referral details
  SELECT * INTO v_referral
  FROM public.portal_referrals
  WHERE id = p_referral_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Referral not found with ID: ' || p_referral_id
    );
  END IF;

  -- Check if user has registered
  IF v_referral.status IN ('registered', 'completed') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User has already registered'
    );
  END IF;

  -- Check for conversion record
  IF EXISTS (
    SELECT 1 FROM public.portal_referral_conversions
    WHERE referral_id = p_referral_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: Conversion record exists'
    );
  END IF;

  -- Check if user has portal access
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(v_referral.referee_email)
    AND role IN ('super_admin', 'admin', 'portal_member', 'investor')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User has portal access'
    );
  END IF;

  -- Delete contact records (both by referral_id AND by email to catch orphaned contacts)
  WITH deleted_contacts AS (
    DELETE FROM public.contacts
    WHERE referral_id = p_referral_id
       OR LOWER(email) = LOWER(v_referral.referee_email)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_contacts_deleted FROM deleted_contacts;

  -- Cancel pending emails
  WITH cancelled_emails AS (
    UPDATE public.email_notifications
    SET status = 'cancelled',
        metadata = metadata || jsonb_build_object(
          'cancelled_reason', 'Referral deleted by admin',
          'cancelled_at', NOW(),
          'cancelled_by', p_admin_user_id
        )
    WHERE metadata->>'referral_id' = p_referral_id::text
    AND status IN ('pending', 'failed')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_emails_cancelled FROM cancelled_emails;

  -- Delete rate limits
  DELETE FROM public.portal_referral_rate_limits
  WHERE referral_id = p_referral_id;

  -- Log deletion
  INSERT INTO public.referral_deletion_logs (
    referral_id,
    referee_email,
    referrer_id,
    deleted_by,
    deletion_reason,
    admin_note,
    contacts_deleted,
    emails_cancelled,
    deleted_at
  ) VALUES (
    p_referral_id,
    v_referral.referee_email,
    v_referral.referrer_id,
    p_admin_user_id,
    p_deletion_reason,
    p_admin_note,
    v_contacts_deleted,
    v_emails_cancelled,
    NOW()
  );

  -- Delete the referral itself
  DELETE FROM public.portal_referrals
  WHERE id = p_referral_id;

  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'referral_id', p_referral_id,
      'contacts_deleted', v_contacts_deleted,
      'emails_cancelled', v_emails_cancelled
    )
  );
END;
$$;
