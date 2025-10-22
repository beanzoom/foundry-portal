import { supabase } from '@/lib/supabase';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  updated_at: string;
  updated_by?: string;
}

class SettingsService {
  /**
   * Get all system settings
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching settings:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get a specific setting value
   */
  async getSetting(key: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_setting', { setting_key: key });

    if (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Update a setting value
   */
  async updateSetting(key: string, value: any): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('update_setting', { 
        setting_key: key, 
        setting_value: value 
      });

    if (error) {
      console.error(`Error updating setting ${key}:`, error);
      return false;
    }

    return data || false;
  }

  /**
   * Get admin email address
   */
  async getAdminEmail(): Promise<string> {
    const email = await this.getSetting('admin_email');
    // Return database value or fall back to env variable or default
    return email || import.meta.env.VITE_ADMIN_EMAIL || 'joey.lutes@fleetdrms.com';
  }

  /**
   * Update admin email address
   */
  async updateAdminEmail(email: string): Promise<boolean> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format');
      return false;
    }

    return this.updateSetting('admin_email', email);
  }

  /**
   * Get email settings
   */
  async getEmailSettings(): Promise<{
    adminEmail: string;
    emailEnabled: boolean;
  }> {
    const settings = await this.getAllSettings();
    const emailSettings = settings.filter(s => s.category === 'email');
    
    return {
      adminEmail: emailSettings.find(s => s.key === 'admin_email')?.value || 'joey.lutes@fleetdrms.com',
      emailEnabled: emailSettings.find(s => s.key === 'email_enabled')?.value !== false
    };
  }

  /**
   * Get email template
   */
  async getEmailTemplate(templateKey: string): Promise<{ subject: string; body: string } | null> {
    const template = await this.getSetting(templateKey);
    return template || null;
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    templateKey: string, 
    subject: string, 
    body: string
  ): Promise<boolean> {
    return this.updateSetting(templateKey, { subject, body });
  }

  /**
   * Get contact confirmation template
   */
  async getContactConfirmationTemplate(): Promise<{ subject: string; body: string }> {
    const template = await this.getEmailTemplate('contact_confirmation_template');
    return template || {
      subject: 'We received your message - FleetDRMS',
      body: `Hello {{name}},

Thank you for contacting us. We have received your message and will get back to you as soon as possible.

**Your Message:**
**Subject:** {{subject}}
**Message:** {{message}}

**Reference Number:** {{ticketNumber}}

If you have any urgent concerns, please don't hesitate to contact us directly.

Best regards,
The FleetDRMS Team`
    };
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace all {{variable}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
    
    return result;
  }
}

// Export singleton instance
export const settingsService = new SettingsService();