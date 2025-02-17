export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      course: {
        Row: {
          academic_year: string
          antirequisite: string | null
          billing_units: number | null
          code: string
          corequisite: string | null
          course_count: number | null
          custom_requisite: string | null
          description: string
          gpa_weight: number | null
          id: string
          name: string
          prerequisite: string | null
          url: string
          weekly_contact: string | null
        }
        Insert: {
          academic_year: string
          antirequisite?: string | null
          billing_units?: number | null
          code: string
          corequisite?: string | null
          course_count?: number | null
          custom_requisite?: string | null
          description: string
          gpa_weight?: number | null
          id?: string
          name: string
          prerequisite?: string | null
          url: string
          weekly_contact?: string | null
        }
        Update: {
          academic_year?: string
          antirequisite?: string | null
          billing_units?: number | null
          code?: string
          corequisite?: string | null
          course_count?: number | null
          custom_requisite?: string | null
          description?: string
          gpa_weight?: number | null
          id?: string
          name?: string
          prerequisite?: string | null
          url?: string
          weekly_contact?: string | null
        }
        Relationships: []
      }
      plan_course: {
        Row: {
          course_id: string
          id: string
          note: string
          plan_id: string
          semester_term: string
          semester_year: number
        }
        Insert: {
          course_id: string
          id?: string
          note: string
          plan_id: string
          semester_term: string
          semester_year: number
        }
        Update: {
          course_id?: string
          id?: string
          note?: string
          plan_id?: string
          semester_term?: string
          semester_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_course_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_course_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "user_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan: {
        Row: {
          created_at: string
          ending_semester_term: Database["public"]["Enums"]["term"]
          ending_semester_year: number
          id: string
          name: string
          notes: string | null
          starting_semester_term: Database["public"]["Enums"]["term"]
          starting_semester_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          ending_semester_term: Database["public"]["Enums"]["term"]
          ending_semester_year: number
          id?: string
          name: string
          notes?: string | null
          starting_semester_term: Database["public"]["Enums"]["term"]
          starting_semester_year: number
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          ending_semester_term?: Database["public"]["Enums"]["term"]
          ending_semester_year?: number
          id?: string
          name?: string
          notes?: string | null
          starting_semester_term?: Database["public"]["Enums"]["term"]
          starting_semester_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      term: "Fall" | "Winter" | "Spring/Summer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

