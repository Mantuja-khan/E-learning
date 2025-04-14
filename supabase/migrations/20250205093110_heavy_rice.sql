/*
  # Add admin roles and permissions

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'admin' or 'sub_admin')
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `admin_roles` table
    - Add policies for admin and sub-admin access
*/

CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'sub_admin')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read admin roles
CREATE POLICY "Everyone can read admin roles"
  ON admin_roles
  FOR SELECT
  USING (true);

-- Only main admin can create admin roles
CREATE POLICY "Only main admin can create admin roles"
  ON admin_roles
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only main admin can update admin roles
CREATE POLICY "Only main admin can update admin roles"
  ON admin_roles
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Only main admin can delete admin roles
CREATE POLICY "Only main admin can delete admin roles"
  ON admin_roles
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'mantujak82@gmail.com');

-- Update existing policies for notes table
DROP POLICY IF EXISTS "Only admin can insert notes" ON notes;
DROP POLICY IF EXISTS "Only admin can update notes" ON notes;
DROP POLICY IF EXISTS "Only admin can delete notes" ON notes;

CREATE POLICY "Admins and sub-admins can insert notes"
  ON notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

CREATE POLICY "Admins and sub-admins can update notes"
  ON notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

CREATE POLICY "Admins and sub-admins can delete notes"
  ON notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Update existing policies for quiz_questions table
DROP POLICY IF EXISTS "Only admin can insert quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Only admin can update quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Only admin can delete quiz questions" ON quiz_questions;

CREATE POLICY "Admins and sub-admins can insert quiz questions"
  ON quiz_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

CREATE POLICY "Admins and sub-admins can update quiz questions"
  ON quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

CREATE POLICY "Admins and sub-admins can delete quiz questions"
  ON quiz_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Insert the main admin
INSERT INTO admin_roles (user_id, role, created_by)
SELECT 
  id as user_id,
  'admin' as role,
  id as created_by
FROM auth.users 
WHERE email = 'mantujak82@gmail.com'
ON CONFLICT DO NOTHING;