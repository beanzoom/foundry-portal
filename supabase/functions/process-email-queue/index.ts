import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailQueueItem {
  queue_id: string
  event_type: string
  event_id: string | null
  template_id: string | null
  to_email: string
  to_user_id: string | null
  event_payload: any
  metadata: any
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string | null
  variables: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get batch size from request or default to 10
    const { batchSize = 10 } = await req.json().catch(() => ({}))

    console.log(`Processing email queue with batch size: ${batchSize}`)

    // Get next batch of emails to process
    const { data: emailBatch, error: batchError } = await supabase
      .rpc('get_next_email_batch', { p_batch_size: batchSize })

    if (batchError) {
      console.error('Error fetching email batch:', batchError)
      throw batchError
    }

    if (!emailBatch || emailBatch.length === 0) {
      console.log('No emails to process')
      return new Response(
        JSON.stringify({ message: 'No emails to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${emailBatch.length} emails to process`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[]
    }

    // Process each email with rate limiting (500ms delay between emails = 2 per second max)
    for (let i = 0; i < emailBatch.length; i++) {
      const email = emailBatch[i]

      try {
        const resendId = await processEmail(email, supabase, resendApiKey)
        results.sent++

        // Mark as sent with the Resend ID
        await supabase.rpc('mark_email_sent', {
          p_queue_id: email.queue_id,
          p_resend_id: resendId,
          p_metadata: { processed_at: new Date().toISOString(), resend_id: resendId }
        })
      } catch (error) {
        console.error(`Failed to process email ${email.queue_id}:`, error)
        results.failed++
        results.errors.push({
          queue_id: email.queue_id,
          error: error.message
        })

        // Mark as failed with retry logic
        await supabase.rpc('mark_email_failed', {
          p_queue_id: email.queue_id,
          p_error: error.message,
          p_error_details: { error: error.toString(), timestamp: new Date().toISOString() }
        })
      }

      // Rate limiting: Wait 500ms between emails (2 emails per second to respect Resend limits)
      if (i < emailBatch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`Processing complete. Sent: ${results.sent}, Failed: ${results.failed}`)

    return new Response(
      JSON.stringify({
        message: 'Email queue processed',
        processed: emailBatch.length,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in process-email-queue:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processEmail(
  email: EmailQueueItem,
  supabase: any,
  resendApiKey: string
): Promise<string> {
  // Fetch template if specified
  let template: EmailTemplate | null = null
  if (email.template_id) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', email.template_id)
      .single()

    if (error) {
      console.error(`Failed to fetch template ${email.template_id}:`, error)
      throw new Error(`Template not found: ${email.template_id}`)
    }

    template = data
  }

  // Get user details if we have a user_id
  let userDetails: any = null
  if (email.to_user_id) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', email.to_user_id)
      .single()

    userDetails = data
  }

  // Prepare email content
  let subject = 'Notification from Fleet DRMS'
  let htmlContent = ''
  let textContent = ''

  if (template) {
    // Interpolate template variables
    const variables = prepareVariables(email, userDetails)
    subject = interpolateTemplate(template.subject, variables)
    htmlContent = interpolateTemplate(template.body_html, variables)
    textContent = template.body_text ? interpolateTemplate(template.body_text, variables) : ''
  } else {
    // Fallback content if no template
    subject = `${email.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
    htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${subject}</h2>
        <p>You have a new notification from Fleet DRMS.</p>
        <p>Please log in to the portal to view more details.</p>
      </div>
    `
  }

  // Send via Resend
  console.log(`Sending email to ${email.to_email} with subject: ${subject}`)

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Fleet DRMS <noreply@fleetdrms.com>',
      to: [email.to_email],
      subject: subject,
      html: htmlContent,
      text: textContent || undefined,
      tags: [
        { name: 'event_type', value: email.event_type },
        { name: 'queue_id', value: email.queue_id },
      ],
    }),
  })

  if (!resendResponse.ok) {
    const error = await resendResponse.text()
    console.error('Resend API error:', error)
    throw new Error(`Failed to send email: ${error}`)
  }

  const resendData = await resendResponse.json()
  console.log(`Email sent successfully. Resend ID: ${resendData.id}`)

  // Return the Resend ID so it can be properly logged
  return resendData.id
}

function prepareVariables(email: EmailQueueItem, userDetails: any): Record<string, string> {
  const payload = email.event_payload || {}

  // Debug logging
  console.log('Preparing variables for event:', email.event_type)
  console.log('Event payload:', JSON.stringify(payload, null, 2))

  // Base variables - always include portal_url as a default
  const variables: Record<string, string> = {
    user_name: userDetails?.first_name || 'User',
    user_email: email.to_email,
    current_date: new Date().toLocaleDateString(),
    current_year: new Date().getFullYear().toString(),
    portal_url: 'https://portal.fleetdrms.com',  // Default portal URL
  }

  // Event-specific variables
  switch (email.event_type) {
    case 'update_published':
      variables.title = payload.title || 'Update'
      variables.content = payload.content || ''
      variables.description = payload.description || payload.summary || ''
      variables.update_type = payload.update_type || 'General Update'
      // Use portal_url from payload if available, otherwise construct it
      variables.portal_url = payload.portal_url || `https://portal.fleetdrms.com/updates/${payload.id || ''}`
      variables.update_date = payload.created_at ? new Date(payload.created_at).toLocaleDateString() : ''
      break

    case 'survey_published':
      variables.title = payload.title || 'Survey'
      variables.description = payload.description || ''
      variables.survey_title = payload.title || 'Survey'
      variables.survey_description = payload.description || ''
      variables.survey_type = payload.survey_type || 'General Survey'
      variables.due_date = payload.due_date ? new Date(payload.due_date).toLocaleDateString() : ''
      variables.survey_due_date = payload.due_date ? new Date(payload.due_date).toLocaleDateString() : ''
      // Use portal_url from payload if available, otherwise construct it
      variables.portal_url = payload.portal_url || `https://portal.fleetdrms.com/surveys/${payload.id || ''}`
      break

    case 'event_published':
      variables.title = payload.title || 'Event'
      variables.description = payload.description || ''
      variables.event_title = payload.title || 'Event'
      variables.event_description = payload.description || ''
      variables.event_type = payload.event_type || 'General Event'
      variables.event_date = payload.event_date ? new Date(payload.event_date).toLocaleDateString() : ''
      variables.date = payload.event_date ? new Date(payload.event_date).toLocaleDateString() : ''
      variables.time = payload.event_time || ''
      variables.location = payload.location || ''
      variables.event_location = payload.location || ''
      // Use portal_url from payload if available, otherwise construct it
      variables.portal_url = payload.portal_url || `https://portal.fleetdrms.com/events/${payload.id || ''}`
      break

    case 'user_registered':
      variables.welcome_message = 'Welcome to Fleet DRMS!'
      variables.login_url = `https://portal.fleetdrms.com`
      variables.portal_url = `https://portal.fleetdrms.com`
      break

    case 'referral_submitted':
    case 'referral_created':
      // Referral data from portal_referrals table
      variables.referee_first_name = payload.referee_first_name || ''
      variables.referee_last_name = payload.referee_last_name || ''
      variables.referee_email = payload.referee_email || ''
      variables.referee_phone = payload.referee_phone || ''
      variables.referee_name = `${payload.referee_first_name || ''} ${payload.referee_last_name || ''}`.trim() || 'Referee'

      // Referrer information (now comes from trigger lookup)
      variables.referrer_first_name = payload.referrer_first_name || ''
      variables.referrer_last_name = payload.referrer_last_name || ''
      variables.referrer_email = payload.referrer_email || ''
      variables.referrer_name = `${payload.referrer_first_name || ''} ${payload.referrer_last_name || ''}`.trim() || 'Referrer'

      variables.referral_code = payload.referral_code || ''
      variables.dsp_name = payload.dsp_name || ''
      variables.dsp_code = payload.dsp_code || ''
      variables.company = payload.dsp_name || ''

      variables.created_date = payload.created_at ? new Date(payload.created_at).toLocaleDateString() : ''
      variables.status = payload.status || 'pending'

      // Legacy variable names for backward compatibility
      variables.title = `${payload.referee_first_name || ''} ${payload.referee_last_name || ''}`.trim() || 'Referral'
      variables.referral_name = `${payload.referee_first_name || ''} ${payload.referee_last_name || ''}`.trim()
      variables.referral_email = payload.referee_email || ''

      variables.portal_url = payload.portal_url || `https://portal.fleetdrms.com/referrals`
      break

    case 'contact_form_submitted':
      variables.name = payload.name || ''
      variables.email = payload.email || ''
      variables.message = payload.message || ''
      variables.portal_url = `https://portal.fleetdrms.com/admin/contacts`
      break

    case 'event_registration':
      variables.event_title = payload.event_title || 'Event'
      variables.registrant_name = payload.registrant_name || ''
      variables.portal_url = `https://portal.fleetdrms.com/events`
      break

    default:
      // For any unhandled event types, portal_url is already set in base variables
      console.log(`Unhandled event type: ${email.event_type}`)
      break
  }

  // Add any custom metadata variables
  if (email.metadata) {
    Object.entries(email.metadata).forEach(([key, value]) => {
      if (typeof value === 'string') {
        variables[key] = value
      }
    })
  }

  return variables
}

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let result = template

  // Replace {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, value)
  })

  // Clean up any unreplaced variables
  result = result.replace(/{{[^}]+}}/g, '')

  return result
}