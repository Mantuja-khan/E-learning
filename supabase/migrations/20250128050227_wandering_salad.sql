/*
  # Add PDF Storage Support

  1. Changes
    - Add pdf_path column to notes table
    - Create storage bucket for PDFs
    - Add storage policies for admin access

  2. Security
    - Only admin can upload PDFs
    - Everyone can download PDFs
    - Enable RLS for storage
*/

-- Add pdf_path column to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS pdf_path text;

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes-pdfs', 'notes-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to download PDFs
CREATE POLICY "Allow public download of PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes-pdfs');

-- Allow admin to upload PDFs
CREATE POLICY "Allow admin to upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notes-pdfs' 
  AND auth.jwt() ->> 'email' = 'mantujak82@gmail.com'
);

-- Allow admin to delete PDFs
CREATE POLICY "Allow admin to delete PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notes-pdfs'
  AND auth.jwt() ->> 'email' = 'mantujak82@gmail.com'
);