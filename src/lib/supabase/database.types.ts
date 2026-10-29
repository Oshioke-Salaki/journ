
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "check_ins": {
                  Row: {
                    "body": NonNullable<Json>,"created_at": string,"efficiency": number | null,"energy": number | null,"feelings": (string)[],"id": string,"local_date": string,"mood": number,"note": string | null,"self_satisfaction": number | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"efficiency"?: number | null,"energy"?: number | null,"feelings"?: (string)[],"id"?: string,"local_date": string,"mood": number,"note"?: string | null,"self_satisfaction"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"efficiency"?: number | null,"energy"?: number | null,"feelings"?: (string)[],"id"?: string,"local_date"?: string,"mood"?: number,"note"?: string | null,"self_satisfaction"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"control_items": {
                  Row: {
                    "body": string,"created_at": string,"goal_step_id": string | null,"id": string,"local_date": string,"user_id": string,"zone": Database["public"]['Enums']["control_zone"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"goal_step_id"?: string | null,"id"?: string,"local_date": string,"user_id"?: string,"zone"?: Database["public"]['Enums']["control_zone"] | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"goal_step_id"?: string | null,"id"?: string,"local_date"?: string,"user_id"?: string,"zone"?: Database["public"]['Enums']["control_zone"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "control_items_goal_step_id_fkey"
      columns: ["goal_step_id"]
isOneToOne: false
      referencedRelation: "goal_steps"
      referencedColumns: ["id"]
    }
                  ]
                },"goal_steps": {
                  Row: {
                    "created_at": string,"done_at": string | null,"due_date": string | null,"goal_id": string,"id": string,"position": number,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"done_at"?: string | null,"due_date"?: string | null,"goal_id": string,"id"?: string,"position"?: number,"title": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"done_at"?: string | null,"due_date"?: string | null,"goal_id"?: string,"id"?: string,"position"?: number,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "goal_steps_goal_id_fkey"
      columns: ["goal_id"]
isOneToOne: false
      referencedRelation: "goals"
      referencedColumns: ["id"]
    }
                  ]
                },"goals": {
                  Row: {
                    "achieved_at": string | null,"area": Database["public"]['Enums']["goal_area"],"created_at": string,"id": string,"status": Database["public"]['Enums']["goal_status"],"target_date": string | null,"title": string,"updated_at": string,"user_id": string,"why": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "achieved_at"?: string | null,"area"?: Database["public"]['Enums']["goal_area"],"created_at"?: string,"id"?: string,"status"?: Database["public"]['Enums']["goal_status"],"target_date"?: string | null,"title": string,"updated_at"?: string,"user_id"?: string,"why"?: string | null
                  }
                  Update: {
                    "achieved_at"?: string | null,"area"?: Database["public"]['Enums']["goal_area"],"created_at"?: string,"id"?: string,"status"?: Database["public"]['Enums']["goal_status"],"target_date"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string,"why"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"journal_entries": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["journal_kind"],"local_date": string,"prompt_body": string | null,"prompt_id": string | null,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["journal_kind"],"local_date": string,"prompt_body"?: string | null,"prompt_id"?: string | null,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["journal_kind"],"local_date"?: string,"prompt_body"?: string | null,"prompt_id"?: string | null,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entries_prompt_id_fkey"
      columns: ["prompt_id"]
isOneToOne: false
      referencedRelation: "prompts"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "birth_country": string | null,"birth_latitude": number | null,"birth_longitude": number | null,"birth_place": string | null,"birth_time": string | null,"birth_timezone": string | null,"country": string | null,"created_at": string,"date_of_birth": string | null,"display_name": string | null,"goal_prompts_enabled": boolean,"id": string,"language": string,"mature_content_confirmed_at": string | null,"onboarded_at": string | null,"plan": Database["public"]['Enums']["member_plan"],"pronouns": string | null,"reminder_time": string,"reminders_enabled": boolean,"role": Database["public"]['Enums']["member_role"],"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_country"?: string | null,"birth_latitude"?: number | null,"birth_longitude"?: number | null,"birth_place"?: string | null,"birth_time"?: string | null,"birth_timezone"?: string | null,"country"?: string | null,"created_at"?: string,"date_of_birth"?: string | null,"display_name"?: string | null,"goal_prompts_enabled"?: boolean,"id": string,"language"?: string,"mature_content_confirmed_at"?: string | null,"onboarded_at"?: string | null,"plan"?: Database["public"]['Enums']["member_plan"],"pronouns"?: string | null,"reminder_time"?: string,"reminders_enabled"?: boolean,"role"?: Database["public"]['Enums']["member_role"],"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "birth_country"?: string | null,"birth_latitude"?: number | null,"birth_longitude"?: number | null,"birth_place"?: string | null,"birth_time"?: string | null,"birth_timezone"?: string | null,"country"?: string | null,"created_at"?: string,"date_of_birth"?: string | null,"display_name"?: string | null,"goal_prompts_enabled"?: boolean,"id"?: string,"language"?: string,"mature_content_confirmed_at"?: string | null,"onboarded_at"?: string | null,"plan"?: Database["public"]['Enums']["member_plan"],"pronouns"?: string | null,"reminder_time"?: string,"reminders_enabled"?: boolean,"role"?: Database["public"]['Enums']["member_role"],"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"prompts": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_active": boolean,"topic_slug": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"topic_slug"?: string | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"topic_slug"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "prompts_topic_slug_fkey"
      columns: ["topic_slug"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["slug"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "author": string | null,"body": string,"created_at": string,"id": string,"is_active": boolean,"source": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author"?: string | null,"body": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"source"?: string | null
                  }
                  Update: {
                    "author"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"source"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"topics": {
                  Row: {
                    "is_mature": boolean,"slug": string,"sort": number,"summary": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "is_mature"?: boolean,"slug": string,"sort"?: number,"summary": string,"title": string
                  }
                  Update: {
                    "is_mature"?: boolean,"slug"?: string,"sort"?: number,"summary"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tracker_entries": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["tracker_kind"],"local_date": string,"note": string | null,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["tracker_kind"],"local_date": string,"note"?: string | null,"user_id"?: string,"value": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["tracker_kind"],"local_date"?: string,"note"?: string | null,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    
                  ]
                },"videos": {
                  Row: {
                    "created_at": string,"description": string,"duration_seconds": number,"host_name": string | null,"id": string,"is_published": boolean,"kind": Database["public"]['Enums']["video_kind"],"mux_playback_id": string | null,"poster_url": string | null,"published_at": string | null,"sort": number,"tier": Database["public"]['Enums']["content_tier"],"title": string,"topic_slug": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"duration_seconds": number,"host_name"?: string | null,"id"?: string,"is_published"?: boolean,"kind"?: Database["public"]['Enums']["video_kind"],"mux_playback_id"?: string | null,"poster_url"?: string | null,"published_at"?: string | null,"sort"?: number,"tier"?: Database["public"]['Enums']["content_tier"],"title": string,"topic_slug"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"duration_seconds"?: number,"host_name"?: string | null,"id"?: string,"is_published"?: boolean,"kind"?: Database["public"]['Enums']["video_kind"],"mux_playback_id"?: string | null,"poster_url"?: string | null,"published_at"?: string | null,"sort"?: number,"tier"?: Database["public"]['Enums']["content_tier"],"title"?: string,"topic_slug"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "videos_topic_slug_fkey"
      columns: ["topic_slug"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["slug"]
    }
                  ]
                },"vision_items": {
                  Row: {
                    "caption": string | null,"created_at": string,"id": string,"image_path": string | null,"kind": Database["public"]['Enums']["vision_kind"],"position": number,"user_id": string,"words": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"image_path"?: string | null,"kind": Database["public"]['Enums']["vision_kind"],"position"?: number,"user_id"?: string,"words"?: string | null
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"image_path"?: string | null,"kind"?: Database["public"]['Enums']["vision_kind"],"position"?: number,"user_id"?: string,"words"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"quote_for_day":
{ Args: { "day": string }; Returns: {
              "author": string | null,
"body": string,
"created_at": string,
"id": string,
"is_active": boolean,
"source": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "quotes"
        isOneToOne: false
        isSetofReturn: true
      } }
          }
          Enums: {
            "content_tier": "free"|"premium","control_zone": "control"|"influence"|"outside","goal_area": "body"|"mind"|"relationships"|"work"|"growth"|"other","goal_status": "active"|"achieved"|"paused","journal_kind": "free"|"prompted","member_plan": "free"|"premium","member_role": "member"|"admin","tracker_kind": "water"|"sleep"|"movement"|"nutrition"|"meditation","video_kind": "lesson"|"practice"|"coaching_session","vision_kind": "image"|"words"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "content_tier": ["free", "premium"],"control_zone": ["control", "influence", "outside"],"goal_area": ["body", "mind", "relationships", "work", "growth", "other"],"goal_status": ["active", "achieved", "paused"],"journal_kind": ["free", "prompted"],"member_plan": ["free", "premium"],"member_role": ["member", "admin"],"tracker_kind": ["water", "sleep", "movement", "nutrition", "meditation"],"video_kind": ["lesson", "practice", "coaching_session"],"vision_kind": ["image", "words"]
          }
        }
} as const
