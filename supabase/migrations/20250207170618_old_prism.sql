/*
  # Create notifications table and policies

  1. New Tables
    - notifications
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - title (text)
      - content (text)
      - type (text, check constraint)
      - read (boolean)
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for users to read their own notifications
    - Add policy for admins to create notifications
*/

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('note', 'quiz')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
  DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
END $$;

-- Create new policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );