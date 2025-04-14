/*
  # Create notes table

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policies for:
      - Everyone can read notes
      - Only admin can create/update/delete notes
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Everyone can read notes
CREATE POLICY "Everyone can read notes"
  ON notes
  FOR SELECT
  USING (true);

-- Only admin can create notes
CREATE POLICY "Only admin can insert notes"
  ON notes
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only admin can update notes
CREATE POLICY "Only admin can update notes"
  ON notes
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only admin can delete notes
CREATE POLICY "Only admin can delete notes"
  ON notes
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');