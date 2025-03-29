/*
  # Initial Quiz Platform Schema

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `quizzes`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `access_key` (text, unique)
      - `time_limit` (integer, minutes)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `show_instant_results` (boolean)
      - `ip_restriction` (boolean)
      - `created_at` (timestamp)
    
    - `questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key)
      - `type` (text) - enum: 'mcq', 'text', 'true_false'
      - `question` (text)
      - `options` (jsonb, for MCQ)
      - `correct_answer` (text)
      - `points` (integer)
      - `order` (integer)
      - `image_url` (text, optional)
    
    - `student_attempts`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key)
      - `student_name` (text)
      - `ip_address` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `score` (integer)
      - `created_at` (timestamp)
    
    - `student_answers`
      - `id` (uuid, primary key)
      - `attempt_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `answer` (text)
      - `is_correct` (boolean)
      - `points_earned` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for teacher access
    - Public access for student quiz taking
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE question_type AS ENUM ('mcq', 'text', 'true_false');

-- Create teachers table
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid REFERENCES teachers(id),
  title text NOT NULL,
  description text,
  access_key text UNIQUE NOT NULL,
  time_limit integer,
  start_time timestamptz,
  end_time timestamptz,
  show_instant_results boolean DEFAULT false,
  ip_restriction boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  question text NOT NULL,
  options jsonb,
  correct_answer text,
  points integer DEFAULT 1,
  "order" integer NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create student_attempts table
CREATE TABLE student_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  ip_address text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  score integer,
  created_at timestamptz DEFAULT now()
);

-- Create student_answers table
CREATE TABLE student_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id uuid REFERENCES student_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  is_correct boolean,
  points_earned integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teachers can read their own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can read their own quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own quizzes"
  ON quizzes
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can read their quiz questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE teacher_id = auth.uid()
  ));

CREATE POLICY "Teachers can manage their quiz questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE teacher_id = auth.uid()
  ));

-- Public policies for student access
CREATE POLICY "Students can access quizzes by access key"
  ON quizzes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Students can read questions"
  ON questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Students can create attempts"
  ON student_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Students can create answers"
  ON student_answers
  FOR INSERT
  TO public
  WITH CHECK (true);