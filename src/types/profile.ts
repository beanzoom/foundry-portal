
// Company Roles (System-wide)
export type CompanyRole = 'super_admin' | 'admin' | 'developer' | 'finance';

// Organization Roles (Customer-scoped)  
export type OrganizationRole = 'owner' | 'manager' | 'dispatch' | 'tech' | 'driver';

// Combined for backward compatibility
export type AppRole = CompanyRole | OrganizationRole;
export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'archived';

export interface Organization {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  preferred_name?: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  avatar_path?: string;
  roles: AppRole[]; // Change from optional to required property
  role?: string; // Added role for backward compatibility
  status: UserStatus;
  organization_id?: string;
  organizations?: { 
    name: string;
    avatar_url?: string; // Added avatar_url to organizations
  };
  title?: string;
}
