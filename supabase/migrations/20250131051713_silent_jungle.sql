/*
  # Add quiz results table
  
  1. New Tables
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `course` (text)
      - `branch` (text)
      - `semester` (text)
      - `score` (integer)
      - `total_questions` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `quiz_results` table
    - Add policies for users to:
      - Read their own results
      - Create their own results
*/

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  course text NOT NULL,
  branch text NOT NULL,
  semester text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own results
CREATE POLICY "Users can read own results"
  ON quiz_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own results
CREATE POLICY "Users can create own results"
  ON quiz_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);