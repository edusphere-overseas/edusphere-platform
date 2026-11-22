
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activity_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity": string,"entity_id": string | null,"id": number,"student_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity": string,"entity_id"?: string | null,"id"?: never,"student_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity"?: string,"entity_id"?: string | null,"id"?: never,"student_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"application_events": {
                  Row: {
                    "application_id": string,"changed_by": string | null,"created_at": string,"id": number,"stage": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"changed_by"?: string | null,"created_at"?: string,"id"?: never,"stage": string,"status": string
                  }
                  Update: {
                    "application_id"?: string,"changed_by"?: string | null,"created_at"?: string,"id"?: never,"stage"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_events_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_events_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "country": string | null,"course": string,"created_at": string,"created_by": string | null,"deadline": string | null,"id": string,"intake": string | null,"note": string | null,"stage": string,"status": string,"student_id": string,"university": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"course"?: string,"created_at"?: string,"created_by"?: string | null,"deadline"?: string | null,"id"?: string,"intake"?: string | null,"note"?: string | null,"stage"?: string,"status"?: string,"student_id": string,"university": string,"updated_at"?: string
                  }
                  Update: {
                    "country"?: string | null,"course"?: string,"created_at"?: string,"created_by"?: string | null,"deadline"?: string | null,"id"?: string,"intake"?: string | null,"note"?: string | null,"stage"?: string,"status"?: string,"student_id"?: string,"university"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "given_at": string,"id": string,"kind": string,"student_id": string | null,"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "given_at"?: string,"id"?: string,"kind": string,"student_id"?: string | null,"user_id": string,"version": string
                  }
                  Update: {
                    "given_at"?: string,"id"?: string,"kind"?: string,"student_id"?: string | null,"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "application_id": string | null,"created_at": string,"doc_type": string,"file_key": string,"file_name": string,"id": string,"label": string | null,"mime_type": string,"replaces": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"reviewer_reason": string | null,"service_request_id": string | null,"size_bytes": number,"status": string,"student_id": string,"updated_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"created_at"?: string,"doc_type": string,"file_key": string,"file_name": string,"id"?: string,"label"?: string | null,"mime_type": string,"replaces"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"reviewer_reason"?: string | null,"service_request_id"?: string | null,"size_bytes": number,"status"?: string,"student_id": string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "application_id"?: string | null,"created_at"?: string,"doc_type"?: string,"file_key"?: string,"file_name"?: string,"id"?: string,"label"?: string | null,"mime_type"?: string,"replaces"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"reviewer_reason"?: string | null,"service_request_id"?: string | null,"size_bytes"?: number,"status"?: string,"student_id"?: string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_replaces_fkey"
      columns: ["replaces"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_service_request_id_fkey"
      columns: ["service_request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "assigned_to": string | null,"created_at": string,"email": string | null,"id": string,"interest": string | null,"message": string | null,"name": string | null,"office": string,"phone": string | null,"profile_id": string | null,"source": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"interest"?: string | null,"message"?: string | null,"name"?: string | null,"office"?: string,"phone"?: string | null,"profile_id"?: string | null,"source": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"interest"?: string | null,"message"?: string | null,"name"?: string | null,"office"?: string,"phone"?: string | null,"profile_id"?: string | null,"source"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"sender_id": string | null,"sender_name": string | null,"sender_role": string | null,"service_request_id": string | null,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"sender_id"?: string | null,"sender_name"?: string | null,"sender_role"?: string | null,"service_request_id"?: string | null,"student_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"sender_id"?: string | null,"sender_name"?: string | null,"sender_role"?: string | null,"service_request_id"?: string | null,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_service_request_id_fkey"
      columns: ["service_request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"parent_links": {
                  Row: {
                    "created_at": string,"decided_at": string | null,"guardian_confirmed_at": string,"id": string,"parent_id": string,"relationship": string,"requested_as": string | null,"requested_via": string,"status": string,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"decided_at"?: string | null,"guardian_confirmed_at": string,"id"?: string,"parent_id": string,"relationship"?: string,"requested_as"?: string | null,"requested_via": string,"status"?: string,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"decided_at"?: string | null,"guardian_confirmed_at"?: string,"id"?: string,"parent_id"?: string,"relationship"?: string,"requested_as"?: string | null,"requested_via"?: string,"status"?: string,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parent_links_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parent_links_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string,"invited_by": string | null,"onboarded_at": string | null,"phone": string | null,"role": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id": string,"invited_by"?: string | null,"onboarded_at"?: string | null,"phone"?: string | null,"role"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"invited_by"?: string | null,"onboarded_at"?: string | null,"phone"?: string | null,"role"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"service_request_events": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"id": number,"request_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: never,"request_id": string,"status": string
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"id"?: never,"request_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_request_events_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_request_events_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"service_requests": {
                  Row: {
                    "assigned_to": string | null,"closed_at": string | null,"created_at": string,"details": NonNullable<Json>,"id": string,"payment_status": string,"price": string | null,"requested_by": string | null,"service": string,"status": string,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"closed_at"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"payment_status"?: string,"price"?: string | null,"requested_by"?: string | null,"service": string,"status"?: string,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"closed_at"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"payment_status"?: string,"price"?: string | null,"requested_by"?: string | null,"service"?: string,"status"?: string,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_requests_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"student_profiles": {
                  Row: {
                    "academic_history": NonNullable<Json>,"city": string | null,"counsellor_id": string | null,"created_at": string,"date_of_birth": string | null,"funding": string | null,"link_code": string,"office": string,"preferred_countries": (string)[],"preferred_course": string | null,"preferred_intake": string | null,"preferred_level": string | null,"test_scores": NonNullable<Json>,"updated_at": string,"user_id": string,"work_experience": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "academic_history"?: NonNullable<Json>,"city"?: string | null,"counsellor_id"?: string | null,"created_at"?: string,"date_of_birth"?: string | null,"funding"?: string | null,"link_code"?: string,"office"?: string,"preferred_countries"?: (string)[],"preferred_course"?: string | null,"preferred_intake"?: string | null,"preferred_level"?: string | null,"test_scores"?: NonNullable<Json>,"updated_at"?: string,"user_id": string,"work_experience"?: string | null
                  }
                  Update: {
                    "academic_history"?: NonNullable<Json>,"city"?: string | null,"counsellor_id"?: string | null,"created_at"?: string,"date_of_birth"?: string | null,"funding"?: string | null,"link_code"?: string,"office"?: string,"preferred_countries"?: (string)[],"preferred_course"?: string | null,"preferred_intake"?: string | null,"preferred_level"?: string | null,"test_scores"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string,"work_experience"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "student_profiles_counsellor_id_fkey"
      columns: ["counsellor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "student_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "complete_onboarding":
{ Args: { "p_consent_version": string,"p_date_of_birth": string,"p_full_name": string,"p_phone": string,"p_role": string }; Returns: undefined
                           },
"link_invited_student":
{ Args: { "p_email": string,"p_parent": string,"p_relationship": string,"p_student": string }; Returns: string
                           },
"portal_context":
{ Args: { "p_student"?: string }; Returns: Json
                           },
"regenerate_link_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"request_link_by_code":
{ Args: { "p_code": string,"p_guardian_confirmed": boolean,"p_relationship": string }; Returns: Json
                           },
"request_link_by_email":
{ Args: { "p_email": string,"p_parent": string,"p_relationship": string }; Returns: Json
                           },
"update_parent_link":
{ Args: { "p_action": string,"p_link": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
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
  "public": {
          Enums: {
            
          }
        }
} as const
