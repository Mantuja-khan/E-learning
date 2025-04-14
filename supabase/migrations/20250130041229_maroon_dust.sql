/*
  # Quiz Management Schema

  1. New Tables
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `course` (text)
      - `branch` (text)
      - `semester` (text)
      - `question` (text)
      - `options` (jsonb array)
      - `correct_option` (integer)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `quiz_questions` table
    - Add policies for:
      - Everyone can read questions
      - Only admin can create/update/delete questions
*/

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course text NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_option integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
CREATE POLICY "Everyone can read quiz questions"
  ON quiz_questions
  FOR SELECT
  USING (true);

-- Only admin can create questions
CREATE POLICY "Only admin can insert quiz questions"
  ON quiz_questions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only admin can update questions
CREATE POLICY "Only admin can update quiz questions"
  ON quiz_questions
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only admin can delete questions
CREATE POLICY "Only admin can delete quiz questions"
  ON quiz_questions
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');