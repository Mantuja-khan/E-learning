/*
  # Add course, branch, and semester columns to notes table

  1. Changes
    - Add course column to notes table
    - Add branch column to notes table
    - Add semester column to notes table
    - Make these columns required for data consistency

  2. Security
    - No changes to existing RLS policies needed
*/

ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS course text NOT NULL DEFAULT 'B.Tech',
ADD COLUMN IF NOT EXISTS branch text NOT NULL DEFAULT 'Computer Science',
ADD COLUMN IF NOT EXISTS semester text NOT NULL DEFAULT '1st';