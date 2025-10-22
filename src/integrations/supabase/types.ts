export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fleet: {
        Row: {
          created_at: string
          id: string
          license_plate_number: string | null
          make: string | null
          model: string | null
          odometer: number | null
          operational_state:
            | Database["public"]["Enums"]["operational_state"]
            | null
          operational_status: string | null
          organization_id: string
          ownership_end_date: string | null
          ownership_start_date: string | null
          ownership_type: string | null
          pm_stats: string | null
          registered_state: string | null
          registration_expiry_date: string | null
          service_tier: string | null
          service_type: string | null
          station_code: string | null
          status: string | null
          status_priority: string | null
          status_reason_code: string | null
          status_reason_message: string | null
          status_search_value: string | null
          sub_model: string | null
          subcontractor_name: string | null
          subservice_type: string | null
          subservice_type2: string | null
          type: string | null
          updated_at: string
          vehicle_name: string | null
          vehicle_provider: string | null
          vehicle_registration_type: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          vin: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          license_plate_number?: string | null
          make?: string | null
          model?: string | null
          odometer?: number | null
          operational_state?:
            | Database["public"]["Enums"]["operational_state"]
            | null
          operational_status?: string | null
          organization_id: string
          ownership_end_date?: string | null
          ownership_start_date?: string | null
          ownership_type?: string | null
          pm_stats?: string | null
          registered_state?: string | null
          registration_expiry_date?: string | null
          service_tier?: string | null
          service_type?: string | null
          station_code?: string | null
          status?: string | null
          status_priority?: string | null
          status_reason_code?: string | null
          status_reason_message?: string | null
          status_search_value?: string | null
          sub_model?: string | null
          subcontractor_name?: string | null
          subservice_type?: string | null
          subservice_type2?: string | null
          type?: string | null
          updated_at?: string
          vehicle_name?: string | null
          vehicle_provider?: string | null
          vehicle_registration_type?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          vin: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          license_plate_number?: string | null
          make?: string | null
          model?: string | null
          odometer?: number | null
          operational_state?:
            | Database["public"]["Enums"]["operational_state"]
            | null
          operational_status?: string | null
          organization_id?: string
          ownership_end_date?: string | null
          ownership_start_date?: string | null
          ownership_type?: string | null
          pm_stats?: string | null
          registered_state?: string | null
          registration_expiry_date?: string | null
          service_tier?: string | null
          service_type?: string | null
          station_code?: string | null
          status?: string | null
          status_priority?: string | null
          status_reason_code?: string | null
          status_reason_message?: string | null
          status_search_value?: string | null
          sub_model?: string | null
          subcontractor_name?: string | null
          subservice_type?: string | null
          subservice_type2?: string | null
          type?: string | null
          updated_at?: string
          vehicle_name?: string | null
          vehicle_provider?: string | null
          vehicle_registration_type?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          vin?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          admin_id: string
          ended_at: string | null
          id: string
          impersonated_user_id: string
          started_at: string
        }
        Insert: {
          admin_id: string
          ended_at?: string | null
          id?: string
          impersonated_user_id: string
          started_at?: string
        }
        Update: {
          admin_id?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id?: string
          started_at?: string
        }
        Relationships: []
      }
      maintenance_assignment_history: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          maintenance_record_id: string
          new_assignee: string | null
          previous_assignee: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          maintenance_record_id: string
          new_assignee?: string | null
          previous_assignee?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          maintenance_record_id?: string
          new_assignee?: string | null
          previous_assignee?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_assignment_history_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_documents: {
        Row: {
          description: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          maintenance_record_id: string
          mime_type: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          description?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          maintenance_record_id: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          description?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          maintenance_record_id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_documents_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notes: {
        Row: {
          created_at: string
          created_by: string
          edited_at: string | null
          edited_by: string | null
          id: string
          maintenance_record_id: string
          note: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          maintenance_record_id: string
          note: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          maintenance_record_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintenance_record_id"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notes_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notes_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          afs_eligible: string | null
          assignee: string | null
          created_at: string
          created_by: string
          date_due: string | null
          id: string
          issue: string | null
          issue_title: string
          location: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes: string | null
          maintenance_record_status:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer: number | null
          organization_id: string
          resolution: string | null
          resolution_reason:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number | null
          support_ticket: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          afs_eligible?: string | null
          assignee?: string | null
          created_at?: string
          created_by: string
          date_due?: string | null
          id?: string
          issue?: string | null
          issue_title: string
          location: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes?: string | null
          maintenance_record_status?:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer?: number | null
          organization_id: string
          resolution?: string | null
          resolution_reason?:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number | null
          support_ticket?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          afs_eligible?: string | null
          assignee?: string | null
          created_at?: string
          created_by?: string
          date_due?: string | null
          id?: string
          issue?: string | null
          issue_title?: string
          location?: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes?: string | null
          maintenance_record_status?:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer?: number | null
          organization_id?: string
          resolution?: string | null
          resolution_reason?:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number | null
          support_ticket?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle_id"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_assignee_fkey"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          maintenance_record_id: string
          new_status: Database["public"]["Enums"]["maintenance_record_status"]
          previous_status:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          maintenance_record_id: string
          new_status: Database["public"]["Enums"]["maintenance_record_status"]
          previous_status?:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          maintenance_record_id?: string
          new_status?: Database["public"]["Enums"]["maintenance_record_status"]
          previous_status?:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_status_history_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      module_configurations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          module_id: string
          organization_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          module_id: string
          organization_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          module_id?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_configurations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["module_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
        }
        Relationships: []
      }
      odometer_history: {
        Row: {
          id: string
          maintenance_record_id: string | null
          notes: string | null
          odometer: number
          recorded_at: string
          recorded_by: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          maintenance_record_id?: string | null
          notes?: string | null
          odometer: number
          recorded_at?: string
          recorded_by: string
          vehicle_id: string
        }
        Update: {
          id?: string
          maintenance_record_id?: string | null
          notes?: string | null
          odometer?: number
          recorded_at?: string
          recorded_by?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odometer_history_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odometer_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          id: string
          info: string | null
          name: string
          primary_contact: string | null
          state: string | null
          station_id: string | null
          street_address: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          info?: string | null
          name: string
          primary_contact?: string | null
          state?: string | null
          station_id?: string | null
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          info?: string | null
          name?: string
          primary_contact?: string | null
          state?: string | null
          station_id?: string | null
          street_address?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization_primary_contact"
            columns: ["primary_contact"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_primary_contact_fkey"
            columns: ["primary_contact"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          organization_id: string | null
          phone_number: string | null
          preferred_name: string | null
          status: Database["public"]["Enums"]["user_status"]
          suffix: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          suffix?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_name?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          suffix?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rankings: {
        Row: {
          category: Database["public"]["Enums"]["ranking_category"]
          created_at: string
          id: string
          rated_by: string | null
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["ranking_category"]
          created_at?: string
          id?: string
          rated_by?: string | null
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ranking_category"]
          created_at?: string
          id?: string
          rated_by?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rankings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          display_order: number | null
          id: string
          last_modified_by: string
          parent_id: string | null
          role_access: string[]
          search_vector: unknown | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status_enum"]
          tags: string[] | null
          title: string
          updated_at: string
          version: string | null
          visibility: Database["public"]["Enums"]["article_visibility"]
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by: string
          display_order?: number | null
          id?: string
          last_modified_by: string
          parent_id?: string | null
          role_access?: string[]
          search_vector?: unknown | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status_enum"]
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: string | null
          visibility?: Database["public"]["Enums"]["article_visibility"]
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          display_order?: number | null
          id?: string
          last_modified_by?: string
          parent_id?: string | null
          role_access?: string[]
          search_vector?: unknown | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status_enum"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: string | null
          visibility?: Database["public"]["Enums"]["article_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "wiki_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_articles_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_articles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_impersonations: {
        Row: {
          admin_email: string | null
          admin_id: string | null
          id: string | null
          impersonated_email: string | null
          impersonated_user_id: string | null
          started_at: string | null
        }
        Relationships: []
      }
      admin_users_view: {
        Row: {
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_fleet_record: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_access_maintenance_note: {
        Args: { p_note_id: string }
        Returns: boolean
      }
      can_access_maintenance_record: {
        Args: { p_record_id: string }
        Returns: boolean
      }
      can_access_module: {
        Args: {
          p_module_type: Database["public"]["Enums"]["module_type"]
          p_organization_id: string
        }
        Returns: boolean
      }
      can_access_organization: {
        Args: Record<PropertyKey, never> | { p_organization_id: string }
        Returns: boolean
      }
      can_access_organization_data: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_access_profiles: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_delete_wiki_article: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_owner_access_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_rate_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      check_user_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      create_maintenance_record_with_vehicle_update: {
        Args:
          | { record_data: Json; vehicle_id: string; severity?: number }
          | {
              record_data: Json
              vehicle_id: string
              severity?: number
              operational_state?: string
            }
        Returns: string
      }
      create_new_user: {
        Args: {
          email: string
          first_name: string
          last_name: string
          middle_name?: string
          suffix?: string
          preferred_name?: string
          phone_number?: string
          organization_id?: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      end_user_impersonation: {
        Args: { session_id: string }
        Returns: boolean
      }
      generate_slug: {
        Args: { input_title: string }
        Returns: string
      }
      get_filtered_maintenance_records: {
        Args: { p_organization_id: string; p_include_all_orgs?: boolean }
        Returns: {
          afs_eligible: string | null
          assignee: string | null
          created_at: string
          created_by: string
          date_due: string | null
          id: string
          issue: string | null
          issue_title: string
          location: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes: string | null
          maintenance_record_status:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer: number | null
          organization_id: string
          resolution: string | null
          resolution_reason:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number | null
          support_ticket: number | null
          updated_at: string
          vehicle_id: string
        }[]
      }
      get_latest_odometer: {
        Args: { p_vehicle_id: string }
        Returns: number
      }
      get_maintenance_assignees: {
        Args: { p_organization_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
          is_current_user: boolean
        }[]
      }
      get_new_users_today_count: {
        Args: { today_date: string }
        Returns: number
      }
      get_organization_modules: {
        Args: { org_id: string }
        Returns: {
          id: string
          name: string
          type: Database["public"]["Enums"]["module_type"]
          description: string
          is_enabled: boolean
        }[]
      }
      get_organizations_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_path: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          id: string
          info: string | null
          name: string
          primary_contact: string | null
          state: string | null
          station_id: string | null
          street_address: string | null
          updated_at: string
          zip_code: string | null
        }[]
      }
      get_owner_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          permission: string
        }[]
      }
      get_technicians: {
        Args: { p_organization_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
          is_current_user: boolean
        }[]
      }
      get_total_admins_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_organizations_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_users_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_organization: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_permissions: {
        Args: { p_user_id?: string }
        Returns: {
          permission: string
        }[]
      }
      get_user_roles: {
        Args: { user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_fleet_maintenance_permission: {
        Args: { p_permission: string }
        Returns: boolean
      }
      has_fleet_permission: {
        Args: { p_permission: string }
        Returns: boolean
      }
      has_fleet_role: {
        Args: { p_role: string }
        Returns: boolean
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_being_impersonated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_fleet_enabled: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_fleet_maintenance_enabled: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_module_enabled: {
        Args: {
          p_module_type: Database["public"]["Enums"]["module_type"]
          p_organization_id: string
        }
        Returns: boolean
      }
      reset_user_password: {
        Args: { user_email: string; new_password: string }
        Returns: Json
      }
      resolve_maintenance_record: {
        Args:
          | {
              p_record_id: string
              p_resolution: string
              p_resolved_at: string
              p_vehicle_id: string
              p_operational_state: string
              p_additional_data?: Json
            }
          | {
              p_record_id: string
              p_resolution: string
              p_resolved_at: string
              p_vehicle_id: string
              p_operational_state: string
              p_resolution_reason: Database["public"]["Enums"]["resolution_reason"]
              p_additional_data?: Json
            }
          | {
              p_record_id: string
              p_resolution: string
              p_resolved_at: string
              p_vehicle_id: string
              p_operational_state: string
              p_resolution_reason?: string
              p_odometer?: number
              p_assignee?: string
            }
        Returns: undefined
      }
      resolve_maintenance_record_status: {
        Args: {
          p_record_id: string
          p_resolution: string
          p_resolved_at: string
          p_vehicle_status: string
        }
        Returns: {
          afs_eligible: string | null
          assignee: string | null
          created_at: string
          created_by: string
          date_due: string | null
          id: string
          issue: string | null
          issue_title: string
          location: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes: string | null
          maintenance_record_status:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer: number | null
          organization_id: string
          resolution: string | null
          resolution_reason:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number | null
          support_ticket: number | null
          updated_at: string
          vehicle_id: string
        }[]
      }
      simple_password_test: {
        Args: { email_to_test: string; password_to_test: string }
        Returns: Json
      }
      start_user_impersonation: {
        Args: { target_user_id: string }
        Returns: string
      }
      test_password_methods: {
        Args: { email_to_test: string; password_to_test: string }
        Returns: Json
      }
      test_pgcrypto_access: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_simple_function: {
        Args: { test_input: string }
        Returns: string
      }
      toggle_module_status: {
        Args: {
          p_module_id: string
          p_organization_id: string
          p_is_enabled: boolean
        }
        Returns: boolean
      }
      update_maintenance_record: {
        Args: { p_id: string; p_data: Json }
        Returns: {
          afs_eligible: string | null
          assignee: string | null
          created_at: string
          created_by: string
          date_due: string | null
          id: string
          issue: string | null
          issue_title: string
          location: Database["public"]["Enums"]["maintenance_location"]
          maintenance_notes: string | null
          maintenance_record_status:
            | Database["public"]["Enums"]["maintenance_record_status"]
            | null
          odometer: number | null
          organization_id: string
          resolution: string | null
          resolution_reason:
            | Database["public"]["Enums"]["resolution_reason"]
            | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number | null
          support_ticket: number | null
          updated_at: string
          vehicle_id: string
        }[]
      }
      update_odometer_with_validation: {
        Args: { p_vehicle_id: string; p_odometer: number }
        Returns: boolean
      }
      update_user_roles: {
        Args: {
          new_roles: Database["public"]["Enums"]["app_role"][]
          p_user_id: string
        }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      update_vehicle_operational_state: {
        Args: { p_vehicle_id: string; p_operational_state?: string }
        Returns: boolean
      }
      update_vehicle_type: {
        Args: {
          p_vehicle_id: string
          p_vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      vehicle_has_active_maintenance: {
        Args: { p_vehicle_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "owner"
        | "manager"
        | "dispatch"
        | "tech"
        | "driver"
        | "super_admin"
        | "developer"
        | "finance"
      article_status_enum: "draft" | "published" | "archived"
      article_visibility: "draft" | "published"
      maintenance_location: "DL13" | "APD" | "Rivian"
      maintenance_record_status:
        | "New Request"
        | "In Progress"
        | "Diagnostic"
        | "Awaiting Parts"
        | "Quality Check"
        | "Ready for Pickup"
        | "On Hold"
        | "Requires Authorization"
        | "Resolved"
      module_type:
        | "dispatch"
        | "inventory"
        | "billing"
        | "reporting"
        | "maintenance"
        | "fleet"
        | "fleet_maintenance"
      operational_state: "Available" | "Grounded"
      ranking_category: "attendance" | "performance" | "safety"
      resolution_reason:
        | "Repairs Completed"
        | "Part Replacement"
        | "Adjustment Made"
        | "No Issue Found"
        | "Deferred Maintenance"
        | "Warranty Work Completed"
        | "Recall Service Performed"
        | "Referred to Specialist"
        | "Unable to Duplicate Issue"
        | "Documentation Update"
        | "Outside Service Scope"
        | "Won't Fix"
      user_status: "active" | "suspended" | "deactivated" | "archived"
      vehicle_type:
        | "EDV"
        | "CDV"
        | "Prime Van"
        | "Sprinter Van"
        | "Step Van"
        | "Other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "owner",
        "manager",
        "dispatch",
        "tech",
        "driver",
        "super_admin",
        "developer",
        "finance",
      ],
      article_status_enum: ["draft", "published", "archived"],
      article_visibility: ["draft", "published"],
      maintenance_location: ["DL13", "APD", "Rivian"],
      maintenance_record_status: [
        "New Request",
        "In Progress",
        "Diagnostic",
        "Awaiting Parts",
        "Quality Check",
        "Ready for Pickup",
        "On Hold",
        "Requires Authorization",
        "Resolved",
      ],
      module_type: [
        "dispatch",
        "inventory",
        "billing",
        "reporting",
        "maintenance",
        "fleet",
        "fleet_maintenance",
      ],
      operational_state: ["Available", "Grounded"],
      ranking_category: ["attendance", "performance", "safety"],
      resolution_reason: [
        "Repairs Completed",
        "Part Replacement",
        "Adjustment Made",
        "No Issue Found",
        "Deferred Maintenance",
        "Warranty Work Completed",
        "Recall Service Performed",
        "Referred to Specialist",
        "Unable to Duplicate Issue",
        "Documentation Update",
        "Outside Service Scope",
        "Won't Fix",
      ],
      user_status: ["active", "suspended", "deactivated", "archived"],
      vehicle_type: [
        "EDV",
        "CDV",
        "Prime Van",
        "Sprinter Van",
        "Step Van",
        "Other",
      ],
    },
  },
} as const
