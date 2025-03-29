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
      teachers: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          teacher_id: string
          title: string
          description: string | null
          access_key: string
          time_limit: number | null
          start_time: string | null
          end_time: string | null
          show_instant_results: boolean
          ip_restriction: boolean
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          title: string
          description?: string | null
          access_key: string
          time_limit?: number | null
          start_time?: string | null
          end_time?: string | null
          show_instant_results?: boolean
          ip_restriction?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          title?: string
          description?: string | null
          access_key?: string
          time_limit?: number | null
          start_time?: string | null
          end_time?: string | null
          show_instant_results?: boolean
          ip_restriction?: boolean
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          type: 'mcq' | 'text' | 'true_false'
          question: string
          options: Json | null
          correct_answer: string | null
          points: number
          order: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          type: 'mcq' | 'text' | 'true_false'
          question: string
          options?: Json | null
          correct_answer?: string | null
          points?: number
          order: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          type?: 'mcq' | 'text' | 'true_false'
          question?: string
          options?: Json | null
          correct_answer?: string | null
          points?: number
          order?: number
          image_url?: string | null
          created_at?: string
        }
      }
      student_attempts: {
        Row: {
          id: string
          quiz_id: string
          student_name: string
          ip_address: string
          start_time: string
          end_time: string | null
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          student_name: string
          ip_address: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          student_name?: string
          ip_address?: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          created_at?: string
        }
      }
      student_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          answer: string
          is_correct: boolean | null
          points_earned: number | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          answer: string
          is_correct?: boolean | null
          points_earned?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          answer?: string
          is_correct?: boolean | null
          points_earned?: number | null
          created_at?: string
        }
      }
    }
  }
}